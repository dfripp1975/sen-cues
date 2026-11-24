// Safe CSV import for ticket sales. Accepts common column names from booking
// platforms' exports, validates every row, and neutralises spreadsheet formulas
// on export.
import Papa from "papaparse";
import { isValidISODate, toISODate } from "./dates";

export const MAX_CSV_BYTES = 1_000_000; // 1 MB
export const MAX_CSV_ROWS = 5_000;

export interface ParsedSale {
  sale_date: string;
  quantity: number;
  revenue: number;
  refunds: number;
  refund_amount: number;
  tier: string | null;
}

export interface CsvResult {
  rows: ParsedSale[];
  errors: { line: number; message: string }[];
  totalRows: number;
}

const ALIASES: Record<keyof ParsedSale, string[]> = {
  sale_date: ["date", "sale_date", "order date", "order_date", "purchase date", "created", "date attending"],
  quantity: ["quantity", "qty", "tickets", "ticket quantity", "tickets sold", "count"],
  revenue: ["revenue", "amount", "total", "gross", "gross sales", "total paid", "price"],
  refunds: ["refunds", "refunded tickets", "refunded quantity"],
  refund_amount: ["refund amount", "refund_amount", "refunded amount"],
  tier: ["tier", "ticket type", "ticket_type", "ticket tier", "ticket class"],
};

function normalise(h: string) {
  return h.trim().toLowerCase().replace(/[_\s]+/g, " ");
}

function findColumn(headers: string[], key: keyof ParsedSale): string | undefined {
  const wanted = ALIASES[key].map(normalise);
  return headers.find((h) => wanted.includes(normalise(h)));
}

function parseNumber(v: unknown): number | null {
  if (v === undefined || v === null || String(v).trim() === "") return 0;
  const cleaned = String(v).replace(/[£$€,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY (UK default), or full ISO timestamps. */
export function parseDate(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return isValidISODate(s.slice(0, 10)) ? s.slice(0, 10) : null;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  }
  if (/^\d+[/.-]\d+[/.-]\d+$/.test(s)) return null; // ambiguous numeric formats
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : toISODate(new Date(t));
}

export function parseSalesCsv(text: string): CsvResult {
  if (text.length > MAX_CSV_BYTES) {
    return { rows: [], errors: [{ line: 0, message: "File is larger than 1 MB." }], totalRows: 0 };
  }
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];
  const errors: CsvResult["errors"] = [];
  const cols = {
    sale_date: findColumn(headers, "sale_date"),
    quantity: findColumn(headers, "quantity"),
    revenue: findColumn(headers, "revenue"),
    refunds: findColumn(headers, "refunds"),
    refund_amount: findColumn(headers, "refund_amount"),
    tier: findColumn(headers, "tier"),
  };
  if (!cols.sale_date) errors.push({ line: 1, message: "Missing a date column (e.g. 'date' or 'order date')." });
  if (!cols.quantity) errors.push({ line: 1, message: "Missing a quantity column (e.g. 'quantity' or 'tickets')." });
  if (errors.length) return { rows: [], errors, totalRows: parsed.data.length };
  if (parsed.data.length > MAX_CSV_ROWS) {
    return { rows: [], errors: [{ line: 0, message: `Too many rows (max ${MAX_CSV_ROWS}).` }], totalRows: parsed.data.length };
  }

  const rows: ParsedSale[] = [];
  parsed.data.forEach((r, i) => {
    const line = i + 2;
    const date = parseDate(r[cols.sale_date!]);
    const quantity = parseNumber(r[cols.quantity!]);
    const revenue = cols.revenue ? parseNumber(r[cols.revenue]) : 0;
    const refunds = cols.refunds ? parseNumber(r[cols.refunds]) : 0;
    const refundAmount = cols.refund_amount ? parseNumber(r[cols.refund_amount]) : 0;
    if (!date) return void errors.push({ line, message: "Invalid or missing date." });
    if (quantity === null || quantity < 0 || !Number.isInteger(quantity) || quantity > 100_000)
      return void errors.push({ line, message: "Quantity must be a whole number between 0 and 100,000." });
    if (revenue === null || revenue < 0 || revenue > 10_000_000) return void errors.push({ line, message: "Invalid revenue amount." });
    if (refunds === null || refunds < 0 || !Number.isInteger(refunds)) return void errors.push({ line, message: "Invalid refunds value." });
    if (refundAmount === null || refundAmount < 0) return void errors.push({ line, message: "Invalid refund amount." });
    const tier = cols.tier ? String(r[cols.tier] ?? "").trim().slice(0, 80) || null : null;
    rows.push({ sale_date: date, quantity, revenue, refunds, refund_amount: refundAmount, tier });
  });
  return { rows, errors, totalRows: parsed.data.length };
}

/** Aggregate rows by date + tier so a per-order export becomes daily totals. */
export function aggregateDaily(rows: ParsedSale[]): ParsedSale[] {
  const map = new Map<string, ParsedSale>();
  for (const r of rows) {
    const k = `${r.sale_date}|${r.tier ?? ""}`;
    const cur = map.get(k);
    if (cur) {
      cur.quantity += r.quantity;
      cur.revenue = Math.round((cur.revenue + r.revenue) * 100) / 100;
      cur.refunds += r.refunds;
      cur.refund_amount = Math.round((cur.refund_amount + r.refund_amount) * 100) / 100;
    } else map.set(k, { ...r });
  }
  return [...map.values()].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
}

/** Prevent CSV/formula injection when users open exports in a spreadsheet. */
export function csvSafeCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvSafeCell).join(","), ...rows.map((r) => r.map(csvSafeCell).join(","))].join("\n");
}
