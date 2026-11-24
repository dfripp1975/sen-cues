import { CheckCircle2, Siren, Target, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Progress, StatCard, UpgradeNotice } from "@/components/ui/misc";
import { Badge, DemoBadge } from "@/components/ui/badge";
import type { EventSummary } from "@/lib/event-summary";
import type { Recommendation } from "@/lib/rescue";
import { daysBetween, formatDate } from "@/lib/dates";
import { netTickets } from "@/lib/forecast";
import { formatNumber } from "@/lib/utils";
import type { RescueActionRow, SaleRecord } from "@/types/db";

export function RescueView({ s, recs, actions, sales, asOf, allowed, isDemo, planner, controls, memberName }: { s: EventSummary; recs: Recommendation[]; actions: RescueActionRow[]; sales: SaleRecord[]; asOf: string; allowed: boolean; isDemo?: boolean; planner: React.ReactNode; controls?: (a: RescueActionRow) => React.ReactNode; memberName?: (id: string | null) => string }) {
  if (!allowed) return <UpgradeNotice feature="Event Rescue Mode" plan="Growth" />;
  const r = s.risk;
  const tone = r.level === "critical" ? "danger" : r.level === "behind" ? "warning" : r.level === "on_track" ? "success" : "info";
  const done = actions.filter((a) => a.status === "done").length;
  const planStart = actions.length ? actions.map((a) => a.created_at.slice(0, 10)).sort()[0] : null;
  let monitor: { before: number; after: number; since: number; days: number } | null = null;
  if (planStart) {
    const days = Math.max(1, daysBetween(planStart, asOf) + 1);
    const since = netTickets(sales.filter((x) => x.sale_date >= planStart && x.sale_date <= asOf));
    const beforeWindowStart = new Date(Date.parse(planStart) - days * 86400000).toISOString().slice(0, 10);
    const before = netTickets(sales.filter((x) => x.sale_date >= beforeWindowStart && x.sale_date < planStart));
    monitor = { before: Math.round((before / days) * 10) / 10, after: Math.round((since / days) * 10) / 10, since, days };
  }
  return (
    <div className="space-y-6">
      <div className={`rounded-3xl p-6 ring-1 sm:p-8 ${r.level === "critical" ? "bg-red-50 ring-red-200" : r.level === "behind" ? "bg-amber-50 ring-amber-200" : r.level === "on_track" ? "bg-emerald-50 ring-emerald-200" : "bg-brand-50 ring-brand-200"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Siren className="size-5" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-wide">Event Rescue Mode</span>
          {isDemo && <DemoBadge />}
        </div>
        <h2 className="mt-3 text-2xl font-bold">{r.headline}</h2>
        <p className="mt-2 max-w-3xl text-slate-700">{r.message}</p>
        {r.level !== "not_applicable" && (
          <div className="mt-5 max-w-xl">
            <div className="flex justify-between text-xs font-medium">
              <span>{formatNumber(s.forecast.ticketsSold)} sold</span>
              <span>Expected by now: {formatNumber(r.expectedByNow)} · Target: {formatNumber(s.event.ticket_target)}</span>
            </div>
            <Progress value={s.forecast.percentOfTarget} className="mt-2 h-3 bg-white" tone={tone === "info" ? "brand" : tone} label="Progress to target" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gap to expected pace" value={formatNumber(r.gapToPace)} sub="Tickets behind a steady sales pace" icon={Target} tone="amber" />
        <StatCard label="Needed per day" value={s.forecast.requiredPerDay ?? "—"} sub={`${s.forecast.daysRemaining} day(s) remaining`} icon={TrendingUp} />
        <StatCard label="Current pace" value={`${s.forecast.recentVelocity}/day`} sub="Last 7 days" icon={Users} tone="teal" />
        <StatCard label="Plan progress" value={`${done} / ${actions.length}`} sub="Actions completed" icon={CheckCircle2} tone="emerald" />
      </div>

      {monitor && (
        <Card>
          <CardHeader><div><CardTitle>Sales since your rescue plan started</CardTitle><CardDescription>Plan started {formatDate(planStart)}. Comparing the same number of days before and after.</CardDescription></div></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-sm text-slate-500">Tickets since plan started</p><p className="font-display text-2xl font-bold">{formatNumber(monitor.since)}</p></div>
            <div><p className="text-sm text-slate-500">Daily rate before</p><p className="font-display text-2xl font-bold">{monitor.before}</p></div>
            <div><p className="text-sm text-slate-500">Daily rate since</p><p className="font-display text-2xl font-bold">{monitor.after}</p></div>
            <p className="text-xs text-slate-500 sm:col-span-3">This shows what happened to recorded sales, not what caused it. Other factors (timing, word of mouth) also affect sales.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>Recommended actions</CardTitle><CardDescription>Based on this event&apos;s details, sales pace and channels. Suggestions only — results aren&apos;t guaranteed.</CardDescription></div></CardHeader>
          <CardContent>{recs.length ? planner : <Alert tone="success">No rescue actions are needed right now based on recorded sales.</Alert>}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Your rescue plan</CardTitle><CardDescription>Assign tasks, set deadlines and mark them complete.</CardDescription></div></CardHeader>
          <CardContent>
            {actions.length ? (
              <ul className="space-y-3">
                {actions.map((a) => (
                  <li key={a.id} className={`rounded-2xl p-4 ring-1 ${a.status === "done" ? "bg-emerald-50/50 ring-emerald-100" : "bg-white ring-slate-200"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className={`font-medium ${a.status === "done" ? "text-slate-500 line-through" : ""}`}>{a.title}</p>
                      {a.due_date && a.status !== "done" && a.due_date < asOf && <Badge tone="danger">Overdue</Badge>}
                    </div>
                    {controls ? (
                      <div className="mt-3">{controls(a)}</div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">{a.status.replace("_", " ")} · due {formatDate(a.due_date)} · {memberName?.(a.assignee_id) ?? "Unassigned"}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No actions yet. Select recommendations and add them to your plan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
