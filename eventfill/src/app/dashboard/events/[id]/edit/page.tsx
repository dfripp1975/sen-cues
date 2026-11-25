import { requireOrg } from "@/lib/auth";
import { getEvent } from "@/lib/data/queries";
import { EventForm } from "@/components/events/event-form";
import { Alert } from "@/components/ui/misc";
import { updateEvent } from "../../actions";

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ duplicated?: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const sp = await searchParams;
  const event = await getEvent(ctx, id);
  const { data: series } = event.series_id ? await ctx.supabase.from("event_series").select("name").eq("id", event.series_id).eq("org_id", ctx.org.id).maybeSingle() : { data: null };
  return (
    <>
      {sp.duplicated && <Alert tone="success" className="mb-6">Event duplicated as a draft. Update the details and save.</Alert>}
      <EventForm action={updateEvent.bind(null, id)} event={event} defaultTimezone={ctx.org.timezone} currency={ctx.org.currency} seriesName={series?.name ?? null} />
    </>
  );
}
