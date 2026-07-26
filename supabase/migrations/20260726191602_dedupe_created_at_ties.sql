-- ============================================================
-- WORDS & PATTERN_SENTENCES — de-duplicate created_at ties
-- ============================================================
-- Bulk inserts (add-new-list, pattern sentence import) stamped every row in
-- a batch with an identical created_at. Lists are ordered only by
-- created_at, so tied rows had no defined order in Postgres — and rewriting
-- any of them (practice sessions now commit a whole batch of status updates
-- at once instead of one row at a time) could shuffle the tied group's
-- visible order.
--
-- This spreads every row 1ms apart, in its current (created_at, id) order,
-- so each row ends up with a distinct created_at and that order can never
-- drift again. Rows that were never tied just shift forward by a
-- negligible amount and keep their existing relative order.
with ranked as (
  select id, row_number() over (partition by list_id order by created_at, id) - 1 as rn
  from words
)
update words
set created_at = words.created_at + (ranked.rn * interval '1 millisecond')
from ranked
where words.id = ranked.id;

with ranked as (
  select id, row_number() over (partition by pattern_id order by created_at, id) - 1 as rn
  from pattern_sentences
)
update pattern_sentences
set created_at = pattern_sentences.created_at + (ranked.rn * interval '1 millisecond')
from ranked
where pattern_sentences.id = ranked.id;
