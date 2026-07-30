"use server";

import type { Grade } from "ts-fsrs";
import { nowISO } from "@/shared/lib/date";
import {
  buildCardInput,
  type Card,
  createEmptyCard,
  type FsrsColumns,
  fsrsColumnsFromCard,
  isGraduated,
  Rating,
  scheduler,
} from "@/shared/lib/fsrs";
import { createClient } from "@/shared/lib/supabase/server";
import { nextEncodingRound } from "@/shared/model/app-store/utils";
import type {
  EncodingAttemptRound,
  ReviewRating,
  SelectionDecision,
} from "../model/types";

async function getSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

function rowToCard(row: FsrsColumns & { last_recalled_at: string | null }) {
  return buildCardInput(row, row.last_recalled_at);
}

function cardToUpdate(card: Card, now: Date) {
  return {
    ...fsrsColumnsFromCard(card),
    last_recalled_at: now.toISOString(),
    updated_at: nowISO(),
  };
}

// Applies Selection decisions for a whole session in one go, same
// all-or-nothing rule as commitRecallResultsAction below — quitting partway
// through Selection mode discards the session entirely.
export async function commitSelectionResultsAction(
  results: {
    wordId: string;
    decision: Exclude<SelectionDecision, null>;
  }[],
) {
  const supabase = await getSupabase();
  const now = nowISO();

  await Promise.all(
    results.map(({ wordId, decision }) =>
      supabase
        .from("words")
        .update({
          status: decision === "unknown_and_needed" ? "selected" : "rejected",
          selection_decision: decision,
          updated_at: now,
        })
        .eq("id", wordId),
    ),
  );
}

export type EncodingResult = {
  wordId: string;
  canVisualizeMeaning?: boolean;
} & (
  | { outcome: "skipped" }
  | { outcome: "encoded"; soundAssociation: string; sceneDescription: string }
);

// Applies Encoding/Slow Encode/Skipped-mode outcomes for a whole session in
// one go, same all-or-nothing rule as commitRecallResultsAction below —
// quitting partway through a pass discards the session entirely.
export async function commitEncodingResultsAction(results: EncodingResult[]) {
  const supabase = await getSupabase();
  const now = nowISO();

  const { data: rows } = await supabase
    .from("words")
    .select("id, encoding_attempt_round, encoding_attempt_count, skip_count")
    .in(
      "id",
      results.map((r) => r.wordId),
    );
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));

  await Promise.all(
    results.map((result) => {
      const row = byId.get(result.wordId);
      const round = (row?.encoding_attempt_round ?? null) as EncodingAttemptRound;
      const attemptCount = row?.encoding_attempt_count ?? 0;

      if (result.outcome === "skipped") {
        return supabase
          .from("words")
          .update({
            status: "skipped",
            skip_count: (row?.skip_count ?? 0) + 1,
            encoding_attempt_count: attemptCount + 1,
            encoding_attempt_round: nextEncodingRound(round),
            ...(result.canVisualizeMeaning !== undefined && {
              can_visualize_meaning: result.canVisualizeMeaning,
            }),
            updated_at: now,
          })
          .eq("id", result.wordId);
      }

      return supabase
        .from("words")
        .update({
          sound_association: result.soundAssociation,
          scene_description: result.sceneDescription,
          status: "encoded",
          encoding_attempt_count: attemptCount + 1,
          encoding_attempt_round: nextEncodingRound(round),
          ...(result.canVisualizeMeaning !== undefined && {
            can_visualize_meaning: result.canVisualizeMeaning,
          }),
          updated_at: now,
        })
        .eq("id", result.wordId);
    }),
  );
}

// Applies Recall results for a whole session in one go. Called only once the
// user has gone through every word in the queue — quitting partway through
// discards the session entirely, so a word's recall progress only ever
// changes as a result of a complete Recall pass, never a partial one.
export async function commitRecallResultsAction(
  results: { wordId: string; remembered: boolean }[],
) {
  const supabase = await getSupabase();
  const now = nowISO();

  const { data: rows } = await supabase
    .from("words")
    .select("id, recall_success_count")
    .in(
      "id",
      results.map((r) => r.wordId),
    );
  const successCountById = new Map(
    (rows ?? []).map((r) => [r.id as string, r.recall_success_count as number]),
  );

  await Promise.all(
    results.map(({ wordId, remembered }) => {
      if (remembered) {
        const recallSuccessCount = (successCountById.get(wordId) ?? 0) + 1;
        if (recallSuccessCount >= 6) {
          // Word graduates out of Recall — seed its FSRS card with a first
          // "Good" review (it just proved itself over 6 rounds) and hand it
          // off to Review mode for long-term spaced scheduling.
          const graduatedAt = new Date();
          const { card } = scheduler.next(
            createEmptyCard(graduatedAt),
            graduatedAt,
            Rating.Good,
          );
          return supabase
            .from("words")
            .update({
              recall_success_count: recallSuccessCount,
              status: "memorized",
              next_review_at: card.due.toISOString(),
              ...cardToUpdate(card, graduatedAt),
            })
            .eq("id", wordId);
        }
        return supabase
          .from("words")
          .update({
            recall_success_count: recallSuccessCount,
            status: "learning",
            last_recalled_at: now,
            updated_at: now,
          })
          .eq("id", wordId);
      }

      // A slip on an already-encoded word — route to the dedicated Recall
      // Mistakes queue instead of straight back into Recall, so it can't
      // silently rack up rounds without ever being corrected.
      return supabase
        .from("words")
        .update({
          status: "marked",
          last_recalled_at: now,
          updated_at: now,
        })
        .eq("id", wordId);
    }),
  );
}

// Applies Recall Mistakes results for a whole session in one go, same
// all-or-nothing rule as commitRecallResultsAction. Fixed words go back to
// "learning" (recall_success_count untouched — they resume Recall from
// wherever they left off); still-wrong words stay "marked".
export async function commitRecallMistakesResultsAction(
  results: { wordId: string; remembered: boolean }[],
) {
  const supabase = await getSupabase();
  const now = nowISO();

  await Promise.all(
    results.map(({ wordId, remembered }) =>
      supabase
        .from("words")
        .update({
          status: remembered ? "learning" : "marked",
          last_recalled_at: now,
          updated_at: now,
        })
        .eq("id", wordId),
    ),
  );
}

export async function markReviewResultAction(
  wordId: string,
  rating: ReviewRating,
) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select(
      "fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_learning_steps, next_review_at, last_recalled_at",
    )
    .eq("id", wordId)
    .single();
  if (!word) return;

  const now = new Date();
  const { card } = scheduler.next(rowToCard(word), now, rating as Grade);
  const graduated = isGraduated(card);

  await supabase
    .from("words")
    .update({
      status: graduated ? "known" : "reviewing",
      next_review_at: graduated ? null : card.due.toISOString(),
      ...cardToUpdate(card, now),
    })
    .eq("id", wordId);
}

export async function getDueReviewWordsByListId(listId: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("list_id", listId)
    .in("status", ["memorized", "reviewing"])
    .lte("next_review_at", nowISO())
    .order("next_review_at");
  return data ?? [];
}

export async function getDueReviewWordCountByListId(
  listId: string,
): Promise<number> {
  const supabase = await getSupabase();
  const { count } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId)
    .in("status", ["memorized", "reviewing"])
    .lte("next_review_at", nowISO());
  return count ?? 0;
}
