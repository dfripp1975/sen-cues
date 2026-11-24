"use client";
import * as React from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Input } from "@/components/ui/form";
import { ActionButton } from "@/components/ui/confirm";
import { createRescuePlan, deleteRescueAction, updateRescueAction } from "@/app/dashboard/events/actions";
import type { Recommendation } from "@/lib/rescue";
import type { RescueActionRow } from "@/types/db";

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

export function RescuePlanner({ eventId, recs, existingKeys, readOnly }: { eventId: string; recs: Recommendation[]; existingKeys: string[]; readOnly?: boolean }) {
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(recs.filter((r) => r.priority === "high" && !existingKeys.includes(r.key)).map((r) => r.key)));
  const [pending, start] = React.useTransition();
  const toggle = (k: string) => setSelected((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div>
      <ul className="space-y-3">
        {recs.map((r) => {
          const added = existingKeys.includes(r.key);
          return (
            <li key={r.key} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <label className="flex cursor-pointer gap-3">
                <input type="checkbox" className="mt-1 size-4 accent-brand-600" checked={selected.has(r.key)} disabled={readOnly || added} onChange={() => toggle(r.key)} />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.title}</span>
                    <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority} priority</Badge>
                    {added && <Badge tone="success">In your plan</Badge>}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">{r.description}</span>
                  <span className="mt-1 block text-xs text-slate-500">Why: {r.reason} · Suggested deadline: {r.dueInDays === 0 ? "today" : `within ${r.dueInDays} day(s)`}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {!readOnly && (
        <Button
          className="mt-4"
          disabled={pending || selected.size === 0}
          onClick={() =>
            start(async () => {
              const items = recs.filter((r) => selected.has(r.key)).map((r) => ({ key: r.key, title: r.title, description: r.description, dueInDays: r.dueInDays }));
              const res = await createRescuePlan(eventId, items);
              if (res.ok) { toast.success(res.message ?? "Plan created"); setSelected(new Set()); }
              else toast.error(res.error);
            })
          }
        >
          {pending && <Loader2 className="animate-spin" />}
          Add {selected.size || ""} selected to rescue plan
        </Button>
      )}
    </div>
  );
}

export function RescueActionControls({ eventId, action, members }: { eventId: string; action: RescueActionRow; members: { user_id: string; name: string }[] }) {
  const [pending, start] = React.useTransition();
  const update = (patch: Parameters<typeof updateRescueAction>[2]) =>
    start(async () => {
      const r = await updateRescueAction(eventId, action.id, patch);
      if (!r.ok) toast.error(r.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select aria-label="Status" value={action.status} disabled={pending} onChange={(e) => update({ status: e.target.value as RescueActionRow["status"] })} className="h-8 w-32 text-xs">
        <option value="todo">To do</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
      </Select>
      <Select aria-label="Assigned to" value={action.assignee_id ?? ""} disabled={pending} onChange={(e) => update({ assignee_id: e.target.value || null })} className="h-8 w-36 text-xs">
        <option value="">Unassigned</option>
        {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
      </Select>
      <Input aria-label="Deadline" type="date" defaultValue={action.due_date ?? ""} disabled={pending} onBlur={(e) => e.target.value !== (action.due_date ?? "") && update({ due_date: e.target.value || null })} className="h-8 w-36 text-xs" />
      <ActionButton variant="ghost" size="icon" aria-label="Remove action" onAction={() => deleteRescueAction(eventId, action.id)}><Trash2 /></ActionButton>
    </div>
  );
}
