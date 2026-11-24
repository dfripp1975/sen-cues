import type { Metadata } from "next";
import QRCode from "qrcode";
import { Link2, MousePointerClick, Smartphone } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { listCampaigns, listClicks, listEvents, listLinks } from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader, StatCard, UpgradeNotice } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/confirm";
import { BarsChart, TrendChart } from "@/components/charts/charts";
import { LinkActions, NewLinkButton, QrDownload } from "@/components/links/client";
import { buildDestination } from "@/lib/tracking";
import { addDays, today } from "@/lib/dates";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Tracking links" };

export default async function LinksPage() {
  const ctx = await requireOrg();
  if (!hasFeature(ctx, "trackingLinks")) return (<><PageHeader title="Tracking links" /><UpgradeNotice feature="Tracking links" plan="Starter" /></>);
  const [links, events, campaigns] = await Promise.all([listLinks(ctx), listEvents(ctx), listCampaigns(ctx)]);
  const asOf = today();
  const since = addDays(asOf, -29);
  const clicks = await listClicks(ctx, links.map((l) => l.id), `${since}T00:00:00Z`);
  const byLink = new Map<string, number>();
  for (const c of clicks) byLink.set(c.link_id, (byLink.get(c.link_id) ?? 0) + 1);
  const trend = Array.from({ length: 30 }, (_, i) => { const d = addDays(since, i); return { date: d, clicks: clicks.filter((c) => c.clicked_at.slice(0, 10) === d).length }; });
  const bySource = new Map<string, number>();
  for (const l of links) bySource.set(l.utm_source ?? l.label, (bySource.get(l.utm_source ?? l.label) ?? 0) + (byLink.get(l.id) ?? 0));
  const mobile = clicks.filter((c) => c.device === "mobile").length;
  const qrs = await Promise.all(links.map((l) => QRCode.toString(`${env.siteUrl}/l/${l.slug}`, { type: "svg", margin: 1, width: 160, color: { dark: "#111827", light: "#ffffff" } })));
  const eventName = (id: string | null) => events.find((e) => e.id === id)?.name;
  return (
    <>
      <PageHeader title="Tracking links" description={`${links.length} of ${ctx.plan.trackingLinks} links used.`} actions={<NewLinkButton events={events.map((e) => ({ id: e.id, name: e.name, booking_url: e.booking_url }))} campaigns={campaigns} />} />
      <Alert tone="info" className="mb-6">Clicks show interest from each channel. They are <strong>not</strong> ticket sales — a click doesn&apos;t mean someone booked. EventFill stores no IP addresses or cookies for clicks.</Alert>
      {links.length === 0 ? (
        <EmptyState icon={Link2} title="No tracking links yet" description="Create a link for each place you promote your event (Instagram, email, partners…) to see which channels generate interest." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Clicks (30 days)" value={clicks.length} icon={MousePointerClick} />
            <StatCard label="Active links" value={links.filter((l) => l.is_active).length} icon={Link2} tone="teal" />
            <StatCard label="Mobile share" value={clicks.length ? `${Math.round((mobile / clicks.length) * 100)}%` : "—"} icon={Smartphone} tone="amber" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Click trend (30 days)</CardTitle></CardHeader><CardContent><TrendChart data={trend} dataKey="clicks" name="Clicks" /></CardContent></Card>
            <Card><CardHeader><div><CardTitle>Campaign comparison</CardTitle><CardDescription>Clicks by source, last 30 days</CardDescription></div></CardHeader><CardContent><BarsChart horizontal data={[...bySource.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} name="Clicks" /></CardContent></Card>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {links.map((l, i) => {
              const short = `${env.siteUrl}/l/${l.slug}`;
              return (
                <li key={l.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <div className="size-24 overflow-hidden rounded-lg ring-1 ring-slate-200 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrs[i] }} aria-label={`QR code for ${l.label}`} role="img" />
                    <QrDownload dataUrl={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrs[i])}`} name={l.label} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{l.label}</p>
                        <p className="truncate text-xs text-slate-500">{eventName(l.event_id) ?? "No event"}</p>
                      </div>
                      {!l.is_active && <Badge>Paused</Badge>}
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-brand-700">{short}</p>
                    <p className="mt-1 truncate text-xs text-slate-400" title={buildDestination(l.destination_url, l)}>→ {buildDestination(l.destination_url, l)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="teal">{byLink.get(l.id) ?? 0} clicks / 30d</Badge>
                      <CopyButton text={short} label="Copy link" />
                      <LinkActions id={l.id} active={l.is_active} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
