import { afterEach, describe, expect, it, vi } from "vitest";
import { CURRENCIES, REGIONS, countryCode, currencyForCountry, detectCurrency, displayMonthly, formatPrice, planPrice } from "@/lib/pricing";
import { PLAN_ORDER, planFromPriceId, stripePriceId, hasOwnCurrencyPrice } from "@/lib/plans";

const headers = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null });

describe("regional pricing", () => {
  it("maps countries to currencies, with USD for everywhere else", () => {
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("ie")).toBe("EUR");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("CA")).toBe("CAD");
    expect(currencyForCountry("AU")).toBe("AUD");
    expect(currencyForCountry("NZ")).toBe("NZD");
    expect(currencyForCountry("ZA")).toBe("USD");
    expect(currencyForCountry(null)).toBe("USD");
  });

  it("reads country names from organisation settings", () => {
    expect(countryCode("United Kingdom")).toBe("GB");
    expect(countryCode("Scotland")).toBe("GB");
    expect(countryCode("gb")).toBe("GB");
    expect(countryCode("Other")).toBeNull();
  });

  it("prefers a saved choice, then the IP country, then the browser language", () => {
    expect(detectCurrency(headers({ "x-vercel-ip-country": "GB" }), "AUD")).toBe("AUD");
    expect(detectCurrency(headers({ "x-vercel-ip-country": "GB", "accept-language": "en-US" }))).toBe("GBP");
    expect(detectCurrency(headers({ "cf-ipcountry": "FR" }))).toBe("EUR");
    expect(detectCurrency(headers({ "accept-language": "en-GB,en;q=0.9" }))).toBe("GBP");
    expect(detectCurrency(headers({ "accept-language": "en" }))).toBe("USD");
    expect(detectCurrency(headers({ "cf-ipcountry": "XX", "accept-language": "en-NZ" }))).toBe("NZD");
    expect(detectCurrency(headers({}), "nonsense")).toBe("USD");
  });

  it("has a price for every paid plan in every currency, annual = ten months", () => {
    for (const c of CURRENCIES) {
      expect(REGIONS[c].paymentMethods).toContain("Card");
      for (const p of PLAN_ORDER) {
        if (p === "free") {
          expect(planPrice(p, c, "month")).toBe(0);
          continue;
        }
        expect(planPrice(p, c, "month")).toBeGreaterThan(0);
        expect(planPrice(p, c, "year")).toBe(planPrice(p, c, "month") * 10);
      }
    }
    expect(planPrice("starter", "GBP", "month")).toBe(25);
    expect(planPrice("starter", "USD", "year")).toBe(290); // matches the US list price
    expect(displayMonthly("growth", "GBP", true)).toBe(Math.round(650 / 12));
  });

  it("formats whole amounts with the right symbol", () => {
    expect(formatPrice(25, "GBP")).toBe("£25");
    expect(formatPrice(290, "USD")).toBe("$290");
    expect(formatPrice(1390, "EUR")).toBe("€1,390");
    expect(formatPrice(39, "CAD")).toMatch(/^CA\$39$|^\$39$/);
  });
});

describe("Stripe prices per currency", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses a currency's own price when set, else the shared price", () => {
    vi.stubEnv("STRIPE_PRICE_STARTER_MONTHLY", "price_shared");
    vi.stubEnv("STRIPE_PRICE_STARTER_MONTHLY_GBP", "price_gbp");
    expect(stripePriceId("starter", "month", "GBP")).toBe("price_gbp");
    expect(stripePriceId("starter", "month", "EUR")).toBe("price_shared");
    expect(stripePriceId("starter", "month")).toBe("price_shared");
    expect(hasOwnCurrencyPrice("starter", "month", "gbp")).toBe(true);
    expect(hasOwnCurrencyPrice("starter", "month", "EUR")).toBe(false);
  });

  it("maps either kind of price back to its plan for the webhook", () => {
    vi.stubEnv("STRIPE_PRICE_GROWTH_ANNUAL", "price_growth_year");
    vi.stubEnv("STRIPE_PRICE_GROWTH_ANNUAL_AUD", "price_growth_year_aud");
    expect(planFromPriceId("price_growth_year")).toEqual({ plan: "growth", interval: "year" });
    expect(planFromPriceId("price_growth_year_aud")).toEqual({ plan: "growth", interval: "year" });
    expect(planFromPriceId("price_unknown")).toBeNull();
  });
});
