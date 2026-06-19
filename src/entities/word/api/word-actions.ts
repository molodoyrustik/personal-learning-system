"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { addDaysISO, nowISO } from "@/shared/lib/date";
import { nextEncodingRound } from "@/shared/model/app-store/utils";
import type { EncodingAttemptRound, SelectionDecision } from "../model/types";

async function getSupabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

// Интервалы повторения (дни) по числу суммарных успешных вспоминаний.
// recallSuccessCount после достижения memorized (= 3):
//   3 → устанавливается при переходе в memorized (+1 день)
//   4 → +3 дня   (1-й review успех)
//   5 → +7 дней  (2-й)
//   6 → +14 дней (3-й)
//   7 → +30 дней (4-й)
//   8+ → known   (5-й)
function getReviewIntervalDays(recallSuccessCount: number): number | null {
  if (recallSuccessCount === 4) return 3;
  if (recallSuccessCount === 5) return 7;
  if (recallSuccessCount === 6) return 14;
  if (recallSuccessCount === 7) return 30;
  return null; // >= 8 → known
}

export async function selectWordAction(wordId: string) {
  const supabase = await getSupabase();
  await supabase.from("words").update({
    status: "selected",
    selection_decision: "unknown_and_needed",
    updated_at: nowISO(),
  }).eq("id", wordId);
}

export async function rejectWordAction(
  wordId: string,
  reason: Exclude<SelectionDecision, "unknown_and_needed" | null>,
) {
  const supabase = await getSupabase();
  await supabase.from("words").update({
    status: "rejected",
    selection_decision: reason,
    updated_at: nowISO(),
  }).eq("id", wordId);
}

export async function setMeaningVisualizationAction(
  wordId: string,
  canVisualizeMeaning: boolean,
) {
  const supabase = await getSupabase();
  await supabase.from("words").update({
    can_visualize_meaning: canVisualizeMeaning,
    updated_at: nowISO(),
  }).eq("id", wordId);
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

  await supabase.from("words").update({
    sound_association: params.soundAssociation,
    scene_description: params.sceneDescription,
    status: "encoded",
    encoding_attempt_count: word.encoding_attempt_count + 1,
    encoding_attempt_round: encodingAttemptRound,
    updated_at: nowISO(),
  }).eq("id", wordId);
}

export async function skipWordAction(wordId: string) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("encoding_attempt_round, encoding_attempt_count, skip_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  await supabase.from("words").update({
    status: "skipped",
    skip_count: word.skip_count + 1,
    encoding_attempt_count: word.encoding_attempt_count + 1,
    encoding_attempt_round: nextEncodingRound(word.encoding_attempt_round as EncodingAttemptRound),
    updated_at: nowISO(),
  }).eq("id", wordId);
}

export async function markRecallResultAction(wordId: string, remembered: boolean) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("recall_success_count, recall_fail_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  if (remembered) {
    const recallSuccessCount = word.recall_success_count + 1;
    if (recallSuccessCount >= 3) {
      await supabase.from("words").update({
        recall_success_count: recallSuccessCount,
        status: "memorized",
        next_review_at: addDaysISO(1),
        last_recalled_at: nowISO(),
        updated_at: nowISO(),
      }).eq("id", wordId);
    } else {
      await supabase.from("words").update({
        recall_success_count: recallSuccessCount,
        status: "learning",
        last_recalled_at: nowISO(),
        updated_at: nowISO(),
      }).eq("id", wordId);
    }
  } else {
    const recallFailCount = word.recall_fail_count + 1;
    await supabase.from("words").update({
      recall_fail_count: recallFailCount,
      status: recallFailCount >= 2 ? "weak" : "learning",
      last_recalled_at: nowISO(),
      updated_at: nowISO(),
    }).eq("id", wordId);
  }
}

export async function markReviewResultAction(wordId: string, remembered: boolean) {
  const supabase = await getSupabase();
  const { data: word } = await supabase
    .from("words")
    .select("recall_success_count, recall_fail_count")
    .eq("id", wordId)
    .single();
  if (!word) return;

  if (remembered) {
    const recallSuccessCount = word.recall_success_count + 1;
    const intervalDays = getReviewIntervalDays(recallSuccessCount);
    await supabase.from("words").update({
      recall_success_count: recallSuccessCount,
      status: intervalDays === null ? "known" : "reviewing",
      next_review_at: intervalDays !== null ? addDaysISO(intervalDays) : null,
      last_recalled_at: nowISO(),
      updated_at: nowISO(),
    }).eq("id", wordId);
  } else {
    // Провал — сбрасываем счётчик и возвращаем в learning
    await supabase.from("words").update({
      recall_success_count: 0,
      recall_fail_count: word.recall_fail_count + 1,
      status: "learning",
      next_review_at: null,
      last_recalled_at: nowISO(),
      updated_at: nowISO(),
    }).eq("id", wordId);
  }
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

export async function getDueReviewWordCountByListId(listId: string): Promise<number> {
  const supabase = await getSupabase();
  const { count } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId)
    .in("status", ["memorized", "reviewing"])
    .lte("next_review_at", nowISO());
  return count ?? 0;
}
