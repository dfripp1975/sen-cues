import { notFound } from "next/navigation";
import { SeriesView } from "@/components/events/series-view";
import { demoContext } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function DemoSeries({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = demoContext();
  const series = d.series.find((s) => s.id === id);
  if (!series) notFound();
  return <SeriesView series={series} dates={d.summaries.filter((s) => s.event.series_id === id)} currency="GBP" base="/demo" asOf={d.asOf} isDemo />;
}
