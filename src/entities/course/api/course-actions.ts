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

export async function deleteCourseAction(courseId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", courseId);
  revalidatePath("/courses");
}
