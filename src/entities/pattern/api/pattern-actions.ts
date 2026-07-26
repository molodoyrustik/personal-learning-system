"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";
import { createClient } from "@/shared/lib/supabase/server";
import type { PracticeMode } from "@/shared/model/patterns-store";

// Clean Full Practice passes required before a sentence graduates to "known".
// Mirrors words' RecallMode round count (there: 6).
const TOTAL_FULL_PRACTICE_PASSES = 3;

async function getSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      params.sentences.map(({ sourceText, targetText }, i) => ({
        id: generateId(),
        user_id: userId,
        pattern_id: patternId,
        source_text: sourceText,
        target_text: targetText,
        comment: null,
        status: "new",
        last_practiced_at: null,
        created_at: nowISO(i),
        updated_at: nowISO(i),
      })),
    );
  }

  revalidatePath("/patterns");
  return { patternId };
}

export async function updatePatternAction(
  patternId: string,
  params: { name: string; description: string | null },
): Promise<void> {
  const { supabase } = await getSupabase();
  await supabase
    .from("patterns")
    .update({
      name: params.name,
      description: params.description,
      updated_at: nowISO(),
    })
    .eq("id", patternId);
  revalidatePath(`/patterns/${patternId}`);
}

export async function importSentencesAction(
  patternId: string,
  sentences: { sourceText: string; targetText: string }[],
) {
  const { supabase, userId } = await getSupabase();
  await supabase.from("pattern_sentences").insert(
    sentences.map(({ sourceText, targetText }, i) => ({
      id: generateId(),
      user_id: userId,
      pattern_id: patternId,
      source_text: sourceText,
      target_text: targetText,
      comment: null,
      status: "new",
      last_practiced_at: null,
      created_at: nowISO(i),
      updated_at: nowISO(i),
    })),
  );
  revalidatePath(`/patterns/${patternId}`);
}

export async function deleteSentenceAction(
  sentenceId: string,
  patternId: string,
) {
  const { supabase } = await getSupabase();
  await supabase.from("pattern_sentences").delete().eq("id", sentenceId);
  revalidatePath(`/patterns/${patternId}`);
}

export async function resetPatternProgressAction(
  patternId: string,
): Promise<void> {
  const { supabase, userId } = await getSupabase();
  await supabase
    .from("pattern_sentences")
    .update({
      status: "new",
      last_practiced_at: null,
      full_practice_success_count: 0,
      updated_at: nowISO(),
    })
    .eq("pattern_id", patternId)
    .eq("user_id", userId);
  await supabase
    .from("pattern_runs")
    .delete()
    .eq("pattern_id", patternId)
    .eq("user_id", userId);
  revalidatePath(`/patterns/${patternId}`);
}

export async function deletePatternAction(patternId: string) {
  const { supabase } = await getSupabase();
  await supabase.from("patterns").delete().eq("id", patternId);
  redirect("/patterns");
}

// Applies status transitions for a whole practice session in one go. Called
// only once the user has gone through every sentence in the queue — quitting
// partway through (Back button, closing the tab) discards the session
// entirely, so a pattern's statuses only ever change as a result of a
// complete First Pass / Review Marked / Full Practice pass, never a partial
// one. This keeps Full Practice history and queue membership consistent:
// every recorded run — and every status change — reflects the whole list.
export async function commitPracticeSessionAction(
  mode: PracticeMode,
  results: { sentenceId: string; correct: boolean }[],
) {
  const { supabase } = await getSupabase();
  const now = nowISO();

  if (mode === "full-practice") {
    const correctIds = results.filter((r) => r.correct).map((r) => r.sentenceId);
    const { data: rows } = correctIds.length
      ? await supabase
          .from("pattern_sentences")
          .select("id, full_practice_success_count")
          .in("id", correctIds)
      : { data: [] };
    const successCountById = new Map(
      (rows ?? []).map((r) => [
        r.id as string,
        r.full_practice_success_count as number,
      ]),
    );

    await Promise.all(
      results.map(({ sentenceId, correct }) => {
        if (!correct) {
          return supabase
            .from("pattern_sentences")
            .update({ status: "marked", last_practiced_at: now, updated_at: now })
            .eq("id", sentenceId);
        }
        const successCount = (successCountById.get(sentenceId) ?? 0) + 1;
        return supabase
          .from("pattern_sentences")
          .update({
            full_practice_success_count: successCount,
            status:
              successCount >= TOTAL_FULL_PRACTICE_PASSES ? "known" : "learning",
            last_practiced_at: now,
            updated_at: now,
          })
          .eq("id", sentenceId);
      }),
    );
    return;
  }

  // First Pass / Review Marked: correct -> learning, mistake -> marked.
  await Promise.all(
    results.map(({ sentenceId, correct }) =>
      supabase
        .from("pattern_sentences")
        .update({
          status: correct ? "learning" : "marked",
          last_practiced_at: now,
          updated_at: now,
        })
        .eq("id", sentenceId),
    ),
  );
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
