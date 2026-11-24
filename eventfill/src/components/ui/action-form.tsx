"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { Field } from "./form";

export type ActionState = { ok: true; message?: string; data?: unknown } | { ok: false; error: string; fieldErrors?: Record<string, string> } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const Ctx = React.createContext<ActionState>(null);

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
  onError,
  successToast = true,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (s: ActionState) => void;
  onError?: (s: Extract<ActionState, { ok: false }>) => void;
  successToast?: boolean;
}) {
  const [state, formAction] = React.useActionState(action, null);
  const ref = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (successToast && state.message) toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
    } else {
      toast.error(state.error);
      onError?.(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <Ctx.Provider value={state}>
      <form ref={ref} action={formAction} className={className} noValidate={false}>
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function useFieldError(name: string): string | undefined {
  const s = React.useContext(Ctx);
  return s && !s.ok ? s.fieldErrors?.[name] : undefined;
}

export function FormField({ name, label, hint, children, className }: { name: string; label: string; hint?: string; children: React.ReactElement<{ "aria-invalid"?: boolean; id?: string; name?: string }>; className?: string }) {
  const error = useFieldError(name);
  const child = React.cloneElement(children, { id: children.props.id ?? name, name: children.props.name ?? name, "aria-invalid": Boolean(error) });
  return (
    <Field label={label} htmlFor={children.props.id ?? name} error={error} hint={hint} className={className}>
      {child}
    </Field>
  );
}

export function SubmitButton({ children, pendingText, ...p }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || p.disabled} aria-busy={pending} {...p}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? pendingText ?? "Saving…" : children}
    </Button>
  );
}
