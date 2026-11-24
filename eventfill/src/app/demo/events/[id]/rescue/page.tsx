import { RescueView } from "@/components/events/rescue-view";
import { RescuePlanner } from "@/components/events/rescue-client";
import { generateRecommendations } from "@/lib/rescue";
import { buildChannelStats } from "@/lib/channel-stats";
import { demoEvent } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const d = demoEvent(id);
  const channels = buildChannelStats(d.campaigns, d.links, d.clicks);
  const recs = generateRecommendations({ ...d.s.event, lowestPrice: d.s.lowestPrice }, d.s.forecast, d.s.risk, channels);
  return <RescueView s={d.s} recs={recs} actions={d.rescue} sales={d.sales} asOf={d.asOf} allowed isDemo planner={<RescuePlanner eventId={id} recs={recs} existingKeys={d.rescue.map((a) => a.recommendation_key ?? "")} readOnly />} memberName={() => "Demo user"} />;
}
