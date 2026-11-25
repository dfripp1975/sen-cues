import "server-only";
import type { OrgContext } from "@/lib/auth";
import { FEATURE_LABELS, minimumPlanFor, planHasFeature, type Feature } from "@/lib/plans";
import { countActiveUnits, type CountableEvent } from "@/lib/series";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function hasFeature(ctx: OrgContext, feature: Feature) {
  return planHasFeature(ctx.plan.id, feature);
}

export function assertFeature(ctx: OrgContext, feature: Feature) {
  if (!hasFeature(ctx, feature)) {
    throw new PlanLimitError(`${FEATURE_LABELS[feature]} is available on the ${minimumPlanFor(feature).name} plan and above.`);
  }
}

async function activeRows(ctx: OrgContext): Promise<CountableEvent[]> {
  const { data } = await ctx.supabase
    .from("events")
    .select("id, series_id, status, is_template")
    .eq("org_id", ctx.org.id)
    .in("status", ["active", "draft"])
    .eq("is_template", false)
    .limit(20000);
  return (data ?? []) as CountableEvent[];
}

/** Active events for the plan limit. A recurring series counts as one. */
export async function countActiveEvents(ctx: OrgContext): Promise<number> {
  return countActiveUnits(await activeRows(ctx));
}

/** Throws if adding an active event (or a new series) would exceed the plan. Adding a date to an already-active series is free. */
export async function assertCanAddActiveEvent(ctx: OrgContext, opts: { seriesId?: string | null } = {}) {
  const rows = await activeRows(ctx);
  if (opts.seriesId && rows.some((r) => r.series_id === opts.seriesId)) return;
  if (countActiveUnits(rows) >= ctx.plan.activeEvents) {
    throw new PlanLimitError(
      `Your ${ctx.plan.name} plan allows ${ctx.plan.activeEvents} active event${ctx.plan.activeEvents === 1 ? "" : "s"} (a recurring series counts as one). Archive an event or upgrade to add more.`,
    );
  }
}

export async function assertCanAddTask(ctx: OrgContext) {
  const { count } = await ctx.supabase
    .from("marketing_tasks")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id)
    .neq("status", "done");
  if ((count ?? 0) >= ctx.plan.campaignTasks) {
    throw new PlanLimitError(`Your ${ctx.plan.name} plan allows ${ctx.plan.campaignTasks} open campaign tasks. Complete some tasks or upgrade.`);
  }
}

export async function assertCanAddTrackingLink(ctx: OrgContext) {
  assertFeature(ctx, "trackingLinks");
  const { count } = await ctx.supabase.from("tracking_links").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id);
  if ((count ?? 0) >= ctx.plan.trackingLinks) throw new PlanLimitError(`Your plan allows ${ctx.plan.trackingLinks} tracking links.`);
}

export function monthStartISO(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function aiCreditsUsed(ctx: OrgContext): Promise<number> {
  const { count } = await ctx.supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("org_id", ctx.org.id)
    .gte("created_at", monthStartISO());
  return count ?? 0;
}
