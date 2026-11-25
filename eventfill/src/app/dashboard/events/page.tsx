import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, PlusCircle } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { listEvents, listSales, listSeries, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { EmptyState, PageHeader, Alert } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EventList } from "@/components/events/event-list";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; deleted?: string }> }) {
  const ctx = await requireOrg();
  const sp = await searchParams;
  const [events, templates, series] = await Promise.all([listEvents(ctx, { includeArchived: true }), listEvents(ctx, { templates: true }), listSeries(ctx)]);
  const ids = events.map((e) => e.id);
  const [sales, tiers] = await Promise.all([listSales(ctx, ids), listTiers(ctx, ids)]);
  const asOf = today();
  const summaries = events.map((e) => summariseEvent(e, sales, tiers, asOf));
  return (
    <>
      <PageHeader title="Events" description="Create, track and manage all of your events." actions={<Button asChild><Link href="/dashboard/events/new"><PlusCircle /> New event</Link></Button>} />
      {sp.deleted && <Alert tone="success" className="mb-6">Event deleted.</Alert>}
      {events.length === 0 && templates.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" description="Create your first event to start tracking ticket sales against a target." action={<Button asChild><Link href="/dashboard/events/new">Create event</Link></Button>} />
      ) : (
        <EventList base="/dashboard" summaries={summaries} templates={templates} q={sp.q} status={sp.status} seriesNames={Object.fromEntries(series.map((x) => [x.id, x.name]))} />
      )}
    </>
  );
}
