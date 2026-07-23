"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { generateId } from "@/shared/lib/ids";
import { createClient } from "@/shared/lib/supabase/server";
import type { PracticeMode } from "@/shared/model/patterns-store";
import type { ReviewRating } from "../model/types";

async function getSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

function rowToCard(row: FsrsColumns & { last_practiced_at: string | null }) {
  return buildCardInput(row, row.last_practiced_at);
}

function cardToUpdate(card: Card, now: Date) {
  return {
    ...fsrsColumnsFromCard(card),
    last_practiced_at: now.toISOString(),
    updated_at: nowISO(),
  };
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
      next_review_at: null,
      fsrs_stability: null,
      fsrs_difficulty: null,
      fsrs_state: null,
      fsrs_reps: 0,
      fsrs_lapses: 0,
      fsrs_learning_steps: 0,
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

export async function markSentenceCorrectAction(
  sentenceId: string,
  mode: PracticeMode,
) {
  const { supabase } = await getSupabase();

  if (mode === "full-practice") {
    // One clean Full Practice pass is enough proof to graduate into FSRS
    // Review — producing a whole sentence correctly is harder per attempt
    // than recalling a single word, so unlike word Recall's 6 rounds, a
    // single pass here is already solid evidence of short-term retention.
    const now = new Date();
    const { card } = scheduler.next(createEmptyCard(now), now, Rating.Good);
    await supabase
      .from("pattern_sentences")
      .update({
        status: "memorized",
        next_review_at: card.due.toISOString(),
        ...cardToUpdate(card, now),
      })
      .eq("id", sentenceId);
    return;
  }

  await supabase
    .from("pattern_sentences")
    .update({
      status: "learning",
      last_practiced_at: nowISO(),
      updated_at: nowISO(),
    })
    .eq("id", sentenceId);
}

export async function markSentenceMistakeAction(sentenceId: string) {
  const { supabase } = await getSupabase();
  await supabase
    .from("pattern_sentences")
    .update({
      status: "marked",
      last_practiced_at: nowISO(),
      updated_at: nowISO(),
    })
    .eq("id", sentenceId);
}

export async function markSentenceReviewResultAction(
  sentenceId: string,
  rating: ReviewRating,
) {
  const { supabase } = await getSupabase();
  const { data: sentence } = await supabase
    .from("pattern_sentences")
    .select(
      "fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_learning_steps, next_review_at, last_practiced_at",
    )
    .eq("id", sentenceId)
    .single();
  if (!sentence) return;

  const now = new Date();
  const { card } = scheduler.next(rowToCard(sentence), now, rating as Grade);
  const graduated = isGraduated(card);

  await supabase
    .from("pattern_sentences")
    .update({
      status: graduated ? "known" : "reviewing",
      next_review_at: graduated ? null : card.due.toISOString(),
      ...cardToUpdate(card, now),
    })
    .eq("id", sentenceId);
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
