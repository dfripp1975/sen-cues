import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** Fixed-window rate limit backed by Postgres (free, works on serverless). */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const db = admin();
  if (!db) return true;
  const { data, error } = await db.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
  if (error) return true; // fail open so a limiter outage doesn't take the app down
  return Boolean(data);
}

export async function audit(orgId: string | null, userId: string | null, action: string, entity?: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const db = admin();
  if (!db) return;
  await db.from("audit_logs").insert({ org_id: orgId, user_id: userId, action, entity, entity_id: entityId, metadata });
}

export async function logError(route: string, err: unknown, orgId?: string | null) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${route}]`, message);
  const db = admin();
  if (!db) return;
  await db.from("app_errors").insert({ route, message: message.slice(0, 1000), org_id: orgId ?? null });
}
