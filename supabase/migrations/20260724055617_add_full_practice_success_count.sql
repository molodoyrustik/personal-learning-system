-- ============================================================
-- PATTERN_SENTENCES — require 3 clean Full Practice passes before
-- graduating into FSRS Review (was 1). Mirrors words' recall_success_count.
-- ============================================================
alter table pattern_sentences
  add column full_practice_success_count integer not null default 0;
