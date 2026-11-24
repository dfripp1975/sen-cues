import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/env";
import { PLANS, type Plan, type PlanId } from "@/lib/plans";
import { effectivePlan } from "@/lib/plan-status";

export interface Org {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  country: string | null;
  event_types: string[];
  event_frequency: string | null;
  ticketing_platform: string | null;
  onboarding_completed: boolean;
  data_retention_months: number;
}

export interface Subscription {
  plan: PlanId;
  status: string;
  billing_interval: "month" | "year" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

export interface OrgContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string; fullName: string };
  org: Org;
  role: "owner" | "admin" | "member";
  subscription: Subscription;
  plan: Plan;
}

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});


export const getOptionalOrgContext = cache(async (): Promise<OrgContext | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, active_org_id").eq("id", user.id).maybeSingle();
  const { data: memberships } = await supabase
    .from("organisation_members")
    .select("org_id, role, organisations(*)")
    .eq("user_id", user.id);
  if (!memberships?.length) return null;
  const chosen = memberships.find((m) => m.org_id === profile?.active_org_id) ?? memberships[0];
  const org = chosen.organisations as unknown as Org;
  const { data: sub } = await supabase.from("subscriptions").select("*").eq("org_id", org.id).maybeSingle();
  const planId = effectivePlan(sub);
  return {
    supabase,
    user: { id: user.id, email: user.email ?? "", fullName: profile?.full_name ?? "" },
    org,
    role: chosen.role as OrgContext["role"],
    subscription: {
      plan: planId,
      status: sub?.status ?? "active",
      billing_interval: sub?.billing_interval ?? null,
      current_period_end: sub?.current_period_end ?? null,
      cancel_at_period_end: sub?.cancel_at_period_end ?? false,
      stripe_customer_id: sub?.stripe_customer_id ?? null,
    },
    plan: PLANS[planId],
  };
});

/** For dashboard pages: requires sign-in and a completed onboarding. */
export async function requireOrg(): Promise<OrgContext> {
  const user = await getUser();
  if (!user) redirect("/login");
  const ctx = await getOptionalOrgContext();
  if (!ctx || !ctx.org.onboarding_completed) redirect("/onboarding");
  return ctx;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return Boolean(user?.email && user.email_confirmed_at && adminEmails().includes(user.email.toLowerCase()));
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/dashboard");
  return user;
}
