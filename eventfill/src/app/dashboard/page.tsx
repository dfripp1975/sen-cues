import { requireOrg } from "@/lib/auth";
import { listCampaigns, listEvents, listSales, listTasks, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { DashboardOverview } from "@/components/dashboard/overview";
import { Alert } from "@/components/ui/misc";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ event?: string; range?: string; passwordUpdated?: string; checkout?: string }> }) {
  const ctx = await requireOrg();
  const sp = await searchParams;
  const [events, tasks, campaigns] = await Promise.all([listEvents(ctx), listTasks(ctx, { openOnly: true }), listCampaigns(ctx)]);
  const ids = events.map((e) => e.id);
  const [sales, tiers] = await Promise.all([listSales(ctx, ids), listTiers(ctx, ids)]);
  const asOf = today();
  const summaries = events.map((e) => summariseEvent(e, sales, tiers, asOf));
  return (
    <>
      {sp.passwordUpdated && <Alert tone="success" className="mb-6">Your password has been updated.</Alert>}
      <DashboardOverview base="/dashboard" greetingName={ctx.user.fullName} currency={ctx.org.currency} summaries={summaries} sales={sales} tasks={tasks} campaigns={campaigns} asOf={asOf} selectedEvent={sp.event} range={sp.range} />
    </>
  );
}
