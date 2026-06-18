"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { nextEncodingRound } from "@/shared/model/app-store/utils";
import type { EncodingAttemptRound, SelectionDecision } from "../model/types";

async function getSupabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
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
    const status = recallSuccessCount >= 3 ? "mastered" : "learning";
    await supabase.from("words").update({
      recall_success_count: recallSuccessCount,
      status,
      last_recalled_at: nowISO(),
      updated_at: nowISO(),
    }).eq("id", wordId);
  } else {
    const recallFailCount = word.recall_fail_count + 1;
    const status = recallFailCount >= 2 ? "weak" : "learning";
    await supabase.from("words").update({
      recall_fail_count: recallFailCount,
      status,
      last_recalled_at: nowISO(),
      updated_at: nowISO(),
    }).eq("id", wordId);
  }
}
