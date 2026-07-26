-- ============================================================
-- WORDS — remove the 'weak' status and its backing counter
-- ============================================================
-- 'weak' only ever meant "forgotten twice in Recall" and stayed in the exact
-- same Recall queue as 'learning' anyway — no dedicated recovery mode ever
-- consumed it, so it added a distinction without a difference.
update words set status = 'learning' where status = 'weak';

alter table words
  drop column recall_fail_count;
