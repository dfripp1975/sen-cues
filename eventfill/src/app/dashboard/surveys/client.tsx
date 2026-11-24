"use client";
import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionButton, ConfirmButton, Modal } from "@/components/ui/confirm";
import { SURVEY_TYPES, type SurveyQuestion } from "@/lib/validation";
import { createSurvey, deleteSurvey, saveQuestions, setSurveyOpen } from "./actions";

export function NewSurveyButton({ events }: { events: { id: string; name: string }[] }) {
  return (
    <Modal title="New survey" description="Start from a template — you can edit the questions next." trigger={<Button><Plus /> New survey</Button>}>
      <ActionForm action={createSurvey} className="space-y-4">
        <FormField name="title" label="Title"><Input required placeholder="e.g. How was the Founders Mixer?" /></FormField>
        <FormField name="survey_type" label="Type"><Select defaultValue="post_event_feedback">{SURVEY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></FormField>
        <FormField name="event_id" label="Event (optional)"><Select defaultValue=""><option value="">Not linked</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></FormField>
        <Checkbox name="anonymous" defaultChecked label="Anonymous responses (recommended) — don't ask for an email address" />
        <SubmitButton className="w-full">Create survey</SubmitButton>
      </ActionForm>
    </Modal>
  );
}

export function QuestionEditor({ id, initial }: { id: string; initial: SurveyQuestion[] }) {
  const [qs, setQs] = React.useState<SurveyQuestion[]>(initial);
  const [pending, start] = React.useTransition();
  const update = (i: number, patch: Partial<SurveyQuestion>) => setQs((list) => list.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  return (
    <div className="space-y-3">
      {qs.map((q, i) => (
        <div key={q.id} className="rounded-xl bg-canvas p-3 ring-1 ring-slate-200">
          <div className="flex gap-2">
            <Input aria-label={`Question ${i + 1}`} value={q.label} onChange={(e) => update(i, { label: e.target.value })} className="flex-1" />
            <Select aria-label="Question type" value={q.type} onChange={(e) => update(i, { type: e.target.value as SurveyQuestion["type"], options: e.target.value === "choice" ? q.options ?? ["Option 1", "Option 2"] : undefined })} className="w-36">
              <option value="text">Text</option><option value="rating">Rating 1–5</option><option value="choice">Multiple choice</option><option value="yesno">Yes / No</option>
            </Select>
            <Button variant="ghost" size="icon" aria-label="Remove question" onClick={() => setQs((l) => l.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
          {q.type === "choice" && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(q.options ?? []).map((o, k) => (
                <span key={k} className="flex items-center gap-1 rounded-lg bg-white pl-2 ring-1 ring-slate-200">
                  <input aria-label={`Option ${k + 1}`} value={o} onChange={(e) => update(i, { options: q.options!.map((x, m) => (m === k ? e.target.value : x)) })} className="w-28 bg-transparent py-1 text-sm outline-none" />
                  <button aria-label="Remove option" className="px-1 text-slate-400 hover:text-red-600" onClick={() => update(i, { options: q.options!.filter((_, m) => m !== k) })}><X className="size-3.5" /></button>
                </span>
              ))}
              <Button size="sm" variant="ghost" onClick={() => update(i, { options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] })}>+ Option</Button>
            </div>
          )}
          <Checkbox className="mt-2" label="Required" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} />
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={qs.length >= 20} onClick={() => setQs((l) => [...l, { id: `q${Date.now().toString(36)}`, type: "text", label: "New question", required: false }])}><Plus /> Add question</Button>
        <Button size="sm" disabled={pending} onClick={() => start(async () => { const r = await saveQuestions(id, qs); if (r.ok) toast.success(r.message); else toast.error(r.error); })}>{pending && <Loader2 className="animate-spin" />} Save questions</Button>
      </div>
      <p className="text-xs text-slate-500">Changing questions after responses arrive may make older answers harder to compare.</p>
    </div>
  );
}

export function SurveyControls({ id, open }: { id: string; open: boolean }) {
  return (
    <>
      <ActionButton variant="secondary" size="sm" onAction={() => setSurveyOpen(id, !open)}>{open ? "Close survey" : "Reopen survey"}</ActionButton>
      <ConfirmButton variant="ghost" size="sm" className="text-red-600" title="Delete this survey?" description="The survey and all of its responses will be permanently deleted." confirmLabel="Delete" onConfirm={() => deleteSurvey(id)}><Trash2 /> Delete</ConfirmButton>
    </>
  );
}
