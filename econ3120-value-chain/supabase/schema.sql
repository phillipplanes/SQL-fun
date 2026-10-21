-- ============================================================
-- ECON3120 Value Chain — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- One row per entity team; fields is the team's JSON field list.
create table if not exists public.team_fields (
  team text primary key check (team in ('customer','salesrep','distributor','supplier','management')),
  fields jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Contracts locked by the teacher during a negotiation.
create table if not exists public.contracts (
  id bigint generated always as identity primary key,
  provider_team text not null references public.team_fields(team) on delete cascade,
  needer_team text not null references public.team_fields(team) on delete cascade,
  field text not null,
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (provider_team, needer_team, field)
);

-- RLS on, with an allow-all policy for the anon key: the classroom app
-- has no login, and there is no sensitive data. Anyone with the anon key
-- (i.e. anyone who opens the site) can read/write these two tables.
alter table public.team_fields enable row level security;
alter table public.contracts enable row level security;

drop policy if exists "allow all team_fields" on public.team_fields;
create policy "allow all team_fields" on public.team_fields
  for all to anon using (true) with check (true);

drop policy if exists "allow all contracts" on public.contracts;
create policy "allow all contracts" on public.contracts
  for all to anon using (true) with check (true);

-- Enable realtime so the teacher board and team views update live.
-- (Guarded so re-running the script doesn't error on "already a member".)
do $$
begin
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_fields') then
    alter publication supabase_realtime add table public.team_fields;
  end if;
  if not exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contracts') then
    alter publication supabase_realtime add table public.contracts;
  end if;
end $$;

-- Before each class, wipe the slate:
-- delete from public.contracts;
-- delete from public.team_fields;
