// Small pieces of EventFill's interface, built in HTML for the marketing cards.
// Every value is a fictional example and is labelled as one.
import { AlertTriangle, Briefcase, Camera, Check, Mail, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ children, className, label = "Example" }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(26_31_46/0.06),0_8px_24px_-12px_rgb(26_31_46/0.18)] ring-1 ring-navy/5", className)}>
      {children}
      {label && <p className="mt-3 text-[11px] text-navy/45">{label}</p>}
    </div>
  );
}

export function ProductShot({ src, alt, width, height, className, priority }: { src: string; alt: string; width: number; height: number; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} className={cn("h-auto w-full rounded-xl ring-1 ring-navy/8", className)} />
  );
}

export function RescueAlert({ className }: { className?: string }) {
  return (
    <Panel className={className}>
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle className="size-4" aria-hidden /></span>
        <div>
          <p className="text-sm font-semibold">Behind sales target</p>
          <p className="mt-0.5 text-sm text-navy/70">Sell 7.4 tickets a day to reach 150.</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full w-2/5 rounded-full bg-amber-500" /></div>
      <p className="mt-1.5 flex justify-between text-xs text-navy/55"><span>61 sold</span><span>12 days to go</span></p>
    </Panel>
  );
}

export function SalesFragment() {
  const bars = [4, 6, 5, 9, 7, 11, 8, 12, 10, 14];
  return (
    <Panel>
      <p className="text-sm font-semibold">Ticket sales</p>
      <div className="mt-3 flex h-20 items-end gap-1.5" aria-hidden>
        {bars.map((b, i) => (
          <div key={i} className="flex-1 rounded-t bg-brand-600/85" style={{ height: `${b * 7}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div><dt className="text-navy/55">Sold</dt><dd className="text-base font-semibold">86</dd></div>
        <div><dt className="text-navy/55">Remaining</dt><dd className="text-base font-semibold">64</dd></div>
        <div><dt className="text-navy/55">Pace</dt><dd className="text-base font-semibold">4.1/day</dd></div>
      </dl>
    </Panel>
  );
}

export function PlannerFragment() {
  const tasks = [
    ["Speaker line-up on LinkedIn", "Mon", true],
    ["Newsletter to past attendees", "Wed", false],
    ["Send partners their links", "Fri", false],
  ] as const;
  return (
    <Panel>
      <p className="text-sm font-semibold">This week</p>
      <ul className="mt-3 space-y-2">
        {tasks.map(([t, d, done]) => (
          <li key={t} className="flex items-center gap-2.5 text-sm">
            <span className={cn("grid size-4 shrink-0 place-items-center rounded border", done ? "border-brand-600 bg-brand-600 text-white" : "border-navy/25")}>{done && <Check className="size-3" aria-hidden />}</span>
            <span className={cn("flex-1", done && "text-navy/45 line-through")}>{t}</span>
            <span className="text-xs text-navy/50">{d}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function LinksFragment() {
  const rows = [
    [Camera, "Instagram", 128],
    [Mail, "Newsletter", 64],
    [Briefcase, "LinkedIn", 41],
  ] as const;
  return (
    <Panel>
      <p className="text-sm font-semibold">Link clicks, last 30 days</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([Icon, name, n]) => (
          <li key={name} className="text-sm">
            <div className="flex items-center gap-2"><Icon className="size-3.5 text-navy/55" aria-hidden /><span className="flex-1">{name}</span><span className="font-semibold tabular-nums">{n}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-canvas"><div className="h-full rounded-full bg-plum" style={{ width: `${(n / 128) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function DraftFragment() {
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Instagram caption</p>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Friendly</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-navy/75">Thursday night, harbourside. Meet founders building in Bristol, swap notes over drinks, and leave with three new contacts. Book your place: [booking link]</p>
    </Panel>
  );
}

export function SurveyFragment() {
  const rows = [["Price", 42], ["Date or time", 31], ["Location", 18]] as const;
  return (
    <Panel>
      <p className="text-sm font-semibold">Why didn’t you book?</p>
      <ul className="mt-3 space-y-2">
        {rows.map(([l, v]) => (
          <li key={l} className="text-sm">
            <div className="flex justify-between"><span>{l}</span><span className="tabular-nums text-navy/60">{v}%</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-canvas"><div className="h-full rounded-full bg-teal-accent" style={{ width: `${v * 2}%` }} /></div>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1 text-xs text-navy/55"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> 4.6 average event rating</p>
    </Panel>
  );
}

export function ProfitFragment() {
  return (
    <Panel>
      <p className="text-sm font-semibold">Event profit</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-navy/60">Revenue</dt><dd className="font-medium tabular-nums">£3,240</dd></div>
        <div className="flex justify-between"><dt className="text-navy/60">Costs</dt><dd className="font-medium tabular-nums">£2,420</dd></div>
        <div className="flex justify-between border-t border-navy/8 pt-1.5"><dt className="font-semibold">Profit</dt><dd className="font-semibold tabular-nums text-brand-700">£820</dd></div>
      </dl>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-navy/55"><Users className="size-3.5" aria-hidden /> Break even at 121 tickets</p>
    </Panel>
  );
}
