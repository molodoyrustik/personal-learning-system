import { createClient } from "@/shared/lib/supabase/server";
import type { Course } from "../model/types";

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("created_at");
  return (data ?? []).map(mapCourse);
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  return data ? mapCourse(data) : null;
}

export async function getLessonCountsByCourseIds(
  courseIds: string[],
): Promise<Record<string, number>> {
  if (courseIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("course_id")
    .in("course_id", courseIds);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { course_id: string }) => {
    counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
  });
  return counts;
}
