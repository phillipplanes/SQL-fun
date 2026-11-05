-- ============================================================
-- SQL Practice Quiz — Supabase schema (v2)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- One row per quiz submission (a student's answers to their 10 name-seeded
-- questions). Students submit without logging in; answers are readable only
-- through the passcode-gated functions below (used by dashboard.html).
-- IMPORTANT: re-run this whole file if you have run an older version.
-- ============================================================

create table if not exists public.sql_quiz_submissions (
  id           bigint generated always as identity primary key,
  student_name text not null,
  questions    jsonb not null default '[]'::jsonb,  -- [{num, skill, prompt}] as seen by the student
  answers      jsonb not null default '[]'::jsonb,  -- [{num, answer, sql, expected, correct}]
  receipt      text,                                -- shown to the student on submission
  created_at   timestamptz not null default now()
);

create index if not exists sql_quiz_submissions_name_idx
  on public.sql_quiz_submissions (student_name, created_at desc);

alter table public.sql_quiz_submissions enable row level security;

-- Anyone with the site (anon key) may SUBMIT a quiz — the classroom app has no
-- login. There is deliberately NO select/update/delete policy for anon, so
-- students cannot read or change anyone's submissions directly.
drop policy if exists "anon can insert quiz submissions" on public.sql_quiz_submissions;
create policy "anon can insert quiz submissions" on public.sql_quiz_submissions
  for insert to anon with check (true);

-- ------------------------------------------------------------
-- Instructor access (dashboard.html)
-- The dashboard reads submissions through these SECURITY DEFINER functions,
-- which check an instructor passcode stored in sql_quiz_config. Direct table
-- reads stay blocked for students (no RLS select policy).
--
-- SET YOUR PASSCODE after running this file:
--   update public.sql_quiz_config set instructor_passcode = 'your-secret-here';
-- Anyone with the passcode can view (or clear) all submissions, so pick
-- something your students won't guess, and change it each term.
-- ------------------------------------------------------------
create table if not exists public.sql_quiz_config (
  id                 int primary key default 1 check (id = 1),
  instructor_passcode text not null default 'change-me'
);

insert into public.sql_quiz_config (id, instructor_passcode)
values (1, 'change-me')
on conflict (id) do nothing;

alter table public.sql_quiz_config enable row level security;
-- No policies at all: neither anon nor authenticated can read or change the passcode.

create or replace function public.sql_quiz_submissions_list(p_passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
  payload jsonb;
begin
  select exists (select 1 from public.sql_quiz_config c
                  where c.id = 1 and c.instructor_passcode = p_passcode)
    into ok;
  if not ok then
    return jsonb_build_object('ok', false, 'error', 'Invalid instructor passcode.');
  end if;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc), '[]'::jsonb)
    into payload
    from public.sql_quiz_submissions s;

  return jsonb_build_object('ok', true, 'rows', payload);
end;
$$;

create or replace function public.sql_quiz_submissions_clear(p_passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
  n integer;
begin
  select exists (select 1 from public.sql_quiz_config c
                  where c.id = 1 and c.instructor_passcode = p_passcode)
    into ok;
  if not ok then
    return jsonb_build_object('ok', false, 'error', 'Invalid instructor passcode.');
  end if;

  select count(*) into n from public.sql_quiz_submissions;
  -- "WHERE true" satisfies pg_safeupdate ("DELETE requires a WHERE clause")
  delete from public.sql_quiz_submissions where true;

  return jsonb_build_object('ok', true, 'deleted', n);
end;
$$;

-- Dashboard/page (anon key) needs to call both functions; the passcode check inside
-- is the real gate.
grant execute on function public.sql_quiz_submissions_list(text) to anon, authenticated;
grant execute on function public.sql_quiz_submissions_clear(text) to anon, authenticated;

-- No realtime needed: the dashboard polls.

-- Before each class, wipe the slate — either press "Clear all submissions" on
-- the dashboard, or:
-- delete from public.sql_quiz_submissions where true;
