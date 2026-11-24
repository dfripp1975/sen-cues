"use client";
import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionButton, Modal } from "@/components/ui/confirm";
import { applyTemplate, createCampaign, createTask, deleteCampaign, deleteTask, setTaskStatus, updateCampaignStatus } from "@/app/dashboard/campaigns/actions";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/tracking";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";

type Opt = { id: string; name: string };

export function NewCampaignButton({ events, currency }: { events: Opt[]; currency: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal open={open} onOpenChange={setOpen} title="New campaign" trigger={<Button><Plus /> New campaign</Button>}>
      <ActionForm action={createCampaign} onSuccess={() => setOpen(false)} className="grid gap-4 sm:grid-cols-2">
        <FormField name="name" label="Campaign name" className="sm:col-span-2"><Input required /></FormField>
        <FormField name="event_id" label="Event"><Select defaultValue=""><option value="">All events / general</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormField>
        <FormField name="channel" label="Channel"><Select defaultValue="instagram">{CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}</Select></FormField>
        <FormField name="start_date" label="Start date"><Input type="date" /></FormField>
        <FormField name="end_date" label="End date"><Input type="date" /></FormField>
        <FormField name="budget" label={`Budget (${currency})`}><Input type="number" min={0} step="0.01" defaultValue={0} /></FormField>
        <FormField name="status" label="Status"><Select defaultValue="planned"><option value="planned">Planned</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></Select></FormField>
        <FormField name="notes" label="Notes" className="sm:col-span-2"><Textarea rows={3} /></FormField>
        <div className="sm:col-span-2"><SubmitButton className="w-full">Create campaign</SubmitButton></div>
      </ActionForm>
    </Modal>
  );
}

export function TemplateButton({ events }: { events: Opt[] }) {
  const [open, setOpen] = React.useState(false);
  const [tpl, setTpl] = React.useState("networking");
  return (
    <Modal open={open} onOpenChange={setOpen} title="Use a ready-made promotional plan" description="Creates a campaign and dated tasks counted back from your event date." trigger={<Button variant="secondary">Ready-made plans</Button>}>
      <ActionForm action={applyTemplate} onSuccess={() => setOpen(false)} className="space-y-4">
        <FormField name="event_id" label="Event"><Select required defaultValue="">{[<option key="" value="" disabled>Choose an event</option>, ...events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)]}</Select></FormField>
        <FormField name="template" label="Plan"><Select value={tpl} onChange={(e) => setTpl(e.target.value)}>{Object.entries(CAMPAIGN_TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</Select></FormField>
        <div className="rounded-xl bg-canvas p-4 text-sm ring-1 ring-slate-200">
          <p className="text-slate-600">{CAMPAIGN_TEMPLATES[tpl].summary}</p>
          <ul className="mt-3 space-y-1.5">
            {CAMPAIGN_TEMPLATES[tpl].tasks.map((t) => <li key={t.title} className="flex gap-2"><span className="w-14 shrink-0 text-xs font-semibold text-brand-600">−{t.offset} days</span><span>{t.title}</span></li>)}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Tasks whose dates have already passed are scheduled for today. Nothing is posted automatically.</p>
        </div>
        <SubmitButton className="w-full">Add plan</SubmitButton>
      </ActionForm>
    </Modal>
  );
}

export function TaskForm({ events, campaigns }: { events: Opt[]; campaigns: Opt[] }) {
  return (
    <ActionForm action={createTask} resetOnSuccess className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
      <FormField name="title" label="Task"><Input required placeholder="e.g. Post speaker announcement" /></FormField>
      <FormField name="event_id" label="Event"><Select defaultValue=""><option value="">General</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormField>
      <FormField name="campaign_id" label="Campaign"><Select defaultValue=""><option value="">None</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormField>
      <FormField name="due_date" label="Deadline"><Input type="date" /></FormField>
      <SubmitButton>Add task</SubmitButton>
    </ActionForm>
  );
}

export function TaskCheckbox({ id, status, label }: { id: string; status: string; label: string }) {
  const [pending, start] = React.useTransition();
  return (
    <input
      type="checkbox"
      aria-label={`Mark "${label}" ${status === "done" ? "not done" : "done"}`}
      className="size-4 cursor-pointer accent-brand-600"
      checked={status === "done"}
      disabled={pending}
      onChange={(e) => start(async () => { const r = await setTaskStatus(id, e.target.checked ? "done" : "todo"); if (!r.ok) toast.error(r.error); })}
    />
  );
}

export function DeleteTaskButton({ id }: { id: string }) {
  return <ActionButton variant="ghost" size="icon" aria-label="Delete task" onAction={() => deleteTask(id)}><Trash2 /></ActionButton>;
}

export function CampaignStatus({ id, status }: { id: string; status: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Select aria-label="Campaign status" className="h-8 w-32 text-xs" value={status} disabled={pending} onChange={(e) => start(async () => { const r = await updateCampaignStatus(id, e.target.value); if (!r.ok) toast.error(r.error); })}>
      <option value="planned">Planned</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
    </Select>
  );
}

export function DeleteCampaignButton({ id }: { id: string }) {
  return <ActionButton variant="ghost" size="icon" aria-label="Delete campaign" onAction={() => deleteCampaign(id)}><Trash2 /></ActionButton>;
}
