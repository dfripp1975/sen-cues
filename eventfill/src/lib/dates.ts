// Date helpers that work on plain YYYY-MM-DD strings in UTC to avoid timezone drift.

const DAY = 86_400_000;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function today(): string {
  return toISODate(new Date());
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / DAY);
}

export function addDays(s: string, n: number): string {
  return toISODate(new Date(parseISODate(s).getTime() + n * DAY));
}

export function isValidISODate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

export function formatDate(s: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!s) return "—";
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(parseISODate(s));
}

/** ISO week start (Monday) for grouping. */
export function weekStart(s: string): string {
  const d = parseISODate(s);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(s, -dow);
}
