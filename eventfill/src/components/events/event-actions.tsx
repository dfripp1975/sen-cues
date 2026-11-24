"use client";
import { Archive, Copy, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { ActionButton, ConfirmButton } from "@/components/ui/confirm";
import { deleteEvent, duplicateEvent, setEventStatus } from "@/app/dashboard/events/actions";

export function EventActions({ id, status }: { id: string; status: string }) {
  return (
    <>
      <ActionButton variant="secondary" size="sm" onAction={() => duplicateEvent(id)}><Copy /> Duplicate</ActionButton>
      {status === "archived" ? (
        <ActionButton variant="secondary" size="sm" onAction={() => setEventStatus(id, "active")}><RotateCcw /> Restore</ActionButton>
      ) : (
        <>
          {status !== "completed" && <ActionButton variant="secondary" size="sm" onAction={() => setEventStatus(id, "completed")}><CheckCircle2 /> Mark completed</ActionButton>}
          <ConfirmButton variant="secondary" size="sm" destructive={false} title="Archive this event?" description="Archived events are hidden from your dashboard and don't count towards your plan's active event limit. You can restore it later." confirmLabel="Archive" onConfirm={() => setEventStatus(id, "archived")}>
            <Archive /> Archive
          </ConfirmButton>
        </>
      )}
      <ConfirmButton variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Delete this event permanently?" description="This deletes the event and all of its sales, campaigns, tracking links, rescue actions and finance records. This cannot be undone." confirmLabel="Delete permanently" onConfirm={() => deleteEvent(id)}>
        <Trash2 /> Delete
      </ConfirmButton>
    </>
  );
}
