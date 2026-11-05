-- ============================================================
-- SQL Practice Quiz — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- One row per quiz submission (a student's answers to their 10 name-seeded
-- questions). Students submit without logging in; only the instructor can
-- read the answers from the Supabase dashboard (or via the service key).
-- ============================================================

create table if not exists public.sql_quiz_submissions (
  id           bigint generated always as identity primary key,
  student_name text not null,
  questions    jsonb not null default '[]'::jsonb,  -- [{num, skill, prompt}] as seen by the student
  answers      jsonb not null default '[]'::jsonb,  -- [{num, answer}]
  receipt      text,                                -- shown to the student on submission
  created_at   timestamptz not null default now()
);

create index if not exists sql_quiz_submissions_name_idx
  on public.sql_quiz_submissions (student_name, created_at desc);

alter table public.sql_quiz_submissions enable row level security;

-- Anyone with the site (anon key) may SUBMIT a quiz — the classroom app has no
-- login. There is deliberately NO select/update/delete policy for anon, so
-- students cannot read or change anyone's submissions.
drop policy if exists "anon can insert quiz submissions" on public.sql_quiz_submissions;
create policy "anon can insert quiz submissions" on public.sql_quiz_submissions
  for insert to anon with check (true);

-- No realtime needed: the instructor reads results in the dashboard after class.
--
-- Before each class, wipe the slate:
-- delete from public.sql_quiz_submissions;
