"use client";
import * as React from "react";
import { ActionForm, FormField, SubmitButton, type ActionState } from "@/components/ui/action-form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_CATEGORIES, TICKETING_PLATFORMS } from "@/lib/validation";
import { RECURRENCES } from "@/lib/series";
import type { EventRow } from "@/types/db";

export function EventForm({ action, event, defaultTimezone, defaultPlatform, isNew, currency, seriesName }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; event?: Partial<EventRow>; defaultTimezone: string; defaultPlatform?: string | null; isNew?: boolean; currency: string; seriesName?: string | null }) {
  const e = event ?? {};
  const [recurrence, setRecurrence] = React.useState("none");
  const [multiDay, setMultiDay] = React.useState(Boolean(e.end_date));
  return (
    <ActionForm action={action} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Event details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField name="name" label="Event name" className="sm:col-span-2">
            <Input defaultValue={e.name} required maxLength={160} />
          </FormField>
          <FormField name="category" label="Category">
            <Select defaultValue={e.category ?? "networking"}>
              {EVENT_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FormField>
          <FormField name="status" label="Status">
            <Select defaultValue={e.status ?? "active"}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </FormField>
          <FormField name="description" label="Description" className="sm:col-span-2" hint="Used for recommendations and AI content. Describe who it's for and what they'll get.">
            <Textarea defaultValue={e.description ?? ""} rows={4} maxLength={5000} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>When and where</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField name="event_date" label={multiDay ? "First day" : "Event date"}>
            <Input type="date" defaultValue={e.event_date} required />
          </FormField>
          {multiDay ? (
            <FormField name="end_date" label="Last day" hint="Sales and forecasts run until the last day.">
              <Input type="date" defaultValue={e.end_date ?? ""} />
            </FormField>
          ) : (
            <FormField name="timezone" label="Timezone">
              <Input defaultValue={e.timezone ?? defaultTimezone} />
            </FormField>
          )}
          <Checkbox className="sm:col-span-2" checked={multiDay} onChange={(ev) => setMultiDay(ev.target.checked)} label="This event runs over more than one day (e.g. a festival or weekend course)" />
          {multiDay && (
            <FormField name="timezone" label="Timezone">
              <Input defaultValue={e.timezone ?? defaultTimezone} />
            </FormField>
          )}
          <FormField name="start_time" label="Start time">
            <Input type="time" defaultValue={e.start_time?.slice(0, 5) ?? ""} />
          </FormField>
          <FormField name="end_time" label="Finish time">
            <Input type="time" defaultValue={e.end_time?.slice(0, 5) ?? ""} />
          </FormField>
          <FormField name="venue" label="Venue / location" className="sm:col-span-2">
            <Input defaultValue={e.venue ?? ""} placeholder="Venue name and town, or 'Online'" />
          </FormField>
          <Checkbox name="is_online" defaultChecked={e.is_online} label="This is an online event" />
          {isNew && (
            <fieldset className="grid gap-3 rounded-xl bg-canvas p-4 ring-1 ring-slate-200 sm:col-span-2 sm:grid-cols-2">
              <legend className="px-1 text-sm font-medium text-slate-700">Repeats</legend>
              <FormField name="recurrence" label="How often?">
                <select id="recurrence" name="recurrence" value={recurrence} onChange={(ev) => setRecurrence(ev.target.value)} className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
                  <option value="none">Does not repeat</option>
                  {RECURRENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </FormField>
              {recurrence !== "none" && (
                <FormField name="repeat_count" label="Number of dates" hint="2–52. You can add more later.">
                  <Input type="number" min={2} max={52} defaultValue={recurrence === "weekly" ? 8 : 6} />
                </FormField>
              )}
              {recurrence !== "none" && <p className="text-xs text-slate-500 sm:col-span-2">Each date gets its own ticket target and sales tracking. The whole series counts as <strong>one</strong> active event on your plan.</p>}
            </fieldset>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tickets and targets</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField name="ticket_target" label="Ticket sales target" hint="How many tickets you want to sell.">
            <Input type="number" min={0} inputMode="numeric" defaultValue={e.ticket_target ?? ""} required />
          </FormField>
          <FormField name="capacity" label="Capacity" hint="Optional. Forecasts are capped at capacity.">
            <Input type="number" min={0} inputMode="numeric" defaultValue={e.capacity ?? ""} />
          </FormField>
          <FormField name="ticketing_platform" label="Ticketing platform">
            <Select defaultValue={e.ticketing_platform ?? defaultPlatform ?? "Eventbrite"}>
              {TICKETING_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </FormField>
          <FormField name="sales_start_date" label="Sales start date" hint="Optional. Used to measure sales pace.">
            <Input type="date" defaultValue={e.sales_start_date ?? ""} />
          </FormField>
          <FormField name="booking_url" label="Ticket booking URL" className="sm:col-span-2">
            <Input type="url" defaultValue={e.booking_url ?? ""} placeholder="https://" />
          </FormField>
          <FormField name="marketing_budget" label={`Marketing budget (${currency})`}>
            <Input type="number" min={0} step="0.01" inputMode="decimal" defaultValue={e.marketing_budget ?? 0} />
          </FormField>
          {isNew && (
            <fieldset className="grid gap-3 rounded-xl bg-canvas p-4 ring-1 ring-slate-200 sm:col-span-2 sm:grid-cols-3">
              <legend className="px-1 text-sm font-medium text-slate-700">First ticket tier (optional)</legend>
              <FormField name="tier_name" label="Tier name"><Input placeholder="General admission" /></FormField>
              <FormField name="tier_price" label={`Price (${currency})`}><Input type="number" min={0} step="0.01" /></FormField>
              <FormField name="tier_quantity" label="Quantity"><Input type="number" min={0} /></FormField>
            </fieldset>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormField name="notes" label="Additional notes">
            <Textarea defaultValue={e.notes ?? ""} rows={3} />
          </FormField>
          <Checkbox name="is_template" defaultChecked={e.is_template} label="Save as a reusable template for recurring events (templates don't count towards your active event limit)" />
        </CardContent>
      </Card>

      {seriesName && (
        <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-200">
          <Checkbox name="apply_to_series" label={<>Also apply these changes to the other <strong>upcoming</strong> dates in &ldquo;{seriesName}&rdquo; (dates, status and outcomes stay as they are)</>} />
        </div>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton size="lg" className="shadow-lift">{isNew ? "Create event" : "Save changes"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
