/*
  Book clubs: read a book together with friends.

  Rules (also shown on the site; change both together, see src/lib/clubs.ts):
  - Anyone signed in can start 1 club of up to 3 people.
  - Premium readers can start up to 5 clubs of up to 12 people.
  - Joining a club is always free. Premium is per person: a Premium host does
    not unlock books for the members.

  Spoiler safety is enforced here, not in the page: a member only receives the
  comments for chapters up to the one they say they've reached (plus their own).
  The page can ask how many comments are waiting in later chapters, never what
  they say.

  Clubs are invite-only. Clubs and members are created only through the
  functions below, which check the limits.
*/

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  book_slug text NOT NULL CHECK (char_length(book_slug) BETWEEN 1 AND 120),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  next_meeting_at timestamptz,
  read_to_chapter integer CHECK (read_to_chapter IS NULL OR read_to_chapter > 0),
  meeting_note text CHECK (meeting_note IS NULL OR char_length(meeting_note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_members (
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  current_chapter integer NOT NULL DEFAULT 1 CHECK (current_chapter > 0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter integer NOT NULL CHECK (chapter > 0),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_owner ON clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_club_chapter ON club_posts(club_id, chapter);

/* ---------- Helpers (run with the caller's id, read past row security) ---------- */

CREATE OR REPLACE FUNCTION is_premium_user(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user AND plan IN ('monthly', 'yearly') AND status IN ('active', 'trialing')
  );
$$;

CREATE OR REPLACE FUNCTION is_club_member(p_club uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM club_members WHERE club_id = p_club AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_club_owner(p_club uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM clubs WHERE id = p_club AND owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION my_club_chapter(p_club uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT current_chapter FROM club_members WHERE club_id = p_club AND user_id = auth.uid();
$$;

/* ---------- Row security ---------- */

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_club" ON clubs;
CREATE POLICY "members_read_club" ON clubs FOR SELECT TO authenticated USING (is_club_member(id));
DROP POLICY IF EXISTS "owner_updates_club" ON clubs;
CREATE POLICY "owner_updates_club" ON clubs FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "owner_deletes_club" ON clubs;
CREATE POLICY "owner_deletes_club" ON clubs FOR DELETE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "members_read_members" ON club_members;
CREATE POLICY "members_read_members" ON club_members FOR SELECT TO authenticated USING (is_club_member(club_id));
DROP POLICY IF EXISTS "member_updates_self" ON club_members;
CREATE POLICY "member_updates_self" ON club_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Members can leave; the host can remove others (the host deletes the club instead of leaving)
DROP POLICY IF EXISTS "leave_or_remove" ON club_members;
CREATE POLICY "leave_or_remove" ON club_members FOR DELETE TO authenticated USING (
  (user_id = auth.uid() AND role <> 'owner') OR (is_club_owner(club_id) AND user_id <> auth.uid())
);

-- Spoiler-safe: only comments up to the reader's own chapter, plus their own
DROP POLICY IF EXISTS "read_posts_up_to_my_chapter" ON club_posts;
CREATE POLICY "read_posts_up_to_my_chapter" ON club_posts FOR SELECT TO authenticated USING (
  is_club_member(club_id) AND (user_id = auth.uid() OR chapter <= my_club_chapter(club_id))
);
-- Members comment on chapters they have reached
DROP POLICY IF EXISTS "post_on_reached_chapters" ON club_posts;
CREATE POLICY "post_on_reached_chapters" ON club_posts FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND is_club_member(club_id) AND chapter <= my_club_chapter(club_id)
);
-- Authors delete their own comments; the host can delete any in their club
DROP POLICY IF EXISTS "delete_own_or_host" ON club_posts;
CREATE POLICY "delete_own_or_host" ON club_posts FOR DELETE TO authenticated USING (
  user_id = auth.uid() OR is_club_owner(club_id)
);

-- Only these columns can be changed from the site; everything else goes through the functions
REVOKE INSERT, UPDATE ON clubs FROM anon, authenticated;
GRANT UPDATE (name, next_meeting_at, read_to_chapter, meeting_note) ON clubs TO authenticated;
REVOKE INSERT, UPDATE ON club_members FROM anon, authenticated;
GRANT UPDATE (display_name, current_chapter) ON club_members TO authenticated;
REVOKE UPDATE ON club_posts FROM anon, authenticated;
GRANT SELECT, DELETE ON clubs, club_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON club_posts TO authenticated;

/* ---------- Actions ---------- */

-- Start a club: 1 club of 3 free; 5 clubs of 12 with Premium
CREATE OR REPLACE FUNCTION create_club(p_name text, p_book_slug text, p_display_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  premium boolean;
  owned integer;
  max_clubs integer;
  code text;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'sign_in_required'; END IF;
  IF char_length(btrim(coalesce(p_name, ''))) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF char_length(btrim(coalesce(p_display_name, ''))) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'invalid_display_name'; END IF;
  IF char_length(coalesce(p_book_slug, '')) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'invalid_book'; END IF;

  premium := is_premium_user(uid);
  max_clubs := CASE WHEN premium THEN 5 ELSE 1 END;
  SELECT count(*) INTO owned FROM clubs WHERE owner_id = uid;
  IF owned >= max_clubs THEN
    RAISE EXCEPTION 'club_limit' USING DETAIL = max_clubs::text;
  END IF;

  LOOP
    code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM clubs WHERE invite_code = code);
  END LOOP;

  INSERT INTO clubs (name, book_slug, owner_id, invite_code)
    VALUES (btrim(p_name), p_book_slug, uid, code) RETURNING id INTO new_id;
  INSERT INTO club_members (club_id, user_id, display_name, role)
    VALUES (new_id, uid, btrim(p_display_name), 'owner');
  RETURN jsonb_build_object('id', new_id, 'invite_code', code);
END;
$$;

-- Join with an invite code: up to 3 people in a free host's club, 12 in a Premium host's
CREATE OR REPLACE FUNCTION join_club(p_code text, p_display_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  c clubs%ROWTYPE;
  members integer;
  cap integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'sign_in_required'; END IF;
  IF char_length(btrim(coalesce(p_display_name, ''))) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'invalid_display_name'; END IF;
  SELECT * INTO c FROM clubs WHERE invite_code = lower(btrim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF EXISTS (SELECT 1 FROM club_members WHERE club_id = c.id AND user_id = uid) THEN RETURN c.id; END IF;
  cap := CASE WHEN is_premium_user(c.owner_id) THEN 12 ELSE 3 END;
  SELECT count(*) INTO members FROM club_members WHERE club_id = c.id;
  IF members >= cap THEN RAISE EXCEPTION 'club_full' USING DETAIL = cap::text; END IF;
  INSERT INTO club_members (club_id, user_id, display_name) VALUES (c.id, uid, btrim(p_display_name));
  RETURN c.id;
END;
$$;

-- What an invite link shows before joining: name, book, host, how full it is. Nothing else.
CREATE OR REPLACE FUNCTION club_invite_preview(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c clubs%ROWTYPE;
BEGIN
  SELECT * INTO c FROM clubs WHERE invite_code = lower(btrim(p_code));
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'name', c.name,
    'book_slug', c.book_slug,
    'host', (SELECT display_name FROM club_members WHERE club_id = c.id AND role = 'owner'),
    'members', (SELECT count(*) FROM club_members WHERE club_id = c.id),
    'cap', CASE WHEN is_premium_user(c.owner_id) THEN 12 ELSE 3 END
  );
END;
$$;

-- How many comments wait in chapters the reader hasn't reached (counts only, never the words)
CREATE OR REPLACE FUNCTION club_waiting_comments(p_club uuid)
RETURNS TABLE (chapter integer, comments bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.chapter, count(*)
  FROM club_posts p
  WHERE p.club_id = p_club
    AND is_club_member(p_club)
    AND p.user_id <> auth.uid()
    AND p.chapter > my_club_chapter(p_club)
  GROUP BY p.chapter
  ORDER BY p.chapter;
$$;

-- Limits for the signed-in reader, so the page shows the same numbers the database enforces
CREATE OR REPLACE FUNCTION my_club_limits()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'premium', is_premium_user(auth.uid()),
    'max_clubs', CASE WHEN is_premium_user(auth.uid()) THEN 5 ELSE 1 END,
    'max_members', CASE WHEN is_premium_user(auth.uid()) THEN 12 ELSE 3 END,
    'owned', (SELECT count(*) FROM clubs WHERE owner_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION is_premium_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION create_club(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION join_club(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION club_waiting_comments(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION my_club_limits() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION club_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_club(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION join_club(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION club_waiting_comments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION my_club_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION club_invite_preview(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_club_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_club_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION my_club_chapter(uuid) TO authenticated;
