"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Globe } from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { CURRENCIES, CURRENCY_COOKIE, REGIONS, displayMonthly, formatPrice, planPrice, type Currency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CurrencyPicker({ value, onChange, id = "pricing-region" }: { value: Currency; onChange: (c: Currency) => void; id?: string }) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-[0.95rem] text-navy/75">
      <Globe className="size-4" aria-hidden />
      <span>Prices for</span>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const c = e.target.value as Currency;
          try {
            document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax`;
          } catch {
            /* cookies blocked: the choice still applies on this page */
          }
          onChange(c);
        }}
        className="rounded-xl border border-navy/15 bg-white py-2 pl-3 pr-8 font-medium text-navy focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {REGIONS[c].label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PricingTable({ ctaHref = "/register", currency: initialCurrency = "USD" }: { ctaHref?: string; currency?: Currency }) {
  const [annual, setAnnual] = React.useState(false);
  const [currency, setCurrency] = React.useState<Currency>(initialCurrency);
  const region = REGIONS[currency];
  return (
    <div>
      <div className="mb-10 flex flex-col items-center gap-4">
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <div className="flex w-fit items-center gap-1 rounded-full bg-canvas p-1" role="radiogroup" aria-label="Billing period">
          {[false, true].map((a) => (
            <button key={String(a)} role="radio" aria-checked={annual === a} onClick={() => setAnnual(a)} className={cn("rounded-full px-5 py-2 text-[0.95rem] font-medium transition-colors", annual === a ? "bg-white text-navy shadow-card" : "text-navy/65 hover:text-navy")}>
              {a ? "Annual · 2 months free" : "Monthly"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const featured = id === "growth";
          const yearly = planPrice(id, currency, "year");
          return (
            <div key={id} className={cn("relative flex flex-col rounded-3xl p-7", featured ? "bg-mint ring-2 ring-brand-600" : "bg-canvas")}>
              {featured && <span className="absolute -top-3.5 left-7 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-brand-100">Includes Event Rescue</span>}
              <h3 className="text-2xl font-medium">{p.name}</h3>
              <p className="mt-1 min-h-10 text-navy/70">{p.description}</p>
              <p className="mt-4">
                <span className="text-5xl font-medium tracking-tight">{formatPrice(displayMonthly(id, currency, annual), currency)}</span>
                <span className="text-navy/60"> /month</span>
              </p>
              <p className="mt-1 h-5 text-sm text-navy/60">{annual && yearly > 0 ? `Billed ${formatPrice(yearly, currency)} yearly` : ""}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-navy/10 pt-6 text-[0.95rem]">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={featured ? "primary" : "mint"}>
                <Link href={`${ctaHref}${id === "free" ? "" : `?plan=${id}&interval=${annual ? "year" : "month"}&currency=${currency}`}`}>{id === "free" ? "Start free" : `Choose ${p.name}`}</Link>
              </Button>
            </div>
          );
        })}
      </div>
      <div className="mt-8 space-y-1 text-center text-sm text-navy/60">
        <p>Pay by {region.paymentMethods.slice(0, -1).join(", ")}{region.paymentMethods.length > 1 ? " or " : ""}{region.paymentMethods.at(-1)}. Payments are handled securely by Stripe.</p>
        <p>Prices in {currency}. A recurring series (e.g. a weekly class) counts as one active event. Taxes may apply depending on your location. Cancel any time from your billing settings.</p>
      </div>
    </div>
  );
}
