import { isPlanId, type PlanId } from "./plans";

/** Statuses that keep paid features active. Anything else falls back to Free. */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function effectivePlan(sub: { plan: string; status: string } | null): PlanId {
  if (!sub || !isPlanId(sub.plan)) return "free";
  if (sub.plan !== "free" && !ACTIVE_STATUSES.has(sub.status)) return "free";
  return sub.plan;
}
