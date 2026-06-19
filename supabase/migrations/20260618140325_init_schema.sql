-- ============================================================
-- LISTS
-- ============================================================
create table lists (
  id           text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  description  text,
  source_language text not null,
  target_language text not null,
  created_at   timestamptz not null,
  updated_at   timestamptz not null
);

alter table lists enable row level security;
create policy "users see own lists" on lists
  for all using (auth.uid() = user_id);

-- ============================================================
-- WORDS
-- ============================================================
create table words (
  id                      text primary key,
  user_id                 uuid not null references auth.users on delete cascade,
  list_id                 text not null references lists on delete cascade,
  source_text             text not null,
  target_text             text not null,
  status                  text not null,
  selection_decision      text,
  can_visualize_meaning   boolean,
  sound_association       text,
  scene_description       text,
  skip_count              integer not null default 0,
  encoding_attempt_count  integer not null default 0,
  encoding_attempt_round  integer,
  recall_success_count    integer not null default 0,
  recall_fail_count       integer not null default 0,
  last_recalled_at        timestamptz,
  next_review_at          timestamptz,
  created_at              timestamptz not null,
  updated_at              timestamptz not null
);

alter table words enable row level security;
create policy "users see own words" on words
  for all using (auth.uid() = user_id);

create index words_list_id_idx on words (list_id);

-- ============================================================
-- PATTERNS
-- ============================================================
create table patterns (
  id          text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

alter table patterns enable row level security;
create policy "users see own patterns" on patterns
  for all using (auth.uid() = user_id);

-- ============================================================
-- PATTERN SENTENCES
-- ============================================================
create table pattern_sentences (
  id                text primary key,
  user_id           uuid not null references auth.users on delete cascade,
  pattern_id        text not null references patterns on delete cascade,
  source_text       text not null,
  target_text       text not null,
  comment           text,
  status            text not null,
  last_practiced_at timestamptz,
  created_at        timestamptz not null,
  updated_at        timestamptz not null
);

alter table pattern_sentences enable row level security;
create policy "users see own pattern_sentences" on pattern_sentences
  for all using (auth.uid() = user_id);

create index pattern_sentences_pattern_id_idx on pattern_sentences (pattern_id);

-- ============================================================
-- PATTERN RUNS
-- ============================================================
create table pattern_runs (
  id           text primary key,
  user_id      uuid not null references auth.users on delete cascade,
  pattern_id   text not null references patterns on delete cascade,
  duration_sec integer not null,
  completed_at timestamptz not null
);

alter table pattern_runs enable row level security;
create policy "users see own pattern_runs" on pattern_runs
  for all using (auth.uid() = user_id);

create index pattern_runs_pattern_id_idx on pattern_runs (pattern_id);

-- ============================================================
-- COURSES
-- ============================================================
create table courses (
  id          text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

alter table courses enable row level security;
create policy "users see own courses" on courses
  for all using (auth.uid() = user_id);

-- ============================================================
-- LESSONS
-- ============================================================
create table lessons (
  id          text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  course_id   text not null references courses on delete cascade,
  title       text not null,
  description text,
  "order"     integer not null default 0,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

alter table lessons enable row level security;
create policy "users see own lessons" on lessons
  for all using (auth.uid() = user_id);

create index lessons_course_id_idx on lessons (course_id);

-- ============================================================
-- LESSON <-> WORD LISTS  (join table)
-- ============================================================
create table lesson_word_lists (
  lesson_id text not null references lessons on delete cascade,
  list_id   text not null references lists on delete cascade,
  primary key (lesson_id, list_id)
);

alter table lesson_word_lists enable row level security;
create policy "users see own lesson_word_lists" on lesson_word_lists
  for all using (
    exists (
      select 1 from lessons l
      where l.id = lesson_id and l.user_id = auth.uid()
    )
  );

-- ============================================================
-- LESSON <-> PATTERNS  (join table)
-- ============================================================
create table lesson_patterns (
  lesson_id  text not null references lessons on delete cascade,
  pattern_id text not null references patterns on delete cascade,
  primary key (lesson_id, pattern_id)
);

alter table lesson_patterns enable row level security;
create policy "users see own lesson_patterns" on lesson_patterns
  for all using (
    exists (
      select 1 from lessons l
      where l.id = lesson_id and l.user_id = auth.uid()
    )
  );

-- ============================================================
-- CHARACTERISTICS
-- ============================================================
create table characteristics (
  id          text primary key,
  user_id     uuid not null references auth.users on delete cascade,
  key         text not null,
  description text not null default '',
  example     text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  unique (user_id, key)
);

alter table characteristics enable row level security;
create policy "users see own characteristics" on characteristics
  for all using (auth.uid() = user_id);
