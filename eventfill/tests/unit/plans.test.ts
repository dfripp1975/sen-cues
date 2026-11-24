import { describe, it, expect, beforeEach } from "vitest";
import { PLANS, planHasFeature, minimumPlanFor, planFromPriceId, stripePriceId } from "@/lib/plans";
import { effectivePlanFor } from "./helpers";

describe("plans and feature gating", () => {
  it("matches the published limits", () => {
    expect([PLANS.free.activeEvents, PLANS.starter.activeEvents, PLANS.growth.activeEvents, PLANS.pro.activeEvents]).toEqual([1, 3, 15, 50]);
    expect(PLANS.free.aiCreditsPerMonth).toBe(0);
    expect([PLANS.starter.monthlyPrice, PLANS.growth.monthlyPrice, PLANS.pro.monthlyPrice]).toEqual([29, 79, 149]);
  });
  it("gates features by plan", () => {
    expect(planHasFeature("free", "forecasting")).toBe(false);
    expect(planHasFeature("starter", "forecasting")).toBe(true);
    expect(planHasFeature("starter", "rescueMode")).toBe(false);
    expect(planHasFeature("growth", "rescueMode")).toBe(true);
    expect(planHasFeature("growth", "teamCollaboration")).toBe(false);
    expect(planHasFeature("pro", "teamCollaboration")).toBe(true);
    expect(minimumPlanFor("competitorWatch").id).toBe("growth");
  });
  it("only keeps paid plans while the subscription is active", () => {
    expect(effectivePlanFor({ plan: "growth", status: "active" })).toBe("growth");
    expect(effectivePlanFor({ plan: "growth", status: "past_due" })).toBe("growth");
    expect(effectivePlanFor({ plan: "growth", status: "canceled" })).toBe("free");
    expect(effectivePlanFor({ plan: "enterprise", status: "active" })).toBe("free");
    expect(effectivePlanFor(null)).toBe("free");
  });
});

describe("Stripe price mapping", () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_s_m";
    process.env.STRIPE_PRICE_GROWTH_ANNUAL = "price_g_y";
  });
  it("maps price ids both ways", () => {
    expect(stripePriceId("starter", "month")).toBe("price_s_m");
    expect(planFromPriceId("price_g_y")).toEqual({ plan: "growth", interval: "year" });
    expect(planFromPriceId("price_unknown")).toBeNull();
    expect(stripePriceId("free", "month")).toBeUndefined();
  });
});
