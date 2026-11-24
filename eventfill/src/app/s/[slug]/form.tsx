"use client";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Input, Label, Textarea } from "@/components/ui/form";
import type { SurveyQuestion } from "@/lib/validation";
import { submitSurvey } from "./actions";

export function SurveyForm({ slug, questions, anonymous }: { slug: string; questions: SurveyQuestion[]; anonymous: boolean }) {
  const [done, setDone] = React.useState(false);
  if (done) return <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-6 text-emerald-900 ring-1 ring-emerald-200"><CheckCircle2 className="size-6" /> Thank you — your response has been recorded.</div>;
  return (
    <ActionForm action={submitSurvey.bind(null, slug)} onSuccess={() => setDone(true)} successToast={false} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
      {questions.map((q) => (
        <fieldset key={q.id}>
          <legend className="mb-2 text-sm font-medium">{q.label}{q.required && <span className="text-red-600"> *</span>}</legend>
          {q.type === "text" && <Textarea name={q.id} rows={3} maxLength={2000} required={q.required} aria-label={q.label} />}
          {q.type === "rating" && (
            <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer"><input type="radio" name={q.id} value={n} required={q.required} className="peer sr-only" /><span className="grid size-11 place-items-center rounded-xl ring-1 ring-slate-300 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600">{n}</span></label>
            ))}</div>
          )}
          {(q.type === "choice" || q.type === "yesno") && (
            <div className="space-y-2">{(q.type === "yesno" ? ["Yes", "No"] : q.options ?? []).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm"><input type="radio" name={q.id} value={o} required={q.required} className="size-4 accent-brand-600" /> {o}</label>
            ))}</div>
          )}
        </fieldset>
      ))}
      {!anonymous && (
        <div className="space-y-2 rounded-xl bg-canvas p-4">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" autoComplete="email" />
          <Checkbox name="consent" label="I'm happy for the organiser to contact me about this event." />
        </div>
      )}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <SubmitButton className="w-full">Submit</SubmitButton>
    </ActionForm>
  );
}
