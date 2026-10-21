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

-- Classroom setting: no auth, no sensitive data. Open access via
-- anon key is acceptable for a single class session. If you want
-- a token of friction, replace 'anon' with a request you share.
create policy "allow all team_fields" on public.team_fields
  for all to anon using (true) with check (true);

create policy "allow all contracts" on public.contracts
  for all to anon using (true) with check (true);

-- Enable realtime so the teacher board and team views update live.
alter publication supabase_realtime add table public.team_fields;
alter publication supabase_realtime add table public.contracts;

-- Before each class, wipe the slate:
-- delete from public.contracts;
-- delete from public.team_fields;
