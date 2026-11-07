/*
# Create The Book Club For One database schema

1. Purpose
This migration creates the full database schema for "The Book Club For One" — a book and reading utility website with personal book club features. The app has optional user accounts (sign-in/sign-up UI built in the frontend). All user-scoped tables use `user_id uuid NOT NULL DEFAULT auth.uid()` and owner-scoped RLS policies.

2. New Tables
- `profiles` — user display profiles (id, display_name, created_at)
- `books` — book metadata (id, slug, title, author, year, genre, pages, chapters, description, public_domain)
- `user_books` — books saved to a user's library (user_id, book_slug, status, current_chapter, total_chapters)
- `chapter_progress` — reading progress per book (user_id, book_slug, current_chapter, total_chapters, percentage)
- `notes` — user notes on books/chapters (user_id, book_slug, chapter, note_text)
- `predictions` — user predictions about what happens next (user_id, book_slug, chapter, prediction_text)
- `reflections` — user reflections after chapters (user_id, book_slug, chapter, reflection_text)
- `reading_goals` — user reading goals (user_id, goal_books, target_date, avg_pages)
- `reading_lists` — user reading lists (user_id, list_name, items jsonb)
- `reading_streaks` — user reading streak data (user_id, current_streak, longest_streak, days_read_this_month, total_reading_days, last_read_date)
- `character_notes` — user notes on book characters (user_id, book_slug, character_name, note_text)
- `vocabulary` — user saved vocabulary words (user_id, word, book_slug, definition, context)
- `ai_insights` — cached AI insights per book/chapter (user_id, book_slug, chapter, insight_type, insight_text)
- `user_preferences` — user UI/reading preferences (user_id, theme, font_size, spoiler_enabled)

3. Security
- RLS enabled on ALL tables.
- `profiles`: owner-scoped CRUD (authenticated, auth.uid() = id).
- `books`: public read (anon, authenticated) — book metadata is shared/public. No writes from the frontend.
- All user-scoped tables: owner-scoped CRUD (authenticated, auth.uid() = user_id). Default user_id to auth.uid().
- No `FOR ALL` policies — separate per-verb policies throughout.
- No `USING (true)` shortcuts — real ownership predicates everywhere.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Books table (public metadata, read-only from frontend)
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  year integer,
  genre text[] DEFAULT '{}',
  pages integer,
  chapters integer,
  description text,
  public_domain boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_books" ON books;
CREATE POLICY "public_read_books" ON books FOR SELECT
TO anon, authenticated USING (true);

-- User books (library)
CREATE TABLE IF NOT EXISTS user_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  status text NOT NULL DEFAULT 'want-to-read',
  current_chapter integer DEFAULT 0,
  total_chapters integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_slug)
);

ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_books" ON user_books;
CREATE POLICY "select_own_user_books" ON user_books FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_books" ON user_books;
CREATE POLICY "insert_own_user_books" ON user_books FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_books" ON user_books;
CREATE POLICY "update_own_user_books" ON user_books FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_books" ON user_books;
CREATE POLICY "delete_own_user_books" ON user_books FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Chapter progress
CREATE TABLE IF NOT EXISTS chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  current_chapter integer DEFAULT 0,
  total_chapters integer DEFAULT 0,
  percentage integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_slug)
);

ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chapter_progress" ON chapter_progress;
CREATE POLICY "select_own_chapter_progress" ON chapter_progress FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chapter_progress" ON chapter_progress;
CREATE POLICY "insert_own_chapter_progress" ON chapter_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chapter_progress" ON chapter_progress;
CREATE POLICY "update_own_chapter_progress" ON chapter_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chapter_progress" ON chapter_progress;
CREATE POLICY "delete_own_chapter_progress" ON chapter_progress FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  chapter integer,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  chapter integer,
  prediction_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_own_predictions" ON predictions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_predictions" ON predictions;
CREATE POLICY "insert_own_predictions" ON predictions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_predictions" ON predictions;
CREATE POLICY "update_own_predictions" ON predictions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_predictions" ON predictions;
CREATE POLICY "delete_own_predictions" ON predictions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Reflections
CREATE TABLE IF NOT EXISTS reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  chapter integer,
  reflection_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reflections" ON reflections;
CREATE POLICY "select_own_reflections" ON reflections FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reflections" ON reflections;
CREATE POLICY "insert_own_reflections" ON reflections FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reflections" ON reflections;
CREATE POLICY "update_own_reflections" ON reflections FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reflections" ON reflections;
CREATE POLICY "delete_own_reflections" ON reflections FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Reading goals
CREATE TABLE IF NOT EXISTS reading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_books integer DEFAULT 12,
  target_date date,
  avg_pages integer DEFAULT 300,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reading_goals" ON reading_goals;
CREATE POLICY "select_own_reading_goals" ON reading_goals FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reading_goals" ON reading_goals;
CREATE POLICY "insert_own_reading_goals" ON reading_goals FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reading_goals" ON reading_goals;
CREATE POLICY "update_own_reading_goals" ON reading_goals FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reading_goals" ON reading_goals;
CREATE POLICY "delete_own_reading_goals" ON reading_goals FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Reading lists
CREATE TABLE IF NOT EXISTS reading_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  list_name text NOT NULL DEFAULT 'My Reading List',
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reading_lists" ON reading_lists;
CREATE POLICY "select_own_reading_lists" ON reading_lists FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reading_lists" ON reading_lists;
CREATE POLICY "insert_own_reading_lists" ON reading_lists FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reading_lists" ON reading_lists;
CREATE POLICY "update_own_reading_lists" ON reading_lists FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reading_lists" ON reading_lists;
CREATE POLICY "delete_own_reading_lists" ON reading_lists FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Reading streaks
CREATE TABLE IF NOT EXISTS reading_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  days_read_this_month integer DEFAULT 0,
  total_reading_days integer DEFAULT 0,
  last_read_date date,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reading_streaks" ON reading_streaks;
CREATE POLICY "select_own_reading_streaks" ON reading_streaks FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reading_streaks" ON reading_streaks;
CREATE POLICY "insert_own_reading_streaks" ON reading_streaks FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reading_streaks" ON reading_streaks;
CREATE POLICY "update_own_reading_streaks" ON reading_streaks FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reading_streaks" ON reading_streaks;
CREATE POLICY "delete_own_reading_streaks" ON reading_streaks FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Character notes
CREATE TABLE IF NOT EXISTS character_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  character_name text NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE character_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_character_notes" ON character_notes;
CREATE POLICY "select_own_character_notes" ON character_notes FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_character_notes" ON character_notes;
CREATE POLICY "insert_own_character_notes" ON character_notes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_character_notes" ON character_notes;
CREATE POLICY "update_own_character_notes" ON character_notes FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_character_notes" ON character_notes;
CREATE POLICY "delete_own_character_notes" ON character_notes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Vocabulary (saved words)
CREATE TABLE IF NOT EXISTS vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  book_slug text,
  definition text,
  context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vocabulary" ON vocabulary;
CREATE POLICY "select_own_vocabulary" ON vocabulary FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_vocabulary" ON vocabulary;
CREATE POLICY "insert_own_vocabulary" ON vocabulary FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_vocabulary" ON vocabulary;
CREATE POLICY "update_own_vocabulary" ON vocabulary FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_vocabulary" ON vocabulary;
CREATE POLICY "delete_own_vocabulary" ON vocabulary FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- AI insights (cached)
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  chapter integer,
  insight_type text NOT NULL,
  insight_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_insights" ON ai_insights;
CREATE POLICY "select_own_ai_insights" ON ai_insights FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_insights" ON ai_insights;
CREATE POLICY "insert_own_ai_insights" ON ai_insights FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_insights" ON ai_insights;
CREATE POLICY "update_own_ai_insights" ON ai_insights FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_insights" ON ai_insights;
CREATE POLICY "delete_own_ai_insights" ON ai_insights FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system',
  font_size text DEFAULT 'medium',
  spoiler_enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_preferences" ON user_preferences;
CREATE POLICY "select_own_user_preferences" ON user_preferences FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_preferences" ON user_preferences;
CREATE POLICY "insert_own_user_preferences" ON user_preferences FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_preferences" ON user_preferences;
CREATE POLICY "update_own_user_preferences" ON user_preferences FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_preferences" ON user_preferences;
CREATE POLICY "delete_own_user_preferences" ON user_preferences FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_slug ON user_books(book_slug);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user_id ON chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_slug ON notes(book_slug);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_streaks_user_id ON reading_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
