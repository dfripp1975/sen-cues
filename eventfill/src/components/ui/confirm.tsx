"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

type Result = { ok: boolean; error?: string; message?: string } | void;

/** A button that asks for confirmation before running a server action. */
export function ConfirmButton({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  children,
  destructive = true,
  ...buttonProps
}: ButtonProps & { title: string; description: string; confirmLabel?: string; onConfirm: () => Promise<Result>; destructive?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button {...buttonProps}>{children}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lift">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-slate-600">{description}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button
              variant={destructive ? "danger" : "primary"}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await onConfirm();
                  if (r && !r.ok) toast.error(r.error ?? "Something went wrong");
                  else {
                    if (r?.message) toast.success(r.message);
                    setOpen(false);
                  }
                })
              }
            >
              {pending && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Runs a server action on click (no confirmation), with toast feedback. */
export function ActionButton({ onAction, children, ...p }: ButtonProps & { onAction: () => Promise<Result> }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      {...p}
      disabled={pending || p.disabled}
      onClick={() =>
        start(async () => {
          const r = await onAction();
          if (r && !r.ok) toast.error(r.error ?? "Something went wrong");
          else if (r?.message) toast.success(r.message);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export function CopyButton({ text, label = "Copy", ...p }: ButtonProps & { text: string; label?: string }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      {...p}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Copied to clipboard");
        } catch {
          toast.error("Couldn't copy. Select the text and copy it manually.");
        }
      }}
    >
      {label}
    </Button>
  );
}

export function Modal({ trigger, title, description, children, open, onOpenChange }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-lift">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-1 text-sm text-slate-500">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
