"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

export async function resetListProgressAction(listId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("words").update({
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
    updated_at: new Date().toISOString(),
  }).eq("list_id", listId).eq("user_id", user.id);

  revalidatePath(`/lists/${listId}`);
}

export async function deleteListAction(listId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("words").delete().eq("list_id", listId).eq("user_id", user.id);
  const { error } = await supabase.from("lists").delete().eq("id", listId).eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/lists");
  redirect("/lists");
}
