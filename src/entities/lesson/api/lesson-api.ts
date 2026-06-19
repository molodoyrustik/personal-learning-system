import { createClient } from "@/shared/lib/supabase/server";
import type { Lesson } from "../model/types";

const LESSON_SELECT = `*, lesson_word_lists(list_id), lesson_patterns(pattern_id)`;

function mapLesson(row: Record<string, unknown>): Lesson {
  const wordLists = row.lesson_word_lists as Array<{ list_id: string }> | null;
  const patterns = row.lesson_patterns as Array<{ pattern_id: string }> | null;
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    order: row.order as number,
    wordListIds: (wordLists ?? []).map((r) => r.list_id),
    patternIds: (patterns ?? []).map((r) => r.pattern_id),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("course_id", courseId)
    .order("order");
  return (data ?? []).map(mapLesson);
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select(LESSON_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? mapLesson(data) : null;
}
