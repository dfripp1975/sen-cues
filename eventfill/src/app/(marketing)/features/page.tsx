import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/marketing/section";
import { ShowcaseList } from "@/components/marketing/showcase";
import { FEATURE_ITEMS } from "@/components/marketing/content";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Features" };

const DETAILS: Record<string, string[]> = {
  rescue: ["Risk levels: on track, watch, behind and at risk", "Tickets per day needed to reach your target", "Recommendations based on category, description, booking link, pricing and channels", "Turn recommendations into tasks with owners and deadlines", "See sales before and after each action"],
  sales: ["Single-date, multi-day and recurring events (a series counts as one on your plan)", "Manual daily entries with tiers, revenue and refunds", "CSV import with validation and clear error messages", "Daily and weekly charts, sales velocity, tickets remaining", "Period comparisons and CSV export", "Source and freshness shown on every figure"],
  forecast: ["Average daily sales and recent 7-day velocity", "Conservative, expected and optimistic scenarios", "Shortfall against target", "Confidence indicator when history is short", "Save snapshots to compare over time"],
  planner: ["Calendar of campaign tasks and deadlines", "Campaign budgets and statuses", "Ready-made plans for 13 event types", "Facebook, Instagram, TikTok, LinkedIn, email, community and partnership channels"],
  links: ["Unique short link per channel", "UTM parameters added automatically", "QR codes for print", "Click trends by day and device type", "Clicks are reported as interest — never as ticket sales"],
  content: ["10 content types from descriptions to TikTok scripts", "Choose audience, platform, tone and objective", "Generate variations, edit, save and add to campaigns", "Monthly limits per plan keep costs predictable"],
  profit: ["Income: tickets, sponsorship, exhibitor fees, other", "Expenses across 9 categories", "Profit, margin, break-even tickets and revenue per ticket", "Mark lines as estimates and model what-if scenarios"],
  surveys: ["Templates for interest, feedback, intentions and reasons for not booking", "Shareable links and QR codes", "Anonymous responses by default", "Charts and summaries"],
  competitors: ["Save competing events' URLs, dates and published prices", "Compare descriptions and advertised benefits", "Positioning notes — all information entered by you"],
};

const IDS = ["rescue", "sales", "forecast", "planner", "links", "content", "profit", "surveys", "competitors"];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="Tools that help you sell out" intro="Everything EventFill does, in plain terms. No ticket selling, no auto-posting, no inflated claims — just practical help." />
      <Section>
        <ShowcaseList items={FEATURE_ITEMS.map((f, i) => ({ ...f, href: `#${IDS[i]}`, linkLabel: "What's included" }))} />
      </Section>
      <Section className="bg-white">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map((f, i) => (
            <div key={f.title} id={IDS[i]} className="scroll-mt-24 rounded-2xl bg-canvas p-6 ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">{f.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {DETAILS[IDS[i]].map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-accent" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex gap-3">
          <Button asChild>
            <Link href="/register">Start free</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/demo">Explore demo</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
