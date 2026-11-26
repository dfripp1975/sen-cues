"use client";
import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingTable({ ctaHref = "/register" }: { ctaHref?: string }) {
  const [annual, setAnnual] = React.useState(false);
  return (
    <div>
      <div className="mx-auto mb-10 flex w-fit items-center gap-1 rounded-full bg-canvas p-1" role="radiogroup" aria-label="Billing period">
        {[false, true].map((a) => (
          <button key={String(a)} role="radio" aria-checked={annual === a} onClick={() => setAnnual(a)} className={cn("rounded-full px-5 py-2 text-[0.95rem] font-medium transition-colors", annual === a ? "bg-white text-navy shadow-card" : "text-navy/65 hover:text-navy")}>
            {a ? "Annual · 2 months free" : "Monthly"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const featured = id === "growth";
          const price = annual ? Math.round(p.annualPrice / 12) : p.monthlyPrice;
          return (
            <div key={id} className={cn("relative flex flex-col rounded-3xl p-7", featured ? "bg-mint ring-2 ring-brand-600" : "bg-canvas")}>
              {featured && <span className="absolute -top-3.5 left-7 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-brand-100">Includes Event Rescue</span>}
              <h3 className="text-2xl font-medium">{p.name}</h3>
              <p className="mt-1 min-h-10 text-navy/70">{p.description}</p>
              <p className="mt-4">
                <span className="text-5xl font-medium tracking-tight">${price}</span>
                <span className="text-navy/60"> /month</span>
              </p>
              <p className="mt-1 h-5 text-sm text-navy/60">{annual && p.annualPrice > 0 ? `Billed $${p.annualPrice} yearly` : ""}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-navy/10 pt-6 text-[0.95rem]">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={featured ? "primary" : "mint"}>
                <Link href={`${ctaHref}${id === "free" ? "" : `?plan=${id}&interval=${annual ? "year" : "month"}`}`}>{id === "free" ? "Start free" : `Choose ${p.name}`}</Link>
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-navy/60">A recurring series (e.g. a weekly class) counts as one active event. Prices in US dollars. Taxes may apply depending on your location. Cancel any time from your billing settings.</p>
    </div>
  );
}
