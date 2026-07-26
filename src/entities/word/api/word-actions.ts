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

export async function selectWordAction(wordId: string) {
  const supabase = await getSupabase();
  await supabase
    .from("words")
    .update({
      status: "selected",
      selection_decision: "unknown_and_needed",
      updated_at: nowISO(),
    })
    .eq("id", wordId);
}

export async function rejectWordAction(
  wordId: string,
  reason: Exclude<SelectionDecision, "unknown_and_needed" | null>,
) {
  const supabase = await getSupabase();
  await supabase
    .from("words")
    .update({
      status: "rejected",
      selection_decision: reason,
      updated_at: nowISO(),
    })
    .eq("id", wordId);
}

export async function setMeaningVisualizationAction(
  wordId: string,
  canVisualizeMeaning: boolean,
) {
  const supabase = await getSupabase();
  await supabase
    .from("words")
    .update({
      can_visualize_meaning: canVisualizeMeaning,
      updated_at: nowISO(),
    })
    .eq("id", wordId);
}

export async function saveEncodingAction(
  wordId: string,
  params: { soundAssociation: string; sceneDescription: string },
) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("encoding_attempt_round, encoding_attempt_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  const r = word.encoding_attempt_round as EncodingAttemptRound;
  const encodingAttemptRound = r == null ? 1 : r === 1 ? 2 : r === 2 ? 3 : 3;

  await supabase
    .from("words")
    .update({
      sound_association: params.soundAssociation,
      scene_description: params.sceneDescription,
      status: "encoded",
      encoding_attempt_count: word.encoding_attempt_count + 1,
      encoding_attempt_round: encodingAttemptRound,
      updated_at: nowISO(),
    })
    .eq("id", wordId);
}

export async function skipWordAction(wordId: string) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("encoding_attempt_round, encoding_attempt_count, skip_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  await supabase
    .from("words")
    .update({
      status: "skipped",
      skip_count: word.skip_count + 1,
      encoding_attempt_count: word.encoding_attempt_count + 1,
      encoding_attempt_round: nextEncodingRound(
        word.encoding_attempt_round as EncodingAttemptRound,
      ),
      updated_at: nowISO(),
    })
    .eq("id", wordId);
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
