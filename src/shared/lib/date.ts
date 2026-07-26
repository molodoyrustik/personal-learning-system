// offsetMs lets bulk inserts stamp each row with a distinct, monotonically
// increasing created_at (base + index) instead of an identical timestamp for
// the whole batch — ties on created_at have no defined order in Postgres, so
// list order silently reshuffles once any tied row is later updated.
export function nowISO(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
