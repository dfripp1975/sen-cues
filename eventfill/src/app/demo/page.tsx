import { DashboardOverview } from "@/components/dashboard/overview";
import { demoContext } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function DemoOverview({ searchParams }: { searchParams: Promise<{ event?: string; range?: string }> }) {
  const sp = await searchParams;
  const d = demoContext();
  return <DashboardOverview base="/demo" isDemo currency="GBP" summaries={d.summaries} sales={d.sales} tasks={d.tasks} campaigns={d.campaigns} asOf={d.asOf} selectedEvent={sp.event} range={sp.range} />;
}
