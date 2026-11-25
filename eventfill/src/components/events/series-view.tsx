import Link from "next/link";
import { ArrowLeft, CalendarDays, Repeat, Ticket, PoundSterling, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, PageHeader, Progress, StatCard, Table } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { BarsChart } from "@/components/charts/charts";
import { RISK_LABEL, RISK_TONE, timingLabel, type EventSummary } from "@/lib/event-summary";
import { RECURRENCE_LABELS } from "@/lib/series";
import { formatDate, formatDateRange } from "@/lib/dates";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { SeriesRow } from "@/types/db";

export function SeriesView({ series, dates, currency, base, asOf, isDemo, controls, addForm }: { series: SeriesRow; dates: EventSummary[]; currency: string; base: string; asOf: string; isDemo?: boolean; controls?: React.ReactNode; addForm?: React.ReactNode }) {
  const live = dates.filter((d) => d.event.status !== "archived");
  const upcoming = live.filter((d) => !d.forecast.eventPassed);
  const past = live.filter((d) => d.forecast.eventPassed);
  const sold = live.reduce((a, d) => a + d.forecast.ticketsSold, 0);
  const revenue = live.reduce((a, d) => a + d.forecast.netRevenue, 0);
  const hit = past.filter((d) => d.event.ticket_target > 0 && d.forecast.ticketsSold >= d.event.ticket_target).length;
  const avgPast = past.length ? Math.round(past.reduce((a, d) => a + d.forecast.ticketsSold, 0) / past.length) : null;
  const atRisk = upcoming.filter((d) => d.risk.level === "behind" || d.risk.level === "critical");
  const first = dates[0]?.event;
  return (
    <>
      <Link href={`${base}/events`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"><ArrowLeft className="size-4" aria-hidden /> All events</Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={<span className="flex flex-wrap gap-2">{isDemo && <DemoBadge />}<Badge tone="teal"><Repeat className="size-3" aria-hidden /> Recurring series</Badge></span>}
          title={series.name}
          description={`${RECURRENCE_LABELS[series.recurrence] ?? series.recurrence} · ${dates.length} date${dates.length === 1 ? "" : "s"}${first ? ` · ${first.is_online ? "Online" : first.venue ?? "Venue TBC"}` : ""} · counts as one active event on your plan`}
          actions={controls}
        />
      </div>
      <div className="space-y-6">
        {atRisk.length > 0 && (
          <Alert tone="warning" title={`${atRisk.length} upcoming date${atRisk.length === 1 ? " is" : "s are"} behind target`}>
            {atRisk.slice(0, 3).map((d) => (
              <span key={d.event.id} className="mr-3 inline-block">
                <Link href={`${base}/events/${d.event.id}/rescue`} className="font-semibold underline">{formatDate(d.event.event_date, { day: "numeric", month: "short" })}</Link> needs {d.forecast.requiredPerDay ?? "—"}/day
              </span>
            ))}
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Upcoming dates" value={upcoming.length} sub={upcoming[0] ? `Next: ${formatDateRange(upcoming[0].event.event_date, upcoming[0].event.end_date)}` : "None scheduled"} icon={CalendarDays} />
          <StatCard label="Tickets sold (all dates)" value={formatNumber(sold)} icon={Ticket} tone="teal" />
          <StatCard label="Ticket revenue (all dates)" value={formatMoney(revenue, currency)} sub="Net of recorded refunds" icon={PoundSterling} tone="emerald" />
          <StatCard label="Past dates that hit target" value={past.length ? `${hit} / ${past.length}` : "—"} sub={avgPast != null ? `Average ${avgPast} tickets per past date` : "No past dates yet"} icon={Target} tone="amber" />
        </div>
        <Card>
          <CardHeader><div><CardTitle>Tickets sold per date</CardTitle><CardDescription>Compare dates to spot patterns (e.g. school holidays, weather, topics)</CardDescription></div></CardHeader>
          <CardContent><BarsChart data={live.slice(0, 26).map((d) => ({ label: formatDate(d.event.event_date, { day: "numeric", month: "short" }), value: d.forecast.ticketsSold }))} name="Tickets sold" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dates</CardTitle></CardHeader>
          <CardContent className="pt-3">
            <Table>
              <thead><tr><th>Date</th><th>Sold / target</th><th>Needed per day</th><th>Status</th></tr></thead>
              <tbody>
                {dates.map((d) => (
                  <tr key={d.event.id} className={d.event.status === "archived" ? "opacity-50" : undefined}>
                    <td className="whitespace-nowrap">
                      <Link href={`${base}/events/${d.event.id}`} className="font-semibold hover:text-brand-600">{formatDateRange(d.event.event_date, d.event.end_date, { weekday: true })}</Link>
                      <span className="block text-xs text-slate-400">{timingLabel(d.event, asOf)}</span>
                    </td>
                    <td className="min-w-40">
                      <div className="flex justify-between text-xs"><span className="font-semibold">{formatNumber(d.forecast.ticketsSold)} / {formatNumber(d.event.ticket_target)}</span><span className="text-slate-500">{d.forecast.percentOfTarget}%</span></div>
                      <Progress value={d.forecast.percentOfTarget} className="mt-1.5" tone={d.risk.level === "critical" ? "danger" : d.risk.level === "behind" ? "warning" : "brand"} label="Progress to target" />
                    </td>
                    <td>{d.forecast.requiredPerDay ?? "—"}</td>
                    <td><Badge tone={d.event.status === "archived" || d.forecast.eventPassed ? "neutral" : RISK_TONE[d.risk.level]}>{d.event.status === "archived" ? "Archived" : d.forecast.eventPassed ? "Finished" : RISK_LABEL[d.risk.level]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        {addForm && (
          <Card>
            <CardHeader><div><CardTitle>Add more dates</CardTitle><CardDescription>New dates continue the pattern after the last date, copying its details and ticket tiers.</CardDescription></div></CardHeader>
            <CardContent>{addForm}</CardContent>
          </Card>
        )}
        {isDemo && <Alert tone="info">In your own account you can add dates, edit one date or all upcoming dates at once, and complete past dates in one click.</Alert>}
      </div>
    </>
  );
}
