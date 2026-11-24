import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string | null | undefined, currency = "GBP", opts: { compact?: boolean } = {}) {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: opts.compact || Math.abs(n) >= 1000 ? 0 : 2,
      notation: opts.compact && Math.abs(n) >= 10000 ? "compact" : "standard",
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function formatNumber(n: number | null | undefined) {
  return new Intl.NumberFormat("en-GB").format(Number(n ?? 0));
}

export function pluralise(n: number, word: string, plural = `${word}s`) {
  return `${formatNumber(n)} ${n === 1 ? word : plural}`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} day(s) ago`;
}
