/*
# Create custom_books table for user-added books

1. Purpose
Allows signed-in users to add any book they're currently reading to the site, so they can use the reading tools (progress tracking, discussion questions, chapter companions, calculators) with books that aren't in the built-in catalogue. Each custom book is private to the user who created it.

2. New Table
- `custom_books`
  - id (uuid, primary key)
  - user_id (uuid, not null, defaults to auth.uid(), references auth.users)
  - slug (text, not null — unique per user, used in URLs)
  - title (text, not null)
  - author (text, not null)
  - year (integer, optional)
  - genre (text[], defaults to empty array)
  - pages (integer, optional)
  - chapters (integer, optional, defaults to 1)
  - description (text, optional)
  - isbn (text, optional)
  - cover_color (text, optional — hex color for designed cover fallback)
  - cover_accent (text, optional)
  - status (text, not null, defaults to 'currently-reading')
  - current_chapter (integer, defaults to 0)
  - created_at (timestamptz)
  - updated_at (timestamptz)

3. Security
- RLS enabled on custom_books.
- Owner-scoped CRUD: each authenticated user can only access their own custom books.
- user_id defaults to auth.uid() so inserts that omit it succeed.
- No FOR ALL policies — separate per-verb policies.
- No USING(true) shortcuts — real ownership predicates.

4. Notes
- The slug is unique per user (UNIQUE(user_id, slug)), not globally, so multiple users can add the same book.
- Custom books are private: only the owner can see them.
- The status column lets the library page show custom books in the right section without a separate user_books join.
*/

CREATE TABLE IF NOT EXISTS custom_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  year integer,
  genre text[] DEFAULT '{}',
  pages integer,
  chapters integer DEFAULT 1,
  description text,
  isbn text,
  cover_color text DEFAULT '#2D4A3E',
  cover_accent text DEFAULT '#C96745',
  status text NOT NULL DEFAULT 'currently-reading',
  current_chapter integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

ALTER TABLE custom_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_custom_books" ON custom_books;
CREATE POLICY "select_own_custom_books" ON custom_books FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_custom_books" ON custom_books;
CREATE POLICY "insert_own_custom_books" ON custom_books FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_custom_books" ON custom_books;
CREATE POLICY "update_own_custom_books" ON custom_books FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_custom_books" ON custom_books;
CREATE POLICY "delete_own_custom_books" ON custom_books FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_books_user_id ON custom_books(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_books_slug ON custom_books(slug);
