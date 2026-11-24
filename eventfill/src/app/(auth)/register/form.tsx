"use client";
import Link from "next/link";
import { ActionForm, FormField, SubmitButton, useFieldError } from "@/components/ui/action-form";
import { Checkbox, Input } from "@/components/ui/form";
import { signUp } from "../actions";

function Terms() {
  const error = useFieldError("terms");
  return (
    <div>
      <Checkbox name="terms" required label={<>I agree to the <Link href="/terms" className="text-brand-600 underline">Terms</Link> and have read the <Link href="/privacy" className="text-brand-600 underline">Privacy Policy</Link>.</>} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function RegisterForm({ next }: { next: string }) {
  return (
    <ActionForm action={signUp} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormField name="fullName" label="Your name">
        <Input autoComplete="name" required />
      </FormField>
      <FormField name="email" label="Work email">
        <Input type="email" autoComplete="email" required />
      </FormField>
      <FormField name="password" label="Password" hint="At least 10 characters, including a letter and a number.">
        <Input type="password" autoComplete="new-password" required minLength={10} />
      </FormField>
      <Terms />
      <SubmitButton className="w-full" pendingText="Creating account…">Create free account</SubmitButton>
    </ActionForm>
  );
}
