// Premium prices, one tidy price per currency. Change prices here and in the
// matching Stripe prices (see README, "Prices and currencies").
//
// Visitors see their own currency when it is in this list. Everyone else sees
// US dollars on the page, and Stripe Adaptive Pricing can charge them in their
// own currency at checkout.

export type CurrencyCode = 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD';

export const PRICES: Record<CurrencyCode, { monthly: number; yearly: number }> = {
  GBP: { monthly: 2.99, yearly: 24 },
  USD: { monthly: 3.99, yearly: 29.99 },
  EUR: { monthly: 3.49, yearly: 27.99 },
  CAD: { monthly: 5.49, yearly: 39.99 },
  AUD: { monthly: 5.99, yearly: 44.99 },
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  GBP: 'British pounds (£)',
  USD: 'US dollars ($)',
  EUR: 'Euros (€)',
  CAD: 'Canadian dollars (CA$)',
  AUD: 'Australian dollars (A$)',
};

const EURO_REGIONS = new Set(['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'AD', 'MC', 'SM', 'VA', 'ME', 'XK']);
const REGION_CURRENCY: Record<string, CurrencyCode> = { GB: 'GBP', UK: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP', GI: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD' };

function regionFromLocale(locale: string): string | null {
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return region ?? null;
  } catch {
    const m = locale.match(/[-_]([A-Za-z]{2})\b/);
    return m ? m[1].toUpperCase() : null;
  }
}

const STORAGE_KEY = 'pricing:currency';

/** The visitor's own currency, from a saved choice, then their device region. */
export function detectCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && saved in PRICES) return saved;
  } catch { /* storage blocked */ }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz === 'Europe/London') return 'GBP';

  const locales = typeof navigator !== 'undefined' ? [...(navigator.languages || []), navigator.language].filter(Boolean) : [];
  for (const loc of locales) {
    const region = regionFromLocale(loc);
    if (!region) continue;
    if (REGION_CURRENCY[region]) return REGION_CURRENCY[region];
    if (EURO_REGIONS.has(region)) return 'EUR';
  }
  if (tz.startsWith('Australia/')) return 'AUD';
  if (tz.startsWith('Europe/')) return 'EUR';
  return 'USD';
}

export function saveCurrency(c: CurrencyCode) {
  try { localStorage.setItem(STORAGE_KEY, c); } catch { /* storage blocked */ }
}

/** "£2.99", "US$3.99" style formatting in the visitor's own locale. */
export function formatPrice(amount: number, currency: CurrencyCode): string {
  let locale = typeof navigator !== 'undefined' ? navigator.language : 'en-GB';
  // Outside the US a bare "$" is ambiguous, so show US dollars as "US$"
  if (currency === 'USD' && regionFromLocale(locale) !== 'US') locale = 'en-CA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Whole-number percentage saved by paying yearly instead of 12 months. */
export function yearlySaving(currency: CurrencyCode): number {
  const p = PRICES[currency];
  return Math.round((1 - p.yearly / (p.monthly * 12)) * 100);
}
