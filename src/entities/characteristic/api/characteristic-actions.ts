"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export async function createCharacteristicAction(input: {
  key: string;
  description: string;
  example?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = nowISO();
  await supabase.from("characteristics").insert({
    id: generateId(),
    user_id: user.id,
    key: input.key,
    description: input.description,
    example: input.example ?? null,
    created_at: now,
    updated_at: now,
  });

  revalidatePath("/characteristics");
}

export async function createCharacteristicsAction(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = nowISO();
  const rows = keys.map((key) => ({
    id: generateId(),
    user_id: user.id,
    key,
    description: "",
    example: null,
    created_at: now,
    updated_at: now,
  }));

  await supabase.from("characteristics").upsert(rows, {
    onConflict: "user_id, key",
    ignoreDuplicates: true,
  });
  revalidatePath("/characteristics");
}

export async function updateCharacteristicAction(
  id: string,
  patch: { key?: string; description?: string; example?: string | null },
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("characteristics")
    .update({ ...patch, updated_at: nowISO() })
    .eq("id", id);
  revalidatePath("/characteristics");
}

export async function deleteCharacteristicAction(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("characteristics").delete().eq("id", id);
  revalidatePath("/characteristics");
}
