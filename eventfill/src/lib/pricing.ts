// Regional pricing: which currency a visitor sees, and what each plan costs in it.
//
// These are set prices for each currency, not exchange-rate conversions, so
// they stay round and don't drift. Change them here; Stripe must hold the same
// amounts (see README, "Charging in several currencies").
import type { PlanId } from "./plans";

export const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD", "NZD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "USD"; // for countries without their own prices
export const CURRENCY_COOKIE = "ef_currency";

export interface Region {
  currency: Currency;
  label: string; // what the picker shows
  /** Ways to pay that suit this region, shown under the prices. Card, Apple Pay
   *  and Google Pay work everywhere; the rest must be switched on in Stripe
   *  (Settings → Payment methods) before launch. */
  paymentMethods: string[];
}

export const REGIONS: Record<Currency, Region> = {
  GBP: { currency: "GBP", label: "United Kingdom (£ GBP)", paymentMethods: ["Card", "Apple Pay", "Google Pay", "Bacs Direct Debit"] },
  USD: { currency: "USD", label: "United States and other countries ($ USD)", paymentMethods: ["Card", "Apple Pay", "Google Pay", "US bank account (ACH)"] },
  EUR: { currency: "EUR", label: "Ireland and the eurozone (€ EUR)", paymentMethods: ["Card", "Apple Pay", "Google Pay", "SEPA Direct Debit"] },
  CAD: { currency: "CAD", label: "Canada (C$ CAD)", paymentMethods: ["Card", "Apple Pay", "Google Pay", "Pre-authorised debit"] },
  AUD: { currency: "AUD", label: "Australia (A$ AUD)", paymentMethods: ["Card", "Apple Pay", "Google Pay", "BECS Direct Debit"] },
  NZD: { currency: "NZD", label: "New Zealand (NZ$ NZD)", paymentMethods: ["Card", "Apple Pay", "Google Pay"] },
};

/** Monthly price per plan in each currency. Annual is ten months (two months free). */
const MONTHLY: Record<Currency, Record<Exclude<PlanId, "free">, number>> = {
  GBP: { starter: 25, growth: 65, pro: 125 },
  USD: { starter: 29, growth: 79, pro: 149 },
  EUR: { starter: 29, growth: 75, pro: 139 },
  CAD: { starter: 39, growth: 109, pro: 199 },
  AUD: { starter: 45, growth: 119, pro: 229 },
  NZD: { starter: 49, growth: 129, pro: 249 },
};

export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as readonly string[]).includes(v.toUpperCase());
}

export function toCurrency(v: unknown): Currency | null {
  return isCurrency(v) ? ((v as string).toUpperCase() as Currency) : null;
}

export function planPrice(plan: PlanId, currency: Currency, interval: "month" | "year"): number {
  if (plan === "free") return 0;
  const m = MONTHLY[currency][plan];
  return interval === "year" ? m * 10 : m;
}

/** Price per month to display; for annual billing, the yearly price spread over 12 months. */
export function displayMonthly(plan: PlanId, currency: Currency, annual: boolean): number {
  return annual ? Math.round(planPrice(plan, currency, "year") / 12) : planPrice(plan, currency, "month");
}

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-GB", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const EUROZONE = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);

export function currencyForCountry(country: string | null | undefined): Currency {
  const c = (country ?? "").trim().toUpperCase();
  if (["GB", "UK", "IM", "JE", "GG"].includes(c)) return "GBP";
  if (EUROZONE.has(c)) return "EUR";
  if (c === "CA") return "CAD";
  if (c === "AU") return "AUD";
  if (c === "NZ") return "NZD";
  return DEFAULT_CURRENCY;
}

/** Country names used by the organisation settings form, mapped to codes. */
const COUNTRY_NAMES: Record<string, string> = {
  "united kingdom": "GB", uk: "GB", england: "GB", scotland: "GB", wales: "GB", "northern ireland": "GB", "great britain": "GB",
  ireland: "IE", "united states": "US", usa: "US", canada: "CA", australia: "AU", "new zealand": "NZ",
  france: "FR", germany: "DE", spain: "ES", italy: "IT", netherlands: "NL", belgium: "BE", portugal: "PT", austria: "AT", finland: "FI",
};

export function countryCode(nameOrCode: string | null | undefined): string | null {
  const v = (nameOrCode ?? "").trim();
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  return COUNTRY_NAMES[v.toLowerCase()] ?? null;
}

/**
 * Best guess at a visitor's currency. Order: a choice they made (cookie),
 * the country their hosting provider reports from their IP address, then the
 * region in their browser language. Only affects what's displayed; they can
 * always pick another.
 */
export function detectCurrency(h: { get(name: string): string | null }, cookieValue?: string | null): Currency {
  const chosen = toCurrency(cookieValue);
  if (chosen) return chosen;
  const ipCountry = h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
  if (ipCountry && ipCountry !== "XX") return currencyForCountry(ipCountry);
  const lang = h.get("accept-language") ?? "";
  const region = /^[a-z]{2,3}-([A-Z]{2})/i.exec(lang.split(",")[0]?.trim() ?? "")?.[1];
  return currencyForCountry(region);
}
