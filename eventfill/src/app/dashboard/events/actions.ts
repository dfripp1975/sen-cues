"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg, type OrgContext } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertCanAddActiveEvent, assertFeature, PlanLimitError } from "@/lib/entitlements";
import { eventSchema, moneyLineSchema, repeatSchema, saleSchema, tierSchema } from "@/lib/validation";
import { generateSeriesDates, salesDeadline, type Recurrence } from "@/lib/series";
import { aggregateDaily, parseSalesCsv, MAX_CSV_BYTES } from "@/lib/csv";
import { computeForecast } from "@/lib/forecast";
import { addDays, daysBetween, today } from "@/lib/dates";
import { audit, rateLimit } from "@/lib/ops";
import { getEvent, listSales } from "@/lib/data/queries";
import type { ActionState } from "@/components/ui/action-form";

const uuid = z.string().uuid();

async function ownedEvent(ctx: OrgContext, id: string) {
  uuid.parse(id);
  return getEvent(ctx, id);
}

function refresh(eventId?: string) {
  revalidatePath("/dashboard", "layout");
  if (eventId) revalidatePath(`/dashboard/events/${eventId}`, "layout");
}

// ---------------------------------------------------------------- events
// Fields copied to every date of a series (dates, status and outcomes are per date).
const SHARED_FIELDS = ["name", "description", "category", "venue", "is_online", "start_time", "end_time", "timezone", "ticketing_platform", "booking_url", "capacity", "ticket_target", "marketing_budget", "notes"] as const;

export async function createEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  let target = "";
  const res = await safeAction("createEvent", async () => {
    const ctx = await requireOrg();
    const input = eventSchema.parse(formToObject(fd));
    const repeat = repeatSchema.parse({ recurrence: fd.get("recurrence") || "none", repeat_count: fd.get("recurrence") && fd.get("recurrence") !== "none" ? fd.get("repeat_count") : undefined });
    const isSeries = repeat.recurrence !== "none" && !input.is_template;
    if (!input.is_template && (input.status === "active" || input.status === "draft")) await assertCanAddActiveEvent(ctx);

    let seriesId: string | null = null;
    let rows = [{ ...input }];
    if (isSeries) {
      const { data: series, error: sErr } = await ctx.supabase.from("event_series").insert({ org_id: ctx.org.id, name: input.name, recurrence: repeat.recurrence }).select("id").single();
      if (sErr) throw sErr;
      seriesId = series.id;
      rows = generateSeriesDates({ start: input.event_date, end: input.end_date, salesStart: input.sales_start_date, recurrence: repeat.recurrence as Recurrence, count: repeat.repeat_count ?? 2 }).map((d) => ({ ...input, ...d }));
    }
    const { data, error } = await ctx.supabase
      .from("events")
      .insert(rows.map((r) => ({ ...r, series_id: seriesId, org_id: ctx.org.id, created_by: ctx.user.id })))
      .select("id");
    if (error) {
      if (seriesId) await ctx.supabase.from("event_series").delete().eq("id", seriesId).eq("org_id", ctx.org.id);
      throw error;
    }
    const ids = (data ?? []).map((d) => d.id as string);
    // Optional first ticket tier from the create form, added to every date
    const tierName = String(fd.get("tier_name") ?? "").trim();
    if (tierName) {
      const tier = tierSchema.parse({ name: tierName, price: fd.get("tier_price") || 0, quantity: fd.get("tier_quantity") ?? "" });
      await ctx.supabase.from("ticket_tiers").insert(ids.map((id) => ({ ...tier, org_id: ctx.org.id, event_id: id })));
    }
    await audit(ctx.org.id, ctx.user.id, isSeries ? "series.created" : "event.created", isSeries ? "series" : "event", seriesId ?? ids[0], { dates: ids.length });
    target = isSeries ? `/dashboard/series/${seriesId}?created=1` : `/dashboard/events/${ids[0]}?created=1`;
    return { ok: true };
  });
  if (!res.ok) return res;
  refresh();
  redirect(target);
}

export async function updateEvent(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  let updatedOthers = 0;
  const res = await safeAction("updateEvent", async () => {
    const ctx = await requireOrg();
    const current = await ownedEvent(ctx, eventId);
    const input = eventSchema.parse(formToObject(fd));
    const becomingActive = (input.status === "active" || input.status === "draft") && !(current.status === "active" || current.status === "draft");
    if (becomingActive && !input.is_template) await assertCanAddActiveEvent(ctx, { seriesId: current.series_id });
    const { error } = await ctx.supabase.from("events").update({ ...input, updated_at: new Date().toISOString() }).eq("id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    if (current.series_id && fd.get("apply_to_series") === "on") {
      const shared = Object.fromEntries(SHARED_FIELDS.map((k) => [k, input[k]]));
      const { data, error: e2 } = await ctx.supabase
        .from("events")
        .update({ ...shared, updated_at: new Date().toISOString() })
        .eq("org_id", ctx.org.id)
        .eq("series_id", current.series_id)
        .neq("id", eventId)
        .gte("event_date", today())
        .in("status", ["active", "draft"])
        .select("id");
      if (e2) throw e2;
      updatedOthers = data?.length ?? 0;
      await ctx.supabase.from("event_series").update({ name: input.name }).eq("id", current.series_id).eq("org_id", ctx.org.id);
    }
    await audit(ctx.org.id, ctx.user.id, "event.updated", "event", eventId, { series_dates_updated: updatedOthers });
    return { ok: true };
  });
  if (!res.ok) return res;
  refresh(eventId);
  redirect(`/dashboard/events/${eventId}?saved=1${updatedOthers ? `&seriesUpdated=${updatedOthers}` : ""}`);
}

export async function duplicateEvent(eventId: string): Promise<ActionResult> {
  let newId = "";
  const res = await safeAction("duplicateEvent", async () => {
    const ctx = await requireOrg();
    const e = await ownedEvent(ctx, eventId);
    await assertCanAddActiveEvent(ctx);
    const { id: _id, created_at: _c, updated_at: _u, attendance: _a, lessons_learned: _l, ...rest } = e;
    const start = e.event_date < today() ? addDays(today(), 30) : e.event_date;
    const shift = daysBetween(e.event_date, start);
    const { data, error } = await ctx.supabase
      .from("events")
      .insert({
        ...rest,
        name: e.is_template ? e.name : `${e.name} (copy)`,
        status: "draft",
        is_template: false,
        series_id: null, // a duplicate is a standalone event
        event_date: start,
        end_date: e.end_date ? addDays(e.end_date, shift) : null,
        sales_start_date: e.sales_start_date ? addDays(e.sales_start_date, shift) : null,
        created_by: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    newId = data.id;
    const { data: tiers } = await ctx.supabase.from("ticket_tiers").select("name, price, quantity").eq("event_id", eventId).eq("org_id", ctx.org.id);
    if (tiers?.length) await ctx.supabase.from("ticket_tiers").insert(tiers.map((t) => ({ ...t, org_id: ctx.org.id, event_id: newId })));
    await audit(ctx.org.id, ctx.user.id, "event.duplicated", "event", newId, { from: eventId });
    return { ok: true };
  });
  if (!res.ok) return res;
  refresh();
  redirect(`/dashboard/events/${newId}/edit?duplicated=1`);
}

export async function setEventStatus(eventId: string, status: "active" | "archived" | "completed"): Promise<ActionResult> {
  const res = await safeAction("setEventStatus", async () => {
    const ctx = await requireOrg();
    const e = await ownedEvent(ctx, eventId);
    if (status === "active" && e.status !== "active" && e.status !== "draft" && !e.is_template) await assertCanAddActiveEvent(ctx, { seriesId: e.series_id });
    const { error } = await ctx.supabase.from("events").update({ status, updated_at: new Date().toISOString() }).eq("id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, `event.${status}`, "event", eventId);
    return { ok: true, message: status === "archived" ? "Event archived" : status === "completed" ? "Event marked as completed" : "Event restored" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const res = await safeAction("deleteEvent", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const { error } = await ctx.supabase.from("events").delete().eq("id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, "event.deleted", "event", eventId);
    return { ok: true };
  });
  if (!res.ok) return res;
  refresh();
  redirect("/dashboard/events?deleted=1");
}

export async function saveOutcome(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("saveOutcome", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const data = z
      .object({
        attendance: z.union([z.literal(""), z.coerce.number().int().min(0).max(10_000_000)]).transform((v) => (v === "" ? null : v)),
        lessons_learned: z.string().max(5000).transform((v) => v.trim() || null),
      })
      .parse(formToObject(fd));
    const { error } = await ctx.supabase.from("events").update(data).eq("id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Saved" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadEventImage(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("uploadEventImage", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const file = fd.get("image");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { ok: false, error: "Use a JPG, PNG or WebP image." };
    if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Images must be 2 MB or smaller." };
    // Check magic bytes, not just the declared type.
    const buf = new Uint8Array(await file.arrayBuffer());
    const sig = Array.from(buf.slice(0, 12));
    const isJpg = sig[0] === 0xff && sig[1] === 0xd8;
    const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
    const isWebp = String.fromCharCode(...sig.slice(0, 4)) === "RIFF" && String.fromCharCode(...sig.slice(8, 12)) === "WEBP";
    if (!(isJpg || isPng || isWebp)) return { ok: false, error: "That file doesn't look like a valid image." };
    const path = `${ctx.org.id}/${eventId}-${Date.now()}.${ext}`;
    const { error } = await ctx.supabase.storage.from("event-images").upload(path, buf, { contentType: file.type, upsert: false });
    if (error) return { ok: false, error: "Upload failed. Check that the storage bucket is set up (see README)." };
    const { data } = ctx.supabase.storage.from("event-images").getPublicUrl(path);
    await ctx.supabase.from("events").update({ image_url: data.publicUrl }).eq("id", eventId).eq("org_id", ctx.org.id);
    return { ok: true, message: "Image uploaded" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

// ---------------------------------------------------------------- tiers
export async function addTier(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("addTier", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const tier = tierSchema.parse(formToObject(fd));
    const { error } = await ctx.supabase.from("ticket_tiers").insert({ ...tier, org_id: ctx.org.id, event_id: eventId });
    if (error) throw error;
    return { ok: true, message: "Ticket tier added" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function deleteTier(eventId: string, tierId: string): Promise<ActionResult> {
  const res = await safeAction("deleteTier", async () => {
    const ctx = await requireOrg();
    uuid.parse(tierId);
    const { error } = await ctx.supabase.from("ticket_tiers").delete().eq("id", tierId).eq("event_id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Tier removed" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

// ---------------------------------------------------------------- sales
export async function addSale(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("addSale", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const sale = saleSchema.parse(formToObject(fd));
    if (sale.sale_date > today()) return { ok: false, error: "Sales can't be dated in the future.", fieldErrors: { sale_date: "Date is in the future" } };
    if (sale.refunds > sale.quantity && sale.quantity > 0) {
      // Allowed (refunds of earlier sales) but keep amounts sane
    }
    if (sale.tier_id) uuid.parse(sale.tier_id);
    const { error } = await ctx.supabase.from("ticket_sales").insert({ ...sale, org_id: ctx.org.id, event_id: eventId, source: "manual", created_by: ctx.user.id });
    if (error) throw error;
    return { ok: true, message: "Sales recorded" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function deleteSale(eventId: string, saleId: string): Promise<ActionResult> {
  const res = await safeAction("deleteSale", async () => {
    const ctx = await requireOrg();
    uuid.parse(saleId);
    const { error } = await ctx.supabase.from("ticket_sales").delete().eq("id", saleId).eq("event_id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Entry deleted" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function importSalesCsv(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("importSalesCsv", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    if (!(await rateLimit(`csv:${ctx.org.id}`, 3600, 30))) return { ok: false, error: "Too many imports this hour. Please try again later." };
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a CSV file to upload." };
    if (file.size > MAX_CSV_BYTES) return { ok: false, error: "CSV files must be 1 MB or smaller." };
    if (!/\.csv$/i.test(file.name) && !/csv|text\/plain|excel/.test(file.type)) return { ok: false, error: "Please upload a .csv file." };
    const parsed = parseSalesCsv(await file.text());
    if (!parsed.rows.length) {
      return { ok: false, error: parsed.errors.slice(0, 3).map((e) => (e.line ? `Line ${e.line}: ${e.message}` : e.message)).join(" ") || "No valid rows found." };
    }
    const rows = aggregateDaily(parsed.rows).filter((r) => r.sale_date <= today());
    const { data: tiers } = await ctx.supabase.from("ticket_tiers").select("id, name").eq("event_id", eventId).eq("org_id", ctx.org.id);
    const tierByName = new Map((tiers ?? []).map((t) => [t.name.toLowerCase(), t.id]));
    const insert = rows.map((r) => ({
      org_id: ctx.org.id,
      event_id: eventId,
      tier_id: r.tier ? tierByName.get(r.tier.toLowerCase()) ?? null : null,
      sale_date: r.sale_date,
      quantity: r.quantity,
      revenue: r.revenue,
      refunds: r.refunds,
      refund_amount: r.refund_amount,
      source: "csv" as const,
      note: r.tier && !tierByName.has(r.tier.toLowerCase()) ? `Tier: ${r.tier}` : null,
      created_by: ctx.user.id,
    }));
    if (fd.get("replace") === "on") {
      await ctx.supabase.from("ticket_sales").delete().eq("event_id", eventId).eq("org_id", ctx.org.id).eq("source", "csv");
    }
    const { error } = await ctx.supabase.from("ticket_sales").insert(insert);
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, "sales.csv_import", "event", eventId, { rows: insert.length, skipped: parsed.errors.length });
    const skipped = parsed.errors.length ? ` ${parsed.errors.length} row(s) skipped due to errors.` : "";
    return { ok: true, message: `Imported ${parsed.rows.length} row(s) as ${insert.length} daily entr${insert.length === 1 ? "y" : "ies"}.${skipped}` };
  });
  if (res.ok) refresh(eventId);
  return res;
}

// ---------------------------------------------------------------- forecast
export async function saveForecastSnapshot(eventId: string): Promise<ActionResult> {
  const res = await safeAction("saveForecastSnapshot", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "forecasting");
    const e = await ownedEvent(ctx, eventId);
    const sales = await listSales(ctx, [eventId]);
    const f = computeForecast({ sales, target: e.ticket_target, eventDate: salesDeadline(e), asOf: today(), salesStartDate: e.sales_start_date, capacity: e.capacity });
    const { error } = await ctx.supabase.from("sales_forecasts").insert({
      org_id: ctx.org.id,
      event_id: eventId,
      conservative: f.scenarios.conservative,
      expected: f.scenarios.expected,
      optimistic: f.scenarios.optimistic,
      inputs: { ticketsSold: f.ticketsSold, averageDailySales: f.averageDailySales, recentVelocity: f.recentVelocity, daysRemaining: f.daysRemaining, target: e.ticket_target },
    });
    if (error) throw error;
    return { ok: true, message: "Forecast snapshot saved" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

// ---------------------------------------------------------------- rescue
const rescueItem = z.object({ key: z.string().max(40), title: z.string().min(1).max(200), description: z.string().max(1000).optional(), dueInDays: z.number().int().min(0).max(365) });

export async function createRescuePlan(eventId: string, items: z.infer<typeof rescueItem>[]): Promise<ActionResult> {
  const res = await safeAction("createRescuePlan", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "rescueMode");
    const e = await ownedEvent(ctx, eventId);
    const list = z.array(rescueItem).min(1, "Choose at least one recommendation").max(20).parse(items);
    const sales = await listSales(ctx, [eventId]);
    const sold = sales.reduce((s, r) => s + r.quantity - r.refunds, 0);
    const base = today();
    const rows = list.map((i) => ({
      org_id: ctx.org.id,
      event_id: eventId,
      recommendation_key: i.key,
      title: i.title,
      description: i.description ?? null,
      due_date: [addDays(base, i.dueInDays), salesDeadline(e)].sort()[0],
      tickets_at_creation: sold,
      assignee_id: ctx.user.id,
    }));
    const { error } = await ctx.supabase.from("rescue_actions").insert(rows);
    if (error) throw error;
    await ctx.supabase.from("notifications").insert({ org_id: ctx.org.id, title: `Rescue plan created for ${e.name}`, body: `${rows.length} action(s) added.`, href: `/dashboard/events/${eventId}/rescue` });
    await audit(ctx.org.id, ctx.user.id, "rescue.plan_created", "event", eventId, { count: rows.length });
    return { ok: true, message: `${rows.length} action(s) added to your rescue plan` };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function updateRescueAction(eventId: string, actionId: string, patch: { status?: "todo" | "in_progress" | "done"; assignee_id?: string | null; due_date?: string | null }): Promise<ActionResult> {
  const res = await safeAction("updateRescueAction", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "rescueMode");
    uuid.parse(actionId);
    const p = z
      .object({
        status: z.enum(["todo", "in_progress", "done"]).optional(),
        assignee_id: z.string().uuid().nullable().optional(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      })
      .parse(patch);
    const update: Record<string, unknown> = { ...p };
    if (p.status) update.completed_at = p.status === "done" ? new Date().toISOString() : null;
    const { error } = await ctx.supabase.from("rescue_actions").update(update).eq("id", actionId).eq("event_id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function deleteRescueAction(eventId: string, actionId: string): Promise<ActionResult> {
  const res = await safeAction("deleteRescueAction", async () => {
    const ctx = await requireOrg();
    uuid.parse(actionId);
    const { error } = await ctx.supabase.from("rescue_actions").delete().eq("id", actionId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Action removed" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

// ---------------------------------------------------------------- finance
export async function addMoneyLine(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await safeAction("addMoneyLine", async () => {
    const ctx = await requireOrg();
    await ownedEvent(ctx, eventId);
    const line = moneyLineSchema.parse(formToObject(fd));
    const table = line.kind === "income" ? "event_income" : "event_expenses";
    const { kind: _k, ...row } = line;
    const { error } = await ctx.supabase.from(table).insert({ ...row, org_id: ctx.org.id, event_id: eventId });
    if (error) {
      if (error.code === "23514") throw new PlanLimitError("Choose a valid category.");
      throw error;
    }
    return { ok: true, message: line.kind === "income" ? "Income added" : "Expense added" };
  });
  if (res.ok) refresh(eventId);
  return res;
}

export async function deleteMoneyLine(eventId: string, kind: "income" | "expense", id: string): Promise<ActionResult> {
  const res = await safeAction("deleteMoneyLine", async () => {
    const ctx = await requireOrg();
    uuid.parse(id);
    const { error } = await ctx.supabase.from(kind === "income" ? "event_income" : "event_expenses").delete().eq("id", id).eq("event_id", eventId).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Removed" };
  });
  if (res.ok) refresh(eventId);
  return res;
}
