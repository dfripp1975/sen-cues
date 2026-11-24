"use client";
import Link from "next/link";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form";
import { signIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={signIn} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormField name="email" label="Email">
        <Input type="email" autoComplete="email" required />
      </FormField>
      <FormField name="password" label="Password">
        <Input type="password" autoComplete="current-password" required />
      </FormField>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Forgotten password?</Link>
      </div>
      <SubmitButton className="w-full" pendingText="Logging in…">Log in</SubmitButton>
    </ActionForm>
  );
}
