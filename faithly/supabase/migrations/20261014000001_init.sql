-- Faithly — initial schema
-- Tables, indexes, foreign keys and Row Level Security for every user-facing table.
-- Private data (journal, prayers, chats) is readable ONLY by its owner. Administrators
-- get aggregate statistics through the admin-stats Edge Function, never row access.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles & preferences
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  is_admin boolean not null default false,
  onboarding_completed boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Users may not promote themselves to admin.
create or replace function public.protect_profile_admin() returns trigger
language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'is_admin can only be changed by the service role';
  end if;
  return new;
end $$;
create trigger profiles_protect_admin before update on public.profiles
  for each row execute function public.protect_profile_admin();

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reasons text[] not null default '{}',          -- What brings you to Faithly?
  focus_areas text[] not null default '{}',
  bible_familiarity text check (bible_familiarity in ('new','some','familiar','very_familiar')),
  daily_minutes int check (daily_minutes in (5, 10, 15, 20, 30)),
  translation_code text not null default 'WEB',
  wants_reminders boolean,
  tradition text check (char_length(tradition) <= 60),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  font_scale numeric(3,2) not null default 1.00 check (font_scale between 0.8 and 1.6),
  new_to_christianity boolean not null default false,
  ai_memory_enabled boolean not null default false,
  ai_memory text not null default '' check (char_length(ai_memory) <= 1500),
  tts_voice text,
  tts_rate numeric(3,2) not null default 1.00 check (tts_rate between 0.5 and 2.0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Create profile + preferences rows for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data->>'display_name',
                                       new.raw_user_meta_data->>'full_name', ''), 60), ''))
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Subscriptions & usage (written only by Edge Functions using the service role)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe','apple','google')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('monthly','yearly')),
  status text not null default 'none',          -- none | trialing | active | past_due | canceled | incomplete ...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  amount_pence int,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.is_admin(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

create table public.usage_tracking (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                    -- chat | deeper | explain_verse | study | prayer | journey_reflection
  provider text,
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  estimated_cost_usd numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);
create index usage_tracking_user_time on public.usage_tracking (user_id, created_at desc);
create index usage_tracking_time on public.usage_tracking (created_at desc);

-- One row per user per day they opened the app — used for retention analytics.
create table public.user_activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
create index user_activity_days_day on public.user_activity_days (day);

create or replace function public.touch_activity() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.user_activity_days (user_id, day) values (auth.uid(), current_date)
  on conflict do nothing;
  update public.profiles set last_active_at = now() where id = auth.uid();
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bible text (public, read-only to clients)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.bible_translations (
  code text primary key,
  name text not null,
  language text not null default 'en',
  license text not null,
  copyright_notice text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.bible_books (
  id smallint primary key,               -- canonical order 1..66
  code text not null unique,             -- USFM code, e.g. GEN, JHN
  name text not null,
  testament text not null check (testament in ('OT','NT')),
  chapter_count smallint not null
);

create table public.bible_chapters (
  translation_code text not null references public.bible_translations(code) on delete cascade,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_count smallint not null,
  primary key (translation_code, book_id, chapter)
);

create table public.bible_verses (
  id bigint generated always as identity primary key,
  translation_code text not null references public.bible_translations(code) on delete cascade,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse smallint not null,
  text text not null,
  search tsvector generated always as (to_tsvector('english', text)) stored,
  unique (translation_code, book_id, chapter, verse)
);
create index bible_verses_search on public.bible_verses using gin (search);

create or replace function public.search_bible(q text, translation text default 'WEB', max_results int default 50)
returns table (book_id smallint, chapter smallint, verse smallint, text text, rank real)
language sql stable set search_path = public as $$
  select v.book_id, v.chapter, v.verse, v.text, ts_rank(v.search, websearch_to_tsquery('english', q)) as rank
  from public.bible_verses v
  where v.translation_code = translation
    and v.search @@ websearch_to_tsquery('english', q)
  order by rank desc, v.book_id, v.chapter, v.verse
  limit least(greatest(max_results, 1), 100);
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily verses (authored list of references; text always comes from bible_verses)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.daily_verses (
  id int primary key,                    -- rotation index
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  explanation text not null,
  theme text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AI conversations
-- ─────────────────────────────────────────────────────────────────────────────
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chat_conversations_user on public.chat_conversations (user_id, updated_at desc);
create trigger chat_conversations_updated_at before update on public.chat_conversations
  for each row execute function public.set_updated_at();

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 20000),
  payload jsonb,                          -- structured assistant response incl. verified passages
  created_at timestamptz not null default now()
);
create index chat_messages_conversation on public.chat_messages (conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Devotionals
-- ─────────────────────────────────────────────────────────────────────────────
create table public.devotional_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  reflection text not null,
  takeaway text not null,
  reflection_question text not null,
  prayer text not null,
  focus_tags text[] not null default '{}',
  is_premium boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger devotional_content_updated_at before update on public.devotional_content
  for each row execute function public.set_updated_at();

create table public.devotional_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  devotional_id uuid not null references public.devotional_content(id) on delete cascade,
  completed_at timestamptz,
  is_saved boolean not null default false,
  note text not null default '' check (char_length(note) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (user_id, devotional_id)
);
create trigger devotional_completions_updated_at before update on public.devotional_completions
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Faith journeys
-- ─────────────────────────────────────────────────────────────────────────────
create table public.faith_journeys (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null,
  description text not null,
  day_count smallint not null,
  focus_tags text[] not null default '{}',
  is_premium boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faith_journeys_updated_at before update on public.faith_journeys
  for each row execute function public.set_updated_at();

create table public.journey_days (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.faith_journeys(id) on delete cascade,
  day_number smallint not null,
  theme text not null,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  explanation text not null,
  reflection_question text not null,
  activity text not null,
  prayer text not null,
  journal_prompt text not null,
  unique (journey_id, day_number)
);

create table public.user_journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null references public.faith_journeys(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed')),
  completed_days smallint[] not null default '{}',
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, journey_id)
);
create index user_journey_progress_user on public.user_journey_progress (user_id, last_activity_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Prayers & journal (private)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.prayer_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'custom',
  title text not null default '' check (char_length(title) <= 120),
  content text not null check (char_length(content) between 1 and 10000),
  is_ai_generated boolean not null default false,
  is_favourite boolean not null default false,
  reflection text not null default '' check (char_length(reflection) <= 5000),
  status text not null default 'praying' check (status in ('praying','reflected','answered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prayer_entries_user on public.prayer_entries (user_id, created_at desc);
create trigger prayer_entries_updated_at before update on public.prayer_entries
  for each row execute function public.set_updated_at();

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  title text not null default '' check (char_length(title) <= 160),
  body text not null check (char_length(body) between 1 and 20000),
  scripture_refs text[] not null default '{}',
  mood text check (mood in ('happy','anxious','sad','grateful','overwhelmed','lonely','hopeful','uncertain','peaceful')),
  is_prayer boolean not null default false,
  prayer_status text check (prayer_status in ('praying','reflected','answered')),
  journey_id uuid references public.faith_journeys(id) on delete set null,
  journey_day smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_entries_user on public.journal_entries (user_id, entry_date desc, created_at desc);
create trigger journal_entries_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Bible personal data
-- ─────────────────────────────────────────────────────────────────────────────
create table public.bible_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation_code text not null default 'WEB',
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  note text not null default '' check (char_length(note) <= 5000),
  created_at timestamptz not null default now(),
  unique (user_id, translation_code, book_id, chapter, verse_start, verse_end)
);
create index bible_bookmarks_user on public.bible_bookmarks (user_id, created_at desc);

create table public.bible_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation_code text not null default 'WEB',
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse smallint not null,
  colour text not null default 'gold' check (colour in ('gold','sage','rose','sky')),
  created_at timestamptz not null default now(),
  unique (user_id, translation_code, book_id, chapter, verse)
);
create index bible_highlights_chapter on public.bible_highlights (user_id, book_id, chapter);

create table public.bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation_code text not null default 'WEB',
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse smallint not null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, translation_code, book_id, chapter, verse)
);
create index bible_notes_chapter on public.bible_notes (user_id, book_id, chapter);
create trigger bible_notes_updated_at before update on public.bible_notes
  for each row execute function public.set_updated_at();

create table public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  read_at timestamptz not null default now(),
  primary key (user_id, book_id, chapter)
);
create index reading_progress_recent on public.reading_progress (user_id, read_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Quizzes & learning
-- ─────────────────────────────────────────────────────────────────────────────
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('trivia','character')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  question text not null,
  options text[] not null check (array_length(options, 1) between 2 and 6),
  correct_index smallint not null,
  explanation text not null,
  reference text not null,               -- e.g. "Genesis 6:14" — verified by scripts/check-seed-refs.mjs
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  check (correct_index >= 0 and correct_index < array_length(options, 1))
);

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity text not null check (activity in ('trivia','character','complete_scripture','book_order','daily_challenge','study_quiz')),
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  created_at timestamptz not null default now()
);
create index quiz_results_user on public.quiz_results (user_id, created_at desc);

-- Scripture memory flashcards with spaced repetition (SM-2 style).
create table public.memory_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id smallint not null references public.bible_books(id),
  chapter smallint not null,
  verse_start smallint not null,
  verse_end smallint not null,
  ease numeric(4,2) not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, chapter, verse_start, verse_end)
);
create index memory_cards_due on public.memory_cards (user_id, due_on);

-- Daily Faith Journey activity ticks (scripture, reflection, prayer, journal, challenge).
create table public.daily_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  activity text not null check (activity in ('scripture','reflection','prayer','journal','challenge')),
  created_at timestamptz not null default now(),
  primary key (user_id, day, activity)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────────────────────
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/London',
  morning_scripture boolean not null default false,
  morning_time time not null default '07:30',
  evening_prayer boolean not null default false,
  evening_time time not null default '21:00',
  daily_devotional boolean not null default false,
  devotional_time time not null default '12:30',
  journey_reminder boolean not null default false,
  journal_reminder boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger notification_preferences_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user on public.push_subscriptions (user_id);

-- Prevents a reminder being sent twice in the same day.
create table public.reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  day date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

-- Trigger must be created after notification_preferences exists.
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.user_activity_days enable row level security;
alter table public.bible_translations enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_chapters enable row level security;
alter table public.bible_verses enable row level security;
alter table public.daily_verses enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.devotional_content enable row level security;
alter table public.devotional_completions enable row level security;
alter table public.faith_journeys enable row level security;
alter table public.journey_days enable row level security;
alter table public.user_journey_progress enable row level security;
alter table public.prayer_entries enable row level security;
alter table public.journal_entries enable row level security;
alter table public.bible_bookmarks enable row level security;
alter table public.bible_highlights enable row level security;
alter table public.bible_notes enable row level security;
alter table public.reading_progress enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.memory_cards enable row level security;
alter table public.daily_progress enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_log enable row level security;

-- Own profile only.
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy prefs_select_own on public.user_preferences for select using (user_id = auth.uid());
create policy prefs_insert_own on public.user_preferences for insert with check (user_id = auth.uid());
create policy prefs_update_own on public.user_preferences for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Subscriptions: read own; writes only via service role (webhook).
create policy subscriptions_select_own on public.subscriptions for select using (user_id = auth.uid());

-- Usage: read own (so the app can show remaining questions); writes via service role.
create policy usage_select_own on public.usage_tracking for select using (user_id = auth.uid());

create policy activity_select_own on public.user_activity_days for select using (user_id = auth.uid());

-- Public Bible data.
create policy translations_read on public.bible_translations for select using (true);
create policy books_read on public.bible_books for select using (true);
create policy chapters_read on public.bible_chapters for select using (true);
create policy verses_read on public.bible_verses for select using (true);
create policy daily_verses_read on public.daily_verses for select using (true);

-- Generic "owner has full control" policies for private tables.
do $$
declare t text;
begin
  foreach t in array array[
    'chat_conversations','chat_messages','devotional_completions','user_journey_progress',
    'prayer_entries','journal_entries','bible_bookmarks','bible_highlights','bible_notes',
    'reading_progress','quiz_results','memory_cards','daily_progress','push_subscriptions'
  ] loop
    execute format('create policy %1$s_owner_select on public.%1$s for select using (user_id = auth.uid())', t);
    execute format('create policy %1$s_owner_insert on public.%1$s for insert with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_owner_update on public.%1$s for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy %1$s_owner_delete on public.%1$s for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- A chat message must belong to one of the user's own conversations.
create policy chat_messages_conversation_owner on public.chat_messages as restrictive for insert
  with check (exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

create policy notif_select_own on public.notification_preferences for select using (user_id = auth.uid());
create policy notif_insert_own on public.notification_preferences for insert with check (user_id = auth.uid());
create policy notif_update_own on public.notification_preferences for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Content: everyone signed in can see published metadata; premium bodies are gated.
create policy devotionals_read on public.devotional_content for select
  using ((is_published and (not is_premium or public.is_premium(auth.uid()))) or public.is_admin(auth.uid()));
create policy devotionals_admin_write on public.devotional_content for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy journeys_read on public.faith_journeys for select
  using (is_published or public.is_admin(auth.uid()));
create policy journeys_admin_write on public.faith_journeys for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Premium journey days are only returned to premium subscribers — enforced in the database.
create policy journey_days_read on public.journey_days for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.faith_journeys j
      where j.id = journey_id and j.is_published
        and (not j.is_premium or public.is_premium(auth.uid()))
    )
  );
create policy journey_days_admin_write on public.journey_days for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- A user can only start a premium journey if they are premium.
create policy user_journey_progress_premium_gate on public.user_journey_progress as restrictive for insert
  with check (exists (
    select 1 from public.faith_journeys j
    where j.id = journey_id and (not j.is_premium or public.is_premium(auth.uid()))
  ));

create policy quiz_questions_read on public.quiz_questions for select
  using (is_published or public.is_admin(auth.uid()));
create policy quiz_questions_admin_write on public.quiz_questions for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- reminder_log: service role only (no policies).

grant execute on function public.search_bible(text, text, int) to anon, authenticated;
grant execute on function public.touch_activity() to authenticated;
grant execute on function public.is_premium(uuid) to authenticated;
