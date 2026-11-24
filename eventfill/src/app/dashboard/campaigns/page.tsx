import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { listCampaigns, listEvents, listTasks } from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, Table } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CampaignStatus, DeleteCampaignButton, DeleteTaskButton, NewCampaignButton, TaskCheckbox, TaskForm, TemplateButton } from "@/components/planner/client";
import { CHANNEL_LABELS, type Channel } from "@/lib/tracking";
import { addDays, formatDate, parseISODate, toISODate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Marketing planner" };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ctx = await requireOrg();
  const sp = await searchParams;
  const planner = hasFeature(ctx, "marketingPlanner");
  const [events, campaigns, tasks] = await Promise.all([listEvents(ctx), listCampaigns(ctx), listTasks(ctx)]);
  const asOf = today();
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : asOf.slice(0, 7);
  const first = parseISODate(`${month}-01`);
  const gridStart = addDays(toISODate(first), -((first.getUTCDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const prev = toISODate(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1))).slice(0, 7);
  const next = toISODate(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1))).slice(0, 7);
  const eventOpts = events.map((e) => ({ id: e.id, name: e.name }));
  const eventName = (id: string | null) => events.find((e) => e.id === id)?.name;
  const open = tasks.filter((t) => t.status !== "done");

  return (
    <>
      <PageHeader
        title="Marketing planner"
        description={`${open.length} of ${ctx.plan.campaignTasks.toLocaleString()} open tasks used. EventFill doesn't post for you — tick tasks off as you complete them.`}
        actions={planner ? <><TemplateButton events={eventOpts} /><NewCampaignButton events={eventOpts} currency={ctx.org.currency} /></> : undefined}
      />
      {!planner && <Alert tone="info" className="mb-6" title="Campaigns, calendar and ready-made plans are on Starter and above" action={<Link href="/dashboard/settings/billing" className="text-sm font-semibold underline">Upgrade</Link>}>On the Free plan you can keep a simple list of up to {ctx.plan.campaignTasks} open marketing tasks.</Alert>}

      <div className="space-y-6">
        {planner && (
          <Card>
            <CardHeader>
              <CardTitle>{first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</CardTitle>
              <div className="flex gap-1">
                <Link href={`?month=${prev}`} aria-label="Previous month" className="grid size-8 place-items-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"><ChevronLeft className="size-4" /></Link>
                <Link href={`?month=${asOf.slice(0, 7)}`} className="grid h-8 place-items-center rounded-lg px-3 text-xs font-semibold ring-1 ring-slate-200 hover:bg-slate-50">Today</Link>
                <Link href={`?month=${next}`} aria-label="Next month" className="grid size-8 place-items-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"><ChevronRight className="size-4" /></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid min-w-[640px] grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-500">{d}</div>)}
                  {days.map((d) => {
                    const dayTasks = tasks.filter((t) => t.due_date === d);
                    const dayEvents = events.filter((e) => e.event_date === d);
                    return (
                      <div key={d} className={cn("min-h-24 bg-white p-1.5", d.slice(0, 7) !== month && "bg-slate-50/70 text-slate-400")}>
                        <p className={cn("mb-1 text-xs", d === asOf && "inline-grid size-5 place-items-center rounded-full bg-brand-600 font-semibold text-white")}>{Number(d.slice(8))}</p>
                        {dayEvents.map((e) => <Link key={e.id} href={`/dashboard/events/${e.id}`} className="mb-1 block truncate rounded bg-navy px-1.5 py-0.5 text-[11px] font-semibold text-white">★ {e.name}</Link>)}
                        {dayTasks.slice(0, 3).map((t) => <p key={t.id} className={cn("mb-1 truncate rounded px-1.5 py-0.5 text-[11px]", t.status === "done" ? "bg-emerald-50 text-emerald-700 line-through" : t.due_date! < asOf ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700")} title={t.title}>{t.title}</p>)}
                        {dayTasks.length > 3 && <p className="text-[11px] text-slate-500">+{dayTasks.length - 3} more</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><div><CardTitle>Tasks checklist</CardTitle><CardDescription>Promotional tasks and deadlines</CardDescription></div></CardHeader>
          <CardContent className="space-y-5">
            <TaskForm events={eventOpts} campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />
            {tasks.length ? (
              <ul className="divide-y divide-slate-100">
                {tasks.slice(0, 300).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <TaskCheckbox id={t.id} status={t.status} label={t.title} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", t.status === "done" && "text-slate-400 line-through")}>{t.title}</p>
                      <p className="text-xs text-slate-500">{[eventName(t.event_id), t.channel ? CHANNEL_LABELS[t.channel as Channel] ?? t.channel : null].filter(Boolean).join(" · ") || "General"}</p>
                    </div>
                    {t.due_date && <Badge tone={t.status !== "done" && t.due_date < asOf ? "danger" : "neutral"}>{formatDate(t.due_date, { day: "numeric", month: "short" })}</Badge>}
                    <DeleteTaskButton id={t.id} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={ClipboardList} title="No tasks yet" description="Add your first promotional task, or apply a ready-made plan." />
            )}
          </CardContent>
        </Card>

        {planner && (
          <Card>
            <CardHeader><div><CardTitle>Campaigns</CardTitle><CardDescription>Budgets, channels and status</CardDescription></div></CardHeader>
            <CardContent className="pt-3">
              {campaigns.length ? (
                <Table>
                  <thead><tr><th>Campaign</th><th>Channel</th><th>Dates</th><th>Budget</th><th>Tasks</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const ct = tasks.filter((t) => t.campaign_id === c.id);
                      return (
                        <tr key={c.id}>
                          <td><p className="font-medium">{c.name}</p><p className="text-xs text-slate-500">{eventName(c.event_id) ?? "All events"}</p></td>
                          <td>{CHANNEL_LABELS[c.channel as Channel] ?? c.channel}</td>
                          <td className="whitespace-nowrap text-xs">{formatDate(c.start_date, { day: "numeric", month: "short" })} – {formatDate(c.end_date, { day: "numeric", month: "short" })}</td>
                          <td>{formatMoney(c.budget, ctx.org.currency)}</td>
                          <td>{ct.filter((t) => t.status === "done").length}/{ct.length}</td>
                          <td><CampaignStatus id={c.id} status={c.status} /></td>
                          <td><DeleteCampaignButton id={c.id} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : <p className="text-sm text-slate-500">No campaigns yet.</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
