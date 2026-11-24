"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOptionalOrgContext } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation";
import { audit } from "@/lib/ops";
import type { ActionState } from "@/components/ui/action-form";

export async function completeOnboarding(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse({
    fullName: fd.get("fullName"),
    orgName: fd.get("orgName"),
    eventTypes: fd.getAll("eventTypes"),
    frequency: fd.get("frequency"),
    platform: fd.get("platform") ?? "",
    country: fd.get("country"),
    currency: fd.get("currency"),
    timezone: fd.get("timezone"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please complete the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const existing = await getOptionalOrgContext();
  let orgId = existing?.org.id;
  if (!orgId) {
    const { data, error } = await supabase.rpc("create_organisation", { p_name: d.orgName });
    if (error || !data) return { ok: false, error: "We couldn't create your organisation. Please try again." };
    orgId = data as string;
  }
  const { error: orgErr } = await supabase
    .from("organisations")
    .update({
      name: d.orgName,
      event_types: d.eventTypes,
      event_frequency: d.frequency,
      ticketing_platform: d.platform || null,
      country: d.country,
      currency: d.currency,
      timezone: d.timezone,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);
  if (orgErr) return { ok: false, error: "We couldn't save your details. Please try again." };
  await supabase.from("profiles").upsert({ id: auth.user.id, full_name: d.fullName, active_org_id: orgId });
  await audit(orgId, auth.user.id, "onboarding.completed", "organisation", orgId);

  const plan = fd.get("plan");
  if (typeof plan === "string" && ["starter", "growth", "pro"].includes(plan)) {
    redirect(`/dashboard/settings/billing?plan=${plan}&interval=${fd.get("interval") === "year" ? "year" : "month"}`);
  }
  redirect("/dashboard/events/new?welcome=1");
}
