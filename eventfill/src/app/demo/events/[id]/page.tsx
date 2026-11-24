import { EventOverviewView } from "@/components/events/views";
import { demoEvent } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = demoEvent((await params).id);
  return <EventOverviewView s={d.s} sales={d.sales} tiers={d.tiers} currency="GBP" base="/demo" isDemo />;
}
