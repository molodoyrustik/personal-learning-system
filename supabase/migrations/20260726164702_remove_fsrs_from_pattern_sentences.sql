-- ============================================================
-- PATTERN_SENTENCES — drop FSRS spaced-review scheduling entirely
-- ============================================================
-- Patterns no longer use date-based spaced review: once Full Practice is
-- clean (TOTAL_FULL_PRACTICE_PASSES), a sentence graduates straight to
-- 'known' with no further automatic scheduling. A Full Practice mistake now
-- routes to a persistent 'flagged' bucket (dedicated Practice Mistakes mode)
-- instead of an FSRS-dated Review queue.
alter table pattern_sentences
  drop column next_review_at,
  drop column fsrs_stability,
  drop column fsrs_difficulty,
  drop column fsrs_state,
  drop column fsrs_reps,
  drop column fsrs_lapses,
  drop column fsrs_learning_steps,
  add column practice_mistake_count integer not null default 0;

-- Collapse the old 'memorized'/'reviewing' FSRS states into 'known' — both
-- meant "graduated out of Full Practice", which is now a single terminal state.
update pattern_sentences set status = 'known' where status in ('memorized', 'reviewing');
