import { requireOrg } from "@/lib/auth";
import { getEvent, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { EventOverviewView } from "@/components/events/views";
import { DeleteTierButton, ImageUploadForm, OutcomeForm, TierForm } from "@/components/events/forms";
import { Alert } from "@/components/ui/misc";

export default async function EventOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; saved?: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const sp = await searchParams;
  const event = await getEvent(ctx, id);
  const [sales, tiers] = await Promise.all([listSales(ctx, [id]), listTiers(ctx, [id])]);
  const s = summariseEvent(event, sales, tiers, today());
  return (
    <>
      {sp.created && <Alert tone="success" className="mb-6" title="Event created">Next, add your ticket tiers below and record your first sales on the Sales tab.</Alert>}
      {sp.saved && <Alert tone="success" className="mb-6">Changes saved.</Alert>}
      <EventOverviewView
        s={s}
        sales={sales}
        tiers={tiers}
        currency={ctx.org.currency}
        base="/dashboard"
        tierForm={<TierForm eventId={id} currency={ctx.org.currency} />}
        tierAction={(tierId) => <DeleteTierButton eventId={id} tierId={tierId} />}
        imageForm={<ImageUploadForm eventId={id} />}
        outcomeForm={<OutcomeForm eventId={id} attendance={event.attendance} lessons={event.lessons_learned} />}
      />
    </>
  );
}
