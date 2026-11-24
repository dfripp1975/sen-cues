"use client";
import { Trash2 } from "lucide-react";
import { ActionForm, FormField, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { ActionButton, ConfirmButton } from "@/components/ui/confirm";
import { TICKETING_PLATFORMS } from "@/lib/validation";
import { deleteAccount, inviteMember, openBillingPortal, removeMember, revokeInvite, startCheckout, updateOrganisation, updateProfile } from "./actions";

export function ProfileForm({ name, marketing }: { name: string; marketing: boolean }) {
  return (
    <ActionForm action={updateProfile} className="space-y-4">
      <FormField name="full_name" label="Your name"><Input defaultValue={name} required /></FormField>
      <Checkbox name="marketing_emails" defaultChecked={marketing} label="Send me occasional product updates by email (optional)" />
      <SubmitButton variant="secondary">Save profile</SubmitButton>
    </ActionForm>
  );
}

export function OrgForm({ org, disabled }: { org: { name: string; currency: string; timezone: string; country: string | null; ticketing_platform: string | null; data_retention_months: number }; disabled: boolean }) {
  return (
    <ActionForm action={updateOrganisation} className="grid gap-4 sm:grid-cols-2">
      <fieldset disabled={disabled} className="contents">
        <FormField name="name" label="Organisation name" className="sm:col-span-2"><Input defaultValue={org.name} required /></FormField>
        <FormField name="currency" label="Currency"><Select defaultValue={org.currency}>{["GBP", "EUR", "USD", "AUD", "CAD", "NZD"].map((c) => <option key={c}>{c}</option>)}</Select></FormField>
        <FormField name="timezone" label="Timezone"><Input defaultValue={org.timezone} /></FormField>
        <FormField name="country" label="Country"><Input defaultValue={org.country ?? ""} /></FormField>
        <FormField name="ticketing_platform" label="Main ticketing platform"><Select defaultValue={org.ticketing_platform ?? "Eventbrite"}>{TICKETING_PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select></FormField>
        <FormField name="data_retention_months" label="Keep link clicks and survey responses for" hint="Older records are deleted automatically each day." className="sm:col-span-2">
          <Select defaultValue={String(org.data_retention_months)}>{[3, 6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m} months</option>)}</Select>
        </FormField>
        <div className="sm:col-span-2"><SubmitButton variant="secondary">Save organisation</SubmitButton></div>
      </fieldset>
    </ActionForm>
  );
}

export function InviteForm() {
  return (
    <ActionForm action={inviteMember} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
      <FormField name="email" label="Email address"><Input type="email" required /></FormField>
      <FormField name="role" label="Role"><Select defaultValue="member"><option value="member">Member</option><option value="admin">Admin</option></Select></FormField>
      <SubmitButton>Create invite</SubmitButton>
    </ActionForm>
  );
}

export function RevokeInvite({ id }: { id: string }) {
  return <ActionButton variant="ghost" size="sm" onAction={() => revokeInvite(id)}>Revoke</ActionButton>;
}

export function RemoveMember({ userId, name }: { userId: string; name: string }) {
  return <ConfirmButton variant="ghost" size="icon" aria-label={`Remove ${name}`} title={`Remove ${name}?`} description="They will immediately lose access to this organisation's data." confirmLabel="Remove" onConfirm={() => removeMember(userId)}><Trash2 /></ConfirmButton>;
}

export function CheckoutButton({ plan, interval, label, variant = "primary" }: { plan: string; interval: "month" | "year"; label: string; variant?: "primary" | "secondary" }) {
  return (
    <ActionForm action={startCheckout} successToast={false}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="interval" value={interval} />
      <SubmitButton variant={variant} className="w-full" pendingText="Opening Stripe…">{label}</SubmitButton>
    </ActionForm>
  );
}

export function PortalButton() {
  return <ActionButton variant="secondary" onAction={() => openBillingPortal()}>Manage billing, invoices and cancellation</ActionButton>;
}

export function DeleteAccountForm() {
  return (
    <ActionForm action={deleteAccount} className="space-y-3">
      <FormField name="confirm" label='Type "DELETE" to confirm' hint="Organisations you own alone are deleted with all their events and data, and any subscription is cancelled. This cannot be undone.">
        <Input autoComplete="off" />
      </FormField>
      <SubmitButton variant="danger" pendingText="Deleting…">Permanently delete my account</SubmitButton>
    </ActionForm>
  );
}
