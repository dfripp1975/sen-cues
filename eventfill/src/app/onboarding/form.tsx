"use client";
import * as React from "react";
import { ActionForm, FormField, SubmitButton, useFieldError } from "@/components/ui/action-form";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EVENT_CATEGORIES, TICKETING_PLATFORMS } from "@/lib/validation";
import { completeOnboarding } from "./actions";
import { cn } from "@/lib/utils";

const CURRENCIES = ["GBP", "EUR", "USD", "AUD", "CAD", "NZD", "IEP"].filter((c) => c !== "IEP");
const COUNTRIES = ["United Kingdom", "Ireland", "United States", "Canada", "Australia", "New Zealand", "Germany", "France", "Netherlands", "Spain", "Other"];

function EventTypes() {
  const error = useFieldError("eventTypes");
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">What type of events do you organise?</legend>
      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map(([v, l]) => (
          <label key={v} className="cursor-pointer">
            <input type="checkbox" name="eventTypes" value={v} className="peer sr-only" />
            <span className="inline-block rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-300 transition peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600">{l}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

export function OnboardingForm({ defaultName, plan, interval }: { defaultName: string; plan?: string; interval?: string }) {
  const [step, setStep] = React.useState(0);
  const [tz, setTz] = React.useState("Europe/London");
  React.useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London");
    } catch {}
  }, []);
  return (
    <ActionForm
      action={completeOnboarding}
      className="mt-8"
      onError={(s) => {
        const f = Object.keys(s.fieldErrors ?? {});
        if (f.some((k) => k === "fullName" || k === "orgName")) setStep(0);
        else if (f.some((k) => ["eventTypes", "frequency", "platform"].includes(k))) setStep(1);
        else if (f.length) setStep(2);
      }}
    >
      <input type="hidden" name="plan" value={plan ?? ""} />
      <input type="hidden" name="interval" value={interval ?? ""} />
      <ol className="mb-6 flex gap-2" aria-label="Progress">
        {["About you", "Your events", "Location"].map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-brand-600" : "bg-slate-200")} />
            <p className={cn("mt-1.5 text-xs", i === step ? "font-semibold text-navy" : "text-slate-400")}>{s}</p>
          </li>
        ))}
      </ol>
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8">
        <div className={cn("space-y-4", step !== 0 && "hidden")}>
          <FormField name="fullName" label="Your name">
            <Input defaultValue={defaultName} autoComplete="name" />
          </FormField>
          <FormField name="orgName" label="Organisation name" hint="Your business, charity, venue or brand name.">
            <Input autoComplete="organization" />
          </FormField>
        </div>
        <div className={cn("space-y-5", step !== 1 && "hidden")}>
          <EventTypes />
          <FormField name="frequency" label="How often do you run events?">
            <Select defaultValue="monthly">
              <option value="one-off">One-off</option>
              <option value="several-a-year">A few times a year</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly or more</option>
            </Select>
          </FormField>
          <FormField name="platform" label="Main ticketing platform">
            <Select defaultValue="Eventbrite">
              {TICKETING_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </FormField>
        </div>
        <div className={cn("space-y-4", step !== 2 && "hidden")}>
          <FormField name="country" label="Country">
            <Select defaultValue="United Kingdom">
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField name="currency" label="Preferred currency">
            <Select defaultValue="GBP">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField name="timezone" label="Timezone">
            <Input value={tz} onChange={(e) => setTz(e.target.value)} />
          </FormField>
        </div>
        <div className="mt-8 flex justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} className={cn(step === 0 && "invisible")}>
            Back
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <SubmitButton pendingText="Setting up…">Finish and create my first event</SubmitButton>
          )}
        </div>
      </div>
    </ActionForm>
  );
}
