// Transparent ticket-sales forecasting. No AI involved: every number can be
// traced back to the formulas below, which are also shown to the user.
import { addDays, daysBetween, parseISODate, toISODate, weekStart } from "./dates";

export interface SaleRow {
  sale_date: string; // YYYY-MM-DD
  quantity: number;
  revenue: number;
  refunds?: number;
  refund_amount?: number;
}

export interface ForecastInput {
  sales: SaleRow[];
  target: number;
  eventDate: string;
  asOf: string; // usually today
  salesStartDate?: string | null;
  capacity?: number | null;
}

export type ForecastConfidence = "none" | "low" | "medium" | "high";

export interface Forecast {
  ticketsSold: number; // net of refunds
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  daysRemaining: number;
  daysSelling: number;
  averageDailySales: number; // since sales began
  recentVelocity: number; // last 7 days per day
  requiredPerDay: number | null; // to reach target; null if event passed
  ticketsRemainingToTarget: number;
  percentOfTarget: number;
  scenarios: { conservative: number; expected: number; optimistic: number };
  projectedShortfall: number; // vs target, expected scenario, >= 0
  confidence: ForecastConfidence;
  eventPassed: boolean;
  notes: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function netTickets(rows: SaleRow[]): number {
  return rows.reduce((s, r) => s + (r.quantity || 0) - (r.refunds || 0), 0);
}

export function computeForecast(input: ForecastInput): Forecast {
  const { sales, target, eventDate, asOf } = input;
  const notes: string[] = [];
  const past = sales.filter((s) => s.sale_date <= asOf);
  const ticketsSold = Math.max(0, netTickets(past));
  const grossRevenue = past.reduce((s, r) => s + Number(r.revenue || 0), 0);
  const refundAmount = past.reduce((s, r) => s + Number(r.refund_amount || 0), 0);
  const refunds = past.reduce((s, r) => s + (r.refunds || 0), 0);

  const daysRemaining = Math.max(0, daysBetween(asOf, eventDate));
  const eventPassed = daysBetween(asOf, eventDate) < 0;

  const firstSale = past.length ? past.map((s) => s.sale_date).sort()[0] : null;
  const start = input.salesStartDate && (!firstSale || input.salesStartDate < firstSale) ? input.salesStartDate : firstSale;
  const daysSelling = start ? Math.max(1, daysBetween(start, asOf) + 1) : 0;

  const averageDailySales = daysSelling ? ticketsSold / daysSelling : 0;
  const recentStart = addDays(asOf, -6);
  const recentWindow = Math.min(7, daysSelling || 7);
  const recentSold = netTickets(past.filter((s) => s.sale_date >= recentStart));
  const recentVelocity = daysSelling ? recentSold / recentWindow : 0;

  const ticketsRemainingToTarget = Math.max(0, target - ticketsSold);
  const requiredPerDay = eventPassed ? null : daysRemaining > 0 ? ticketsRemainingToTarget / daysRemaining : ticketsRemainingToTarget;
  const percentOfTarget = target > 0 ? Math.min(999, (ticketsSold / target) * 100) : 0;

  // Scenarios: project the remaining days at different rates.
  // Conservative: the slower of average and recent pace, reduced by 25%.
  // Expected: weighted 60% recent / 40% overall average.
  // Optimistic: the faster pace, increased by 25%.
  const slow = Math.min(averageDailySales, recentVelocity);
  const fast = Math.max(averageDailySales, recentVelocity);
  const blended = 0.6 * recentVelocity + 0.4 * averageDailySales;
  const cap = input.capacity && input.capacity > 0 ? input.capacity : Infinity;
  const project = (rate: number) => Math.min(cap, Math.round(ticketsSold + rate * daysRemaining));
  const scenarios = eventPassed
    ? { conservative: ticketsSold, expected: ticketsSold, optimistic: ticketsSold }
    : { conservative: project(slow * 0.75), expected: project(blended), optimistic: project(fast * 1.25) };

  let confidence: ForecastConfidence = "high";
  if (past.length === 0) {
    confidence = "none";
    notes.push("No sales recorded yet, so a projection isn't possible. Add your first sales to see a forecast.");
  } else if (daysSelling < 7) {
    confidence = "low";
    notes.push(`Only ${daysSelling} day(s) of sales history. Projections become more reliable after a week of data.`);
  } else if (daysSelling < 21) {
    confidence = "medium";
  }
  if (eventPassed) notes.push("This event date has passed. Figures show final recorded sales.");
  if (target <= 0) notes.push("No ticket target set. Add a target to see progress and required sales per day.");
  if (cap !== Infinity) notes.push(`Projections are capped at event capacity (${cap}).`);

  return {
    ticketsSold,
    grossRevenue,
    netRevenue: grossRevenue - refundAmount,
    refunds,
    daysRemaining,
    daysSelling,
    averageDailySales: round1(averageDailySales),
    recentVelocity: round1(recentVelocity),
    requiredPerDay: requiredPerDay === null ? null : round1(requiredPerDay),
    ticketsRemainingToTarget,
    percentOfTarget: Math.round(percentOfTarget),
    scenarios,
    projectedShortfall: Math.max(0, target - scenarios.expected),
    confidence,
    eventPassed,
    notes,
  };
}

/** Daily series (with cumulative totals) for charts, filling gaps with zero. */
export function dailySeries(sales: SaleRow[], from?: string, to?: string) {
  if (!sales.length) return [];
  const dates = sales.map((s) => s.sale_date).sort();
  const start = from ?? dates[0];
  const end = to ?? dates[dates.length - 1];
  const byDay = new Map<string, { tickets: number; revenue: number }>();
  for (const s of sales) {
    const cur = byDay.get(s.sale_date) ?? { tickets: 0, revenue: 0 };
    cur.tickets += (s.quantity || 0) - (s.refunds || 0);
    cur.revenue += Number(s.revenue || 0) - Number(s.refund_amount || 0);
    byDay.set(s.sale_date, cur);
  }
  const out: { date: string; tickets: number; revenue: number; cumulative: number }[] = [];
  let cumulative = 0;
  const total = Math.min(daysBetween(start, end), 1000);
  for (let i = 0; i <= total; i++) {
    const d = addDays(start, i);
    const v = byDay.get(d) ?? { tickets: 0, revenue: 0 };
    cumulative += v.tickets;
    out.push({ date: d, tickets: v.tickets, revenue: Math.round(v.revenue * 100) / 100, cumulative });
  }
  return out;
}

export function weeklySeries(sales: SaleRow[]) {
  const byWeek = new Map<string, { tickets: number; revenue: number }>();
  for (const s of sales) {
    const w = weekStart(s.sale_date);
    const cur = byWeek.get(w) ?? { tickets: 0, revenue: 0 };
    cur.tickets += (s.quantity || 0) - (s.refunds || 0);
    cur.revenue += Number(s.revenue || 0) - Number(s.refund_amount || 0);
    byWeek.set(w, cur);
  }
  return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, v]) => ({ week, ...v }));
}

/** Compare two equal-length periods ending at asOf. */
export function comparePeriods(sales: SaleRow[], asOf: string, days: number) {
  const curStart = addDays(asOf, -(days - 1));
  const prevStart = addDays(curStart, -days);
  const prevEnd = addDays(curStart, -1);
  const current = netTickets(sales.filter((s) => s.sale_date >= curStart && s.sale_date <= asOf));
  const previous = netTickets(sales.filter((s) => s.sale_date >= prevStart && s.sale_date <= prevEnd));
  const change = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
  return { current, previous, change, curStart, prevStart, prevEnd };
}

/** Where cumulative sales "should" be today if selling linearly toward target. */
export function expectedPace(target: number, salesStart: string, eventDate: string, asOf: string): number {
  const total = daysBetween(salesStart, eventDate);
  if (total <= 0) return target;
  const elapsed = Math.min(total, Math.max(0, daysBetween(salesStart, asOf)));
  return Math.round((target * elapsed) / total);
}

export function isoNow(): string {
  return toISODate(new Date());
}

export { parseISODate };
