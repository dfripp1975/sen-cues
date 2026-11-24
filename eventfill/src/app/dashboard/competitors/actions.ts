"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertFeature } from "@/lib/entitlements";
import { competitorSchema } from "@/lib/validation";
import { getEvent } from "@/lib/data/queries";
import type { ActionState } from "@/components/ui/action-form";

export async function addCompetitor(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("addCompetitor", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "competitorWatch");
    const c = competitorSchema.parse(formToObject(fd));
    if (c.event_id) await getEvent(ctx, c.event_id);
    if (c.price_min != null && c.price_max != null && c.price_max < c.price_min) return { ok: false, error: "Maximum price is lower than the minimum.", fieldErrors: { price_max: "Lower than minimum" } };
    const { error } = await ctx.supabase.from("competitors").insert({ ...c, org_id: ctx.org.id });
    if (error) throw error;
    return { ok: true, message: "Competitor saved" };
  });
  if (r.ok) revalidatePath("/dashboard/competitors");
  return r;
}

export async function deleteCompetitor(id: string): Promise<ActionResult> {
  const r = await safeAction("deleteCompetitor", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("competitors").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Removed" };
  });
  if (r.ok) revalidatePath("/dashboard/competitors");
  return r;
}
