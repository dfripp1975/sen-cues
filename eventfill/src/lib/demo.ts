import { notFound } from "next/navigation";
import { buildDemo } from "./demo-data";
import { summariseEvent } from "./event-summary";
import { today } from "./dates";

export function demoContext() {
  const asOf = today();
  const d = buildDemo(asOf);
  const summaries = d.events.map((e) => summariseEvent(e, d.sales, d.tiers, asOf));
  return { ...d, asOf, summaries };
}

export function demoEvent(id: string) {
  const ctx = demoContext();
  const s = ctx.summaries.find((x) => x.event.id === id);
  if (!s) notFound();
  return {
    ...ctx,
    s,
    sales: ctx.sales.filter((x) => x.event_id === id),
    tiers: ctx.tiers.filter((x) => x.event_id === id),
    income: ctx.income.filter((x) => x.event_id === id),
    expenses: ctx.expenses.filter((x) => x.event_id === id),
    campaigns: ctx.campaigns.filter((x) => x.event_id === id),
    links: ctx.links.filter((x) => x.event_id === id),
    rescue: ctx.rescueActions.filter((x) => x.event_id === id),
  };
}
