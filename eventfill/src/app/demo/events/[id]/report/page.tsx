import { ReportView } from "@/components/events/report-view";
import { demoEvent } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = demoEvent((await params).id);
  const clicksByLink: Record<string, number> = {};
  for (const c of d.clicks) clicksByLink[c.link_id] = (clicksByLink[c.link_id] ?? 0) + 1;
  return <ReportView s={d.s} sales={d.sales} income={d.income} expenses={d.expenses} campaigns={d.campaigns} links={d.links} clicksByLink={clicksByLink} rescue={d.rescue} surveys={[]} currency="GBP" orgName={d.org.name} advanced isDemo />;
}
