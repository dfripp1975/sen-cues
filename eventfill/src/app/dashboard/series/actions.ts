"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg, type OrgContext } from "@/lib/auth";
import { safeAction, type ActionResult } from "@/lib/action";
import { assertCanAddActiveEvent } from "@/lib/entitlements";
import { MAX_SERIES_DATES, nextOccurrence, generateSeriesDates, type Recurrence } from "@/lib/series";
import { addDays, daysBetween, parseISODate, today } from "@/lib/dates";
import { audit } from "@/lib/ops";
import type { ActionState } from "@/components/ui/action-form";
import type { EventRow, SeriesRow } from "@/types/db";

async function ownedSeries(ctx: OrgContext, id: string) {
  z.string().uuid().parse(id);
  const { data } = await ctx.supabase.from("event_series").select("*").eq("id", id).eq("org_id", ctx.org.id).maybeSingle();
  if (!data) throw new Error("Series not found");
  return data as SeriesRow;
}

export async function addSeriesDates(seriesId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("addSeriesDates", async () => {
    const ctx = await requireOrg();
    const series = await ownedSeries(ctx, seriesId);
    const count = z.coerce.number().int().min(1, "Add at least one date").max(MAX_SERIES_DATES).parse(fd.get("count"));
    const { data: dates } = await ctx.supabase.from("events").select("*").eq("series_id", seriesId).eq("org_id", ctx.org.id).order("event_date");
    const all = (dates ?? []) as EventRow[];
    if (!all.length) return { ok: false, error: "This series has no dates to copy from." };
    if (all.length + count > 104) return { ok: false, error: "A series can have up to 104 dates. Start a new series for later dates." };
    await assertCanAddActiveEvent(ctx, { seriesId });
    const last = all[all.length - 1];
    const firstDay = parseISODate(all[0].event_date).getUTCDate();
    const start = nextOccurrence(last.event_date, series.recurrence as Recurrence, firstDay);
    const shift = daysBetween(last.event_date, start);
    const generated = generateSeriesDates({
      start,
      end: last.end_date ? addDays(last.end_date, shift) : null,
      salesStart: last.sales_start_date ? addDays(last.sales_start_date, shift) : null,
      recurrence: series.recurrence as Recurrence,
      count,
      dayOfMonth: firstDay, // monthly series keep the original day (e.g. the 31st) where the month allows
    });
    const { id: _i, created_at: _c, updated_at: _u, attendance: _a, lessons_learned: _l, event_date: _d, end_date: _e, sales_start_date: _s, ...template } = last;
    const { data: inserted, error } = await ctx.supabase
      .from("events")
      .insert(generated.map((g) => ({ ...template, ...g, status: "active", created_by: ctx.user.id })))
      .select("id");
    if (error) throw error;
    const { data: tiers } = await ctx.supabase.from("ticket_tiers").select("name, price, quantity").eq("event_id", last.id).eq("org_id", ctx.org.id);
    if (tiers?.length && inserted?.length) {
      await ctx.supabase.from("ticket_tiers").insert(inserted.flatMap((ev) => tiers.map((t) => ({ ...t, org_id: ctx.org.id, event_id: ev.id }))));
    }
    await audit(ctx.org.id, ctx.user.id, "series.dates_added", "series", seriesId, { count });
    return { ok: true, message: `${count} date${count === 1 ? "" : "s"} added` };
  });
  if (r.ok) revalidatePath("/dashboard", "layout");
  return r;
}

export async function archivePastSeriesDates(seriesId: string): Promise<ActionResult> {
  const r = await safeAction("archivePastSeriesDates", async () => {
    const ctx = await requireOrg();
    await ownedSeries(ctx, seriesId);
    const { data, error } = await ctx.supabase
      .from("events")
      .update({ status: "completed" })
      .eq("series_id", seriesId)
      .eq("org_id", ctx.org.id)
      .lt("event_date", today())
      .in("status", ["active", "draft"])
      .select("id");
    if (error) throw error;
    return { ok: true, message: data?.length ? `${data.length} past date(s) marked as completed` : "No past dates to complete" };
  });
  if (r.ok) revalidatePath("/dashboard", "layout");
  return r;
}

export async function deleteSeries(seriesId: string): Promise<ActionResult> {
  const r = await safeAction("deleteSeries", async () => {
    const ctx = await requireOrg();
    await ownedSeries(ctx, seriesId);
    const { error } = await ctx.supabase.from("events").delete().eq("series_id", seriesId).eq("org_id", ctx.org.id);
    if (error) throw error;
    await ctx.supabase.from("event_series").delete().eq("id", seriesId).eq("org_id", ctx.org.id);
    await audit(ctx.org.id, ctx.user.id, "series.deleted", "series", seriesId);
    return { ok: true };
  });
  if (!r.ok) return r;
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/events?deleted=1");
}
