import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { getEvent, listCampaigns, listClicks, listLinks, listMoney, listRescueActions, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { summariseResponses, type Answers } from "@/lib/surveys";
import { today } from "@/lib/dates";
import { ReportView } from "@/components/events/report-view";
import type { SurveyQuestion } from "@/lib/validation";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const [sales, tiers, money, campaigns, links, rescue, surveysRes] = await Promise.all([
    listSales(ctx, [id]), listTiers(ctx, [id]), listMoney(ctx, id), listCampaigns(ctx, id), listLinks(ctx, id), listRescueActions(ctx, id),
    ctx.supabase.from("surveys").select("id, title, questions, survey_responses(answers)").eq("event_id", id).eq("org_id", ctx.org.id),
  ]);
  const clicks = await listClicks(ctx, links.map((l) => l.id));
  const clicksByLink: Record<string, number> = {};
  for (const c of clicks) clicksByLink[c.link_id] = (clicksByLink[c.link_id] ?? 0) + 1;
  const surveys = (surveysRes.data ?? []).map((sv) => {
    const responses = (sv.survey_responses as { answers: Answers }[]).map((r) => r.answers);
    const summary = summariseResponses(sv.questions as SurveyQuestion[], responses);
    const rating = summary.find((x) => x.average != null);
    return { title: sv.title as string, responses: responses.length, avgRating: rating?.average ?? null };
  });
  return <ReportView s={summariseEvent(event, sales, tiers, today())} sales={sales} income={money.income} expenses={money.expenses} campaigns={campaigns} links={links} clicksByLink={clicksByLink} rescue={rescue} surveys={surveys} currency={ctx.org.currency} orgName={ctx.org.name} advanced={hasFeature(ctx, "advancedReporting")} exportHref={`/dashboard/events/${id}/sales/export`} />;
}
