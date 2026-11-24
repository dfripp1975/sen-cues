import { describe, it, expect } from "vitest";
import { computeForecast } from "@/lib/forecast";
import { assessRisk, generateRecommendations, type RescueEventContext } from "@/lib/rescue";
import { addDays } from "@/lib/dates";

const asOf = "2026-03-01";
const event = (over: Partial<RescueEventContext> = {}): RescueEventContext => ({
  name: "Spring Founders Mixer",
  category: "networking",
  description: "Short.",
  booking_url: "https://example.com/book",
  event_date: "2026-03-15",
  sales_start_date: "2026-02-01",
  ticket_target: 150,
  lowestPrice: 15,
  ...over,
});
const sales = (days: number, perDay: number) =>
  Array.from({ length: days }, (_, i) => ({ sale_date: addDays(asOf, -(days - 1) + i), quantity: perDay, revenue: perDay * 15 }));

describe("assessRisk", () => {
  it("flags a slow event as critical with a per-day message", () => {
    const e = event();
    const f = computeForecast({ sales: sales(29, 1), target: e.ticket_target, eventDate: e.event_date, asOf });
    const r = assessRisk(e, f, asOf);
    expect(r.level).toBe("critical");
    expect(r.message).toMatch(/You need to sell an average of 8.6 tickets per day/);
  });

  it("marks a healthy event on track and gives no recommendations", () => {
    const e = event({ ticket_target: 100 });
    const f = computeForecast({ sales: sales(29, 4), target: 100, eventDate: e.event_date, asOf });
    const r = assessRisk(e, f, asOf);
    expect(r.level).toBe("on_track");
    expect(generateRecommendations(e, f, r)).toEqual([]);
  });

  it("reports behind when slightly under pace", () => {
    const e = event({ ticket_target: 100 });
    const f = computeForecast({ sales: sales(29, 2), target: 100, eventDate: e.event_date, asOf });
    // 58 sold + ~2/day * 14 = 86 expected -> 86% of target
    expect(assessRisk(e, f, asOf).level).toBe("behind");
  });

  it("treats no sales close to the event as critical", () => {
    const e = event();
    const f = computeForecast({ sales: [], target: 150, eventDate: e.event_date, asOf });
    expect(assessRisk(e, f, asOf).level).toBe("critical");
  });

  it("is not applicable for past events or zero targets", () => {
    const past = computeForecast({ sales: [], target: 10, eventDate: "2026-02-01", asOf });
    expect(assessRisk(event(), past, asOf).level).toBe("not_applicable");
    const noTarget = computeForecast({ sales: [], target: 0, eventDate: "2026-04-01", asOf });
    expect(assessRisk(event({ ticket_target: 0 }), noTarget, asOf).level).toBe("not_applicable");
  });
});

describe("generateRecommendations", () => {
  it("personalises recommendations from event data", () => {
    const e = event({ booking_url: null });
    const f = computeForecast({ sales: sales(29, 1), target: 150, eventDate: e.event_date, asOf });
    const recs = generateRecommendations(e, f, assessRisk(e, f, asOf), [{ channel: "Email", clicks: 2, campaigns: 1 }]);
    const keys = recs.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(["headline", "description", "cta", "channels", "partnerships", "existing_audience", "underperforming", "pricing"]));
    expect(recs.find((r) => r.key === "headline")!.description).toContain("Spring Founders Mixer");
    expect(recs.find((r) => r.key === "cta")!.reason).toMatch(/No booking URL/);
    expect(recs.find((r) => r.key === "channels")!.description).toMatch(/LinkedIn/);
    expect(recs[0].priority).toBe("high");
    // due dates never land after the event
    for (const r of recs) expect(r.dueInDays).toBeLessThanOrEqual(f.daysRemaining);
  });

  it("never promises results", () => {
    const e = event();
    const f = computeForecast({ sales: sales(10, 1), target: 150, eventDate: e.event_date, asOf });
    const text = generateRecommendations(e, f, assessRisk(e, f, asOf)).map((r) => r.title + r.description + r.reason).join(" ");
    expect(text).not.toMatch(/guarantee/i);
  });
});
