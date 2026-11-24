import { describe, it, expect, beforeAll } from "vitest";
import Stripe from "stripe";
import { processStripeEvent, type BillingStore, type SubscriptionRecord } from "@/lib/billing";

const stripe = new Stripe("sk_test_dummy");
const secret = "whsec_test_secret";

function signed(payload: object) {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return { body, header };
}

function memoryStore() {
  const rows = new Map<string, Partial<SubscriptionRecord>>();
  const store: BillingStore = {
    async orgIdForCustomer(c) {
      for (const [org, r] of rows) if (r.stripe_customer_id === c) return org;
      return null;
    },
    async upsert(org, rec) {
      rows.set(org, { ...rows.get(org), ...rec });
    },
  };
  return { rows, store };
}

const sub = (over: Record<string, unknown> = {}) => ({
  id: "sub_123",
  object: "subscription",
  customer: "cus_1",
  status: "active",
  cancel_at_period_end: false,
  metadata: { org_id: "org_1" },
  items: { data: [{ price: { id: "price_growth_m" }, current_period_end: 1893456000 }] },
  ...over,
});

beforeAll(() => {
  process.env.STRIPE_PRICE_GROWTH_MONTHLY = "price_growth_m";
  process.env.STRIPE_PRICE_PRO_ANNUAL = "price_pro_y";
});

describe("Stripe webhook processing", () => {
  it("rejects payloads with an invalid signature", async () => {
    const { body } = signed({ id: "evt_1", type: "customer.subscription.updated", data: { object: sub() } });
    const bad = stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_wrong" });
    await expect(stripe.webhooks.constructEventAsync(body, bad, secret)).rejects.toThrow();
  });

  it("rejects tampered payloads", async () => {
    const { header } = signed({ id: "evt_1", type: "customer.subscription.updated", data: { object: sub() } });
    const tampered = JSON.stringify({ id: "evt_1", type: "customer.subscription.updated", data: { object: sub({ items: { data: [{ price: { id: "price_pro_y" } }] } }) } });
    await expect(stripe.webhooks.constructEventAsync(tampered, header, secret)).rejects.toThrow();
  });

  it("activates a plan after checkout completes", async () => {
    const { body, header } = signed({
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { object: "checkout.session", mode: "subscription", client_reference_id: "org_1", subscription: "sub_123", customer: "cus_1" } },
    });
    const event = await stripe.webhooks.constructEventAsync(body, header, secret);
    const { rows, store } = memoryStore();
    const res = await processStripeEvent(event, store, async () => sub() as unknown as Stripe.Subscription);
    expect(res).toEqual({ handled: true, orgId: "org_1" });
    expect(rows.get("org_1")).toMatchObject({ plan: "growth", billing_interval: "month", status: "active", stripe_customer_id: "cus_1" });
    expect(rows.get("org_1")!.current_period_end).toBe(new Date(1893456000 * 1000).toISOString());
  });

  it("handles upgrades and downgrades via subscription updates", async () => {
    const { rows, store } = memoryStore();
    await store.upsert("org_1", { stripe_customer_id: "cus_1", plan: "growth" });
    const { body, header } = signed({
      id: "evt_3",
      type: "customer.subscription.updated",
      data: { object: sub({ metadata: {}, items: { data: [{ price: { id: "price_pro_y" }, current_period_end: 1893456000 }] } }) },
    });
    const event = await stripe.webhooks.constructEventAsync(body, header, secret);
    await processStripeEvent(event, store, async () => { throw new Error("not used"); });
    expect(rows.get("org_1")).toMatchObject({ plan: "pro", billing_interval: "year" });
  });

  it("downgrades to free when a subscription is cancelled", async () => {
    const { rows, store } = memoryStore();
    const { body, header } = signed({ id: "evt_4", type: "customer.subscription.deleted", data: { object: sub({ status: "canceled" }) } });
    const event = await stripe.webhooks.constructEventAsync(body, header, secret);
    await processStripeEvent(event, store, async () => { throw new Error("not used"); });
    expect(rows.get("org_1")).toMatchObject({ plan: "free", status: "canceled", stripe_subscription_id: null });
  });

  it("does not grant a paid plan for unknown prices", async () => {
    const { rows, store } = memoryStore();
    const { body, header } = signed({ id: "evt_5", type: "customer.subscription.created", data: { object: sub({ items: { data: [{ price: { id: "price_attacker" } }] } }) } });
    await processStripeEvent(await stripe.webhooks.constructEventAsync(body, header, secret), store, async () => { throw new Error(); });
    expect(rows.get("org_1")!.plan).toBe("free");
  });

  it("ignores unrelated events", async () => {
    const { store } = memoryStore();
    const { body, header } = signed({ id: "evt_6", type: "invoice.paid", data: { object: {} } });
    const res = await processStripeEvent(await stripe.webhooks.constructEventAsync(body, header, secret), store, async () => { throw new Error(); });
    expect(res.handled).toBe(false);
  });
});
