"use client";
import Link from "next/link";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your email and we&apos;ll send you a reset link.</p>
      <ActionForm action={requestPasswordReset} className="mt-6 space-y-4" resetOnSuccess>
        <FormField name="email" label="Email">
          <Input type="email" autoComplete="email" required />
        </FormField>
        <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-brand-600 hover:underline">Back to log in</Link></p>
    </>
  );
}
