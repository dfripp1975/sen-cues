import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { aiCreditsUsed, hasFeature } from "@/lib/entitlements";
import { listCampaigns, listEvents } from "@/lib/data/queries";
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, TONES, type ContentType } from "@/lib/ai";
import { isAiConfigured } from "@/lib/env";
import { Alert, EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ContentStudio, SavedContentItem } from "@/components/content/studio";

export const metadata: Metadata = { title: "AI Content Studio" };

export default async function ContentPage() {
  const ctx = await requireOrg();
  const [events, campaigns, used, saved] = await Promise.all([
    listEvents(ctx),
    listCampaigns(ctx),
    aiCreditsUsed(ctx),
    ctx.supabase.from("ai_content").select("id, body, content_type, platform, is_demo, event_id, campaign_id, created_at").eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const allowed = hasFeature(ctx, "aiContent");
  const ai = isAiConfigured();
  return (
    <>
      <PageHeader title="AI Content Studio" description="Draft promotional copy from your event details. Everything is editable, and the AI is instructed never to invent facts." />
      {!allowed && <Alert tone="info" className="mb-6" title="AI generation is on Starter and above" action={<Button asChild size="sm"><Link href="/dashboard/settings/billing">See plans</Link></Button>}>You can still insert labelled example templates{ai ? " once you upgrade" : ""} and save your own copy.</Alert>}
      {events.length === 0 ? (
        <EmptyState icon={Sparkles} title="Create an event first" description="The Content Studio uses your event's details to draft copy." action={<Button asChild><Link href="/dashboard/events/new">Create event</Link></Button>} />
      ) : (
        <ContentStudio events={events.map((e) => ({ id: e.id, name: e.name }))} campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, event_id: c.event_id }))} contentTypes={CONTENT_TYPES.map(([v, l]) => [v, l])} tones={TONES} aiAvailable={ai} allowed={allowed} creditsLeft={Math.max(0, ctx.plan.aiCreditsPerMonth - used)} />
      )}
      <h2 className="mb-3 mt-10 text-lg font-bold">Saved content</h2>
      {saved.data?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">{saved.data.map((i) => <SavedContentItem key={i.id} item={i} label={CONTENT_TYPE_LABELS[i.content_type as ContentType] ?? i.content_type} />)}</ul>
      ) : (
        <p className="text-sm text-slate-500">Nothing saved yet.</p>
      )}
    </>
  );
}
