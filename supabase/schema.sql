-- SEN Cues database schema
-- Run this in the Supabase SQL editor for a new project.
-- Pattern matches Darren's other Supabase apps: anonymous auth, row-level security,
-- no ORM, plain SQL.

-- ---------------------------------------------------------------------------
-- Child profiles
-- ---------------------------------------------------------------------------
create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  age text,
  diagnosis text default 'Not diagnosed / Prefer not to say',
  comm_prefs text,
  sensory_prefs text,
  triggers text,
  helps text,
  calming text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table child_profiles enable row level security;

create policy "Users manage their own child profiles"
  on child_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Favourited cues ("My Cues")
-- ---------------------------------------------------------------------------
create table if not exists favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  situation_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, situation_id)
);

alter table favourites enable row level security;

create policy "Users manage their own favourites"
  on favourites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Account / subscription state
-- Keep this in sync with RevenueCat via webhook once billing is wired up.
-- Until then, is_premium can be toggled manually for testing.
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  active_profile_id uuid references child_profiles(id) on delete set null,
  onboarding_answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table accounts enable row level security;

create policy "Users manage their own account row"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AI cue generation log — one row per generate-cue call, used by the Edge
-- Function to enforce a per-user daily limit. RLS is enabled with no
-- policies on purpose: only the service role (the Edge Function) can touch
-- it, so the limit can't be reset from the app.
-- ---------------------------------------------------------------------------
create table if not exists cue_generation_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists cue_generation_log_user_time
  on cue_generation_log (user_id, created_at);

alter table cue_generation_log enable row level security;

-- ---------------------------------------------------------------------------
-- Parent journal (Phase 2 — not yet wired into the app, schema ready for it)
-- ---------------------------------------------------------------------------
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_profile_id uuid references child_profiles(id) on delete set null,
  what_happened text,
  trigger text,
  what_i_tried text,
  what_helped text,
  what_didnt_help text,
  tags text[],
  created_at timestamptz not null default now()
);

alter table journal_entries enable row level security;

create policy "Users manage their own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger child_profiles_updated_at
  before update on child_profiles
  for each row execute function set_updated_at();

create trigger accounts_updated_at
  before update on accounts
  for each row execute function set_updated_at();
