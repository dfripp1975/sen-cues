-- Cache for AI output that is NOT personal (verse explanations, chapter studies),
-- so the same request from different users does not cost another API call.
-- Service-role only: RLS enabled with no policies.
create table public.ai_cache (
  cache_key text primary key,
  mode text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index ai_cache_created on public.ai_cache (created_at);
alter table public.ai_cache enable row level security;
