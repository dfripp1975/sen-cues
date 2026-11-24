import Link from "next/link";
import { MapPin, Monitor, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { QueryFilter } from "@/components/dashboard/filters";
import { RISK_LABEL, RISK_TONE, type EventSummary } from "@/lib/event-summary";
import { CATEGORY_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/dates";
import { formatNumber } from "@/lib/utils";
import type { EventRow } from "@/types/db";

export function EventList({ base, summaries, templates = [], q, status }: { base: string; summaries: EventSummary[]; templates?: EventRow[]; q?: string; status?: string }) {
  const term = (q ?? "").trim().toLowerCase();
  const filtered = summaries.filter((s) => {
    if (status ? s.event.status !== status : s.event.status === "archived") return false;
    if (!term) return true;
    return [s.event.name, s.event.venue, s.event.category].some((v) => v?.toLowerCase().includes(term));
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form className="relative flex-1" role="search">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search events by name, venue or category" aria-label="Search events" className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <QueryFilter name="status" label="Filter by status" options={[["", "Active & drafts"], ["active", "Active"], ["draft", "Drafts"], ["completed", "Completed"], ["archived", "Archived"]]} />
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">No events match your filters.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <li key={s.event.id}>
              <Link href={`${base}/events/${s.event.id}`} className="block rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lift hover:ring-brand-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{CATEGORY_LABELS[s.event.category] ?? s.event.category}</p>
                    <h2 className="mt-1 truncate text-lg font-bold">{s.event.name}</h2>
                  </div>
                  <Badge tone={s.event.status === "archived" || s.event.status === "draft" ? "neutral" : s.forecast.eventPassed ? "neutral" : RISK_TONE[s.risk.level]}>
                    {s.event.status === "archived" ? "Archived" : s.event.status === "draft" ? "Draft" : s.forecast.eventPassed ? "Finished" : RISK_LABEL[s.risk.level]}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  {s.event.is_online ? <Monitor className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
                  {formatDate(s.event.event_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {s.event.is_online ? "Online" : s.event.venue ?? "Venue TBC"}
                </p>
                <div className="mt-4 flex justify-between text-sm">
                  <span><strong>{formatNumber(s.forecast.ticketsSold)}</strong> <span className="text-slate-500">of {formatNumber(s.event.ticket_target)} sold</span></span>
                  <span className="text-slate-500">{s.forecast.eventPassed ? "Finished" : `${s.forecast.daysRemaining} days to go`}</span>
                </div>
                <Progress value={s.forecast.percentOfTarget} className="mt-2" tone={s.risk.level === "critical" ? "danger" : s.risk.level === "behind" ? "warning" : s.risk.level === "on_track" ? "success" : "brand"} label={`${s.event.name} progress`} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {templates.length > 0 && (
        <div>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Templates</h2>
          <ul className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <li key={t.id}>
                <Link href={`${base}/events/new?template=${t.id}`} className="inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-200 hover:ring-brand-300">{t.name} → Use template</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
