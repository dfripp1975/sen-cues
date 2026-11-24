import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, CalendarCheck, CheckCircle2, FileSpreadsheet, LineChart, Megaphone, Siren, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ShowcaseList } from "@/components/marketing/showcase";
import { PricingTable } from "@/components/marketing/pricing-table";
import { FAQS, FEATURE_ITEMS, INDUSTRIES } from "@/components/marketing/content";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,#E0E7FF_0%,rgba(248,250,252,0)_70%)]" />
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-card ring-1 ring-brand-100">
              <Siren className="size-3.5" aria-hidden /> Event Rescue Mode spots slow sales early
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Stop Guessing. <span className="bg-gradient-to-r from-brand-600 to-teal-accent bg-clip-text text-transparent">Start Filling Your Events.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              EventFill helps event organisers track ticket sales, create smarter marketing campaigns and take action before empty seats turn into lost revenue.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Start Free <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/demo">Explore Demo</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Free plan available. No card required.</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      <div className="border-y border-slate-200 bg-white px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-4xl text-center text-sm text-slate-500">
          Works alongside the booking platform you already use — enter sales manually or import CSV exports from <strong className="text-slate-700">Eventbrite</strong>, <strong className="text-slate-700">Ticket Tailor</strong>, <strong className="text-slate-700">Humanitix</strong> and others.
        </p>
      </div>

      {/* Features in the reference list layout */}
      <Section>
        <SectionHeading eyebrow="Features" title="Everything you need to fill the room" intro="One place to track sales, plan promotion and act early. Here's what's inside." />
        <ShowcaseList items={FEATURE_ITEMS.slice(0, 6)} />
        <div className="mt-10">
          <Button asChild variant="secondary">
            <Link href="/features">
              See all features <ArrowRight />
            </Link>
          </Button>
        </div>
      </Section>

      {/* How it works */}
      <Section className="bg-white">
        <SectionHeading eyebrow="How it works" title="From first listing to full house" center />
        <ol className="grid gap-5 md:grid-cols-4">
          {[
            [Target, "Set your target", "Add your event, capacity, ticket tiers and the number of tickets you want to sell."],
            [FileSpreadsheet, "Record sales", "Enter daily sales or upload a CSV export. Every figure shows its source and when it was updated."],
            [Megaphone, "Plan promotion", "Use ready-made plans, tracking links and AI-drafted posts to promote across channels."],
            [LineChart, "Act early", "Forecasts and Event Rescue Mode flag slow sales and suggest what to do next."],
          ].map(([Icon, title, body], i) => {
            const I = Icon as React.ElementType;
            return (
              <li key={i} className="rounded-2xl bg-canvas p-6 ring-1 ring-slate-200">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
                  <I className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-xs font-semibold text-brand-600">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold">{title as string}</h3>
                <p className="mt-2 text-sm text-slate-600">{body as string}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* Rescue showcase */}
      <section className="bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-accent">Flagship feature</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Event Rescue Mode</h2>
            <p className="mt-4 text-lg text-slate-300">
              EventFill compares your sales with the pace needed to hit your target. When an event slips behind, you&apos;ll see exactly how far — and a practical plan to respond.
            </p>
            <ul className="mt-6 space-y-3 text-slate-200">
              {["Risk levels based on your own sales pace", "Tickets per day needed to reach your goal", "Personalised recommendations from your event details", "Assign tasks, set deadlines and track what happens next"].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-accent" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant="teal" size="lg">
              <Link href="/demo/events/demo-1">See it on a demo event</Link>
            </Button>
          </div>
          <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-950">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-5 text-amber-600" aria-hidden /> Behind sales target
              </div>
              <p className="mt-1 text-sm">Your event is currently behind its sales target. You need to sell an average of 12 tickets per day to reach your goal.</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-amber-700">Example message</p>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                ["High", "Contact your existing opted-in audience"],
                ["High", "Start a community partnership campaign"],
                ["Medium", "Strengthen your call to action"],
              ].map(([p, t]) => (
                <li key={t} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
                  <span>{t}</span>
                  <span className={p === "High" ? "rounded-full bg-red-400/20 px-2 py-0.5 text-xs text-red-200" : "rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200"}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Industries */}
      <Section>
        <SectionHeading eyebrow="Who it's for" title="Built for organisers of every kind" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
              <CalendarCheck className="size-5 text-teal-accent" aria-hidden />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section className="bg-white" id="pricing">
        <SectionHeading eyebrow="Pricing" title="Simple plans that grow with you" intro="Start free on one event. Upgrade when you need forecasting, Event Rescue Mode or your team." center />
        <PricingTable />
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHeading eyebrow="FAQ" title="Questions organisers ask" center />
        <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-brand-600 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-14 text-center text-white sm:px-12">
          <BarChart3 className="mx-auto size-10 text-brand-200" aria-hidden />
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold sm:text-4xl">Your next event deserves a full room</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Set up your first event in a few minutes. Free plan, no card required.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/register">Start Free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white ring-1 ring-white/40 hover:bg-white/10 hover:text-white">
              <Link href="/demo">Explore Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroPreview() {
  const bars = [3, 5, 4, 6, 5, 8, 7, 6, 9, 8, 10, 7, 11, 9, 12, 10, 13, 12];
  return (
    <div className="relative mx-auto mt-14 max-w-5xl animate-fade-up [animation-delay:150ms]">
      <div className="rounded-3xl bg-white/60 p-2 shadow-lift ring-1 ring-slate-200 backdrop-blur">
        <div className="overflow-hidden rounded-2xl bg-canvas ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-2.5 rounded-full bg-teal-accent" /> Spring Networking Evening
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Example data</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {[
              ["Tickets sold", "86 / 150"],
              ["Revenue", "£1,290"],
              ["Days to go", "14"],
              ["Needed per day", "4.6"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">{l}</p>
                <p className="mt-1 font-display text-xl font-bold">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500">Daily sales</p>
              <div className="mt-3 flex h-28 items-end gap-1.5" aria-hidden>
                {bars.map((b, i) => (
                  <div key={i} className="flex-1 rounded-t bg-brand-500" style={{ height: `${b * 7}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle className="size-3.5" aria-hidden /> Behind pace
              </p>
              <p className="mt-2 text-sm text-amber-900">3 rescue actions suggested</p>
              <div className="mt-3 space-y-1.5" aria-hidden>
                <div className="h-2 rounded bg-amber-200" />
                <div className="h-2 w-4/5 rounded bg-amber-200" />
                <div className="h-2 w-3/5 rounded bg-amber-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
