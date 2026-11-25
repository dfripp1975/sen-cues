"use client";
import { CheckCircle2, Trash2 } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form";
import { ActionButton, ConfirmButton } from "@/components/ui/confirm";
import { addSeriesDates, archivePastSeriesDates, deleteSeries } from "./actions";

export function AddDatesForm({ seriesId }: { seriesId: string }) {
  return (
    <ActionForm action={addSeriesDates.bind(null, seriesId)} resetOnSuccess className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <FormField name="count" label="Number of dates to add" className="sm:w-56"><Input type="number" min={1} max={52} defaultValue={4} required /></FormField>
      <SubmitButton variant="secondary" pendingText="Adding…">Add dates</SubmitButton>
    </ActionForm>
  );
}

export function SeriesControls({ seriesId, name }: { seriesId: string; name: string }) {
  return (
    <>
      <ActionButton variant="secondary" size="sm" onAction={() => archivePastSeriesDates(seriesId)}><CheckCircle2 /> Complete past dates</ActionButton>
      <ConfirmButton variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" title={`Delete "${name}" and all its dates?`} description="Every date in this series is deleted, with its sales, campaigns, tracking links, rescue actions and finance records. This cannot be undone. To keep past dates, delete individual upcoming dates instead." confirmLabel="Delete series" onConfirm={() => deleteSeries(seriesId)}>
        <Trash2 /> Delete series
      </ConfirmButton>
    </>
  );
}
