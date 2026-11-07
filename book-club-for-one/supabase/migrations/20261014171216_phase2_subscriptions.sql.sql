/*
# Phase 2: Subscriptions and AI Book Club

## Changes

### 1. New Table: `subscriptions`
Tracks each user's Stripe subscription state so the frontend can gate premium features.

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, unique — one subscription row per user)
- `stripe_customer_id` (text, Stripe customer ID)
- `stripe_subscription_id` (text, nullable, Stripe subscription ID)
- `plan` (text, 'free' | 'monthly' | 'yearly', default 'free')
- `status` (text, 'active' | 'canceled' | 'past_due' | 'trialing', default 'active')
- `current_period_end` (timestamptz, nullable, when the current billing period ends)
- `created_at` (timestamptz)
- `updated_at` (timestamptz, auto-updated)

### 2. New Table: `ai_usage`
Tracks AI feature usage per user for rate limiting on the free plan.

- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `action` (text, which AI action was used)
- `book_title` (text, which book)
- `created_at` (timestamptz)

### 3. Security
- RLS enabled on both tables.
- `subscriptions`: users can only read their own row. All writes happen via the service role in edge functions (webhooks, checkout) — no user-facing INSERT/UPDATE/DELETE policies.
- `ai_usage`: users can read and insert their own rows (for usage tracking). No update or delete needed.

### 4. Indexes
- Index on `subscriptions.user_id` (unique lookup)
- Index on `ai_usage.user_id` (usage queries)
- Index on `ai_usage.created_at` (date-range queries for rate limiting)
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription"
  ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  book_title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_usage" ON ai_usage;
CREATE POLICY "select_own_ai_usage"
  ON ai_usage FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_usage" ON ai_usage;
CREATE POLICY "insert_own_ai_usage"
  ON ai_usage FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
