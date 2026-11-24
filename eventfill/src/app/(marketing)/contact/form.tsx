"use client";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Input, Select, Textarea } from "@/components/ui/form";
import { sendContact } from "./actions";

export function ContactForm() {
  return (
    <ActionForm action={sendContact} resetOnSuccess className="space-y-4">
      <FormField name="name" label="Your name">
        <Input autoComplete="name" required />
      </FormField>
      <FormField name="email" label="Email">
        <Input type="email" autoComplete="email" required />
      </FormField>
      <FormField name="topic" label="Topic">
        <Select defaultValue="General question">
          <option>General question</option>
          <option>Support</option>
          <option>Billing</option>
          <option>Privacy request</option>
          <option>Feedback</option>
        </Select>
      </FormField>
      <FormField name="message" label="Message">
        <Textarea rows={6} required />
      </FormField>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <SubmitButton className="w-full" pendingText="Sending…">Send message</SubmitButton>
      <p className="text-xs text-slate-500">We use your details only to reply to your message.</p>
    </ActionForm>
  );
}
