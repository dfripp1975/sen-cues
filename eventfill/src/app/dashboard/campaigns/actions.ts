"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertCanAddTask, assertFeature, PlanLimitError } from "@/lib/entitlements";
import { campaignSchema, taskSchema } from "@/lib/validation";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { addDays, today } from "@/lib/dates";
import { getEvent } from "@/lib/data/queries";
import type { ActionState } from "@/components/ui/action-form";

const uuid = z.string().uuid();
const done = (r: ActionResult) => {
  if (r.ok) revalidatePath("/dashboard", "layout");
  return r;
};

export async function createCampaign(_: ActionState, fd: FormData): Promise<ActionState> {
  return done(await safeAction("createCampaign", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "marketingPlanner");
    const c = campaignSchema.parse(formToObject(fd));
    if (c.event_id) await getEvent(ctx, c.event_id);
    if (c.start_date && c.end_date && c.end_date < c.start_date) return { ok: false, error: "End date must be after the start date.", fieldErrors: { end_date: "Before start date" } };
    const { error } = await ctx.supabase.from("campaigns").insert({ ...c, org_id: ctx.org.id });
    if (error) throw error;
    return { ok: true, message: "Campaign created" };
  }));
}

export async function updateCampaignStatus(id: string, status: string): Promise<ActionResult> {
  return done(await safeAction("updateCampaignStatus", async () => {
    const ctx = await requireOrg();
    uuid.parse(id);
    const s = z.enum(["planned", "active", "paused", "completed"]).parse(status);
    const { error } = await ctx.supabase.from("campaigns").update({ status: s }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true };
  }));
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  return done(await safeAction("deleteCampaign", async () => {
    const ctx = await requireOrg();
    uuid.parse(id);
    const { error } = await ctx.supabase.from("campaigns").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Campaign deleted" };
  }));
}

export async function createTask(_: ActionState, fd: FormData): Promise<ActionState> {
  return done(await safeAction("createTask", async () => {
    const ctx = await requireOrg();
    await assertCanAddTask(ctx);
    const t = taskSchema.parse(formToObject(fd));
    if (t.event_id) await getEvent(ctx, t.event_id);
    if (t.campaign_id) {
      uuid.parse(t.campaign_id);
      const { data } = await ctx.supabase.from("campaigns").select("id, event_id").eq("id", t.campaign_id).eq("org_id", ctx.org.id).maybeSingle();
      if (!data) return { ok: false, error: "Campaign not found." };
      t.event_id ??= data.event_id;
    }
    const { error } = await ctx.supabase.from("marketing_tasks").insert({ ...t, org_id: ctx.org.id, assignee_id: ctx.user.id });
    if (error) throw error;
    return { ok: true, message: "Task added" };
  }));
}

export async function setTaskStatus(id: string, status: "todo" | "in_progress" | "done"): Promise<ActionResult> {
  return done(await safeAction("setTaskStatus", async () => {
    const ctx = await requireOrg();
    uuid.parse(id);
    const s = z.enum(["todo", "in_progress", "done"]).parse(status);
    if (s !== "done") {
      const { data } = await ctx.supabase.from("marketing_tasks").select("status").eq("id", id).eq("org_id", ctx.org.id).maybeSingle();
      if (data?.status === "done") await assertCanAddTask(ctx);
    }
    const { error } = await ctx.supabase.from("marketing_tasks").update({ status: s }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true };
  }));
}

export async function deleteTask(id: string): Promise<ActionResult> {
  return done(await safeAction("deleteTask", async () => {
    const ctx = await requireOrg();
    uuid.parse(id);
    const { error } = await ctx.supabase.from("marketing_tasks").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Task deleted" };
  }));
}

export async function applyTemplate(_: ActionState, fd: FormData): Promise<ActionState> {
  return done(await safeAction("applyTemplate", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "marketingPlanner");
    const { event_id, template } = z.object({ event_id: z.string().uuid("Choose an event"), template: z.string() }).parse(formToObject(fd));
    const tpl = CAMPAIGN_TEMPLATES[template];
    if (!tpl) return { ok: false, error: "Choose a template." };
    const event = await getEvent(ctx, event_id);
    const now = today();
    const tasks = tpl.tasks.map((t) => ({ ...t, due: addDays(event.event_date, -t.offset) })).filter((t) => t.due >= now || event.event_date >= now);
    const { count } = await ctx.supabase.from("marketing_tasks").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id).neq("status", "done");
    if ((count ?? 0) + tasks.length > ctx.plan.campaignTasks) throw new PlanLimitError(`This plan adds ${tasks.length} tasks, which would exceed your limit of ${ctx.plan.campaignTasks} open tasks.`);
    const { data: camp, error } = await ctx.supabase
      .from("campaigns")
      .insert({ org_id: ctx.org.id, event_id, name: `${tpl.name}: ${event.name}`, channel: "other", status: "active", start_date: tasks.length ? [tasks.map((t) => t.due).sort()[0], now].sort().reverse()[0] : now, end_date: event.event_date, notes: tpl.summary })
      .select("id")
      .single();
    if (error) throw error;
    const rows = tasks.map((t) => ({ org_id: ctx.org.id, event_id, campaign_id: camp.id, title: t.title, channel: t.channel, due_date: t.due < now ? now : t.due, assignee_id: ctx.user.id }));
    if (rows.length) {
      const { error: e2 } = await ctx.supabase.from("marketing_tasks").insert(rows);
      if (e2) throw e2;
    }
    return { ok: true, message: `Added "${tpl.name}" with ${rows.length} tasks` };
  }));
}
