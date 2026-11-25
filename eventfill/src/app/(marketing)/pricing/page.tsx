import type { Metadata } from "next";
import { PageHero, Section } from "@/components/marketing/section";
import { PricingTable } from "@/components/marketing/pricing-table";
import { PLANS, PLAN_ORDER, FEATURE_LABELS, planHasFeature, type Feature } from "@/lib/plans";
import { Check, Minus } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  const features = Object.keys(FEATURE_LABELS) as Feature[];
  return (
    <>
      <PageHero eyebrow="Pricing" title="Plans for every size of event" intro="Start free. Upgrade, downgrade or cancel at any time." />
      <Section className="pt-6 sm:pt-8">
        <PricingTable />
        <div className="mt-16 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Plan comparison</caption>
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3">Compare plans</th>
                {PLAN_ORDER.map((p) => (
                  <th key={p} className="px-5 py-3 text-center">{PLANS[p].name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["Active events (a recurring series counts as one)", (p: (typeof PLANS)["free"]) => p.activeEvents],
                ["Open campaign tasks", (p: (typeof PLANS)["free"]) => p.campaignTasks.toLocaleString()],
                ["AI credits / month", (p: (typeof PLANS)["free"]) => p.aiCreditsPerMonth],
                ["Tracking links", (p: (typeof PLANS)["free"]) => p.trackingLinks || "—"],
                ["Team seats", (p: (typeof PLANS)["free"]) => p.teamMembers],
              ].map(([label, fn]) => (
                <tr key={label as string}>
                  <td className="px-5 py-3 font-medium">{label as string}</td>
                  {PLAN_ORDER.map((p) => (
                    <td key={p} className="px-5 py-3 text-center">{(fn as (x: (typeof PLANS)["free"]) => React.ReactNode)(PLANS[p])}</td>
                  ))}
                </tr>
              ))}
              {features.map((f) => (
                <tr key={f}>
                  <td className="px-5 py-3 font-medium">{FEATURE_LABELS[f]}</td>
                  {PLAN_ORDER.map((p) => (
                    <td key={p} className="px-5 py-3 text-center">
                      {planHasFeature(p, f) ? <Check className="mx-auto size-4 text-teal-accent" aria-label="Included" /> : <Minus className="mx-auto size-4 text-slate-300" aria-label="Not included" />}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3 font-medium">Ticket tracking, dashboard, profit calculator</td>
                {PLAN_ORDER.map((p) => (
                  <td key={p} className="px-5 py-3 text-center"><Check className="mx-auto size-4 text-teal-accent" aria-label="Included" /></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
