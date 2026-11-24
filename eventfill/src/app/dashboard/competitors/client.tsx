"use client";
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConfirmButton, Modal } from "@/components/ui/confirm";
import { addCompetitor, deleteCompetitor } from "./actions";

export function AddCompetitorButton({ events, defaultEvent, currency }: { events: { id: string; name: string }[]; defaultEvent?: string; currency: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal open={open} onOpenChange={setOpen} title="Add a competing event" description="Enter publicly advertised details yourself. EventFill doesn't scrape other websites." trigger={<Button><Plus /> Add competitor</Button>}>
      <ActionForm action={addCompetitor} onSuccess={() => setOpen(false)} className="grid gap-4 sm:grid-cols-2">
        <FormField name="event_id" label="Compare with your event" className="sm:col-span-2"><Select defaultValue={defaultEvent ?? ""}><option value="">Not linked</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormField>
        <FormField name="title" label="Competing event title" className="sm:col-span-2"><Input required /></FormField>
        <FormField name="url" label="Event URL" className="sm:col-span-2"><Input type="url" placeholder="https://" /></FormField>
        <FormField name="event_date" label="Event date"><Input type="date" /></FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField name="price_min" label={`From (${currency})`}><Input type="number" min={0} step="0.01" /></FormField>
          <FormField name="price_max" label={`To (${currency})`}><Input type="number" min={0} step="0.01" /></FormField>
        </div>
        <FormField name="description" label="Their description (summary)" className="sm:col-span-2"><Textarea rows={3} /></FormField>
        <FormField name="benefits" label="Advertised benefits" className="sm:col-span-2" hint="e.g. free drinks, CPD certificate, speaker line-up"><Textarea rows={2} /></FormField>
        <FormField name="notes" label="Your positioning notes" className="sm:col-span-2"><Textarea rows={2} /></FormField>
        <div className="sm:col-span-2"><SubmitButton className="w-full">Save competitor</SubmitButton></div>
      </ActionForm>
    </Modal>
  );
}

export function DeleteCompetitor({ id }: { id: string }) {
  return <ConfirmButton variant="ghost" size="icon" aria-label="Remove competitor" title="Remove this competitor?" description="This only removes your notes from EventFill." confirmLabel="Remove" onConfirm={() => deleteCompetitor(id)}><Trash2 /></ConfirmButton>;
}
