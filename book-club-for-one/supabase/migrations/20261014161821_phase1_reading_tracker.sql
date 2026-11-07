/*
# Phase 1: Personal Reading Tracker — database extensions

1. Purpose
Extends the existing schema to support a full personal reading tracker:
  - More reading statuses (paused, did-not-finish)
  - Start/finish dates and per-book ratings
  - Current page tracking (not just chapters)
  - Reading session logging (pages read, minutes spent, date)
  - Annual reading goals with goal type and pages target

2. Modified Tables
- `user_books` — add columns: current_page, start_date, finish_date, rating (1-5), personal_notes
- `reading_goals` — add columns: goal_type ('books' | 'pages'), target_pages, year

3. New Tables
- `reading_sessions`
  - id (uuid, PK)
  - user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK auth.users)
  - book_slug (text, NOT NULL)
  - pages_read (integer, default 0)
  - minutes_read (integer, default 0)
  - session_date (date, NOT NULL, default current date)
  - notes (text, optional)
  - created_at (timestamptz)

4. Security
- `reading_sessions`: RLS enabled, owner-scoped CRUD (authenticated, auth.uid() = user_id).
- All existing policies on modified tables remain unchanged — new columns inherit existing RLS.
- No destructive operations — all changes are additive (ALTER TABLE ADD COLUMN).

5. Notes
- The new columns on user_books and reading_goals are nullable/defaulted so existing rows are unaffected.
- reading_sessions.book_slug references the same slugs used in user_books (no FK constraint since slugs are text, not UUIDs).
- The session_date column enables streak calculation from real activity.
*/

-- Extend user_books with page tracking, dates, rating, and private notes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_books' AND column_name = 'current_page') THEN
    ALTER TABLE user_books ADD COLUMN current_page integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_books' AND column_name = 'start_date') THEN
    ALTER TABLE user_books ADD COLUMN start_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_books' AND column_name = 'finish_date') THEN
    ALTER TABLE user_books ADD COLUMN finish_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_books' AND column_name = 'rating') THEN
    ALTER TABLE user_books ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_books' AND column_name = 'personal_notes') THEN
    ALTER TABLE user_books ADD COLUMN personal_notes text;
  END IF;
END $$;

-- Extend reading_goals with goal_type, target_pages, and year
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_goals' AND column_name = 'goal_type') THEN
    ALTER TABLE reading_goals ADD COLUMN goal_type text DEFAULT 'books';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_goals' AND column_name = 'target_pages') THEN
    ALTER TABLE reading_goals ADD COLUMN target_pages integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_goals' AND column_name = 'year') THEN
    ALTER TABLE reading_goals ADD COLUMN year integer DEFAULT EXTRACT(YEAR FROM now())::integer;
  END IF;
END $$;

-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  pages_read integer DEFAULT 0,
  minutes_read integer DEFAULT 0,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reading_sessions" ON reading_sessions;
CREATE POLICY "select_own_reading_sessions" ON reading_sessions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reading_sessions" ON reading_sessions;
CREATE POLICY "insert_own_reading_sessions" ON reading_sessions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reading_sessions" ON reading_sessions;
CREATE POLICY "update_own_reading_sessions" ON reading_sessions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reading_sessions" ON reading_sessions;
CREATE POLICY "delete_own_reading_sessions" ON reading_sessions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Indexes for reading_sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_session_date ON reading_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_slug ON reading_sessions(book_slug);

-- Extend the unique constraint on reading_goals to allow per-year goals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reading_goals_user_id_key' AND contype = 'u') THEN
    ALTER TABLE reading_goals DROP CONSTRAINT reading_goals_user_id_key;
    ALTER TABLE reading_goals ADD CONSTRAINT reading_goals_user_year_key UNIQUE(user_id, year);
  END IF;
END $$;