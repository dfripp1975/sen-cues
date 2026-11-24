import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { getEvent, listCampaigns, listClicks, listLinks, listMembers, listRescueActions, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { generateRecommendations } from "@/lib/rescue";
import { buildChannelStats } from "@/lib/channel-stats";
import { today } from "@/lib/dates";
import { RescueView } from "@/components/events/rescue-view";
import { RescueActionControls, RescuePlanner } from "@/components/events/rescue-client";

export default async function RescuePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const asOf = today();
  const [sales, tiers, actions, campaigns, links, members] = await Promise.all([listSales(ctx, [id]), listTiers(ctx, [id]), listRescueActions(ctx, id), listCampaigns(ctx, id), listLinks(ctx, id), listMembers(ctx)]);
  const clicks = await listClicks(ctx, links.map((l) => l.id));
  const s = summariseEvent(event, sales, tiers, asOf);
  const channels = buildChannelStats(campaigns, links, clicks);
  const recs = generateRecommendations({ ...event, lowestPrice: s.lowestPrice }, s.forecast, s.risk, channels);
  return (
    <RescueView
      s={s}
      recs={recs}
      actions={actions}
      sales={sales}
      asOf={asOf}
      allowed={hasFeature(ctx, "rescueMode")}
      planner={<RescuePlanner eventId={id} recs={recs} existingKeys={actions.filter((a) => a.status !== "done").map((a) => a.recommendation_key ?? "")} />}
      controls={(a) => <RescueActionControls eventId={id} action={a} members={members} />}
    />
  );
}
