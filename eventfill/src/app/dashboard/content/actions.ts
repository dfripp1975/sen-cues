"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, type ActionResult } from "@/lib/action";
import { aiCreditsUsed, assertFeature, monthStartISO } from "@/lib/entitlements";
import { AiUnavailableError, CONTENT_TYPES, exampleTemplate, generateContent, type GenerateInput } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAiConfigured } from "@/lib/env";
import { getEvent } from "@/lib/data/queries";
import { audit, rateLimit } from "@/lib/ops";

const inputSchema = z.object({
  eventId: z.string().uuid("Choose an event"),
  contentType: z.enum(CONTENT_TYPES.map(([v]) => v) as [string, ...string[]]),
  audience: z.string().trim().min(1, "Describe the target audience").max(300),
  platform: z.string().trim().min(1).max(60),
  tone: z.string().trim().min(1).max(60),
  objective: z.string().trim().min(1, "Choose an objective").max(200),
  keyInfo: z.string().trim().max(1500).default(""),
  variationOf: z.string().max(4000).optional().nullable(),
  exampleOnly: z.boolean().optional(),
});

/** Optional global safety net: stop all generation once estimated monthly spend hits the cap. */
async function globalBudgetExceeded(): Promise<boolean> {
  const cap = Number(process.env.AI_MONTHLY_BUDGET_USD || 0);
  if (!cap) return false;
  try {
    const db = createAdminClient();
    const { data } = await db.from("ai_usage").select("estimated_cost_usd").gte("created_at", monthStartISO()).limit(100000);
    const spent = (data ?? []).reduce((s, r) => s + Number(r.estimated_cost_usd), 0);
    return spent >= cap;
  } catch {
    return true; // fail closed for spending
  }
}

export async function generateAction(raw: z.input<typeof inputSchema>): Promise<ActionResult> {
  return safeAction("generateContent", async () => {
    const ctx = await requireOrg();
    const input = inputSchema.parse(raw);
    const event = await getEvent(ctx, input.eventId);
    const gen: GenerateInput = {
      contentType: input.contentType as GenerateInput["contentType"],
      eventName: event.name,
      eventDate: event.end_date ? `${event.event_date} to ${event.end_date}` : event.event_date,
      venue: event.venue,
      isOnline: event.is_online,
      bookingUrl: event.booking_url,
      eventDescription: event.description,
      audience: input.audience,
      platform: input.platform,
      tone: input.tone,
      objective: input.objective,
      keyInfo: input.keyInfo,
      variationOf: input.variationOf,
    };
    if (input.exampleOnly) return { ok: true, data: { text: exampleTemplate(gen), isExample: true } };

    assertFeature(ctx, "aiContent");
    if (!isAiConfigured()) return { ok: false, error: "AI generation isn't configured on this server yet. You can insert a labelled example template instead." };
    const used = await aiCreditsUsed(ctx);
    if (used >= ctx.plan.aiCreditsPerMonth) return { ok: false, error: `You've used all ${ctx.plan.aiCreditsPerMonth} AI credits for this month. Credits reset on the 1st, or upgrade for more.` };
    if (!(await rateLimit(`ai:${ctx.user.id}`, 60, 6))) return { ok: false, error: "You're generating quickly — please wait a minute and try again." };
    if (await globalBudgetExceeded()) return { ok: false, error: "AI generation is temporarily unavailable. Please try again later." };

    try {
      const result = await generateContent(gen);
      const db = createAdminClient();
      await db.from("ai_usage").insert({ org_id: ctx.org.id, user_id: ctx.user.id, provider: result.provider, model: result.model, input_tokens: result.inputTokens, output_tokens: result.outputTokens, estimated_cost_usd: result.estimatedCostUsd });
      revalidatePath("/dashboard/content");
      return { ok: true, data: { text: result.text, isExample: false, creditsLeft: ctx.plan.aiCreditsPerMonth - used - 1 } };
    } catch (e) {
      if (e instanceof AiUnavailableError) return { ok: false, error: e.message };
      throw e;
    }
  });
}

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid().nullable(),
  campaignId: z.string().uuid().nullable().optional(),
  contentType: z.string().max(40),
  platform: z.string().max(60).optional(),
  tone: z.string().max(60).optional(),
  body: z.string().trim().min(1, "Content is empty").max(10000),
  isExample: z.boolean().default(false),
});

export async function saveContent(raw: z.input<typeof saveSchema>): Promise<ActionResult> {
  return safeAction("saveContent", async () => {
    const ctx = await requireOrg();
    const d = saveSchema.parse(raw);
    if (d.eventId) await getEvent(ctx, d.eventId);
    if (d.campaignId) {
      const { data } = await ctx.supabase.from("campaigns").select("id").eq("id", d.campaignId).eq("org_id", ctx.org.id).maybeSingle();
      if (!data) return { ok: false, error: "Campaign not found." };
    }
    const row = { org_id: ctx.org.id, event_id: d.eventId, campaign_id: d.campaignId ?? null, content_type: d.contentType, platform: d.platform, tone: d.tone, body: d.body, is_demo: d.isExample, created_by: ctx.user.id, updated_at: new Date().toISOString() };
    const { error } = d.id ? await ctx.supabase.from("ai_content").update(row).eq("id", d.id).eq("org_id", ctx.org.id) : await ctx.supabase.from("ai_content").insert(row);
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, d.id ? "content.updated" : "content.saved", "ai_content");
    revalidatePath("/dashboard/content");
    return { ok: true, message: d.campaignId ? "Saved and added to campaign" : "Saved to your library" };
  });
}

export async function deleteContent(id: string): Promise<ActionResult> {
  return safeAction("deleteContent", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("ai_content").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    revalidatePath("/dashboard/content");
    return { ok: true, message: "Deleted" };
  });
}
