"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export async function createLessonAction(input: {
  courseId: string;
  title: string;
  description?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("lessons")
    .select("order")
    .eq("course_id", input.courseId)
    .order("order", { ascending: false })
    .limit(1);

  const order = existing && existing.length > 0 ? existing[0].order + 1 : 0;
  const now = nowISO();

  await supabase.from("lessons").insert({
    id: generateId(),
    user_id: user.id,
    course_id: input.courseId,
    title: input.title,
    description: input.description ?? null,
    order,
    created_at: now,
    updated_at: now,
  });

  revalidatePath(`/courses/${input.courseId}`);
}

export async function deleteLessonAction(lessonId: string, courseId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/courses/${courseId}`);
}

export async function addWordListToLessonAction(
  lessonId: string,
  listId: string,
  courseId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("lesson_word_lists").upsert({ lesson_id: lessonId, list_id: listId });
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}

export async function removeWordListFromLessonAction(
  lessonId: string,
  listId: string,
  courseId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("lesson_word_lists")
    .delete()
    .eq("lesson_id", lessonId)
    .eq("list_id", listId);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}

export async function addPatternToLessonAction(
  lessonId: string,
  patternId: string,
  courseId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("lesson_patterns").upsert({ lesson_id: lessonId, pattern_id: patternId });
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}

export async function removePatternFromLessonAction(
  lessonId: string,
  patternId: string,
  courseId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("lesson_patterns")
    .delete()
    .eq("lesson_id", lessonId)
    .eq("pattern_id", patternId);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}
