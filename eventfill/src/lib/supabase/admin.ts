import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS, so only use it on the server for
 * operations that cannot run as the user (webhooks, public redirects, admin
 * aggregates, usage metering) and always scope queries explicitly.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.supabaseUrl || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
