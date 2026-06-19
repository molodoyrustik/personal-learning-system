import { createClient } from "@/shared/lib/supabase/server";
import type { Pattern, PatternRun, PatternSentence } from "../model/types";

function mapPattern(row: Record<string, unknown>): Pattern {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSentence(row: Record<string, unknown>): PatternSentence {
  return {
    id: row.id as string,
    patternId: row.pattern_id as string,
    sourceText: row.source_text as string,
    targetText: row.target_text as string,
    comment: (row.comment as string | null) ?? null,
    status: row.status as PatternSentence["status"],
    lastPracticedAt: (row.last_practiced_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRun(row: Record<string, unknown>): PatternRun {
  return {
    id: row.id as string,
    patternId: row.pattern_id as string,
    durationSec: row.duration_sec as number,
    completedAt: row.completed_at as string,
  };
}

export async function getPatterns(): Promise<Pattern[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapPattern);
}

export async function getPatternById(id: string): Promise<Pattern | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapPattern(data as Record<string, unknown>);
}

export async function getSentencesByPatternId(patternId: string): Promise<PatternSentence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pattern_sentences")
    .select("*")
    .eq("pattern_id", patternId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapSentence);
}

export async function getRunsByPatternId(patternId: string): Promise<PatternRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pattern_runs")
    .select("*")
    .eq("pattern_id", patternId)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return data.map(mapRun);
}

export async function getSentenceCountsByPatternIds(
  patternIds: string[],
): Promise<Record<string, number>> {
  if (patternIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pattern_sentences")
    .select("pattern_id")
    .in("pattern_id", patternIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.pattern_id] = (counts[row.pattern_id] ?? 0) + 1;
  }
  return counts;
}
