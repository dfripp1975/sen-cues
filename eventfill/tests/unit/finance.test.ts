import { describe, it, expect } from "vitest";
import { computeProfit, scenarioProfit } from "@/lib/finance";

describe("computeProfit", () => {
  it("calculates profit, margin and break-even", () => {
    const s = computeProfit({
      ticketRevenue: 2000,
      ticketsSold: 100,
      income: [{ category: "sponsorship", amount: 500, is_estimate: false }],
      expenses: [
        { category: "venue", amount: 1500, is_estimate: false },
        { category: "catering", amount: 600, is_estimate: true },
      ],
    });
    expect(s.totalRevenue).toBe(2500);
    expect(s.totalExpenses).toBe(2100);
    expect(s.profit).toBe(400);
    expect(s.margin).toBe(16);
    expect(s.averageRevenuePerTicket).toBe(20);
    expect(s.breakEvenTickets).toBe(80); // (2100 - 500) / 20
    expect(s.hasEstimates).toBe(true);
    expect(s.estimatedExpenses).toBe(600);
  });
  it("uses the ticket price for break-even before any sales", () => {
    const s = computeProfit({ ticketRevenue: 0, ticketsSold: 0, income: [], expenses: [{ category: "venue", amount: 999, is_estimate: true }], averageTicketPrice: 25 });
    expect(s.breakEvenTickets).toBe(40);
    expect(s.margin).toBeNull();
  });
  it("returns null break-even when price is unknown", () => {
    expect(computeProfit({ ticketRevenue: 0, ticketsSold: 0, income: [], expenses: [] }).breakEvenTickets).toBeNull();
  });
  it("models scenarios", () => {
    expect(scenarioProfit(100, 25, 500, 2000)).toEqual({ revenue: 3000, profit: 1000 });
  });
});
