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
  return (
    <>
      {sp.duplicated && <Alert tone="success" className="mb-6">Event duplicated as a draft. Update the details and save.</Alert>}
      <EventForm action={updateEvent.bind(null, id)} event={event} defaultTimezone={ctx.org.timezone} currency={ctx.org.currency} />
    </>
  );
}
