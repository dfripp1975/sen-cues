import type { Metadata } from "next";
import { requireOrg } from "@/lib/auth";
import { countActiveEvents } from "@/lib/entitlements";
import { listEvents } from "@/lib/data/queries";
import { EventForm } from "@/components/events/event-form";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createEvent } from "../actions";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ template?: string; welcome?: string }> }) {
  const ctx = await requireOrg();
  const sp = await searchParams;
  const [active, templates] = await Promise.all([countActiveEvents(ctx), listEvents(ctx, { templates: true })]);
  const template = templates.find((t) => t.id === sp.template);
  const atLimit = active >= ctx.plan.activeEvents;
  return (
    <>
      <PageHeader title={sp.welcome ? "Create your first event" : "New event"} description={sp.welcome ? "You're all set up. Add your first event to start tracking sales and planning promotion." : `${active} of ${ctx.plan.activeEvents} active events used on the ${ctx.plan.name} plan.`} />
      {atLimit && (
        <Alert tone="warning" className="mb-6" title="You've reached your active event limit" action={<Button asChild size="sm"><Link href="/dashboard/settings/billing">Upgrade</Link></Button>}>
          Archive or complete an event, save this as a template, or upgrade to add more active events.
        </Alert>
      )}
      {templates.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Start from a template:</span>
          {templates.map((t) => (
            <Link key={t.id} href={`/dashboard/events/new?template=${t.id}`} className={`rounded-full px-3 py-1 ring-1 ${t.id === sp.template ? "bg-brand-600 text-white ring-brand-600" : "bg-white ring-slate-300 hover:ring-brand-400"}`}>{t.name}</Link>
          ))}
        </div>
      )}
      <EventForm key={template?.id ?? "blank"} action={createEvent} isNew defaultTimezone={ctx.org.timezone} defaultPlatform={ctx.org.ticketing_platform} currency={ctx.org.currency} event={template ? { ...template, is_template: false, event_date: undefined, status: "active" } : undefined} />
    </>
  );
}
