import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/site-mode";

export const metadata: Metadata = { title: "How It Works" };

const STEPS = [
  ["Create your account", "Register with your email, confirm it, and answer a few questions about your organisation, currency and timezone."],
  ["Add your event", "Enter the date, venue, capacity, ticket tiers, ticket target and marketing budget. Save recurring events as templates."],
  ["Record ticket sales", "Add daily sales by hand, or upload a CSV export from your booking platform. EventFill validates every row and shows you any problems before importing."],
  ["Plan your promotion", "Apply a ready-made plan for your event type, add campaigns and tasks, and create a tracking link and QR code for each channel."],
  ["Watch the forecast", "See average and recent sales pace, tickets needed per day and three projection scenarios — all labelled as estimates."],
  ["Act with Event Rescue Mode", "If sales fall behind, review personalised recommendations, turn them into an action plan and track what changes."],
  ["Review and learn", "After the event, record attendance and lessons learned, check profit, and generate a report to improve the next one."],
];

export default function HowItWorksPage() {
  const cta = primaryCta();
  return (
    <>
      <PageHero eyebrow="How it works" title="A clear routine for every event" intro="EventFill fits around your existing ticketing platform. Here's a typical journey." />
      <Section>
        <ol className="relative mx-auto max-w-3xl space-y-6 border-l-2 border-brand-100 pl-8">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="relative">
              <span className="absolute -left-[3.05rem] grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white ring-4 ring-canvas">{i + 1}</span>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
                <h2 className="text-lg font-bold">{t}</h2>
                <p className="mt-1 text-slate-600">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
