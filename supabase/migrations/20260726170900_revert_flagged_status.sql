-- ============================================================
-- PATTERN_SENTENCES — revert the 'flagged' Practice Mistakes bucket
-- ============================================================
-- Full Practice mistakes now route back to 'marked' (Review Marked), same as
-- First Pass / Review mistakes — no separate Practice Mistakes mode. 'known'
-- sentences that had slipped into 'flagged' go back to 'marked' for rework.
update pattern_sentences set status = 'marked' where status = 'flagged';

alter table pattern_sentences
  drop column practice_mistake_count;
