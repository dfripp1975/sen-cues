-- Row Level Security checks, run by scripts/test-db.sh against a local Postgres
-- with supabase/tests/auth_stub.sql applied. Raises an exception on any failure.
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com', '{"display_name":"Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com', '{}');

do $$ begin
  assert (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 'Alice', 'profile trigger';
  assert (select count(*) from public.user_preferences) = 2, 'preferences trigger';
  assert (select count(*) from public.notification_preferences) = 2, 'notification trigger';
end $$;

-- ── Act as Alice ──
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.journal_entries (user_id, body) values ('11111111-1111-1111-1111-111111111111', 'Alice private entry');
insert into public.prayer_entries (user_id, content) values ('11111111-1111-1111-1111-111111111111', 'Alice prayer');
insert into public.chat_conversations (id, user_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Alice chat');

do $$ begin
  -- Cannot write rows for someone else.
  begin
    insert into public.journal_entries (user_id, body) values ('22222222-2222-2222-2222-222222222222', 'forged');
    raise exception 'FAIL: forged journal insert succeeded';
  exception when insufficient_privilege then null; end;

  -- Cannot self-promote to admin.
  begin
    update public.profiles set is_admin = true where id = '11111111-1111-1111-1111-111111111111';
    raise exception 'FAIL: self-promotion succeeded';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- Cannot grant themselves premium.
  begin
    insert into public.subscriptions (user_id, status) values ('11111111-1111-1111-1111-111111111111', 'active');
    raise exception 'FAIL: subscription self-insert succeeded';
  exception when insufficient_privilege then null; end;

  -- Free users cannot read premium journey days or start premium journeys.
  assert (select count(*) from public.journey_days d join public.faith_journeys j on j.id = d.journey_id where j.is_premium) = 0,
    'free user can read premium journey days';
  assert (select count(*) from public.journey_days) = 14, 'free user should see the 14 free journey days';
  begin
    insert into public.user_journey_progress (user_id, journey_id)
      select '11111111-1111-1111-1111-111111111111', id from public.faith_journeys where is_premium limit 1;
    raise exception 'FAIL: free user started premium journey';
  exception when insufficient_privilege then null; end;

  -- Cannot edit content.
  update public.devotional_content set title = 'hacked';
  assert not exists (select 1 from public.devotional_content where title = 'hacked'), 'non-admin edited content';

  -- Bible is readable and searchable.
  assert (select count(*) from public.search_bible('shepherd')) > 0, 'search_bible';
end $$;

-- ── Act as Bob ──
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.journal_entries) = 0, 'Bob can see Alice journal';
  assert (select count(*) from public.prayer_entries) = 0, 'Bob can see Alice prayers';
  assert (select count(*) from public.chat_conversations) = 0, 'Bob can see Alice chats';
  assert (select count(*) from public.profiles) = 1, 'Bob can see other profiles';
  begin
    insert into public.chat_messages (conversation_id, user_id, role, content)
      values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'user', 'intrusion');
    raise exception 'FAIL: Bob wrote into Alice conversation';
  exception when insufficient_privilege then null; end;
end $$;

-- ── Premium unlocks premium journeys (subscription written by the service role) ──
reset role;
insert into public.subscriptions (user_id, status, plan, current_period_end)
  values ('22222222-2222-2222-2222-222222222222', 'active', 'monthly', now() + interval '30 days');
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.journey_days) = 28, 'premium user should see all 28 days';
  insert into public.user_journey_progress (user_id, journey_id)
    select '22222222-2222-2222-2222-222222222222', id from public.faith_journeys where is_premium limit 1;
end $$;

-- ── Account deletion cascades ──
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  assert not exists (select 1 from public.journal_entries), 'journal not deleted with account';
  assert not exists (select 1 from public.chat_conversations), 'chats not deleted with account';
  assert not exists (select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'profile not deleted';
end $$;

rollback;
\echo 'RLS tests passed'
