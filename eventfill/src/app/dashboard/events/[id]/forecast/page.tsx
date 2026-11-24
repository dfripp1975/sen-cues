import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { getEvent, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { ForecastView } from "@/components/events/views";
import { SnapshotButton } from "./snapshot-button";

export default async function ForecastPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const [sales, tiers] = await Promise.all([listSales(ctx, [id]), listTiers(ctx, [id])]);
  const asOf = today();
  const { data: snapshots } = await ctx.supabase.from("sales_forecasts").select("created_at, conservative, expected, optimistic").eq("event_id", id).eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(20);
  return <ForecastView s={summariseEvent(event, sales, tiers, asOf)} sales={sales} asOf={asOf} allowed={hasFeature(ctx, "forecasting")} snapshots={snapshots ?? []} snapshotButton={<SnapshotButton eventId={id} />} />;
}
