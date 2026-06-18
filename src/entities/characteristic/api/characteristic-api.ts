import { createClient } from "@/shared/lib/supabase/server";
import type { Characteristic } from "../model/types";

function mapCharacteristic(row: Record<string, unknown>): Characteristic {
  return {
    id: row.id as string,
    key: row.key as string,
    description: (row.description as string) ?? "",
    example: (row.example as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getCharacteristics(): Promise<Characteristic[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("characteristics").select("*").order("created_at");
  return (data ?? []).map(mapCharacteristic);
}

export async function getCharacteristicById(id: string): Promise<Characteristic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("characteristics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapCharacteristic(data) : null;
}
