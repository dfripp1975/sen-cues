import type { Metadata } from "next";
import { ExternalLink, Swords } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { listEvents, listTiers } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, UpgradeNotice } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { QueryFilter } from "@/components/dashboard/filters";
import { daysBetween, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/utils";
import { AddCompetitorButton, DeleteCompetitor } from "./client";

export const metadata: Metadata = { title: "Competitor Watch" };

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const ctx = await requireOrg();
  if (!hasFeature(ctx, "competitorWatch")) return (<><PageHeader title="Competitor Watch" /><UpgradeNotice feature="Competitor Watch" plan="Growth" /></>);
  const sp = await searchParams;
  const events = await listEvents(ctx);
  const tiers = await listTiers(ctx, events.map((e) => e.id));
  let q = ctx.supabase.from("competitors").select("*").eq("org_id", ctx.org.id).order("event_date", { ascending: true, nullsFirst: false });
  if (sp.event) q = q.eq("event_id", sp.event);
  const { data: competitors } = await q;
  const cur = ctx.org.currency;
  const mine = (id: string | null) => events.find((e) => e.id === id);
  const myPrices = (id: string | null) => { const p = tiers.filter((t) => t.event_id === id).map((t) => t.price); return p.length ? [Math.min(...p), Math.max(...p)] : null; };
  return (
    <>
      <PageHeader title="Competitor Watch" description="Compare your events with others competing for the same audience." actions={<AddCompetitorButton events={events.map((e) => ({ id: e.id, name: e.name }))} defaultEvent={sp.event} currency={cur} />} />
      <Alert tone="info" className="mb-6">All competitor information is entered by you from publicly available details. EventFill never estimates or invents competitors&apos; ticket sales or attendance.</Alert>
      <div className="mb-5"><QueryFilter name="event" label="Filter by your event" options={[["", "All of your events"], ...events.map((e) => [e.id, e.name] as [string, string])]} /></div>
      {!competitors?.length ? (
        <EmptyState icon={Swords} title="No competitors saved" description="Add competing events to compare dates, prices and positioning." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {competitors.map((c) => {
            const ev = mine(c.event_id);
            const prices = myPrices(c.event_id);
            const notes: string[] = [];
            if (ev && c.event_date) {
              const gap = Math.abs(daysBetween(ev.event_date, c.event_date));
              if (gap <= 7) notes.push(`Within ${gap} day(s) of your event — consider emphasising what makes yours different.`);
            }
            if (prices && c.price_min != null) {
              if (Number(c.price_min) < prices[0]) notes.push("Their lowest advertised price is below yours.");
              else if (Number(c.price_min) > prices[0]) notes.push("Your lowest price is below their advertised price.");
            }
            if (c.benefits && ev && !(ev.description ?? "").length) notes.push("They list benefits; your event has no description saved yet.");
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{c.title}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(c.event_date)} {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="ml-2 inline-flex items-center gap-1 text-brand-600 hover:underline">View <ExternalLink className="size-3" /></a>}</p>
                  </div>
                  <DeleteCompetitor id={c.id} />
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3 ring-1 ring-slate-200">
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Them</p><p className="mt-1">{c.price_min != null ? `${formatMoney(c.price_min, cur)}${c.price_max != null && c.price_max !== c.price_min ? `–${formatMoney(c.price_max, cur)}` : ""}` : "Price not recorded"}</p><p className="text-slate-500">{formatDate(c.event_date)}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-brand-600">You{ev ? `: ${ev.name}` : ""}</p>{ev ? <><p className="mt-1">{prices ? `${formatMoney(prices[0], cur)}${prices[1] !== prices[0] ? `–${formatMoney(prices[1], cur)}` : ""}` : "No tiers"}</p><p className="text-slate-500">{formatDate(ev.event_date)}</p></> : <p className="mt-1 text-slate-500">Not linked</p>}</div>
                  </div>
                  {c.description && <div><p className="text-xs font-semibold uppercase text-slate-500">Their description</p><p className="mt-1 text-slate-700">{c.description}</p></div>}
                  {c.benefits && <div><p className="text-xs font-semibold uppercase text-slate-500">Advertised benefits</p><p className="mt-1 text-slate-700">{c.benefits}</p></div>}
                  {c.notes && <div><p className="text-xs font-semibold uppercase text-slate-500">Your notes</p><p className="mt-1 text-slate-700">{c.notes}</p></div>}
                  {notes.length > 0 && <ul className="space-y-1">{notes.map((n) => <li key={n}><Badge tone="warning">Possible difference</Badge> <span className="text-slate-600">{n}</span></li>)}</ul>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
