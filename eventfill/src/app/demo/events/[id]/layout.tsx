import { EventHeader } from "@/components/events/event-header";
import { EventTabs } from "@/components/events/event-tabs";
import { DemoBadge } from "@/components/ui/badge";
import { demoEvent } from "@/lib/demo";

export default async function DemoEventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { s, series } = demoEvent(id);
  return (
    <>
      <EventHeader event={s.event} base="/demo" eyebrow={<DemoBadge />} seriesName={series.find((x) => x.id === s.event.series_id)?.name} />
      <EventTabs base={`/demo/events/${id}`} showEdit={false} />
      {children}
    </>
  );
}
