import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/marketing/section";

export const metadata: Metadata = { title: "Help Centre" };

const TOPICS: [string, [string, React.ReactNode][]][] = [
  ["Getting started", [
    ["How do I create my first event?", "After registering and completing onboarding, go to Events → New event. Add the date, ticket target and capacity. You can add ticket tiers and prices from the event page."],
    ["What does 'active event' mean for my plan?", "Events with status Active or Draft count towards your plan's limit. A recurring series (for example a weekly class with 12 dates) counts as one. Archive or mark events as Completed to free up space. Templates don't count."],
    ["How do I set up a recurring event?", "When creating an event, choose how often it repeats (weekly, every 2 weeks or monthly) and how many dates to create. Each date gets its own sales tracking and forecast. On the series page you can add more dates or complete past ones, and when editing a date you can apply changes to all upcoming dates."],
    ["How do multi-day events work?", "Tick 'This event runs over more than one day' and set the first and last day. Sales, forecasts and Event Rescue run until the last day. Use ticket tiers for day passes and weekend passes."],
    ["Can I reuse an event setup?", "Yes. Tick 'Save as template' when creating an event, or use Duplicate on any event page."],
  ]],
  ["Ticket sales", [
    ["How do I import sales from a CSV?", <>Open an event → Sales → Import CSV. The file needs a <strong>date</strong> column and a <strong>quantity</strong> column. Optional columns: revenue/total, ticket type, refunds, refund amount. Dates can be YYYY-MM-DD or DD/MM/YYYY. Maximum 1 MB and 5,000 rows. Rows are grouped into daily totals.</>],
    ["Does EventFill connect to Eventbrite automatically?", "Not currently. Sales are entered manually or imported from CSV, and every dashboard figure shows its source and when it was last updated."],
    ["How are refunds handled?", "Record refunded tickets and amounts on the sale entry. Tickets sold and revenue are shown net of refunds."],
  ]],
  ["Forecasts and Event Rescue", [
    ["How is the forecast calculated?", "Expected = tickets sold + (60% × last-7-day daily rate + 40% × overall daily average) × days remaining. Conservative uses the slower rate × 0.75; optimistic the faster rate × 1.25. Projections are capped at capacity and labelled as estimates."],
    ["When does an event show as 'At risk'?", "When the expected projection is below 75% of your target, or the event is within 7 days and under 60% sold, or there are no sales within 30 days of the event."],
    ["Are recommendations guaranteed to work?", "No. They're practical suggestions based on your event's details. Use tracking links and your sales data to see what helps."],
  ]],
  ["Tracking links and AI", [
    ["Do link clicks mean ticket sales?", "No. Clicks show interest from each channel. EventFill never reports clicks as ticket purchases."],
    ["What data do tracking links collect?", "Time of click, a coarse device type (mobile/desktop/tablet) and the referring website's domain. No IP addresses, cookies or personal data are stored."],
    ["What counts as an AI credit?", "Each generation or variation uses one credit. Credits reset on the first day of each month (UTC)."],
  ]],
  ["Billing and account", [
    ["How do I upgrade, downgrade or cancel?", "Go to Settings → Billing. Changes are handled securely by Stripe. After cancelling, paid features remain until the end of your billing period."],
    ["How do I export or delete my data?", "Settings → Privacy lets you download your organisation's data as JSON and permanently delete your account."],
  ]],
];

export default function HelpPage() {
  return (
    <>
      <PageHero eyebrow="Help Centre" title="How can we help?" intro="Answers to common questions. Can't find what you need?" />
      <p className="-mt-4 mb-4 text-center">
        <Link href="/contact" className="link-dotted font-medium text-brand-700">Contact support ↗</Link>
      </p>
      <Section className="pt-6">
        <div className="mx-auto max-w-3xl space-y-10">
          {TOPICS.map(([topic, qs]) => (
            <div key={topic}>
              <h2 className="text-xl font-bold">{topic}</h2>
              <div className="mt-3 divide-y divide-slate-200 rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
                {qs.map(([q, a]) => (
                  <details key={q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {q}
                      <span className="text-brand-600 transition group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600">{a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
