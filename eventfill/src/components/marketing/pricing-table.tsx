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
      <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full bg-white p-1 shadow-card ring-1 ring-slate-200" role="radiogroup" aria-label="Billing period">
        {[false, true].map((a) => (
          <button key={String(a)} role="radio" aria-checked={annual === a} onClick={() => setAnnual(a)} className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", annual === a ? "bg-navy text-white" : "text-slate-600")}>
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
            <div key={id} className={cn("relative flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200", featured && "ring-2 ring-brand-600")}>
              {featured && <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Includes Event Rescue</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-500">{p.description}</p>
              <p className="mt-4">
                <span className="font-display text-4xl font-extrabold">${price}</span>
                <span className="text-sm text-slate-500">/month</span>
              </p>
              <p className="h-5 text-xs text-slate-500">{annual && p.annualPrice > 0 ? `Billed $${p.annualPrice} yearly` : ""}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-teal-accent" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={featured ? "primary" : "secondary"}>
                <Link href={`${ctaHref}${id === "free" ? "" : `?plan=${id}&interval=${annual ? "year" : "month"}`}`}>{id === "free" ? "Start Free" : `Choose ${p.name}`}</Link>
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">A recurring series (e.g. a weekly class) counts as one active event. Prices in US dollars. Taxes may apply depending on your location. Cancel any time from your billing settings.</p>
    </div>
  );
}
