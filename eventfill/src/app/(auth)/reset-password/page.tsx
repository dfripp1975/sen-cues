"use client";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <ActionForm action={updatePassword} className="mt-6 space-y-4">
        <FormField name="password" label="New password" hint="At least 10 characters, including a letter and a number.">
          <Input type="password" autoComplete="new-password" required />
        </FormField>
        <FormField name="confirm" label="Confirm new password">
          <Input type="password" autoComplete="new-password" required />
        </FormField>
        <SubmitButton className="w-full">Update password</SubmitButton>
      </ActionForm>
    </>
  );
}
