"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { safeAction, formToObject, type ActionResult } from "@/lib/action";
import { assertFeature, PlanLimitError } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { env, isStripeConfigured } from "@/lib/env";
import { hasOwnCurrencyPrice, isPlanId, stripePriceId, PLANS } from "@/lib/plans";
import { DEFAULT_CURRENCY, toCurrency } from "@/lib/pricing";
import { audit } from "@/lib/ops";
import type { ActionState } from "@/components/ui/action-form";

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("updateProfile", async () => {
    const ctx = await requireOrg();
    const d = z.object({ full_name: z.string().trim().min(1, "Enter your name").max(100), marketing_emails: z.string().optional().transform((v) => v === "on") }).parse(formToObject(fd));
    const { error } = await ctx.supabase.from("profiles").update({ ...d, updated_at: new Date().toISOString() }).eq("id", ctx.user.id);
    if (error) throw error;
    return { ok: true, message: "Profile saved" };
  });
  if (r.ok) revalidatePath("/dashboard", "layout");
  return r;
}

export async function updateOrganisation(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("updateOrganisation", async () => {
    const ctx = await requireOrg();
    if (ctx.role === "member") return { ok: false, error: "Only owners and admins can change organisation settings." };
    const d = z
      .object({
        name: z.string().trim().min(1, "Enter a name").max(120),
        currency: z.string().regex(/^[A-Z]{3}$/),
        timezone: z.string().trim().min(3).max(60),
        country: z.string().trim().max(60),
        ticketing_platform: z.string().trim().max(60),
        data_retention_months: z.coerce.number().int().min(3).max(120),
      })
      .parse(formToObject(fd));
    const { error } = await ctx.supabase.from("organisations").update({ ...d, updated_at: new Date().toISOString() }).eq("id", ctx.org.id);
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, "organisation.updated", "organisation", ctx.org.id);
    return { ok: true, message: "Organisation saved" };
  });
  if (r.ok) revalidatePath("/dashboard", "layout");
  return r;
}

// ------------------------------------------------------------------ team
export async function inviteMember(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("inviteMember", async () => {
    const ctx = await requireOrg();
    assertFeature(ctx, "teamCollaboration");
    if (ctx.role === "member") return { ok: false, error: "Only owners and admins can invite people." };
    const d = z.object({ email: z.email("Enter a valid email"), role: z.enum(["admin", "member"]) }).parse(formToObject(fd));
    const [{ count: members }, { count: invites }] = await Promise.all([
      ctx.supabase.from("organisation_members").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.org.id),
      ctx.supabase.from("organisation_invites").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id).is("accepted_at", null),
    ]);
    if ((members ?? 0) + (invites ?? 0) >= ctx.plan.teamMembers) throw new PlanLimitError(`Your plan includes ${ctx.plan.teamMembers} seats.`);
    const { error } = await ctx.supabase.from("organisation_invites").insert({ org_id: ctx.org.id, email: d.email.toLowerCase(), role: d.role, invited_by: ctx.user.id });
    if (error) throw error;
    await audit(ctx.org.id, ctx.user.id, "team.invited", "invite", undefined, { role: d.role });
    return { ok: true, message: "Invite created — copy the link and send it to your teammate." };
  });
  if (r.ok) revalidatePath("/dashboard/settings/team");
  return r;
}

export async function revokeInvite(id: string): Promise<ActionResult> {
  const r = await safeAction("revokeInvite", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(id);
    const { error } = await ctx.supabase.from("organisation_invites").delete().eq("id", id).eq("org_id", ctx.org.id);
    if (error) throw error;
    return { ok: true, message: "Invite revoked" };
  });
  if (r.ok) revalidatePath("/dashboard/settings/team");
  return r;
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const r = await safeAction("removeMember", async () => {
    const ctx = await requireOrg();
    z.string().uuid().parse(userId);
    if (userId === ctx.user.id) return { ok: false, error: "You can't remove yourself here." };
    const { error, count } = await ctx.supabase.from("organisation_members").delete({ count: "exact" }).eq("org_id", ctx.org.id).eq("user_id", userId);
    if (error) throw error;
    if (!count) return { ok: false, error: "You don't have permission to remove this member." };
    await audit(ctx.org.id, ctx.user.id, "team.removed", "member", userId);
    return { ok: true, message: "Member removed" };
  });
  if (r.ok) revalidatePath("/dashboard/settings/team");
  return r;
}

// ------------------------------------------------------------------ billing
export async function startCheckout(_: ActionState, fd: FormData): Promise<ActionState> {
  let url = "";
  const r = await safeAction("startCheckout", async () => {
    const ctx = await requireOrg();
    if (ctx.role !== "owner" && ctx.role !== "admin") return { ok: false, error: "Only owners and admins can manage billing." };
    if (!isStripeConfigured()) return { ok: false, error: "Payments aren't configured yet (STRIPE_SECRET_KEY missing). See the README." };
    const plan = fd.get("plan");
    const interval = fd.get("interval") === "year" ? "year" : "month";
    if (!isPlanId(plan) || plan === "free") return { ok: false, error: "Choose a paid plan." };
    const currency = toCurrency(fd.get("currency")) ?? DEFAULT_CURRENCY;
    const price = stripePriceId(plan, interval, currency);
    if (!price) return { ok: false, error: `No Stripe price is configured for ${PLANS[plan].name} (${interval}ly).` };
    // A shared price charges in another currency through its currency options;
    // a currency's own price is already in that currency.
    const checkoutCurrency = hasOwnCurrencyPrice(plan, interval, currency) ? undefined : currency.toLowerCase();
    const stripe = getStripe();
    if (ctx.subscription.plan !== "free" && ctx.subscription.stripe_customer_id) {
      // Existing subscribers change plan in the Stripe customer portal (handles proration).
      const portal = await stripe.billingPortal.sessions.create({ customer: ctx.subscription.stripe_customer_id, return_url: `${env.siteUrl}/dashboard/settings/billing` });
      url = portal.url;
      return { ok: true };
    }
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        currency: checkoutCurrency,
        line_items: [{ price, quantity: 1 }],
        client_reference_id: ctx.org.id,
        customer: ctx.subscription.stripe_customer_id ?? undefined,
        customer_email: ctx.subscription.stripe_customer_id ? undefined : ctx.user.email,
        subscription_data: { metadata: { org_id: ctx.org.id } },
        metadata: { org_id: ctx.org.id },
        allow_promotion_codes: true,
        success_url: `${env.siteUrl}/dashboard/settings/billing?checkout=success`,
        cancel_url: `${env.siteUrl}/dashboard/settings/billing?checkout=cancelled`,
      });
    } catch (e) {
      if (/currenc/i.test(e instanceof Error ? e.message : "")) {
        return { ok: false, error: `${PLANS[plan].name} can't be paid in ${currency} yet. Choose another currency, or contact us.` };
      }
      throw e;
    }
    if (!session.url) return { ok: false, error: "Stripe didn't return a checkout link." };
    url = session.url;
    await audit(ctx.org.id, ctx.user.id, "billing.checkout_started", "subscription", undefined, { plan, interval, currency });
    return { ok: true };
  });
  if (!r.ok) return r;
  redirect(url);
}

export async function openBillingPortal(): Promise<ActionResult> {
  let url = "";
  const r = await safeAction("openBillingPortal", async () => {
    const ctx = await requireOrg();
    if (ctx.role !== "owner" && ctx.role !== "admin") return { ok: false, error: "Only owners and admins can manage billing." };
    if (!isStripeConfigured()) return { ok: false, error: "Payments aren't configured yet." };
    if (!ctx.subscription.stripe_customer_id) return { ok: false, error: "No billing account yet. Choose a plan first." };
    const portal = await getStripe().billingPortal.sessions.create({ customer: ctx.subscription.stripe_customer_id, return_url: `${env.siteUrl}/dashboard/settings/billing` });
    url = portal.url;
    return { ok: true };
  });
  if (!r.ok) return r;
  redirect(url);
}

// ------------------------------------------------------------------ privacy
export async function deleteAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = await safeAction("deleteAccount", async () => {
    const ctx = await requireOrg();
    if (String(fd.get("confirm")).trim().toUpperCase() !== "DELETE") return { ok: false, error: 'Type DELETE to confirm.', fieldErrors: { confirm: 'Type DELETE' } };
    const admin = createAdminClient();
    // Organisations this user owns alone are deleted entirely (with all their data).
    const { data: owned } = await admin.from("organisation_members").select("org_id").eq("user_id", ctx.user.id).eq("role", "owner");
    for (const { org_id } of owned ?? []) {
      const { count } = await admin.from("organisation_members").select("user_id", { count: "exact", head: true }).eq("org_id", org_id).eq("role", "owner");
      if ((count ?? 0) > 1) continue;
      const { data: sub } = await admin.from("subscriptions").select("stripe_subscription_id").eq("org_id", org_id).maybeSingle();
      if (sub?.stripe_subscription_id && isStripeConfigured()) {
        try { await getStripe().subscriptions.cancel(sub.stripe_subscription_id); } catch { /* already cancelled */ }
      }
      await admin.from("organisations").delete().eq("id", org_id);
    }
    const { error } = await admin.auth.admin.deleteUser(ctx.user.id);
    if (error) throw error;
    return { ok: true };
  });
  if (!r.ok) return r;
  const { createClient } = await import("@/lib/supabase/server");
  await (await createClient()).auth.signOut().catch(() => {});
  redirect("/?accountDeleted=1");
}
