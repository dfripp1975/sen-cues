"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertCanAddTrackingLink, assertFeature } from "@/lib/entitlements";
import { linkSchema } from "@/lib/validation";
import { generateSlug, validateDestination } from "@/lib/tracking";
import { env } from "@/lib/env";
import { getEvent } from "@/lib/data/queries";
import type { ActionState } from "@/components/ui/action-form";

const done = (r: ActionResult) => {
  if (r.ok) revalidatePath("/dashboard/links");
  return r;
};

export async function createLink(_: ActionState, fd: FormData): Promise<ActionState> {
  return done(await safeAction("createLink", async () => {
    const ctx = await requireOrg();
    await assertCanAddTrackingLink(ctx);
    const input = linkSchema.parse(formToObject(fd));
    const v = validateDestination(input.destination_url, new URL(env.siteUrl).hostname);
    if (!v.ok) return { ok: false, error: v.error, fieldErrors: { destination_url: v.error } };
    if (input.event_id) await getEvent(ctx, input.event_id);
    if (input.campaign_id) z.string().uuid().parse(input.campaign_id);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await ctx.supabase.from("tracking_links").insert({ ...input, destination_url: v.url.toString(), slug: generateSlug(), org_id: ctx.org.id });
      if (!error) return { ok: true, message: "Tracking link created" };
      if (error.code !== "23505") throw error; // retry only on slug collision
    }
    return { ok: false, error: "Couldn't generate a unique link. Please try again." };
  }));
}

export async function toggleLink(id: string, active: boolean): Promise<ActionResult> {
  return done(await safeAction("toggleLink", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "trackingLinks");
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("tracking_links").update({ is_active: active }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: active ? "Link activated" : "Link paused" };
  }));
}

export async function deleteLink(id: string): Promise<ActionResult> {
  return done(await safeAction("deleteLink", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("tracking_links").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Link deleted" };
  }));
}
