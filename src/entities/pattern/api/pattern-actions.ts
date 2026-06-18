"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";
import type { PracticeMode } from "@/shared/model/patterns-store";

async function getSupabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createPatternWithSentences(params: {
  name: string;
  description: string | null;
  sentences: { sourceText: string; targetText: string }[];
}): Promise<{ patternId: string }> {
  const { supabase, userId } = await getSupabase();
  const patternId = generateId();
  const now = nowISO();

  await supabase.from("patterns").insert({
    id: patternId,
    user_id: userId,
    name: params.name,
    description: params.description,
    created_at: now,
    updated_at: now,
  });

  if (params.sentences.length > 0) {
    await supabase.from("pattern_sentences").insert(
      params.sentences.map(({ sourceText, targetText }) => ({
        id: generateId(),
        user_id: userId,
        pattern_id: patternId,
        source_text: sourceText,
        target_text: targetText,
        comment: null,
        status: "new",
        last_practiced_at: null,
        created_at: now,
        updated_at: now,
      })),
    );
  }

  revalidatePath("/patterns");
  return { patternId };
}

export async function importSentencesAction(
  patternId: string,
  sentences: { sourceText: string; targetText: string }[],
) {
  const { supabase, userId } = await getSupabase();
  const now = nowISO();
  await supabase.from("pattern_sentences").insert(
    sentences.map(({ sourceText, targetText }) => ({
      id: generateId(),
      user_id: userId,
      pattern_id: patternId,
      source_text: sourceText,
      target_text: targetText,
      comment: null,
      status: "new",
      last_practiced_at: null,
      created_at: now,
      updated_at: now,
    })),
  );
  revalidatePath(`/patterns/${patternId}`);
}

export async function deleteSentenceAction(sentenceId: string, patternId: string) {
  const { supabase } = await getSupabase();
  await supabase.from("pattern_sentences").delete().eq("id", sentenceId);
  revalidatePath(`/patterns/${patternId}`);
}

export async function deletePatternAction(patternId: string) {
  const { supabase } = await getSupabase();
  await supabase.from("patterns").delete().eq("id", patternId);
  redirect("/patterns");
}

export async function markSentenceCorrectAction(sentenceId: string, mode: PracticeMode) {
  const { supabase } = await getSupabase();
  const patch =
    mode === "full-practice"
      ? { last_practiced_at: nowISO(), updated_at: nowISO() }
      : { status: "learning", last_practiced_at: nowISO(), updated_at: nowISO() };
  await supabase.from("pattern_sentences").update(patch).eq("id", sentenceId);
}

export async function markSentenceMistakeAction(sentenceId: string) {
  const { supabase } = await getSupabase();
  await supabase.from("pattern_sentences").update({
    status: "marked",
    last_practiced_at: nowISO(),
    updated_at: nowISO(),
  }).eq("id", sentenceId);
}

export async function addFullRunAction(patternId: string, durationSec: number) {
  const { supabase, userId } = await getSupabase();
  await supabase.from("pattern_runs").insert({
    id: generateId(),
    user_id: userId,
    pattern_id: patternId,
    duration_sec: durationSec,
    completed_at: nowISO(),
  });
}
