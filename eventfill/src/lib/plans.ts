// Single source of truth for plans, prices and limits. Change values here to
// reconfigure pricing. Stripe price IDs come from environment variables.

export type PlanId = "free" | "starter" | "growth" | "pro";
export type Feature =
  | "forecasting"
  | "marketingPlanner"
  | "trackingLinks"
  | "rescueMode"
  | "competitorWatch"
  | "advancedReporting"
  | "teamCollaboration"
  | "surveys"
  | "aiContent";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number; // USD, display only - Stripe is the source of truth for charges
  annualPrice: number; // USD per year
  description: string;
  activeEvents: number;
  campaignTasks: number; // max open marketing tasks
  aiCreditsPerMonth: number;
  trackingLinks: number;
  teamMembers: number;
  features: Feature[];
  highlights: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Try EventFill on a single event.",
    activeEvents: 1,
    campaignTasks: 10,
    aiCreditsPerMonth: 0,
    trackingLinks: 0,
    teamMembers: 1,
    features: ["surveys"],
    highlights: ["1 active event or series", "Basic dashboard", "Manual ticket tracking", "Up to 10 campaign tasks", "Profit calculator", "No AI generation"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 290,
    description: "For organisers running a few events at a time.",
    activeEvents: 3,
    campaignTasks: 100,
    aiCreditsPerMonth: 50,
    trackingLinks: 25,
    teamMembers: 1,
    features: ["forecasting", "marketingPlanner", "trackingLinks", "surveys", "aiContent"],
    highlights: ["3 active events or series", "Sales forecasting", "Marketing planner", "Tracking links & QR codes", "50 AI credits / month"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthlyPrice: 79,
    annualPrice: 790,
    description: "Catch slow-selling events before it's too late.",
    activeEvents: 15,
    campaignTasks: 1000,
    aiCreditsPerMonth: 200,
    trackingLinks: 200,
    teamMembers: 3,
    features: ["forecasting", "marketingPlanner", "trackingLinks", "rescueMode", "competitorWatch", "advancedReporting", "surveys", "aiContent"],
    highlights: ["15 active events or series", "Event Rescue Mode", "Advanced reporting", "Competitor Watch", "200 AI credits / month"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 1490,
    description: "For agencies and teams running many events.",
    activeEvents: 50,
    campaignTasks: 10000,
    aiCreditsPerMonth: 500,
    trackingLinks: 1000,
    teamMembers: 15,
    features: ["forecasting", "marketingPlanner", "trackingLinks", "rescueMode", "competitorWatch", "advancedReporting", "teamCollaboration", "surveys", "aiContent"],
    highlights: ["50 active events or series", "Team collaboration (15 seats)", "Advanced reporting", "500 AI credits / month", "Higher usage limits", "Priority support"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "growth", "pro"];

export const FEATURE_LABELS: Record<Feature, string> = {
  forecasting: "Sales forecasting",
  marketingPlanner: "Marketing planner",
  trackingLinks: "Tracking links",
  rescueMode: "Event Rescue Mode",
  competitorWatch: "Competitor Watch",
  advancedReporting: "Advanced reporting",
  teamCollaboration: "Team collaboration",
  surveys: "Audience surveys",
  aiContent: "AI Content Studio",
};

export function planHasFeature(plan: PlanId, feature: Feature): boolean {
  return PLANS[plan].features.includes(feature);
}

/** Cheapest plan that includes a feature, for upgrade prompts. */
export function minimumPlanFor(feature: Feature): Plan {
  return PLANS[PLAN_ORDER.find((p) => planHasFeature(p, feature)) ?? "pro"];
}

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && (PLAN_ORDER as string[]).includes(v);
}

/** Stripe price ID for a plan/interval, from env. */
export function stripePriceId(plan: PlanId, interval: "month" | "year"): string | undefined {
  if (plan === "free") return undefined;
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "ANNUAL"}`;
  return process.env[key] || undefined;
}

/** Reverse lookup used by the Stripe webhook. */
export function planFromPriceId(priceId: string | null | undefined): { plan: PlanId; interval: "month" | "year" } | null {
  if (!priceId) return null;
  for (const plan of PLAN_ORDER) {
    for (const interval of ["month", "year"] as const) {
      if (stripePriceId(plan, interval) === priceId) return { plan, interval };
    }
  }
  return null;
}
