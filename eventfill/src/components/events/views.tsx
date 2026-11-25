import Link from "next/link";
import { AlertTriangle, CalendarClock, Gauge, PoundSterling, Ticket, Download, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, StatCard, Table, UpgradeNotice } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarsChart, SalesChart, TrendChart } from "@/components/charts/charts";
import { RISK_LABEL, RISK_TONE, type EventSummary } from "@/lib/event-summary";
import { comparePeriods, dailySeries, weeklySeries } from "@/lib/forecast";
import { formatDate, formatDateRange } from "@/lib/dates";
import { formatMoney, formatNumber, timeAgo } from "@/lib/utils";
import type { SaleRecord, TierRow } from "@/types/db";

export function FreshnessNote({ summary, isDemo }: { summary: EventSummary; isDemo?: boolean }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <Info className="size-3.5" aria-hidden />
      {isDemo ? "Fictional demonstration data." : `Sales source: ${summary.lastSaleSource === "csv" ? "CSV import" : summary.lastSaleSource === "manual" ? "manual entry" : "no sales recorded yet"}. Last updated ${timeAgo(summary.lastSaleRecordedAt)}. Not synced automatically with your ticketing platform.`}
    </p>
  );
}

export function KeyStats({ s, currency }: { s: EventSummary; currency: string }) {
  const f = s.forecast;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Tickets sold" value={`${formatNumber(f.ticketsSold)} / ${formatNumber(s.event.ticket_target)}`} sub={`${f.percentOfTarget}% of target${s.event.capacity ? ` · capacity ${formatNumber(s.event.capacity)}` : ""}`} icon={Ticket} />
      <StatCard label="Ticket revenue" value={formatMoney(f.netRevenue, currency)} sub={f.refunds ? `${f.refunds} ticket(s) refunded` : "Net of refunds"} icon={PoundSterling} tone="emerald" />
      <StatCard label={f.eventPassed ? "Event date" : s.event.end_date ? "Days until last day" : "Days until event"} value={f.eventPassed ? "Finished" : f.daysRemaining} sub={formatDateRange(s.event.event_date, s.event.end_date)} icon={CalendarClock} tone="amber" />
      <StatCard label="Needed per day" value={f.requiredPerDay ?? "—"} sub={f.eventPassed ? "Event finished" : `Current pace: ${f.recentVelocity}/day (last 7 days)`} icon={Gauge} tone="teal" />
    </div>
  );
}

export function RiskBanner({ s, base }: { s: EventSummary; base: string }) {
  if (s.risk.level !== "behind" && s.risk.level !== "critical") return null;
  return (
    <Alert tone={s.risk.level === "critical" ? "danger" : "warning"} title={s.risk.headline} action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/events/${s.event.id}/rescue`}>Open Event Rescue</Link></Button>}>
      {s.risk.message}
    </Alert>
  );
}

export function EventOverviewView({ s, sales, tiers, currency, base, isDemo, tierForm, tierAction, imageForm, outcomeForm }: { s: EventSummary; sales: SaleRecord[]; tiers: TierRow[]; currency: string; base: string; isDemo?: boolean; tierForm?: React.ReactNode; tierAction?: (id: string) => React.ReactNode; imageForm?: React.ReactNode; outcomeForm?: React.ReactNode }) {
  const e = s.event;
  const series = dailySeries(sales.filter((x) => x.sale_date <= (s.forecast.eventPassed ? e.end_date ?? e.event_date : new Date().toISOString().slice(0, 10))));
  return (
    <div className="space-y-6">
      <RiskBanner s={s} base={base} />
      <KeyStats s={s} currency={currency} />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sales progress</CardTitle>
            <CardDescription>Daily tickets (bars) and running total (line) against your target</CardDescription>
          </div>
          {isDemo ? <DemoBadge /> : <Badge tone={RISK_TONE[s.risk.level]}>{s.forecast.eventPassed ? "Finished" : RISK_LABEL[s.risk.level]}</Badge>}
        </CardHeader>
        <CardContent>
          <SalesChart data={series} target={e.ticket_target} />
          <div className="mt-3"><FreshnessNote summary={s} isDemo={isDemo} /></div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ticket tiers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {tiers.length ? (
              <ul className="divide-y divide-slate-100">
                {tiers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="flex items-center gap-3 text-slate-600">
                      {formatMoney(t.price, currency)}{t.quantity != null && <span className="text-xs text-slate-400">× {t.quantity}</span>}
                      {tierAction?.(t.id)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No ticket tiers yet. Add tiers to record sales by ticket type.</p>
            )}
            {tierForm}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Event details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ["Dates", formatDateRange(e.event_date, e.end_date)],
                ["Ticket target", formatNumber(e.ticket_target)],
                ["Capacity", e.capacity != null ? formatNumber(e.capacity) : "—"],
                ["Marketing budget", formatMoney(e.marketing_budget, currency)],
                ["Ticketing platform", e.ticketing_platform ?? "—"],
                ["Sales started", formatDate(e.sales_start_date)],
                ["Times", e.start_time ? `${e.start_time.slice(0, 5)}${e.end_time ? `–${e.end_time.slice(0, 5)}` : ""} (${e.timezone})` : "—"],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            {e.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{e.description}</p>}
            {e.notes && <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-slate-600"><strong>Notes:</strong> {e.notes}</p>}
            {imageForm && <div className="mt-5 border-t border-slate-100 pt-4">{imageForm}</div>}
          </CardContent>
        </Card>
      </div>
      {s.forecast.eventPassed && (
        <Card>
          <CardHeader><div><CardTitle>Event outcome</CardTitle><CardDescription>Record what actually happened for your report.</CardDescription></div></CardHeader>
          <CardContent>
            {outcomeForm ?? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Attendance</dt><dd className="font-medium">{e.attendance ?? "Not recorded"}</dd></div>
                <div><dt className="text-slate-500">Lessons learned</dt><dd className="font-medium">{e.lessons_learned ?? "—"}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SalesView({ s, sales, tiers, currency, asOf, isDemo, saleForm, csvForm, rowAction, exportHref }: { s: EventSummary; sales: SaleRecord[]; tiers: TierRow[]; currency: string; asOf: string; isDemo?: boolean; saleForm?: React.ReactNode; csvForm?: React.ReactNode; rowAction?: (id: string) => React.ReactNode; exportHref?: string }) {
  const f = s.forecast;
  const cmp = comparePeriods(sales, asOf, 7);
  const weekly = weeklySeries(sales.filter((x) => x.sale_date <= asOf)).map((w) => ({ label: formatDate(w.week, { day: "numeric", month: "short" }), value: w.tickets }));
  const daily = dailySeries(sales.filter((x) => x.sale_date <= asOf));
  const tierName = (id: string | null) => tiers.find((t) => t.id === id)?.name ?? "—";
  const remainingCapacity = s.event.capacity != null ? Math.max(0, s.event.capacity - f.ticketsSold) : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tickets remaining to target" value={formatNumber(f.ticketsRemainingToTarget)} sub={remainingCapacity != null ? `${formatNumber(remainingCapacity)} left before capacity` : undefined} icon={Ticket} />
        <StatCard label="Sales velocity" value={`${f.recentVelocity}/day`} sub={`Average since launch: ${f.averageDailySales}/day`} icon={TrendingUp} tone="teal" />
        <StatCard label="Last 7 days" value={formatNumber(cmp.current)} sub={`${cmp.change >= 0 ? "+" : ""}${cmp.change}% vs previous 7 days (${cmp.previous})`} icon={Gauge} tone="amber" />
        <StatCard label="Net revenue" value={formatMoney(f.netRevenue, currency)} sub={`Gross ${formatMoney(f.grossRevenue, currency)}`} icon={PoundSterling} tone="emerald" />
      </div>
      {(saleForm || csvForm) && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card><CardHeader><div><CardTitle>Record sales</CardTitle><CardDescription>Enter totals for a day. You can add several entries per day (e.g. one per tier).</CardDescription></div></CardHeader><CardContent>{saleForm}</CardContent></Card>
          <Card><CardHeader><div><CardTitle>Import from CSV</CardTitle><CardDescription>Upload an export from your booking platform.</CardDescription></div></CardHeader><CardContent>{csvForm}</CardContent></Card>
        </div>
      )}
      {isDemo && <Alert tone="info">This is a read-only demo. <Link href="/register" className="font-semibold underline">Create a free account</Link> to record your own sales.</Alert>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Daily sales</CardTitle></CardHeader><CardContent><SalesChart data={daily} target={s.event.ticket_target} height={240} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Weekly sales</CardTitle></CardHeader><CardContent><BarsChart data={weekly} height={240} name="Tickets" /></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader><CardContent><TrendChart data={daily} dataKey="revenue" name="Net revenue" color="#10B981" /></CardContent></Card>
      <Card>
        <CardHeader>
          <div><CardTitle>Sales history</CardTitle><CardDescription>{sales.length} entr{sales.length === 1 ? "y" : "ies"}</CardDescription></div>
          {exportHref && <Button asChild variant="secondary" size="sm"><a href={exportHref}><Download /> Export CSV</a></Button>}
        </CardHeader>
        <CardContent className="pt-3">
          {sales.length ? (
            <Table>
              <thead><tr><th>Date</th><th>Tier</th><th>Tickets</th><th>Revenue</th><th>Refunds</th><th>Source</th>{rowAction && <th><span className="sr-only">Actions</span></th>}</tr></thead>
              <tbody>
                {[...sales].reverse().slice(0, 200).map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{formatDate(r.sale_date)}</td>
                    <td>{r.tier_id ? tierName(r.tier_id) : r.note?.startsWith("Tier: ") ? r.note.slice(6) : "—"}</td>
                    <td className="font-medium">{r.quantity}</td>
                    <td>{formatMoney(r.revenue, currency)}</td>
                    <td>{r.refunds ? `${r.refunds} (${formatMoney(r.refund_amount, currency)})` : "—"}</td>
                    <td><Badge tone={r.source === "csv" ? "teal" : "neutral"}>{r.source === "csv" ? "CSV" : "Manual"}</Badge></td>
                    {rowAction && <td className="text-right">{rowAction(r.id)}</td>}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No sales recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ForecastView({ s, sales, asOf, allowed, isDemo, snapshots = [], snapshotButton }: { s: EventSummary; sales: SaleRecord[]; asOf: string; allowed: boolean; isDemo?: boolean; snapshots?: { created_at: string; conservative: number; expected: number; optimistic: number }[]; snapshotButton?: React.ReactNode }) {
  if (!allowed) return <UpgradeNotice feature="Sales forecasting" plan="Starter" />;
  const f = s.forecast;
  const target = s.event.ticket_target;
  const scen = [
    ["Conservative", f.scenarios.conservative, "bg-amber-50 text-amber-900 ring-amber-200"],
    ["Expected", f.scenarios.expected, "bg-brand-50 text-brand-900 ring-brand-200"],
    ["Optimistic", f.scenarios.optimistic, "bg-teal-50 text-teal-900 ring-teal-200"],
  ] as const;
  const series = dailySeries(sales.filter((x) => x.sale_date <= asOf));
  return (
    <div className="space-y-6">
      <Alert tone="info" title="These are estimates, not predictions of certainty">
        Projections are calculated from your recorded sales only. Real results depend on many factors, including your promotion from here.
      </Alert>
      {f.notes.map((n) => <Alert key={n} tone="warning">{n}</Alert>)}
      <div className="grid gap-4 sm:grid-cols-3">
        {scen.map(([label, value, cls]) => (
          <div key={label} className={`rounded-2xl p-5 ring-1 ${cls}`}>
            <p className="text-sm font-semibold">{label} estimate</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{f.confidence === "none" ? "—" : formatNumber(value)}</p>
            <p className="mt-1 text-xs opacity-80">{f.confidence === "none" ? "Needs sales data" : target ? `${Math.round((value / target) * 100)}% of target` : "tickets by event day"}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tickets sold" value={formatNumber(f.ticketsSold)} sub={`${f.percentOfTarget}% of target`} />
        <StatCard label="Average daily sales" value={f.averageDailySales} sub={`Over ${f.daysSelling} day(s) of selling`} />
        <StatCard label="Recent velocity" value={f.recentVelocity} sub="Per day, last 7 days" />
        <StatCard label="Potential shortfall" value={f.confidence === "none" ? "—" : formatNumber(f.projectedShortfall)} sub={`Needed: ${f.requiredPerDay ?? "—"}/day for ${f.daysRemaining} day(s)`} />
      </div>
      <Card>
        <CardHeader><div><CardTitle>Sales so far</CardTitle><CardDescription>Confidence: {f.confidence === "none" ? "not enough data" : f.confidence}</CardDescription></div>{isDemo && <DemoBadge />}</CardHeader>
        <CardContent><SalesChart data={series} target={target} height={240} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>How this forecast is calculated</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p><strong>Average daily sales</strong> = net tickets sold ÷ days since sales started ({f.ticketsSold} ÷ {f.daysSelling || 0}).</p>
          <p><strong>Recent velocity</strong> = net tickets in the last 7 days ÷ 7.</p>
          <p><strong>Expected</strong> = sold + (60% × recent velocity + 40% × average) × days remaining.</p>
          <p><strong>Conservative</strong> = sold + (slower of the two rates × 0.75) × days remaining. <strong>Optimistic</strong> = sold + (faster rate × 1.25) × days remaining.</p>
          <p><strong>Needed per day</strong> = tickets still needed to reach target ÷ days remaining. All projections are capped at event capacity when set.</p>
        </CardContent>
      </Card>
      {(snapshotButton || snapshots.length > 0) && (
        <Card>
          <CardHeader><div><CardTitle>Saved forecast snapshots</CardTitle><CardDescription>Save a snapshot to compare how projections change over time.</CardDescription></div>{snapshotButton}</CardHeader>
          <CardContent className="pt-3">
            {snapshots.length ? (
              <Table>
                <thead><tr><th>Saved</th><th>Conservative</th><th>Expected</th><th>Optimistic</th></tr></thead>
                <tbody>{snapshots.map((x) => <tr key={x.created_at}><td>{new Date(x.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td><td>{x.conservative}</td><td className="font-semibold">{x.expected}</td><td>{x.optimistic}</td></tr>)}</tbody>
              </Table>
            ) : <p className="text-sm text-slate-500">No snapshots saved yet.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function NoTargetNotice() {
  return <Alert tone="warning"><AlertTriangle className="hidden" />Set a ticket target on this event to enable forecasting and Event Rescue Mode.</Alert>;
}
