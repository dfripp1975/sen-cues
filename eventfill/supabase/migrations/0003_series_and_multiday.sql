-- Multi-day events and recurring event series.
-- Safe to run once on an existing EventFill database (adds columns and a table).

alter table public.events add column if not exists end_date date;
alter table public.events drop constraint if exists events_end_after_start;
alter table public.events add constraint events_end_after_start check (end_date is null or end_date >= event_date);

create table if not exists public.event_series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  recurrence text not null check (recurrence in ('weekly','fortnightly','monthly')),
  created_at timestamptz not null default now()
);
create index if not exists event_series_org_idx on public.event_series(org_id);

alter table public.events add column if not exists series_id uuid references public.event_series(id) on delete set null;
create index if not exists events_series_idx on public.events(series_id);

alter table public.event_series enable row level security;
drop policy if exists "org members select" on public.event_series;
drop policy if exists "org members insert" on public.event_series;
drop policy if exists "org members update" on public.event_series;
drop policy if exists "org members delete" on public.event_series;
create policy "org members select" on public.event_series for select using (public.is_org_member(org_id));
create policy "org members insert" on public.event_series for insert with check (public.is_org_member(org_id));
create policy "org members update" on public.event_series for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "org members delete" on public.event_series for delete using (public.is_org_member(org_id));

-- An event can only join a series from its own organisation.
create or replace function public.enforce_series_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.series_id is not null and not exists (
    select 1 from public.event_series where id = new.series_id and org_id = new.org_id
  ) then
    raise exception 'series does not belong to this organisation';
  end if;
  return new;
end;
$$;
drop trigger if exists events_series_org on public.events;
create trigger events_series_org before insert or update on public.events
  for each row execute function public.enforce_series_org();

grant select, insert, update, delete on public.event_series to authenticated;
