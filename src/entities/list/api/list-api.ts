import { createClient } from "@/shared/lib/supabase/server";
import type { List } from "../model/types";

function mapRow(row: Record<string, unknown>): List {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    sourceLanguage: row.source_language as List["sourceLanguage"],
    targetLanguage: row.target_language as List["targetLanguage"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getLists(): Promise<List[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapRow);
}

export async function getListById(id: string): Promise<List | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRow(data as Record<string, unknown>);
}
