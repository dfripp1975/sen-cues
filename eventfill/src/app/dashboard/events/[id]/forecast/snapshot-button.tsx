"use client";
import { Save } from "lucide-react";
import { ActionButton } from "@/components/ui/confirm";
import { saveForecastSnapshot } from "@/app/dashboard/events/actions";

export function SnapshotButton({ eventId }: { eventId: string }) {
  return <ActionButton variant="secondary" size="sm" onAction={() => saveForecastSnapshot(eventId)}><Save /> Save snapshot</ActionButton>;
}
