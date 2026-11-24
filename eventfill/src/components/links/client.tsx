"use client";
import * as React from "react";
import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionButton, ConfirmButton, Modal } from "@/components/ui/confirm";
import { createLink, deleteLink, toggleLink } from "@/app/dashboard/links/actions";
import { CHANNELS, CHANNEL_LABELS, CHANNEL_MEDIUM } from "@/lib/tracking";

type Ev = { id: string; name: string; booking_url: string | null };

export function NewLinkButton({ events, campaigns }: { events: Ev[]; campaigns: { id: string; name: string; event_id: string | null; channel: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [eventId, setEventId] = React.useState(events[0]?.id ?? "");
  const [channel, setChannel] = React.useState<string>("instagram");
  const ev = events.find((e) => e.id === eventId);
  const slug = (ev?.name ?? "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return (
    <Modal open={open} onOpenChange={setOpen} title="New tracking link" description="Create one link per channel so you can compare where interest comes from." trigger={<Button><Plus /> New link</Button>}>
      <ActionForm action={createLink} onSuccess={() => setOpen(false)} className="grid gap-4 sm:grid-cols-2" key={`${eventId}-${channel}`}>
        <FormField name="event_id" label="Event"><Select value={eventId} onChange={(e) => setEventId(e.target.value)}><option value="">No event</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormField>
        <div>
          <label htmlFor="channel-pick" className="mb-1.5 block text-sm font-medium text-slate-700">Channel</label>
          <Select id="channel-pick" value={channel} onChange={(e) => setChannel(e.target.value)}>{CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}</Select>
        </div>
        <FormField name="label" label="Link name" className="sm:col-span-2"><Input required defaultValue={`${CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS]}${ev ? ` – ${ev.name}` : ""}`} /></FormField>
        <FormField name="destination_url" label="Destination (your booking page)" className="sm:col-span-2"><Input type="url" required defaultValue={ev?.booking_url ?? ""} placeholder="https://" /></FormField>
        <FormField name="campaign_id" label="Campaign (optional)" className="sm:col-span-2"><Select defaultValue=""><option value="">None</option>{campaigns.filter((c) => !eventId || c.event_id === eventId || !c.event_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormField>
        <FormField name="utm_source" label="utm_source"><Input defaultValue={channel} /></FormField>
        <FormField name="utm_medium" label="utm_medium"><Input defaultValue={CHANNEL_MEDIUM[channel as keyof typeof CHANNEL_MEDIUM]} /></FormField>
        <FormField name="utm_campaign" label="utm_campaign"><Input defaultValue={slug} /></FormField>
        <FormField name="utm_content" label="utm_content (optional)"><Input /></FormField>
        <div className="sm:col-span-2"><SubmitButton className="w-full">Create link</SubmitButton></div>
      </ActionForm>
    </Modal>
  );
}

export function LinkActions({ id, active }: { id: string; active: boolean }) {
  return (
    <div className="flex">
      <ActionButton variant="ghost" size="icon" aria-label={active ? "Pause link" : "Activate link"} onAction={() => toggleLink(id, !active)}>{active ? <Pause /> : <Play />}</ActionButton>
      <ConfirmButton variant="ghost" size="icon" aria-label="Delete link" title="Delete this link?" description="The short link will stop working and its click history will be deleted." confirmLabel="Delete" onConfirm={() => deleteLink(id)}><Trash2 /></ConfirmButton>
    </div>
  );
}

export function QrDownload({ dataUrl, name }: { dataUrl: string; name: string }) {
  return <a href={dataUrl} download={`${name.replace(/[^a-z0-9]+/gi, "-")}-qr.svg`} className="text-xs font-semibold text-brand-600 hover:underline">Download QR</a>;
}
