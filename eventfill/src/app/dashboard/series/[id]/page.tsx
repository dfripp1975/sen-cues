import type { Metadata } from "next";
import { requireOrg } from "@/lib/auth";
import { getSeries, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { SeriesView } from "@/components/events/series-view";
import { Alert } from "@/components/ui/misc";
import { AddDatesForm, SeriesControls } from "../client";

export const metadata: Metadata = { title: "Event series" };

export default async function SeriesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const sp = await searchParams;
  const { series, events } = await getSeries(ctx, id);
  const ids = events.map((e) => e.id);
  const [sales, tiers] = await Promise.all([listSales(ctx, ids), listTiers(ctx, ids)]);
  const asOf = today();
  return (
    <>
      {sp.created && <Alert tone="success" className="mb-6" title={`Series created with ${events.length} dates`}>Each date has its own sales tracking and forecast. Open a date to record sales, or edit one and tick &ldquo;apply to upcoming dates&rdquo; to change them all.</Alert>}
      <SeriesView series={series} dates={events.map((e) => summariseEvent(e, sales, tiers, asOf))} currency={ctx.org.currency} base="/dashboard" asOf={asOf} controls={<SeriesControls seriesId={id} name={series.name} />} addForm={<AddDatesForm seriesId={id} />} />
    </>
  );
}
