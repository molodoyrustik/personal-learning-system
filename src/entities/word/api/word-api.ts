import { nowISO } from "@/shared/lib/date";
import { createClient } from "@/shared/lib/supabase/server";
import type { Word } from "../model/types";

export type WordProgress = {
  total: number;
  newCount: number;
  doneCount: number;
  dueCount: number;
};

// A word no longer needs active work once it's rejected (opted out) or has
// graduated into spaced review — "done" for lesson-status purposes.
const DONE_WORD_STATUSES: Word["status"][] = [
  "rejected",
  "memorized",
  "reviewing",
  "known",
];

function mapRow(row: Record<string, unknown>): Word {
  return {
    id: row.id as string,
    listId: row.list_id as string,
    sourceText: row.source_text as string,
    targetText: row.target_text as string,
    status: row.status as Word["status"],
    selectionDecision:
      (row.selection_decision as Word["selectionDecision"]) ?? null,
    canVisualizeMeaning: (row.can_visualize_meaning as boolean | null) ?? null,
    soundAssociation: (row.sound_association as string | null) ?? null,
    sceneDescription: (row.scene_description as string | null) ?? null,
    skipCount: (row.skip_count as number) ?? 0,
    encodingAttemptCount: (row.encoding_attempt_count as number) ?? 0,
    encodingAttemptRound:
      (row.encoding_attempt_round as Word["encodingAttemptRound"]) ?? null,
    recallSuccessCount: (row.recall_success_count as number) ?? 0,
    lastRecalledAt: (row.last_recalled_at as string | null) ?? null,
    nextReviewAt: (row.next_review_at as string | null) ?? null,
    fsrsStability: (row.fsrs_stability as number | null) ?? null,
    fsrsDifficulty: (row.fsrs_difficulty as number | null) ?? null,
    fsrsState: (row.fsrs_state as Word["fsrsState"]) ?? null,
    fsrsReps: (row.fsrs_reps as number) ?? 0,
    fsrsLapses: (row.fsrs_lapses as number) ?? 0,
    fsrsLearningSteps: (row.fsrs_learning_steps as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getWordsByListId(listId: string): Promise<Word[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("list_id", listId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data.map(mapRow);
}

export async function getWordProgressByListIds(
  listIds: string[],
): Promise<Record<string, WordProgress>> {
  if (listIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("list_id, status, next_review_at")
    .in("list_id", listIds);
  if (error) throw error;

  const now = nowISO();
  const progress: Record<string, WordProgress> = {};
  for (const row of data) {
    const listId = row.list_id as string;
    const status = row.status as Word["status"];
    if (!progress[listId]) {
      progress[listId] = { total: 0, newCount: 0, doneCount: 0, dueCount: 0 };
    }
    const p = progress[listId];
    p.total += 1;
    if (status === "new") p.newCount += 1;
    if (DONE_WORD_STATUSES.includes(status)) p.doneCount += 1;
    const nextReviewAt = row.next_review_at as string | null;
    if (
      (status === "memorized" || status === "reviewing") &&
      nextReviewAt &&
      nextReviewAt <= now
    ) {
      p.dueCount += 1;
    }
  }
  return progress;
}
