import { computeForecast, dailySeries, type Forecast } from "./forecast";
import { assessRisk, type RiskAssessment } from "./rescue";
import type { EventRow, SaleRecord, TierRow } from "@/types/db";
import { salesDeadline } from "./series";
import { daysBetween } from "./dates";

export interface EventSummary {
  event: EventRow;
  forecast: Forecast;
  risk: RiskAssessment;
  lowestPrice: number | null;
  lastSaleRecordedAt: string | null;
  lastSaleSource: "manual" | "csv" | null;
}

export function summariseEvent(event: EventRow, sales: SaleRecord[], tiers: TierRow[], asOf: string): EventSummary {
  const own = sales.filter((s) => s.event_id === event.id);
  const forecast = computeForecast({
    sales: own,
    target: event.ticket_target,
    eventDate: salesDeadline(event),
    asOf,
    salesStartDate: event.sales_start_date,
    capacity: event.capacity,
  });
  const prices = tiers.filter((t) => t.event_id === event.id).map((t) => Number(t.price));
  const lowestPrice = prices.length ? Math.min(...prices) : null;
  const risk = assessRisk({ ...event, event_date: salesDeadline(event), lowestPrice }, forecast, asOf);
  const latest = [...own].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return { event, forecast, risk, lowestPrice, lastSaleRecordedAt: latest?.created_at ?? null, lastSaleSource: latest?.source ?? null };
}

export function chartSeries(event: EventRow, sales: SaleRecord[], asOf: string) {
  const own = sales.filter((s) => s.event_id === event.id && s.sale_date <= asOf);
  if (!own.length) return [];
  return dailySeries(own, undefined, asOf);
}

export const RISK_TONE = {
  on_track: "success",
  watch: "brand",
  behind: "warning",
  critical: "danger",
  not_applicable: "neutral",
} as const;

export const RISK_LABEL = {
  on_track: "On track",
  watch: "Watch",
  behind: "Behind target",
  critical: "At risk",
  not_applicable: "—",
} as const;

/** "12 days to go", "Happening now", "Finished". */
export function timingLabel(event: { event_date: string; end_date?: string | null }, asOf: string): string {
  const toStart = daysBetween(asOf, event.event_date);
  if (toStart > 0) return `${toStart} day${toStart === 1 ? "" : "s"} to go`;
  if (toStart === 0) return "Today";
  return asOf <= salesDeadline(event) ? "Happening now" : "Finished";
}
