"use client";
import * as React from "react";
import { Trash2, Upload } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { ActionButton } from "@/components/ui/confirm";
import { addMoneyLine, addSale, addTier, deleteMoneyLine, deleteSale, deleteTier, importSalesCsv, saveOutcome, uploadEventImage } from "@/app/dashboard/events/actions";
import { today } from "@/lib/dates";
import type { TierRow } from "@/types/db";

export function TierForm({ eventId, currency }: { eventId: string; currency: string }) {
  return (
    <ActionForm action={addTier.bind(null, eventId)} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
      <FormField name="name" label="Tier name"><Input placeholder="e.g. Early bird" required /></FormField>
      <FormField name="price" label={`Price (${currency})`}><Input type="number" min={0} step="0.01" required /></FormField>
      <FormField name="quantity" label="Quantity"><Input type="number" min={0} /></FormField>
      <SubmitButton variant="secondary">Add tier</SubmitButton>
    </ActionForm>
  );
}

export function DeleteTierButton({ eventId, tierId }: { eventId: string; tierId: string }) {
  return (
    <ActionButton variant="ghost" size="icon" aria-label="Remove tier" onAction={() => deleteTier(eventId, tierId)}>
      <Trash2 />
    </ActionButton>
  );
}

export function SaleForm({ eventId, tiers, currency }: { eventId: string; tiers: TierRow[]; currency: string }) {
  const [tier, setTier] = React.useState("");
  const [qty, setQty] = React.useState("");
  const price = tiers.find((t) => t.id === tier)?.price;
  return (
    <ActionForm action={addSale.bind(null, eventId)} resetOnSuccess onSuccess={() => { setQty(""); setTier(""); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <FormField name="sale_date" label="Date"><Input type="date" defaultValue={today()} max={today()} required /></FormField>
      <FormField name="tier_id" label="Ticket tier">
        <Select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All / unspecified</option>
          {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </FormField>
      <FormField name="quantity" label="Tickets sold"><Input type="number" min={0} required value={qty} onChange={(e) => setQty(e.target.value)} /></FormField>
      <FormField name="revenue" label={`Revenue (${currency})`} hint={price !== undefined && qty ? `Suggested: ${(Number(qty) * price).toFixed(2)}` : undefined}>
        <Input type="number" min={0} step="0.01" key={`${tier}-${qty}`} defaultValue={price !== undefined && qty ? (Number(qty) * price).toFixed(2) : ""} required />
      </FormField>
      <FormField name="refunds" label="Tickets refunded"><Input type="number" min={0} defaultValue={0} /></FormField>
      <FormField name="refund_amount" label={`Refund amount (${currency})`}><Input type="number" min={0} step="0.01" defaultValue={0} /></FormField>
      <FormField name="note" label="Note (optional)" className="sm:col-span-2"><Input maxLength={300} /></FormField>
      <div className="flex items-end"><SubmitButton className="w-full">Record sales</SubmitButton></div>
    </ActionForm>
  );
}

export function DeleteSaleButton({ eventId, saleId }: { eventId: string; saleId: string }) {
  return (
    <ActionButton variant="ghost" size="icon" aria-label="Delete entry" onAction={() => deleteSale(eventId, saleId)}>
      <Trash2 />
    </ActionButton>
  );
}

export function CsvImportForm({ eventId }: { eventId: string }) {
  return (
    <ActionForm action={importSalesCsv.bind(null, eventId)} resetOnSuccess className="space-y-3">
      <FormField name="file" label="CSV file" hint="Needs date and quantity columns. Optional: revenue/total, ticket type, refunds, refund amount. Max 1 MB.">
        <Input type="file" accept=".csv,text/csv" required className="h-auto py-2" />
      </FormField>
      <Checkbox name="replace" label="Replace previously imported CSV data for this event (manual entries are kept)" />
      <SubmitButton variant="secondary" pendingText="Importing…"><Upload /> Import CSV</SubmitButton>
    </ActionForm>
  );
}

export function ImageUploadForm({ eventId }: { eventId: string }) {
  return (
    <ActionForm action={uploadEventImage.bind(null, eventId)} resetOnSuccess className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <FormField name="image" label="Event image" hint="JPG, PNG or WebP up to 2 MB." className="flex-1">
        <Input type="file" accept="image/jpeg,image/png,image/webp" className="h-auto py-2" />
      </FormField>
      <SubmitButton variant="secondary" pendingText="Uploading…">Upload</SubmitButton>
    </ActionForm>
  );
}

export function OutcomeForm({ eventId, attendance, lessons }: { eventId: string; attendance: number | null; lessons: string | null }) {
  return (
    <ActionForm action={saveOutcome.bind(null, eventId)} className="space-y-3">
      <FormField name="attendance" label="Recorded attendance" hint="How many people actually attended (if you counted)."><Input type="number" min={0} defaultValue={attendance ?? ""} /></FormField>
      <FormField name="lessons_learned" label="Lessons for future events"><Textarea defaultValue={lessons ?? ""} rows={4} /></FormField>
      <SubmitButton variant="secondary">Save outcome</SubmitButton>
    </ActionForm>
  );
}

const INCOME = [["sponsorship", "Sponsorship"], ["exhibitor", "Exhibitor fees"], ["other", "Other income"]];
const EXPENSES = [["venue", "Venue hire"], ["catering", "Catering"], ["staff", "Staff"], ["entertainment", "Entertainment"], ["equipment", "Equipment"], ["marketing", "Marketing"], ["ticketing_fees", "Ticketing fees"], ["suppliers", "Suppliers"], ["other", "Other"]];
export const MONEY_LABELS: Record<string, string> = Object.fromEntries([...INCOME, ...EXPENSES]);

export function MoneyLineForm({ eventId, kind, currency }: { eventId: string; kind: "income" | "expense"; currency: string }) {
  const cats = kind === "income" ? INCOME : EXPENSES;
  return (
    <ActionForm action={addMoneyLine.bind(null, eventId)} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="kind" value={kind} />
      <FormField name="category" label="Category">
        <Select defaultValue={cats[0][0]}>{cats.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
      </FormField>
      <FormField name="amount" label={`Amount (${currency})`}><Input type="number" min={0} step="0.01" required /></FormField>
      <FormField name="description" label="Description" className="sm:col-span-2"><Input maxLength={200} /></FormField>
      <Checkbox name="is_estimate" label="This is an estimate (not yet confirmed)" />
      <div className="sm:text-right"><SubmitButton variant="secondary">Add {kind}</SubmitButton></div>
    </ActionForm>
  );
}

export function DeleteMoneyButton({ eventId, kind, id }: { eventId: string; kind: "income" | "expense"; id: string }) {
  return (
    <ActionButton variant="ghost" size="icon" aria-label="Remove line" onAction={() => deleteMoneyLine(eventId, kind, id)}>
      <Trash2 />
    </ActionButton>
  );
}
