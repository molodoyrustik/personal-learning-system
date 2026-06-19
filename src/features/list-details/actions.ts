"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

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
