import { requireOrg } from "@/lib/auth";
import { getEvent } from "@/lib/data/queries";
import { EventHeader } from "@/components/events/event-header";
import { EventTabs } from "@/components/events/event-tabs";
import { EventActions } from "@/components/events/event-actions";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const { data: series } = event.series_id ? await ctx.supabase.from("event_series").select("name").eq("id", event.series_id).eq("org_id", ctx.org.id).maybeSingle() : { data: null };
  return (
    <>
      <EventHeader event={event} base="/dashboard" seriesName={series?.name} actions={<EventActions id={event.id} status={event.status} />} />
      <EventTabs base={`/dashboard/events/${event.id}`} />
      {children}
    </>
  );
}
