import Link from "next/link";
import { AlertTriangle, CalendarClock, CalendarDays, Megaphone, PlusCircle, PoundSterling, Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, Progress, StatCard, Table } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesChart } from "@/components/charts/charts";
import { QueryFilter } from "@/components/dashboard/filters";
import { RISK_LABEL, RISK_TONE, timingLabel, type EventSummary } from "@/lib/event-summary";
import { dailySeries } from "@/lib/forecast";
import { addDays, formatDate, formatDateRange } from "@/lib/dates";
import { formatMoney, formatNumber, timeAgo } from "@/lib/utils";
import { CHANNEL_LABELS, type Channel } from "@/lib/tracking";
import type { CampaignRow, SaleRecord, TaskRow } from "@/types/db";

export interface OverviewProps {
  base: string;
  greetingName?: string;
  currency: string;
  summaries: EventSummary[];
  sales: SaleRecord[];
  tasks: TaskRow[];
  campaigns: CampaignRow[];
  asOf: string;
  isDemo?: boolean;
  selectedEvent?: string;
  range?: string;
}

const RANGES: [string, string][] = [
  ["30", "Last 30 days"],
  ["7", "Last 7 days"],
  ["90", "Last 90 days"],
  ["all", "All time"],
];

export function DashboardOverview(p: OverviewProps) {
  const upcoming = p.summaries.filter((s) => s.event.status !== "archived" && !s.forecast.eventPassed);
  const scope = p.selectedEvent ? p.summaries.filter((s) => s.event.id === p.selectedEvent) : upcoming.length ? upcoming : p.summaries;
  const scopeIds = new Set(scope.map((s) => s.event.id));
  const rangeDays = p.range === "all" ? null : Number(p.range ?? 30) || 30;
  const from = rangeDays ? addDays(p.asOf, -(rangeDays - 1)) : undefined;
  const scopedSales = p.sales.filter((s) => scopeIds.has(s.event_id) && s.sale_date <= p.asOf && (!from || s.sale_date >= from));
  const series = dailySeries(scopedSales, from, p.asOf);
  const ticketsInRange = scopedSales.reduce((a, s) => a + s.quantity - s.refunds, 0);
  const revenueInRange = scopedSales.reduce((a, s) => a + s.revenue - s.refund_amount, 0);
  const attention = upcoming.filter((s) => s.risk.level === "critical" || s.risk.level === "behind");
  const next = upcoming[0];
  const lastUpdate = p.summaries.map((s) => s.lastSaleRecordedAt).filter(Boolean).sort().pop() ?? null;
  const deadlines = p.tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date <= addDays(p.asOf, 14)).slice(0, 6);
  const activeCampaigns = p.campaigns.filter((c) => c.status === "active" || c.status === "planned").slice(0, 5);
  const eventName = (id: string | null) => p.summaries.find((s) => s.event.id === id)?.event.name;
  const single = scope.length === 1 ? scope[0] : null;

  return (
    <>
      <PageHeader
        eyebrow={p.isDemo ? <DemoBadge /> : undefined}
        title={p.greetingName ? `Welcome back, ${p.greetingName.split(" ")[0]}` : "Overview"}
        description={<span>Sales data source: manual entries and CSV imports · last updated {timeAgo(lastUpdate)}</span>}
        actions={
          <Button asChild>
            <Link href={`${p.base}/events/new`}>
              <PlusCircle /> New event
            </Link>
          </Button>
        }
      />

      {p.summaries.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Create your first event" description="Add an event with a ticket target to start tracking sales, forecasts and marketing." action={<Button asChild><Link href={`${p.base}/events/new`}>Create event</Link></Button>} />
      ) : (
        <div className="space-y-6">
          {attention.map((s) => (
            <Alert
              key={s.event.id}
              tone={s.risk.level === "critical" ? "danger" : "warning"}
              title={`${s.event.name}: ${s.risk.headline}`}
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link href={`${p.base}/events/${s.event.id}/rescue`}>Open Event Rescue</Link>
                </Button>
              }
            >
              {s.risk.message}
            </Alert>
          ))}

          <div className="flex flex-wrap gap-2">
            <QueryFilter name="event" label="Filter by event" options={[["", "All upcoming events"], ...p.summaries.map((s) => [s.event.id, s.event.name] as [string, string])]} />
            <QueryFilter name="range" label="Date range" options={RANGES} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Active events" value={upcoming.length} sub={`${p.summaries.length} total`} icon={CalendarDays} />
            <StatCard label="Tickets sold" value={formatNumber(ticketsInRange)} sub={RANGES.find(([v]) => v === (p.range ?? "30"))?.[1] ?? "Last 30 days"} icon={Ticket} tone="teal" />
            <StatCard label="Ticket revenue" value={formatMoney(revenueInRange, p.currency)} sub="Net of recorded refunds" icon={PoundSterling} tone="emerald" />
            <StatCard label="Next event" value={next ? timingLabel(next.event, p.asOf).replace(" to go", "") : "—"} sub={next ? next.event.name : "No upcoming events"} icon={CalendarClock} tone="amber" />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Ticket sales</CardTitle>
                <CardDescription>{single ? single.event.name : `${scope.length} event(s)`} · daily tickets and running total</CardDescription>
              </div>
              {p.isDemo && <DemoBadge />}
            </CardHeader>
            <CardContent>
              <SalesChart data={series} target={single && p.range === "all" ? single.event.ticket_target : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events and targets</CardTitle>
              <Link href={`${p.base}/events`} className="text-sm font-semibold text-brand-600 hover:underline">All events</Link>
            </CardHeader>
            <CardContent className="pt-3">
              <Table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Sold / target</th>
                    <th>Needed per day</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.summaries.slice(0, 10).map((s) => (
                    <tr key={s.event.id}>
                      <td>
                        <Link href={`${p.base}/events/${s.event.id}`} className="font-semibold hover:text-brand-600">{s.event.name}</Link>
                      </td>
                      <td className="whitespace-nowrap text-slate-600">
                        {formatDateRange(s.event.event_date, s.event.end_date)}
                        <span className="block text-xs text-slate-400">{timingLabel(s.event, p.asOf)}</span>
                      </td>
                      <td className="min-w-40">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold">{formatNumber(s.forecast.ticketsSold)} / {formatNumber(s.event.ticket_target)}</span>
                          <span className="text-slate-500">{s.forecast.percentOfTarget}%</span>
                        </div>
                        <Progress value={s.forecast.percentOfTarget} className="mt-1.5" tone={s.risk.level === "critical" ? "danger" : s.risk.level === "behind" ? "warning" : "brand"} label={`${s.event.name} progress`} />
                      </td>
                      <td>{s.forecast.requiredPerDay ?? "—"}</td>
                      <td>
                        <Badge tone={RISK_TONE[s.risk.level]}>{s.forecast.eventPassed ? "Finished" : RISK_LABEL[s.risk.level]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Upcoming promotional deadlines</CardTitle>
                  <CardDescription>Open tasks due in the next 14 days</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {deadlines.length ? (
                  <ul className="divide-y divide-slate-100">
                    {deadlines.map((t) => {
                      const overdue = t.due_date! < p.asOf;
                      return (
                        <li key={t.id} className="flex items-start justify-between gap-3 py-3">
                          <div>
                            <p className="text-sm font-medium">{t.title}</p>
                            <p className="text-xs text-slate-500">{eventName(t.event_id) ?? "General"}</p>
                          </div>
                          <Badge tone={overdue ? "danger" : "neutral"}>{overdue ? "Overdue" : formatDate(t.due_date, { day: "numeric", month: "short" })}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No deadlines in the next two weeks. <Link href={`${p.base}/campaigns`} className="text-brand-600 underline">Plan some promotion</Link>.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Marketing activities</CardTitle>
                  <CardDescription>Active and planned campaigns</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {activeCampaigns.length ? (
                  <ul className="divide-y divide-slate-100">
                    {activeCampaigns.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-lg bg-teal-50 text-teal-600"><Megaphone className="size-4" aria-hidden /></span>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-slate-500">{CHANNEL_LABELS[c.channel as Channel] ?? c.channel} · {eventName(c.event_id) ?? "All events"}</p>
                          </div>
                        </div>
                        <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No campaigns yet. <Link href={`${p.base}/campaigns`} className="text-brand-600 underline">Create one</Link>.</p>
                )}
              </CardContent>
            </Card>
          </div>
          {attention.length === 0 && upcoming.length > 0 && (
            <p className="flex items-center gap-2 text-sm text-slate-500"><AlertTriangle className="size-4 text-slate-300" aria-hidden /> No upcoming events currently need attention based on recorded sales.</p>
          )}
        </div>
      )}
    </>
  );
}
