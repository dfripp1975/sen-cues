import "server-only";
import { notFound } from "next/navigation";
import type { OrgContext } from "@/lib/auth";
import type { CampaignRow, EventRow, LinkRow, MoneyRow, RescueActionRow, SaleRecord, TaskRow, TierRow } from "@/types/db";

const num = <T extends object>(rows: T[] | null, keys: (keyof T)[]): T[] =>
  (rows ?? []).map((r) => {
    const o = { ...r } as Record<string, unknown>;
    for (const k of keys as string[]) if (o[k] !== null && o[k] !== undefined) o[k] = Number(o[k]);
    return o as T;
  });

export async function listEvents(ctx: OrgContext, opts: { includeArchived?: boolean; templates?: boolean } = {}) {
  let q = ctx.supabase.from("events").select("*").eq("org_id", ctx.org.id).eq("is_template", Boolean(opts.templates)).order("event_date", { ascending: true });
  if (!opts.includeArchived) q = q.neq("status", "archived");
  const { data } = await q;
  return num((data ?? []) as EventRow[], ["marketing_budget"]);
}

export async function getEvent(ctx: OrgContext, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await ctx.supabase.from("events").select("*").eq("org_id", ctx.org.id).eq("id", id).maybeSingle();
  if (!data) notFound();
  return num([data as EventRow], ["marketing_budget"])[0];
}

export async function listSales(ctx: OrgContext, eventIds?: string[]) {
  let q = ctx.supabase.from("ticket_sales").select("*").eq("org_id", ctx.org.id).order("sale_date", { ascending: true }).limit(20000);
  if (eventIds) q = q.in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q;
  return num((data ?? []) as SaleRecord[], ["revenue", "refund_amount"]);
}

export async function listTiers(ctx: OrgContext, eventIds?: string[]) {
  let q = ctx.supabase.from("ticket_tiers").select("*").eq("org_id", ctx.org.id).order("price");
  if (eventIds) q = q.in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q;
  return num((data ?? []) as TierRow[], ["price"]);
}

export async function listCampaigns(ctx: OrgContext, eventId?: string) {
  let q = ctx.supabase.from("campaigns").select("*").eq("org_id", ctx.org.id).order("start_date", { ascending: true, nullsFirst: false });
  if (eventId) q = q.eq("event_id", eventId);
  const { data } = await q;
  return num((data ?? []) as CampaignRow[], ["budget"]);
}

export async function listTasks(ctx: OrgContext, opts: { eventId?: string; openOnly?: boolean } = {}) {
  let q = ctx.supabase.from("marketing_tasks").select("*").eq("org_id", ctx.org.id).order("due_date", { ascending: true, nullsFirst: false }).limit(2000);
  if (opts.eventId) q = q.eq("event_id", opts.eventId);
  if (opts.openOnly) q = q.neq("status", "done");
  const { data } = await q;
  return (data ?? []) as TaskRow[];
}

export async function listRescueActions(ctx: OrgContext, eventId?: string) {
  let q = ctx.supabase.from("rescue_actions").select("*").eq("org_id", ctx.org.id).order("due_date", { ascending: true, nullsFirst: false });
  if (eventId) q = q.eq("event_id", eventId);
  const { data } = await q;
  return (data ?? []) as RescueActionRow[];
}

export async function listLinks(ctx: OrgContext, eventId?: string) {
  let q = ctx.supabase.from("tracking_links").select("*").eq("org_id", ctx.org.id).order("created_at", { ascending: false });
  if (eventId) q = q.eq("event_id", eventId);
  const { data } = await q;
  return (data ?? []) as LinkRow[];
}

export async function listClicks(ctx: OrgContext, linkIds: string[], sinceISO?: string) {
  if (!linkIds.length) return [];
  let q = ctx.supabase.from("link_clicks").select("link_id, clicked_at, device, referrer_host").eq("org_id", ctx.org.id).in("link_id", linkIds).limit(50000);
  if (sinceISO) q = q.gte("clicked_at", sinceISO);
  const { data } = await q;
  return (data ?? []) as { link_id: string; clicked_at: string; device: string; referrer_host: string | null }[];
}

export async function listMoney(ctx: OrgContext, eventId: string) {
  const [inc, exp] = await Promise.all([
    ctx.supabase.from("event_income").select("*").eq("org_id", ctx.org.id).eq("event_id", eventId).order("created_at"),
    ctx.supabase.from("event_expenses").select("*").eq("org_id", ctx.org.id).eq("event_id", eventId).order("created_at"),
  ]);
  return { income: num((inc.data ?? []) as MoneyRow[], ["amount"]), expenses: num((exp.data ?? []) as MoneyRow[], ["amount"]) };
}

export async function listMembers(ctx: OrgContext) {
  const { data } = await ctx.supabase.from("organisation_members").select("user_id, role, created_at").eq("org_id", ctx.org.id);
  const ids = (data ?? []).map((m) => m.user_id as string);
  const { data: profiles } = ids.length ? await ctx.supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name as string) || ""]));
  return (data ?? []).map((m) => ({ user_id: m.user_id as string, role: m.role as string, name: names.get(m.user_id as string) || (m.user_id === ctx.user.id ? ctx.user.email : "Team member") }));
}
