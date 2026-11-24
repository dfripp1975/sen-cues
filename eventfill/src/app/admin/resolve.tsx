"use client";
import { ActionButton } from "@/components/ui/confirm";
import { resolveSupportMessage } from "./actions";

export function ResolveButton({ id }: { id: string }) {
  return <ActionButton size="sm" variant="secondary" onAction={() => resolveSupportMessage(id)}>Mark resolved</ActionButton>;
}
