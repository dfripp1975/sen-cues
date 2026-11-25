// Recurring event series and multi-day helpers. Pure functions (tested).
import { addDays, daysBetween, parseISODate, toISODate } from "./dates";

export const RECURRENCES = [
  ["weekly", "Every week"],
  ["fortnightly", "Every 2 weeks"],
  ["monthly", "Every month (same date)"],
] as const;
export type Recurrence = (typeof RECURRENCES)[number][0];
export const RECURRENCE_LABELS = Object.fromEntries(RECURRENCES) as Record<string, string>;
export const MAX_SERIES_DATES = 52;

/** Adds months, clamping to the last day of shorter months (31 Jan + 1 month = 28/29 Feb). */
export function addMonthsClamped(iso: string, months: number, dayOfMonth?: number): string {
  const d = parseISODate(iso);
  const day = dayOfMonth ?? d.getUTCDate();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return toISODate(new Date(Date.UTC(y, m, Math.min(day, lastDay))));
}

export interface SeriesDate {
  event_date: string;
  end_date: string | null;
  sales_start_date: string | null;
}

/**
 * Generates `count` occurrences starting at `start`. Each keeps the same length
 * (end date) and the same sales lead time as the first occurrence.
 */
export function generateSeriesDates(opts: { start: string; end?: string | null; salesStart?: string | null; recurrence: Recurrence; count: number; dayOfMonth?: number }): SeriesDate[] {
  const count = Math.max(1, Math.min(MAX_SERIES_DATES, Math.floor(opts.count)));
  const length = opts.end ? Math.max(0, daysBetween(opts.start, opts.end)) : null;
  const lead = opts.salesStart ? daysBetween(opts.salesStart, opts.start) : null;
  const startDay = opts.dayOfMonth ?? parseISODate(opts.start).getUTCDate();
  const out: SeriesDate[] = [];
  for (let i = 0; i < count; i++) {
    const date =
      opts.recurrence === "weekly" ? addDays(opts.start, i * 7) : opts.recurrence === "fortnightly" ? addDays(opts.start, i * 14) : addMonthsClamped(opts.start, i, startDay);
    out.push({
      event_date: date,
      end_date: length !== null && length > 0 ? addDays(date, length) : null,
      sales_start_date: lead !== null ? addDays(date, -lead) : null,
    });
  }
  return out;
}

/** Next occurrence after the last existing one, for "add more dates". */
export function nextOccurrence(last: string, recurrence: Recurrence, firstDayOfMonth?: number): string {
  if (recurrence === "weekly") return addDays(last, 7);
  if (recurrence === "fortnightly") return addDays(last, 14);
  return addMonthsClamped(last, 1, firstDayOfMonth);
}

export interface CountableEvent {
  id: string;
  series_id: string | null;
  status: string;
  is_template: boolean;
}

/** Active events for plan limits: a recurring series counts once. */
export function countActiveUnits(events: CountableEvent[]): number {
  const units = new Set<string>();
  for (const e of events) {
    if (e.is_template || (e.status !== "active" && e.status !== "draft")) continue;
    units.add(e.series_id ? `s:${e.series_id}` : `e:${e.id}`);
  }
  return units.size;
}

/** Sales are tracked up to the last day of a multi-day event. */
export function salesDeadline(e: { event_date: string; end_date?: string | null }): string {
  return e.end_date && e.end_date > e.event_date ? e.end_date : e.event_date;
}
