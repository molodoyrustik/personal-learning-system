"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";
import type { LanguageCode } from "@/entities/list";

export async function createListWithWords(params: {
  name: string;
  description: string | null;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  words: { sourceText: string; targetText: string }[];
}): Promise<{ listId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const listId = generateId();
  const now = nowISO();

  await supabase.from("lists").insert({
    id: listId,
    user_id: user.id,
    name: params.name,
    description: params.description,
    source_language: params.sourceLanguage,
    target_language: params.targetLanguage,
    created_at: now,
    updated_at: now,
  });

  if (params.words.length > 0) {
    await supabase.from("words").insert(
      params.words.map(({ sourceText, targetText }) => ({
        id: generateId(),
        user_id: user.id,
        list_id: listId,
        source_text: sourceText,
        target_text: targetText,
        status: "new",
        selection_decision: null,
        can_visualize_meaning: null,
        sound_association: null,
        scene_description: null,
        skip_count: 0,
        encoding_attempt_count: 0,
        encoding_attempt_round: null,
        recall_success_count: 0,
        recall_fail_count: 0,
        last_recalled_at: null,
        next_review_at: null,
        created_at: now,
        updated_at: now,
      })),
    );
  }

  revalidatePath("/lists");
  return { listId };
}

export async function addWordsToListAction(
  listId: string,
  words: { sourceText: string; targetText: string }[],
): Promise<void> {
  if (words.length === 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = nowISO();
  await supabase.from("words").insert(
    words.map(({ sourceText, targetText }) => ({
      id: generateId(),
      user_id: user.id,
      list_id: listId,
      source_text: sourceText,
      target_text: targetText,
      status: "new",
      selection_decision: null,
      can_visualize_meaning: null,
      sound_association: null,
      scene_description: null,
      skip_count: 0,
      encoding_attempt_count: 0,
      encoding_attempt_round: null,
      recall_success_count: 0,
      recall_fail_count: 0,
      last_recalled_at: null,
      next_review_at: null,
      created_at: now,
      updated_at: now,
    })),
  );
  revalidatePath(`/lists/${listId}`);
}
