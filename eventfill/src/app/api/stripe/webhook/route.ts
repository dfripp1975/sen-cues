import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { processStripeEvent, type BillingStore } from "@/lib/billing";
import { audit, logError } from "@/lib/ops";

// Stripe calls this endpoint. The signature is verified before anything else.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const body = await req.text();
  const stripe = getStripe();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createAdminClient();
  const store: BillingStore = {
    async orgIdForCustomer(customerId) {
      const { data } = await db.from("subscriptions").select("org_id").eq("stripe_customer_id", customerId).maybeSingle();
      return data?.org_id ?? null;
    },
    async upsert(orgId, rec) {
      const { error } = await db.from("subscriptions").upsert({ org_id: orgId, ...rec, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
  };

  try {
    const result = await processStripeEvent(event, store, (id) => stripe.subscriptions.retrieve(id));
    if (result.handled && result.orgId) {
      await audit(result.orgId, null, `billing.${event.type}`, "subscription");
      const { data: sub } = await db.from("subscriptions").select("plan, status").eq("org_id", result.orgId).maybeSingle();
      if (sub) await db.from("notifications").insert({ org_id: result.orgId, title: `Subscription updated: ${sub.plan} plan (${sub.status})`, href: "/dashboard/settings/billing" });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    await logError("stripe-webhook", e);
    // 500 tells Stripe to retry later.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
