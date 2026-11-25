// Event Rescue Mode: detects events at risk of missing their ticket target and
// produces practical, personalised recommendations. Rules-based and transparent;
// recommendations are suggestions, never guarantees of results.
import type { Forecast } from "./forecast";
import { expectedPace } from "./forecast";

export type RiskLevel = "on_track" | "watch" | "behind" | "critical" | "not_applicable";

export interface RescueEventContext {
  name: string;
  category: string;
  description?: string | null;
  booking_url?: string | null;
  event_date: string;
  sales_start_date?: string | null;
  created_at?: string | null;
  ticket_target: number;
  marketing_budget?: number | null;
  is_online?: boolean;
  lowestPrice?: number | null;
}

export interface ChannelStat {
  channel: string;
  clicks: number;
  campaigns: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  headline: string;
  message: string;
  expectedByNow: number;
  gapToPace: number;
}

export interface Recommendation {
  key: string;
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  dueInDays: number;
}

export function assessRisk(event: RescueEventContext, f: Forecast, asOf: string): RiskAssessment {
  if (f.eventPassed) {
    return { level: "not_applicable", headline: "Event finished", message: "This event has already taken place.", expectedByNow: 0, gapToPace: 0 };
  }
  if (event.ticket_target <= 0) {
    return { level: "not_applicable", headline: "No target set", message: "Set a ticket target to enable Event Rescue Mode.", expectedByNow: 0, gapToPace: 0 };
  }
  const start = event.sales_start_date ?? (event.created_at ? event.created_at.slice(0, 10) : asOf);
  const expectedByNow = expectedPace(event.ticket_target, start < asOf ? start : asOf, event.event_date, asOf);
  const gapToPace = Math.max(0, expectedByNow - f.ticketsSold);
  const perDay = f.requiredPerDay ?? 0;
  const perDayText = `You need to sell an average of ${formatRate(perDay)} tickets per day to reach your goal.`;

  if (f.ticketsSold >= event.ticket_target) {
    return { level: "on_track", headline: "Target reached", message: "You've reached your ticket target. Consider whether capacity allows a stretch goal.", expectedByNow, gapToPace: 0 };
  }

  const expectedRatio = f.scenarios.expected / event.ticket_target;
  const paceRatio = expectedByNow > 0 ? f.ticketsSold / expectedByNow : 1;

  if (f.confidence === "none") {
    if (f.daysRemaining <= 30) {
      return { level: "critical", headline: "No sales recorded", message: `No ticket sales have been recorded and the event is ${f.daysRemaining} day(s) away. ${perDayText}`, expectedByNow, gapToPace };
    }
    return { level: "watch", headline: "Waiting for sales data", message: "Record your first ticket sales so EventFill can track your pace.", expectedByNow, gapToPace };
  }

  if (expectedRatio < 0.75 || (f.daysRemaining <= 7 && f.percentOfTarget < 60)) {
    return { level: "critical", headline: "Significantly behind target", message: `Your event is significantly behind its sales target. At the current pace you may sell around ${f.scenarios.expected} of ${event.ticket_target} tickets. ${perDayText}`, expectedByNow, gapToPace };
  }
  if (expectedRatio < 0.95 || paceRatio < 0.85) {
    return { level: "behind", headline: "Behind sales target", message: `Your event is currently behind its sales target. ${perDayText}`, expectedByNow, gapToPace };
  }
  if (expectedRatio < 1.05) {
    return { level: "watch", headline: "On the edge", message: `Your event is roughly on pace, with little margin. ${perDayText}`, expectedByNow, gapToPace };
  }
  return { level: "on_track", headline: "On track", message: "Sales are on pace to reach your target based on recorded data.", expectedByNow, gapToPace };
}

function formatRate(n: number): string {
  return n >= 10 ? String(Math.ceil(n)) : String(Math.ceil(n * 10) / 10);
}

const CATEGORY_CHANNELS: Record<string, string[]> = {
  networking: ["LinkedIn", "local business groups and chambers of commerce", "Meetup"],
  workshop: ["LinkedIn", "relevant professional communities", "email to past attendees"],
  conference: ["LinkedIn", "industry newsletters", "speaker and sponsor networks"],
  music: ["Instagram", "TikTok", "local listings and venue mailing lists"],
  charity: ["Facebook", "community groups", "partner charities and local press"],
  exhibition: ["Instagram", "trade associations", "exhibitor networks"],
  community: ["Facebook community groups", "Nextdoor-style neighbourhood groups", "local libraries and noticeboards"],
  sport: ["local clubs and leagues", "Instagram", "Strava or running/cycling groups"],
  performing_arts: ["Instagram", "local what's-on listings", "the venue's own mailing list"],
  food_drink: ["Instagram", "local food bloggers and listings", "partner restaurants, bars or producers"],
  festival: ["Instagram", "TikTok", "local and regional what's-on listings"],
  class: ["Instagram", "local community groups", "email to past learners"],
  tour: ["TripAdvisor-style review and listing sites", "Instagram", "local hotels and visitor centres"],
  other: ["your strongest existing social channel", "community groups", "email to opted-in contacts"],
};

export function generateRecommendations(
  event: RescueEventContext,
  f: Forecast,
  risk: RiskAssessment,
  channels: ChannelStat[] = [],
): Recommendation[] {
  if (risk.level === "not_applicable" || risk.level === "on_track") return [];
  const recs: Recommendation[] = [];
  const urgent = f.daysRemaining <= 14;
  const due = (normal: number) => Math.max(0, Math.min(normal, Math.floor(f.daysRemaining / 2)));
  const cat = CATEGORY_CHANNELS[event.category] ? event.category : "other";
  const descLen = (event.description ?? "").trim().length;

  recs.push({
    key: "headline",
    title: "Sharpen your event headline",
    description: `Rewrite "${event.name}" so it states the main benefit for attendees in under 10 words. Test two versions across your channels and keep the one with more link clicks.`,
    reason: "A clear headline is often the first thing people see in listings and social feeds.",
    priority: risk.level === "critical" ? "high" : "medium",
    dueInDays: due(2),
  });

  if (descLen < 300) {
    recs.push({
      key: "description",
      title: "Expand the event description",
      description: "Add who the event is for, what attendees will gain, the agenda or line-up, and practical details (accessibility, refreshments, parking or joining links).",
      reason: descLen === 0 ? "No description is saved for this event." : `The saved description is short (${descLen} characters).`,
      priority: "high",
      dueInDays: due(2),
    });
  } else {
    recs.push({
      key: "description",
      title: "Review the event description",
      description: "Move the strongest benefit into the first two sentences and end with a single, clear call to action.",
      reason: "Many readers only see the first lines of a listing before deciding.",
      priority: "low",
      dueInDays: due(4),
    });
  }

  if (!event.booking_url) {
    recs.push({
      key: "cta",
      title: "Add a booking link everywhere",
      description: "Save the booking URL to this event, then create a tracking link for each channel so every post has a clear 'Book now' call to action.",
      reason: "No booking URL is saved for this event.",
      priority: "high",
      dueInDays: 1,
    });
  } else {
    recs.push({
      key: "cta",
      title: "Strengthen your call to action",
      description: "Use one specific call to action per post (for example 'Book your place by Friday') and link straight to the booking page with a tracking link.",
      reason: "Specific, time-bound calls to action are easier to act on.",
      priority: "medium",
      dueInDays: due(3),
    });
  }

  const used = new Set(channels.map((c) => c.channel.toLowerCase()));
  const suggested = CATEGORY_CHANNELS[cat].filter((c) => !used.has(c.toLowerCase()));
  recs.push({
    key: "channels",
    title: "Try additional promotional channels",
    description: `For ${cat === "other" ? "this kind of" : cat} events, consider: ${suggested.slice(0, 3).join(", ")}.`,
    reason: channels.length ? `You're currently tracking ${channels.length} channel(s).` : "No campaigns or tracking links are recorded for this event yet.",
    priority: channels.length < 2 ? "high" : "medium",
    dueInDays: due(3),
  });

  recs.push({
    key: "social_posts",
    title: "Schedule a run of promotional posts",
    description: urgent
      ? `Plan a short burst: one post every 1–2 days until the event (${f.daysRemaining} day(s) left), each with a different angle (speaker, venue, benefit, last places).`
      : "Plan a weekly rhythm of posts with different angles: announcement, behind the scenes, speaker or act spotlight, benefits, and a final reminder.",
    reason: `${f.ticketsRemainingToTarget} ticket(s) still needed to reach the target.`,
    priority: "medium",
    dueInDays: due(2),
  });

  const weak = channels.filter((c) => c.campaigns > 0 && c.clicks < 5);
  if (weak.length) {
    recs.push({
      key: "underperforming",
      title: "Review underperforming channels",
      description: `These channels have very few recorded link clicks: ${weak.map((w) => w.channel).join(", ")}. Consider changing the message, the posting time, or moving effort to stronger channels.`,
      reason: "Based on tracking link clicks (clicks are interest, not confirmed ticket sales).",
      priority: "medium",
      dueInDays: due(3),
    });
  }

  if (event.lowestPrice != null && event.lowestPrice > 0) {
    recs.push({
      key: "pricing",
      title: "Review ticket pricing and options",
      description: "Check whether your price is clear and comparable with similar events. Options include a limited early-bird or group tier, or a bundle. Only advertise genuine availability and deadlines.",
      reason: `Your lowest saved ticket price is ${event.lowestPrice.toFixed(2)}.`,
      priority: risk.level === "critical" ? "medium" : "low",
      dueInDays: due(4),
    });
  }

  recs.push({
    key: "promotion",
    title: "Offer a genuine limited-time promotion",
    description: "If it suits your event, offer a real time-limited incentive, such as a bring-a-friend discount or group rate, and state the true end date clearly.",
    reason: "Real deadlines can help people who are interested but undecided.",
    priority: "low",
    dueInDays: due(5),
  });

  recs.push({
    key: "partnerships",
    title: "Start a community partnership campaign",
    description: "Ask two or three relevant organisations (local businesses, associations, speakers, performers or sponsors) to share the event with their audiences, giving each their own tracking link.",
    reason: "Partners can reach audiences you don't currently reach.",
    priority: risk.level === "critical" ? "high" : "medium",
    dueInDays: due(4),
  });

  recs.push({
    key: "existing_audience",
    title: "Contact your existing opted-in audience",
    description: "Email past attendees and subscribers who have agreed to hear from you. Make it personal and include a single booking link.",
    reason: "People who have attended before are often the most likely to book again.",
    priority: "high",
    dueInDays: due(2),
  });

  recs.push({
    key: "schedule",
    title: "Update your marketing schedule",
    description: `Map remaining activity onto the ${f.daysRemaining} day(s) left and set deadlines for each task in the marketing planner.`,
    reason: "A dated plan makes it easier to see what's been done and what's slipping.",
    priority: "medium",
    dueInDays: 1,
  });

  const weight = { high: 0, medium: 1, low: 2 } as const;
  return recs.sort((a, b) => weight[a.priority] - weight[b.priority]);
}
