// Stripe webhook processing. Kept free of framework code so it can be unit
// tested with real Stripe signatures and an in-memory store.
import type Stripe from "stripe";
import { planFromPriceId, type PlanId } from "./plans";

export interface SubscriptionRecord {
  plan: PlanId;
  billing_interval: "month" | "year" | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  currency?: string | null;
}

export interface BillingStore {
  orgIdForCustomer(customerId: string): Promise<string | null>;
  upsert(orgId: string, rec: Partial<SubscriptionRecord>): Promise<void>;
}

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

export function subscriptionToRecord(sub: Stripe.Subscription): Partial<SubscriptionRecord> {
  const item = sub.items?.data?.[0];
  const mapped = planFromPriceId(item?.price?.id);
  const ended = sub.status === "canceled" || sub.status === "incomplete_expired";
  const periodEnd = item?.current_period_end ?? null;
  return {
    plan: ended || !mapped ? "free" : mapped.plan,
    billing_interval: ended ? null : mapped?.interval ?? null,
    status: sub.status,
    stripe_customer_id: idOf(sub.customer),
    stripe_subscription_id: ended ? null : sub.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    currency: sub.currency ? sub.currency.toUpperCase() : null,
  };
}

export async function processStripeEvent(
  event: Stripe.Event,
  store: BillingStore,
  fetchSubscription: (id: string) => Promise<Stripe.Subscription>,
): Promise<{ handled: boolean; orgId?: string | null }> {
  if (!HANDLED.has(event.type)) return { handled: false };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") return { handled: false };
    const orgId = session.client_reference_id ?? session.metadata?.org_id ?? null;
    const subId = idOf(session.subscription);
    if (!orgId || !subId) return { handled: false };
    const sub = await fetchSubscription(subId);
    await store.upsert(orgId, subscriptionToRecord(sub));
    return { handled: true, orgId };
  }

  const sub = event.data.object as Stripe.Subscription;
  const customerId = idOf(sub.customer);
  const orgId = sub.metadata?.org_id || (customerId ? await store.orgIdForCustomer(customerId) : null);
  if (!orgId) return { handled: false };
  const rec = subscriptionToRecord(sub);
  if (event.type === "customer.subscription.deleted") {
    rec.plan = "free";
    rec.billing_interval = null;
    rec.stripe_subscription_id = null;
    rec.status = "canceled";
  }
  await store.upsert(orgId, rec);
  return { handled: true, orgId };
}
