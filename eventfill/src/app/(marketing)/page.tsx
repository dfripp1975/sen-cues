import Link from "next/link";
import { ArrowRight, BookOpen, CalendarRange, FileSpreadsheet, LifeBuoy, LineChart, Mail, Megaphone, MonitorPlay, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Section, SectionHeading, SplitHeading } from "@/components/marketing/section";
import { PricingTable } from "@/components/marketing/pricing-table";
import { getVisitorCurrency } from "@/lib/pricing-server";
import { FAQS, INDUSTRIES } from "@/components/marketing/content";
import { DraftFragment, LinksFragment, PlannerFragment, ProductShot, ProfitFragment, RescueAlert, SalesFragment, SurveyFragment } from "@/components/marketing/fragments";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Eventbrite", "Ticket Tailor", "Humanitix", "Tito", "Skiddle", "Your own website"];

export default async function HomePage() {
  const currency = await getVisitorCurrency();
  return (
    <>
      {/* Hero: words on the left, the product on the right */}
      <section className="px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div>
            <h1 className="text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">Stop guessing. Start filling your events.</h1>
            <p className="mt-6 max-w-xl text-lg text-navy/80 sm:text-xl">EventFill helps you track ticket sales, plan promotion and act before seats go empty.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Start free</Link>
              </Button>
              <Button asChild size="lg" variant="mint">
                <Link href="/demo">Explore demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-navy/60">Free plan for one event. No card required.</p>
          </div>
          <div className="relative rounded-3xl bg-canvas p-4 sm:p-8">
            <ProductShot src="/images/product/overview.webp" alt="The EventFill dashboard for a demo organiser, showing tickets sold, revenue and events that need attention" width={2368} height={1192} priority className="shadow-lift" />
            <RescueAlert className="absolute -bottom-6 -left-2 hidden w-72 sm:block lg:-left-10" />
            <p className="mt-3 text-right text-xs text-navy/55">Demo data from a fictional organiser</p>
          </div>
        </div>
      </section>

      {/* Platforms, as plain text: no logos */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-base text-navy/70">Works alongside the booking platform you already use. Enter sales by hand or import a CSV export from</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-10 gap-y-3 text-xl font-medium text-navy/45">
            {PLATFORMS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bento of pastel feature cards */}
      <Section>
        <SplitHeading
          chip={<Chip href="/features">Platform overview</Chip>}
          title="Everything you need to fill the room"
          intro="Sales, forecasts, promotion and early warnings, in one place built for organisers."
          link={{ href: "/features", label: "See all features" }}
        />
        <div className="grid gap-5 md:grid-cols-3">
          <BentoCard href="/features#rescue" tone="bg-sky" title="Event Rescue Mode" body="Know weeks ahead when an event is slipping, and get a dated plan to respond." className="md:col-span-2">
            <ProductShot src="/images/product/rescue.webp" alt="Event Rescue Mode on a demo event, showing the sales gap and recommended actions" width={2368} height={1356} />
          </BentoCard>
          <BentoCard href="/features#forecast" tone="bg-blush" title="Sales forecasting" body="Three projections from your own sales, with the formula shown.">
            <ProductShot src="/images/product/forecast.webp" alt="A sales forecast for a demo event with conservative, expected and optimistic lines" width={2368} height={1448} />
          </BentoCard>
          <BentoCard href="/features#sales" tone="bg-lime" title="Ticket sales tracker" body="Daily sales, revenue and progress to target, by hand or by CSV.">
            <SalesFragment />
          </BentoCard>
          <BentoCard href="/features#planner" tone="bg-butter" title="Marketing planner" body="Campaigns, checklists and ready-made plans for each event type.">
            <PlannerFragment />
          </BentoCard>
          <BentoCard href="/features#links" tone="bg-lavender" title="Tracking links" body="A short link and QR code per channel, so you see what works.">
            <LinksFragment />
          </BentoCard>
        </div>
      </Section>

      {/* One big centred feature panel */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-canvas px-4 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Chip href="/demo/events/demo-1">Event Rescue Mode</Chip>
            <h2 className="mt-6 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">See trouble coming while there is still time to act</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-navy/75">EventFill compares your sales with the pace you need. When an event falls behind, it shows the gap in tickets per day and suggests practical next steps you can assign and track.</p>
          </div>
          <div className="mx-auto mt-12 max-w-5xl rounded-3xl bg-white p-3 shadow-lift sm:p-5">
            <ProductShot src="/images/product/series.webp" alt="A demo weekly class series, showing sales across each date" width={2368} height={1410} />
          </div>
          <p className="mt-4 text-center text-xs text-navy/55">Demo data from a fictional organiser</p>
        </div>
      </section>

      {/* Four steps with pastel tops */}
      <Section>
        <SplitHeading chip={<Chip href="/how-it-works" tone="lavender">How it works</Chip>} title="From first listing to full house" link={{ href: "/how-it-works", label: "Read the full guide" }} />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Target, "bg-mint", "Set your target", "Add your event, capacity, ticket tiers and how many tickets you want to sell."],
            [FileSpreadsheet, "bg-sky", "Record sales", "Enter daily sales or upload a CSV export. Every figure shows its source."],
            [Megaphone, "bg-blush", "Plan promotion", "Use ready-made plans, tracking links and AI-drafted posts."],
            [LineChart, "bg-butter", "Act early", "Forecasts and Event Rescue Mode flag slow sales and suggest what to do."],
          ].map(([Icon, tone, title, body], i) => {
            const I = Icon as React.ElementType;
            return (
              <li key={title as string} className="overflow-hidden rounded-3xl bg-white ring-1 ring-navy/8">
                <div className={cn("grid h-36 place-items-center", tone as string)}>
                  <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand-700 shadow-card">
                    <I className="size-6" aria-hidden />
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-sm font-medium text-teal-accent">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-medium">{title as string}</h3>
                  <p className="mt-2 text-navy/70">{body as string}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* More tools, as a second bento row */}
      <Section className="pt-0 sm:pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          <BentoCard href="/features#content" tone="bg-mint" title="AI Content Studio" body="Draft posts, emails and descriptions from your event details. Always editable.">
            <DraftFragment />
          </BentoCard>
          <BentoCard href="/features#profit" tone="bg-butter" title="Profit calculator" body="Income, costs, margin and the ticket count where you break even.">
            <ProfitFragment />
          </BentoCard>
          <BentoCard href="/features#surveys" tone="bg-sky" title="Audience surveys" body="Ask why people didn’t book, and collect feedback after the event.">
            <SurveyFragment />
          </BentoCard>
        </div>
      </Section>

      {/* Organisers: butter band */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-butter px-6 py-16 sm:px-12 sm:py-20">
          <SplitHeading title="Built for organisers of every kind" intro="One-off evenings, weekly classes and multi-day festivals all work the same way." link={{ href: "/how-it-works", label: "See supported event types" }} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white p-5">
                <CalendarRange className="size-5 text-brand-600" aria-hidden />
                <h3 className="mt-3 text-lg font-medium">{t}</h3>
                <p className="mt-1 text-sm text-navy/65">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Purple band: bring your sales in */}
      <Section>
        <div className="rounded-[2rem] bg-plum px-6 py-16 text-white sm:px-12 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Chip href="/help" tone="white">CSV import guide</Chip>
              <h2 className="mt-6 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">Bring your sales in from anywhere</h2>
              <p className="mt-5 max-w-lg text-lg text-white/80">Export a CSV from your booking platform and upload it, or type in each day’s sales. EventFill doesn’t sync automatically yet, so every figure shows where it came from and when it was last updated.</p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map((p) => (
                <li key={p} className="grid min-h-24 place-items-center rounded-2xl bg-white/10 p-4 text-center font-medium ring-1 ring-white/15">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="pt-0 sm:pt-0">
        <SectionHeading title="Simple plans that grow with you" intro="Start free on one event. Upgrade when you need forecasting, Event Rescue Mode or your team." center />
        <PricingTable currency={currency} />
      </Section>

      {/* Explore cards */}
      <Section className="pt-0 sm:pt-0">
        <SplitHeading title="Explore EventFill" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/demo", MonitorPlay, "bg-mint", "Try the demo", "Click around a full account filled with fictional events."],
            ["/how-it-works", BookOpen, "bg-lavender", "How it works", "A short guide from first event to final report."],
            ["/help", LifeBuoy, "bg-sky", "Help Centre", "CSV templates, forecasting formulas and setup guides."],
            ["/contact", Mail, "bg-blush", "Contact us", "Questions about plans, data or your events."],
          ].map(([href, Icon, tone, title, body]) => {
            const I = Icon as React.ElementType;
            return (
              <Link key={href as string} href={href as string} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-navy/8 transition-shadow hover:shadow-lift">
                <div className={cn("grid h-32 place-items-center", tone as string)}>
                  <I className="size-9 text-navy/80" aria-hidden />
                </div>
                <div className="p-6">
                  <h3 className="flex items-center justify-between text-xl font-medium">
                    {title as string}
                    <ArrowRight className="size-5 text-brand-600 transition-transform group-hover:translate-x-1" aria-hidden />
                  </h3>
                  <p className="mt-2 text-navy/70">{body as string}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="pt-0 sm:pt-0">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <h2 className="text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">Questions organisers ask</h2>
            <p className="mt-4 text-lg text-navy/75">
              Something else? <Link href="/contact" className="border-b-2 border-brand-600 font-medium hover:text-brand-700">Get in touch</Link>
            </p>
          </div>
          <div className="divide-y divide-navy/10 border-y border-navy/10">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-navy/75">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* Final CTA: white card on a grey panel */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-canvas p-4 sm:p-10">
          <div className="rounded-3xl bg-white px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">Your next event deserves a full room</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-navy/75">Set up your first event in a few minutes. Free plan, no card required.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Start free</Link>
              </Button>
              <Button asChild size="lg" variant="mint">
                <Link href="/demo">Explore demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function BentoCard({ href, tone, title, body, className, children }: { href: string; tone: string; title: string; body: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("group flex flex-col overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-lift sm:p-8", tone, className)}>
      <h3 className="flex items-center gap-2 text-2xl font-medium">
        {title}
        <ArrowRight className="size-5 text-brand-700 transition-transform group-hover:translate-x-1" aria-hidden />
      </h3>
      <p className="mt-2 max-w-md text-navy/75">{body}</p>
      <div className="mt-6 flex flex-1 items-end">{<div className="w-full">{children}</div>}</div>
    </Link>
  );
}
