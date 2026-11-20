/*
  AI question allowance for Premium readers

  - Every live AI request counts as one question.
  - Premium readers get a free daily allowance (10 by default, set in the
    ai-book-club function), reset at midnight UTC.
  - Readers can buy top-up packs (10 or 50 questions). Bought questions never
    expire and are only used once the day's free questions are gone.
  - A monthly spend total lets the function pause AI site-wide once the owner's
    monthly budget is reached.

  Only the server (service role) can change any of this. Readers can read their
  own rows to show "questions left", nothing more. The old ai_usage table let
  readers insert their own usage rows; that policy is removed so usage is only
  ever recorded by the server.
*/

CREATE TABLE IF NOT EXISTS ai_question_days (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  used integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS ai_question_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_question_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack text NOT NULL,
  questions integer NOT NULL CHECK (questions > 0),
  stripe_session_id text NOT NULL UNIQUE,
  amount_total integer,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_monthly_spend (
  month text PRIMARY KEY,                 -- 'YYYY-MM' (UTC)
  requests integer NOT NULL DEFAULT 0,
  cost_microdollars bigint NOT NULL DEFAULT 0
);

ALTER TABLE ai_question_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_monthly_spend ENABLE ROW LEVEL SECURITY;   -- no policies: server only

DROP POLICY IF EXISTS "select_own_ai_question_days" ON ai_question_days;
CREATE POLICY "select_own_ai_question_days" ON ai_question_days
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_ai_question_credits" ON ai_question_credits;
CREATE POLICY "select_own_ai_question_credits" ON ai_question_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_ai_question_purchases" ON ai_question_purchases;
CREATE POLICY "select_own_ai_question_purchases" ON ai_question_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_usage" ON ai_usage;

/* Take one question: today's free allowance first, then bought questions. */
CREATE OR REPLACE FUNCTION take_ai_question(p_user uuid, p_daily integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := (now() AT TIME ZONE 'utc')::date;
  used_today integer;
  bal integer;
BEGIN
  INSERT INTO ai_question_days (user_id, day, used) VALUES (p_user, d, 0)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT used INTO used_today FROM ai_question_days WHERE user_id = p_user AND day = d FOR UPDATE;
  SELECT COALESCE((SELECT balance FROM ai_question_credits WHERE user_id = p_user), 0) INTO bal;

  IF used_today < p_daily THEN
    UPDATE ai_question_days SET used = used + 1 WHERE user_id = p_user AND day = d;
    RETURN jsonb_build_object('source', 'daily', 'daily_left', p_daily - used_today - 1, 'credits', bal);
  END IF;

  UPDATE ai_question_credits SET balance = balance - 1, updated_at = now()
    WHERE user_id = p_user AND balance > 0
    RETURNING balance INTO bal;
  IF FOUND THEN
    RETURN jsonb_build_object('source', 'credit', 'daily_left', 0, 'credits', bal);
  END IF;

  RETURN jsonb_build_object('source', 'none', 'daily_left', 0, 'credits', 0);
END;
$$;

/* Give a question back when the AI request fails. */
CREATE OR REPLACE FUNCTION return_ai_question(p_user uuid, p_source text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source = 'daily' THEN
    UPDATE ai_question_days SET used = GREATEST(used - 1, 0)
      WHERE user_id = p_user AND day = (now() AT TIME ZONE 'utc')::date;
  ELSIF p_source = 'credit' THEN
    INSERT INTO ai_question_credits (user_id, balance) VALUES (p_user, 1)
      ON CONFLICT (user_id) DO UPDATE SET balance = ai_question_credits.balance + 1, updated_at = now();
  END IF;
END;
$$;

/* Add bought questions once per Stripe checkout session (safe if Stripe retries). */
CREATE OR REPLACE FUNCTION add_ai_question_credits(
  p_user uuid, p_pack text, p_questions integer, p_session text, p_amount integer, p_currency text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal integer;
BEGIN
  INSERT INTO ai_question_purchases (user_id, pack, questions, stripe_session_id, amount_total, currency)
    VALUES (p_user, p_pack, p_questions, p_session, p_amount, p_currency)
    ON CONFLICT (stripe_session_id) DO NOTHING;
  IF NOT FOUND THEN
    SELECT COALESCE((SELECT balance FROM ai_question_credits WHERE user_id = p_user), 0) INTO bal;
    RETURN bal;   -- already credited for this session
  END IF;
  INSERT INTO ai_question_credits (user_id, balance) VALUES (p_user, p_questions)
    ON CONFLICT (user_id) DO UPDATE SET balance = ai_question_credits.balance + p_questions, updated_at = now()
    RETURNING balance INTO bal;
  RETURN bal;
END;
$$;

/* Running monthly total of AI requests and their estimated cost. */
CREATE OR REPLACE FUNCTION add_ai_spend(p_month text, p_cost bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
BEGIN
  INSERT INTO ai_monthly_spend (month, requests, cost_microdollars) VALUES (p_month, 1, p_cost)
    ON CONFLICT (month) DO UPDATE SET
      requests = ai_monthly_spend.requests + 1,
      cost_microdollars = ai_monthly_spend.cost_microdollars + p_cost
    RETURNING cost_microdollars INTO total;
  RETURN total;
END;
$$;

REVOKE ALL ON FUNCTION take_ai_question(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION return_ai_question(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION add_ai_question_credits(uuid, text, integer, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION add_ai_spend(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION take_ai_question(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION return_ai_question(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION add_ai_question_credits(uuid, text, integer, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION add_ai_spend(text, bigint) TO service_role;
