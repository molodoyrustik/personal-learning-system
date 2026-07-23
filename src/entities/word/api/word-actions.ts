"use server";

import { revalidatePath } from "next/cache";
import {
  type Card,
  type CardInput,
  createEmptyCard,
  fsrs,
  type Grade,
  generatorParameters,
  Rating,
  State,
} from "ts-fsrs";
import { nowISO } from "@/shared/lib/date";
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

// enable_short_term: false — our own Recall mode (6 rounds) already plays the
// role of FSRS's short-term learning steps, so Review can go straight into
// long-term interval scheduling from the very first pass (see LongTermScheduler
// in ts-fsrs: every rating, including Again, resolves to State.Review with a
// day-scale interval instead of a 1m/10m short step).
const scheduler = fsrs(
  generatorParameters({ enable_short_term: false, enable_fuzz: true }),
);

// A word "graduates" out of Review once FSRS trusts it for ~2 months without
// prompting — mirrors the old scheme's top interval (30 days) plus one more
// successful pass, but is now driven by the algorithm's own stability instead
// of a fixed review count.
const KNOWN_STABILITY_DAYS = 60;

type FsrsRow = {
  fsrs_stability: number | null;
  fsrs_difficulty: number | null;
  fsrs_state: number | null;
  fsrs_reps: number | null;
  fsrs_lapses: number | null;
  fsrs_learning_steps: number | null;
  next_review_at: string | null;
  last_recalled_at: string | null;
};

function rowToCard(row: FsrsRow): CardInput {
  return {
    due: row.next_review_at ?? new Date(),
    stability: row.fsrs_stability ?? 0,
    difficulty: row.fsrs_difficulty ?? 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: row.fsrs_learning_steps ?? 0,
    reps: row.fsrs_reps ?? 0,
    lapses: row.fsrs_lapses ?? 0,
    state: row.fsrs_state ?? State.New,
    last_review: row.last_recalled_at ?? undefined,
  };
}

function cardToUpdate(card: Card, now: Date) {
  return {
    fsrs_stability: card.stability,
    fsrs_difficulty: card.difficulty,
    fsrs_state: card.state,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    fsrs_learning_steps: card.learning_steps,
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

export async function markRecallResultAction(
  wordId: string,
  remembered: boolean,
) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("recall_success_count, recall_fail_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  if (remembered) {
    const recallSuccessCount = word.recall_success_count + 1;
    if (recallSuccessCount >= 6) {
      // Word graduates out of Recall — seed its FSRS card with a first
      // "Good" review (it just proved itself over 6 rounds) and hand it
      // off to Review mode for long-term spaced scheduling.
      const now = new Date();
      const { card } = scheduler.next(createEmptyCard(now), now, Rating.Good);
      await supabase
        .from("words")
        .update({
          recall_success_count: recallSuccessCount,
          status: "memorized",
          next_review_at: card.due.toISOString(),
          ...cardToUpdate(card, now),
        })
        .eq("id", wordId);
    } else {
      await supabase
        .from("words")
        .update({
          recall_success_count: recallSuccessCount,
          status: "learning",
          last_recalled_at: nowISO(),
          updated_at: nowISO(),
        })
        .eq("id", wordId);
    }
  } else {
    const recallFailCount = word.recall_fail_count + 1;
    await supabase
      .from("words")
      .update({
        recall_fail_count: recallFailCount,
        status: recallFailCount >= 2 ? "weak" : "learning",
        last_recalled_at: nowISO(),
        updated_at: nowISO(),
      })
      .eq("id", wordId);
  }
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

  // enable_short_term: false means every rating (including Again) resolves
  // to State.Review with a day-scale interval — no separate "reset to
  // Recall" path needed, FSRS just gives a shorter interval on failure.
  const graduated =
    card.state === State.Review && card.stability >= KNOWN_STABILITY_DAYS;

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
