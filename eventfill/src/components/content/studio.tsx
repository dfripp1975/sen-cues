"use client";
import * as React from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Save, Sparkles, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/confirm";
import { deleteContent, generateAction, saveContent } from "@/app/dashboard/content/actions";

const OBJECTIVES = ["Sell more tickets", "Announce the event", "Last-chance reminder", "Build awareness", "Recruit partners or sponsors", "Thank attendees / follow up"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "TikTok", "Email", "Website / listing", "WhatsApp / message", "Other"];

type Opt = { id: string; name: string };

export function ContentStudio({ events, campaigns, contentTypes, tones, aiAvailable, allowed, creditsLeft }: { events: Opt[]; campaigns: (Opt & { event_id: string | null })[]; contentTypes: [string, string][]; tones: string[]; aiAvailable: boolean; allowed: boolean; creditsLeft: number }) {
  const [form, setForm] = React.useState({ eventId: events[0]?.id ?? "", contentType: "instagram_caption", audience: "", platform: "Instagram", tone: tones[0], objective: OBJECTIVES[0], keyInfo: "" });
  const [text, setText] = React.useState("");
  const [isExample, setIsExample] = React.useState(false);
  const [campaignId, setCampaignId] = React.useState("");
  const [credits, setCredits] = React.useState(creditsLeft);
  const [pending, start] = React.useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = (opts: { variation?: boolean; example?: boolean }) =>
    start(async () => {
      const res = await generateAction({ ...form, variationOf: opts.variation ? text : null, exampleOnly: opts.example });
      if (!res.ok) return void toast.error(res.error);
      const d = res.data as { text: string; isExample: boolean; creditsLeft?: number };
      setText(d.text);
      setIsExample(d.isExample);
      if (d.creditsLeft !== undefined) setCredits(d.creditsLeft);
    });

  const canGenerate = allowed && aiAvailable && credits > 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
        <div><Label htmlFor="ev">Event</Label><Select id="ev" value={form.eventId} onChange={set("eventId")}>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></div>
        <div><Label htmlFor="ct">What do you need?</Label><Select id="ct" value={form.contentType} onChange={set("contentType")}>{contentTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="pl">Platform</Label><Select id="pl" value={form.platform} onChange={set("platform")}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select></div>
          <div><Label htmlFor="tn">Tone</Label><Select id="tn" value={form.tone} onChange={set("tone")}>{tones.map((t) => <option key={t}>{t}</option>)}</Select></div>
        </div>
        <div><Label htmlFor="au">Target audience</Label><Input id="au" value={form.audience} onChange={set("audience")} placeholder="e.g. Local founders and freelancers" maxLength={300} /></div>
        <div><Label htmlFor="ob">Promotional objective</Label><Select id="ob" value={form.objective} onChange={set("objective")}>{OBJECTIVES.map((o) => <option key={o}>{o}</option>)}</Select></div>
        <div><Label htmlFor="ki">Important event information</Label><Textarea id="ki" value={form.keyInfo} onChange={set("keyInfo")} rows={4} maxLength={1500} placeholder="Speakers, what's included, price, deadlines (only real ones), accessibility…" /></div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending || !canGenerate || !form.eventId} onClick={() => run({})}>{pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate</Button>
          {!aiAvailable && <Button variant="secondary" disabled={pending || !form.eventId} onClick={() => run({ example: true })}><FileText /> Insert example template</Button>}
        </div>
        <p className="text-xs text-slate-500">
          {!allowed ? "AI generation is available on Starter and above." : !aiAvailable ? "AI generation isn't configured on this server. Example templates are not AI-generated." : `${credits} AI credit(s) left this month. Each generation or variation uses 1 credit.`}
        </p>
      </div>
      <div className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Draft</h2>
          {text && (isExample ? <Badge tone="warning">Example template — not AI</Badge> : <Badge tone="brand">AI draft — review before use</Badge>)}
        </div>
        <Textarea aria-label="Generated content" value={text} onChange={(e) => setText(e.target.value)} className="mt-3 min-h-72 flex-1 font-mono text-[13px] leading-relaxed" placeholder="Your editable draft will appear here." />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" disabled={!text} onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Couldn't copy"); } }}><Copy /> Copy</Button>
          <Button variant="secondary" size="sm" disabled={!text || pending || !canGenerate || isExample} onClick={() => run({ variation: true })}><RefreshCw /> Generate variation</Button>
          <Select aria-label="Add to campaign" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="h-8 w-48 text-xs">
            <option value="">Save to library only</option>
            {campaigns.filter((c) => !c.event_id || c.event_id === form.eventId).map((c) => <option key={c.id} value={c.id}>Add to: {c.name}</option>)}
          </Select>
          <Button size="sm" disabled={!text || pending} onClick={() => start(async () => { const r = await saveContent({ eventId: form.eventId || null, campaignId: campaignId || null, contentType: form.contentType, platform: form.platform, tone: form.tone, body: text, isExample }); if (r.ok) toast.success(r.message); else toast.error(r.error); })}><Save /> Save</Button>
        </div>
      </div>
    </div>
  );
}

export function SavedContentItem({ item, label }: { item: { id: string; body: string; content_type: string; platform: string | null; is_demo: boolean; event_id: string | null; campaign_id: string | null }; label: string }) {
  const [body, setBody] = React.useState(item.body);
  const [pending, start] = React.useTransition();
  return (
    <li className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">{label}</Badge>
        {item.platform && <Badge>{item.platform}</Badge>}
        {item.is_demo && <Badge tone="warning">Example template</Badge>}
      </div>
      <Textarea aria-label="Saved content" value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-3 text-sm" />
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="secondary" disabled={pending || body === item.body} onClick={() => start(async () => { const r = await saveContent({ id: item.id, eventId: item.event_id, campaignId: item.campaign_id, contentType: item.content_type, platform: item.platform ?? undefined, body, isExample: item.is_demo }); if (r.ok) toast.success("Updated"); else toast.error(r.error); })}><Save /> Save edits</Button>
        <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(body); toast.success("Copied"); } catch { toast.error("Couldn't copy"); } }}><Copy /> Copy</Button>
        <ActionButton size="sm" variant="ghost" onAction={() => deleteContent(item.id)}><Trash2 /> Delete</ActionButton>
      </div>
    </li>
  );
}
