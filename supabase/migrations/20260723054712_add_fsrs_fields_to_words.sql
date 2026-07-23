-- ============================================================
-- WORDS — FSRS scheduling fields for the Review mode
-- ============================================================
-- Replaces the fixed-interval lookup table (getReviewIntervalDays) with the
-- FSRS algorithm. `next_review_at` keeps its role as the FSRS "due" date and
-- `last_recalled_at` keeps its role as the FSRS "last_review" timestamp —
-- both already existed and are reused as-is, no new columns needed for them.
alter table words
  add column fsrs_stability      double precision,
  add column fsrs_difficulty     double precision,
  add column fsrs_state          smallint,
  add column fsrs_reps           integer not null default 0,
  add column fsrs_lapses         integer not null default 0,
  add column fsrs_learning_steps integer not null default 0;
