"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export async function createCourseAction(input: {
  title: string;
  description?: string | null;
}): Promise<{ courseId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const id = generateId();
  const now = nowISO();

  const { error } = await supabase.from("courses").insert({
    id,
    user_id: user.id,
    title: input.title,
    description: input.description ?? null,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/courses");
  return { courseId: id };
}

export async function updateCourseAction(
  courseId: string,
  input: { title: string; description?: string | null },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ title: input.title, description: input.description ?? null, updated_at: nowISO() })
    .eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  const supabase = await createClient();

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  const lessonIds = (lessonRows ?? []).map((r) => r.id);

  if (lessonIds.length > 0) {
    const [{ data: listRows }, { data: patternRows }] = await Promise.all([
      supabase.from("lesson_word_lists").select("list_id").in("lesson_id", lessonIds),
      supabase.from("lesson_patterns").select("pattern_id").in("lesson_id", lessonIds),
    ]);

    const listIds = [...new Set((listRows ?? []).map((r) => r.list_id))];
    const patternIds = [...new Set((patternRows ?? []).map((r) => r.pattern_id))];

    await Promise.all([
      listIds.length > 0 ? supabase.from("lists").delete().in("id", listIds) : Promise.resolve(),
      patternIds.length > 0 ? supabase.from("patterns").delete().in("id", patternIds) : Promise.resolve(),
    ]);
  }

  await supabase.from("courses").delete().eq("id", courseId);
  revalidatePath("/courses");
}
