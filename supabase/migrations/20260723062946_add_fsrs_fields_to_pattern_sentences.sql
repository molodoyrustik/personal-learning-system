-- ============================================================
-- PATTERN_SENTENCES — FSRS scheduling fields for the spaced Review mode
-- ============================================================
-- Mirrors the words migration (20260723054712). `last_practiced_at` already
-- existed and keeps its role as the FSRS "last_review" timestamp; `due` needs
-- a new `next_review_at` column since patterns had no scheduling concept
-- before (First Pass / Review Marked / Full Practice only track a flat
-- new/marked/learning status, no dates).
alter table pattern_sentences
  add column next_review_at      timestamptz,
  add column fsrs_stability      double precision,
  add column fsrs_difficulty     double precision,
  add column fsrs_state          smallint,
  add column fsrs_reps           integer not null default 0,
  add column fsrs_lapses         integer not null default 0,
  add column fsrs_learning_steps integer not null default 0;
