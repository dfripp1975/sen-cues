-- EventFill core schema
-- Every customer-owned row carries org_id. Row-level security limits access to
-- members of that organisation. Tables that must never be written by browsers
-- (subscriptions, ai_usage, link_clicks, rate_limits, audit_logs, app_errors)
-- have read-only or no policies; the server writes them with the service role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles & organisations
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  active_org_id uuid,
  marketing_emails boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  event_types text[] not null default '{}',
  event_frequency text,
  ticketing_platform text,
  country text,
  currency text not null default 'GBP' check (char_length(currency) = 3),
  timezone text not null default 'Europe/London',
  onboarding_completed boolean not null default false,
  data_retention_months int not null default 24 check (data_retention_months between 3 and 120),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_active_org_fk foreign key (active_org_id)
  references public.organisations(id) on delete set null;

create table public.organisation_members (
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.organisation_members(user_id);

create table public.organisation_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

-- Membership helpers. SECURITY DEFINER so policies on organisation_members do
-- not recurse into themselves.
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members
    where org_id = p_org and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members
    where org_id = p_org and user_id = auth.uid() and role = any(p_roles)
  );
$$;

-- Creates an organisation and makes the caller its owner in one step.
create or replace function public.create_organisation(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.organisations(name, created_by) values (p_name, auth.uid()) returning id into v_org;
  insert into public.organisation_members(org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  insert into public.profiles(id, active_org_id) values (auth.uid(), v_org)
    on conflict (id) do update set active_org_id = excluded.active_org_id, updated_at = now();
  return v_org;
end;
$$;

-- Accepts a team invite for the signed-in user if the email matches.
create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv public.organisation_invites; v_email text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select email into v_email from auth.users where id = auth.uid();
  select * into v_inv from public.organisation_invites
    where token = p_token and accepted_at is null and expires_at > now();
  if v_inv.id is null then raise exception 'invite not found or expired'; end if;
  if lower(v_inv.email) <> lower(v_email) then raise exception 'invite was sent to a different email address'; end if;
  insert into public.organisation_members(org_id, user_id, role)
    values (v_inv.org_id, auth.uid(), v_inv.role) on conflict do nothing;
  update public.organisation_invites set accepted_at = now() where id = v_inv.id;
  insert into public.profiles(id, active_org_id) values (auth.uid(), v_inv.org_id)
    on conflict (id) do update set active_org_id = excluded.active_org_id;
  return v_inv.org_id;
end;
$$;

-- New auth user -> profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Events & sales
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  category text not null default 'other',
  venue text,
  is_online boolean not null default false,
  event_date date not null,
  start_time time,
  end_time time,
  timezone text not null default 'Europe/London',
  ticketing_platform text,
  booking_url text,
  capacity int check (capacity is null or capacity >= 0),
  ticket_target int not null default 0 check (ticket_target >= 0),
  marketing_budget numeric(12,2) not null default 0,
  image_url text,
  notes text,
  sales_start_date date,
  attendance int check (attendance is null or attendance >= 0),
  lessons_learned text,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  is_template boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.events(org_id, event_date);

create table public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  quantity int check (quantity is null or quantity >= 0),
  created_at timestamptz not null default now()
);
create index on public.ticket_tiers(event_id);

create table public.ticket_sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  tier_id uuid references public.ticket_tiers(id) on delete set null,
  sale_date date not null,
  quantity int not null default 0 check (quantity >= 0),
  revenue numeric(12,2) not null default 0 check (revenue >= 0),
  refunds int not null default 0 check (refunds >= 0),
  refund_amount numeric(12,2) not null default 0 check (refund_amount >= 0),
  source text not null default 'manual' check (source in ('manual','csv')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.ticket_sales(event_id, sale_date);

create table public.sales_forecasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  conservative int not null,
  expected int not null,
  optimistic int not null,
  inputs jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Marketing
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  channel text not null default 'other',
  status text not null default 'planned' check (status in ('planned','active','paused','completed')),
  start_date date,
  end_date date,
  budget numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.marketing_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  title text not null,
  channel text,
  due_date date,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  assignee_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.marketing_tasks(org_id, due_date);

create table public.rescue_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  recommendation_key text,
  title text not null,
  description text,
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  tickets_at_creation int,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_content (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  content_type text not null,
  platform text,
  tone text,
  body text not null,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  estimated_cost_usd numeric(10,5) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.ai_usage(org_id, created_at);

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{4,40}$'),
  label text not null,
  destination_url text not null check (destination_url ~* '^https?://'),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- No IP addresses or user agents are stored, only coarse device type and referrer host.
create table public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.tracking_links(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer_host text,
  device text check (device in ('mobile','desktop','tablet','bot','unknown'))
);
create index on public.link_clicks(link_id, clicked_at);

-- ---------------------------------------------------------------------------
-- Competitors, surveys, finance
-- ---------------------------------------------------------------------------
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  url text check (url is null or url ~* '^https?://'),
  event_date date,
  price_min numeric(10,2),
  price_max numeric(10,2),
  description text,
  benefits text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  survey_type text not null default 'custom',
  slug text not null unique default encode(gen_random_bytes(6), 'hex'),
  questions jsonb not null default '[]',
  is_open boolean not null default true,
  anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  answers jsonb not null,
  respondent_email text,
  created_at timestamptz not null default now()
);
create index on public.survey_responses(survey_id);

create table public.event_income (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null check (category in ('sponsorship','exhibitor','other')),
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  is_estimate boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.event_expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null check (category in ('venue','catering','staff','entertainment','equipment','marketing','ticketing_fees','suppliers','other')),
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  is_estimate boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Billing, notifications, audit, ops
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  org_id uuid primary key references public.organisations(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','starter','growth','pro')),
  billing_interval text check (billing_interval in ('month','year')),
  status text not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid references public.organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.app_errors (
  id bigint generated always as identity primary key,
  route text,
  message text not null,
  org_id uuid,
  created_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

-- Atomic fixed-window rate limiter. Returns true when the call is allowed.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds int, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  insert into public.rate_limits(key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rate_limits.count + 1 end,
    window_start = case when rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else rate_limits.window_start end
  returning count into v_count;
  return v_count <= p_max;
end;
$$;
revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

-- Every new organisation starts on the free plan.
create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions(org_id, plan) values (new.id, 'free') on conflict do nothing;
  return new;
end;
$$;
create trigger on_org_created after insert on public.organisations
  for each row execute function public.handle_new_org();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;
alter table public.organisation_invites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_usage enable row level security;
alter table public.link_clicks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_errors enable row level security;
alter table public.support_messages enable row level security;
alter table public.rate_limits enable row level security;
alter table public.notifications enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
-- Team members can see each other's names
create policy "teammate profiles" on public.profiles for select using (
  exists (select 1 from public.organisation_members m1
          join public.organisation_members m2 on m1.org_id = m2.org_id
          where m1.user_id = auth.uid() and m2.user_id = profiles.id)
);

create policy "members read org" on public.organisations for select using (public.is_org_member(id));
create policy "admins update org" on public.organisations for update
  using (public.has_org_role(id, array['owner','admin'])) with check (public.has_org_role(id, array['owner','admin']));
create policy "owner deletes org" on public.organisations for delete using (public.has_org_role(id, array['owner']));

create policy "members read members" on public.organisation_members for select using (public.is_org_member(org_id));
create policy "admins remove members" on public.organisation_members for delete
  using (public.has_org_role(org_id, array['owner','admin']) and role <> 'owner');
create policy "member leaves" on public.organisation_members for delete using (user_id = auth.uid() and role <> 'owner');

create policy "admins manage invites" on public.organisation_invites for all
  using (public.has_org_role(org_id, array['owner','admin'])) with check (public.has_org_role(org_id, array['owner','admin']));

create policy "members read subscription" on public.subscriptions for select using (public.is_org_member(org_id));
create policy "members read ai usage" on public.ai_usage for select using (public.is_org_member(org_id));
create policy "members read clicks" on public.link_clicks for select using (public.is_org_member(org_id));
create policy "members read audit" on public.audit_logs for select using (public.is_org_member(org_id));
create policy "own notifications" on public.notifications for select
  using (public.is_org_member(org_id) and (user_id is null or user_id = auth.uid()));
create policy "members create notifications" on public.notifications for insert
  with check (public.is_org_member(org_id));
create policy "own notifications update" on public.notifications for update
  using (public.is_org_member(org_id) and (user_id is null or user_id = auth.uid()));
-- app_errors, support_messages, rate_limits: no policies -> service role only.

-- Generic "members of the org can do everything" policy for customer data tables.
do $$
declare t text;
begin
  foreach t in array array['events','ticket_tiers','ticket_sales','sales_forecasts','campaigns',
    'marketing_tasks','rescue_actions','ai_content','tracking_links','competitors','surveys',
    'survey_responses','event_income','event_expenses']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "org members select" on public.%I for select using (public.is_org_member(org_id))', t);
    execute format('create policy "org members insert" on public.%I for insert with check (public.is_org_member(org_id))', t);
    execute format('create policy "org members update" on public.%I for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id))', t);
    execute format('create policy "org members delete" on public.%I for delete using (public.is_org_member(org_id))', t);
  end loop;
end $$;

-- Child rows must belong to the same org as their parent event, so a member of
-- org A cannot attach rows to org B's event by guessing its id.
create or replace function public.enforce_event_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.events where id = new.event_id and org_id = new.org_id
  ) then
    raise exception 'event does not belong to this organisation';
  end if;
  return new;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array['ticket_tiers','ticket_sales','sales_forecasts','campaigns','marketing_tasks',
    'rescue_actions','ai_content','tracking_links','competitors','surveys','event_income','event_expenses']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.enforce_event_org()', t || '_event_org', t);
  end loop;
end $$;

-- Keep organisations' plan out of client reach: plan lives only in subscriptions,
-- which has no insert/update policy.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.create_organisation(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
