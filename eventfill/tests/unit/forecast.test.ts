import { describe, it, expect } from "vitest";
import { computeForecast, dailySeries, comparePeriods, expectedPace, weeklySeries } from "@/lib/forecast";
import { addDays } from "@/lib/dates";

const asOf = "2026-03-01";
const daily = (days: number, perDay: number, end = asOf) =>
  Array.from({ length: days }, (_, i) => ({ sale_date: addDays(end, -(days - 1) + i), quantity: perDay, revenue: perDay * 20 }));

describe("computeForecast", () => {
  it("calculates core metrics from steady sales", () => {
    const f = computeForecast({ sales: daily(10, 5), target: 200, eventDate: "2026-03-21", asOf });
    expect(f.ticketsSold).toBe(50);
    expect(f.grossRevenue).toBe(1000);
    expect(f.daysRemaining).toBe(20);
    expect(f.averageDailySales).toBe(5);
    expect(f.recentVelocity).toBe(5);
    expect(f.ticketsRemainingToTarget).toBe(150);
    expect(f.requiredPerDay).toBe(7.5);
    expect(f.percentOfTarget).toBe(25);
    expect(f.scenarios.expected).toBe(150);
    expect(f.scenarios.conservative).toBeLessThan(f.scenarios.expected);
    expect(f.scenarios.optimistic).toBeGreaterThan(f.scenarios.expected);
    expect(f.projectedShortfall).toBe(50);
    expect(f.confidence).toBe("medium");
  });

  it("subtracts refunds from tickets and revenue", () => {
    const f = computeForecast({
      sales: [{ sale_date: asOf, quantity: 10, revenue: 200, refunds: 2, refund_amount: 40 }],
      target: 10,
      eventDate: "2026-03-10",
      asOf,
    });
    expect(f.ticketsSold).toBe(8);
    expect(f.netRevenue).toBe(160);
    expect(f.refunds).toBe(2);
  });

  it("handles no sales history without dividing by zero", () => {
    const f = computeForecast({ sales: [], target: 100, eventDate: "2026-03-11", asOf });
    expect(f.ticketsSold).toBe(0);
    expect(f.averageDailySales).toBe(0);
    expect(f.requiredPerDay).toBe(10);
    expect(f.confidence).toBe("none");
    expect(f.notes.join(" ")).toMatch(/No sales recorded/);
  });

  it("flags low confidence with little history", () => {
    const f = computeForecast({ sales: daily(3, 4), target: 100, eventDate: "2026-04-01", asOf });
    expect(f.confidence).toBe("low");
  });

  it("ignores future-dated sales and caps projections at capacity", () => {
    const f = computeForecast({
      sales: [...daily(30, 10), { sale_date: "2026-03-05", quantity: 999, revenue: 0 }],
      target: 500,
      eventDate: "2026-04-30",
      asOf,
      capacity: 400,
    });
    expect(f.ticketsSold).toBe(300);
    expect(f.scenarios.optimistic).toBe(400);
    expect(f.confidence).toBe("high");
  });

  it("treats past events as final", () => {
    const f = computeForecast({ sales: daily(5, 2), target: 50, eventDate: "2026-02-20", asOf });
    expect(f.eventPassed).toBe(true);
    expect(f.requiredPerDay).toBeNull();
    expect(f.scenarios.expected).toBe(f.ticketsSold);
  });

  it("handles a zero target", () => {
    const f = computeForecast({ sales: daily(5, 2), target: 0, eventDate: "2026-03-20", asOf });
    expect(f.percentOfTarget).toBe(0);
    expect(f.projectedShortfall).toBe(0);
  });
});

describe("series helpers", () => {
  it("fills missing days with zeros and accumulates", () => {
    const s = dailySeries([
      { sale_date: "2026-01-01", quantity: 2, revenue: 10 },
      { sale_date: "2026-01-03", quantity: 3, revenue: 15 },
    ]);
    expect(s.map((d) => d.tickets)).toEqual([2, 0, 3]);
    expect(s[2].cumulative).toBe(5);
  });
  it("groups weekly from Monday", () => {
    const w = weeklySeries([
      { sale_date: "2026-01-05", quantity: 1, revenue: 0 }, // Monday
      { sale_date: "2026-01-11", quantity: 1, revenue: 0 }, // Sunday
      { sale_date: "2026-01-12", quantity: 1, revenue: 0 },
    ]);
    expect(w).toEqual([
      { week: "2026-01-05", tickets: 2, revenue: 0 },
      { week: "2026-01-12", tickets: 1, revenue: 0 },
    ]);
  });
  it("compares periods", () => {
    const c = comparePeriods(daily(14, 1).map((r, i) => ({ ...r, quantity: i < 7 ? 1 : 2 })), asOf, 7);
    expect(c).toMatchObject({ current: 14, previous: 7, change: 100 });
  });
  it("computes expected linear pace", () => {
    expect(expectedPace(100, "2026-01-01", "2026-01-11", "2026-01-06")).toBe(50);
    expect(expectedPace(100, "2026-01-01", "2026-01-11", "2026-02-01")).toBe(100);
  });
});
