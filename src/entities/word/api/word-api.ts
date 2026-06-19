import { createClient } from "@/shared/lib/supabase/server";
import type { Word } from "../model/types";

function mapRow(row: Record<string, unknown>): Word {
  return {
    id: row.id as string,
    listId: row.list_id as string,
    sourceText: row.source_text as string,
    targetText: row.target_text as string,
    status: row.status as Word["status"],
    selectionDecision: (row.selection_decision as Word["selectionDecision"]) ?? null,
    canVisualizeMeaning: (row.can_visualize_meaning as boolean | null) ?? null,
    soundAssociation: (row.sound_association as string | null) ?? null,
    sceneDescription: (row.scene_description as string | null) ?? null,
    skipCount: (row.skip_count as number) ?? 0,
    encodingAttemptCount: (row.encoding_attempt_count as number) ?? 0,
    encodingAttemptRound: (row.encoding_attempt_round as Word["encodingAttemptRound"]) ?? null,
    recallSuccessCount: (row.recall_success_count as number) ?? 0,
    recallFailCount: (row.recall_fail_count as number) ?? 0,
    lastRecalledAt: (row.last_recalled_at as string | null) ?? null,
    nextReviewAt: (row.next_review_at as string | null) ?? null,
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
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapRow);
}
