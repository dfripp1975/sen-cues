/*
# Create contact_submissions table

1. New Tables
- `contact_submissions`
  - `id` (uuid, primary key)
  - `name` (text, not null) — the name of the person contacting
  - `email` (text, not null) — their email address for replies
  - `message` (text, not null) — their message
  - `status` (text, default 'new') — tracks whether the message has been read/resolved
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `contact_submissions`.
- Allow anyone (anon + authenticated) to INSERT — the contact form is public.
- No SELECT/UPDATE/DELETE for anon or authenticated — only the service role can read/manage submissions.
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_submissions;
CREATE POLICY "anon_insert_contact"
ON contact_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);
