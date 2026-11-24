"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertFeature } from "@/lib/entitlements";
import { questionSchema, SURVEY_TYPES } from "@/lib/validation";
import { SURVEY_TEMPLATES } from "@/lib/surveys";
import { getEvent } from "@/lib/data/queries";
import type { ActionState } from "@/components/ui/action-form";

export async function createSurvey(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const r = await safeAction("createSurvey", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "surveys");
    const d = z
      .object({
        title: z.string().trim().min(1, "Give your survey a title").max(150),
        survey_type: z.enum(SURVEY_TYPES.map(([v]) => v) as [string, ...string[]]),
        event_id: z.string().optional().transform((v) => (v ? v : null)),
        anonymous: z.string().optional().transform((v) => v === "on"),
      })
      .parse(formToObject(fd));
    if (d.event_id) await getEvent(ctx, d.event_id);
    const { data, error } = await ctx.supabase.from("surveys").insert({ ...d, questions: SURVEY_TEMPLATES[d.survey_type], org_id: ctx.org.id }).select("id").single();
    if (error) throw error;
    id = data.id;
    return { ok: true };
  });
  if (!r.ok) return r;
  revalidatePath("/dashboard/surveys");
  redirect(`/dashboard/surveys/${id}`);
}

export async function saveQuestions(id: string, questions: unknown): Promise<ActionResult> {
  const r = await safeAction("saveQuestions", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const qs = z.array(questionSchema).min(1, "Add at least one question").max(20).parse(questions);
    for (const q of qs) if (q.type === "choice" && (!q.options || q.options.length < 2)) return { ok: false, error: `"${q.label}" needs at least two options.` };
    const { error } = await ctx.supabase.from("surveys").update({ questions: qs }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Questions saved" };
  });
  if (r.ok) revalidatePath(`/dashboard/surveys/${id}`);
  return r;
}

export async function setSurveyOpen(id: string, open: boolean): Promise<ActionResult> {
  const r = await safeAction("setSurveyOpen", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("surveys").update({ is_open: open }).eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: open ? "Survey reopened" : "Survey closed to new responses" };
  });
  if (r.ok) revalidatePath(`/dashboard/surveys/${id}`);
  return r;
}

export async function deleteSurvey(id: string): Promise<ActionResult> {
  const r = await safeAction("deleteSurvey", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("surveys").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true };
  });
  if (!r.ok) return r;
  revalidatePath("/dashboard/surveys");
  redirect("/dashboard/surveys");
}
