import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Table, UpgradeNotice } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { SalesChart } from "@/components/charts/charts";
import { PrintButton } from "./print-button";
import { computeProfit } from "@/lib/finance";
import { dailySeries } from "@/lib/forecast";
import { formatDateRange } from "@/lib/dates";
import { formatMoney, formatNumber } from "@/lib/utils";
import { CHANNEL_LABELS, type Channel } from "@/lib/tracking";
import type { EventSummary } from "@/lib/event-summary";
import type { CampaignRow, LinkRow, MoneyRow, RescueActionRow, SaleRecord } from "@/types/db";

export interface ReportData {
  s: EventSummary;
  sales: SaleRecord[];
  income: MoneyRow[];
  expenses: MoneyRow[];
  campaigns: CampaignRow[];
  links: LinkRow[];
  clicksByLink: Record<string, number>;
  rescue: RescueActionRow[];
  surveys: { title: string; responses: number; avgRating: number | null }[];
  currency: string;
  orgName: string;
  advanced: boolean;
  isDemo?: boolean;
  exportHref?: string;
}

export function ReportView(d: ReportData) {
  const { s, currency } = d;
  const p = computeProfit({ ticketRevenue: s.forecast.netRevenue, ticketsSold: s.forecast.ticketsSold, income: d.income, expenses: d.expenses, averageTicketPrice: s.lowestPrice });
  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Report generated {new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}</p>
        <div className="flex gap-2">
          {d.exportHref && <a href={d.exportHref} className="inline-flex h-8 items-center rounded-xl bg-white px-3 text-xs font-semibold ring-1 ring-slate-200 hover:bg-slate-50">Export sales CSV</a>}
          <PrintButton />
        </div>
      </div>
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{s.event.name} — Event report</h1>
        <p className="text-sm">{d.orgName} · {formatDateRange(s.event.event_date, s.event.end_date)}</p>
      </div>
      {d.isDemo && <DemoBadge />}
      <Alert tone="info">Figures marked &quot;recorded&quot; come from data entered in EventFill. Forecasts and items marked &quot;estimate&quot; are not actual results.</Alert>

      <Card>
        <CardHeader><CardTitle>Ticket sales (recorded)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-slate-500">Tickets sold</dt><dd className="text-lg font-bold">{formatNumber(s.forecast.ticketsSold)}</dd></div>
            <div><dt className="text-slate-500">Target</dt><dd className="text-lg font-bold">{formatNumber(s.event.ticket_target)} ({s.forecast.percentOfTarget}%)</dd></div>
            <div><dt className="text-slate-500">Net ticket revenue</dt><dd className="text-lg font-bold">{formatMoney(s.forecast.netRevenue, currency)}</dd></div>
            <div><dt className="text-slate-500">Attendance</dt><dd className="text-lg font-bold">{s.event.attendance != null ? formatNumber(s.event.attendance) : "Not recorded"}</dd></div>
          </dl>
          <SalesChart data={dailySeries(d.sales)} target={s.event.ticket_target} height={220} />
        </CardContent>
      </Card>

      {!s.forecast.eventPassed && (
        <Card>
          <CardHeader><CardTitle>Sales forecast (estimate)</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {s.forecast.confidence === "none" ? "Not enough sales data for a forecast." : <>Conservative {s.forecast.scenarios.conservative} · <strong>Expected {s.forecast.scenarios.expected}</strong> · Optimistic {s.forecast.scenarios.optimistic} tickets. Current status: <Badge>{s.risk.headline}</Badge></>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Financial summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-slate-500">Revenue</dt><dd className="text-lg font-bold">{formatMoney(p.totalRevenue, currency)}</dd></div>
            <div><dt className="text-slate-500">Expenses</dt><dd className="text-lg font-bold">{formatMoney(p.totalExpenses, currency)}</dd></div>
            <div><dt className="text-slate-500">{p.hasEstimates ? "Profit (includes estimates)" : "Profit"}</dt><dd className="text-lg font-bold">{formatMoney(p.profit, currency)}</dd></div>
            <div><dt className="text-slate-500">Margin</dt><dd className="text-lg font-bold">{p.margin != null ? `${p.margin}%` : "—"}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {d.advanced ? (
        <>
          <Card>
            <CardHeader><CardTitle>Marketing campaigns and link performance</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-3">
              {d.campaigns.length ? (
                <Table><thead><tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Budget</th></tr></thead>
                  <tbody>{d.campaigns.map((c) => <tr key={c.id}><td>{c.name}</td><td>{CHANNEL_LABELS[c.channel as Channel] ?? c.channel}</td><td>{c.status}</td><td>{formatMoney(c.budget, currency)}</td></tr>)}</tbody></Table>
              ) : <p className="text-sm text-slate-500">No campaigns recorded.</p>}
              {d.links.length > 0 && (
                <Table><thead><tr><th>Tracking link</th><th>Source</th><th>Clicks (interest, not sales)</th></tr></thead>
                  <tbody>{d.links.map((l) => <tr key={l.id}><td>{l.label}</td><td>{l.utm_source ?? "—"}</td><td>{d.clicksByLink[l.id] ?? 0}</td></tr>)}</tbody></Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Event Rescue actions</CardTitle></CardHeader>
            <CardContent>
              {d.rescue.length ? <ul className="space-y-1 text-sm">{d.rescue.map((a) => <li key={a.id}>{a.status === "done" ? "✓" : "○"} {a.title} <span className="text-slate-500">({a.status.replace("_", " ")})</span></li>)}</ul> : <p className="text-sm text-slate-500">No rescue actions recorded.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Audience feedback</CardTitle></CardHeader>
            <CardContent>
              {d.surveys.length ? <ul className="space-y-1 text-sm">{d.surveys.map((x) => <li key={x.title}>{x.title}: {x.responses} response(s){x.avgRating != null && ` · average rating ${x.avgRating}/5`}</li>)}</ul> : <p className="text-sm text-slate-500">No surveys linked to this event.</p>}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="no-print"><UpgradeNotice feature="Advanced reporting" plan="Growth" /></div>
      )}

      <Card>
        <CardHeader><CardTitle>Lessons for future events</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-line text-sm text-slate-700">{s.event.lessons_learned || "Add lessons learned on the event overview after the event."}</p></CardContent>
      </Card>
    </div>
  );
}
