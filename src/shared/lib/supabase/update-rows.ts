import type { SupabaseClient } from "@supabase/supabase-js";

export type DbRow = Record<string, unknown> & { id: string };

// Applies per-row changes to many rows as a single upsert statement, so a
// study session's results land all-or-nothing (Postgres runs one statement
// in one transaction) — a failed save leaves nothing half-written and is
// safe to retry. Rows are read in full first because an upsert must carry
// every NOT NULL column, even for rows that only ever take the UPDATE path.
// Throws on any database error instead of failing silently.
export async function updateRowsAtomically<T>(
  supabase: SupabaseClient,
  table: string,
  changesById: Map<string, T>,
  patch: (row: DbRow, change: T) => Record<string, unknown>,
): Promise<void> {
  if (changesById.size === 0) return;

  const { data } = await supabase
    .from(table)
    .select("*")
    .in("id", [...changesById.keys()])
    .throwOnError();

  const rows = (data ?? []) as DbRow[];
  if (rows.length === 0) return;

  await supabase
    .from(table)
    .upsert(
      rows.map((row) => ({
        ...row,
        ...patch(row, changesById.get(row.id) as T),
      })),
      { onConflict: "id" },
    )
    .throwOnError();
}
