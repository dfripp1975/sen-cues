import { MailCheck } from "lucide-react";
import Link from "next/link";

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><MailCheck className="size-7" /></span>
      <h1 className="mt-5 text-2xl font-bold">Check your email</h1>
      <p className="mt-2 text-sm text-slate-600">We&apos;ve sent a verification link to {email ? <strong>{email}</strong> : "your inbox"}. Click it to activate your account.</p>
      <p className="mt-6 text-xs text-slate-500">Didn&apos;t get it? Check spam, or <Link href="/register" className="text-brand-600 underline">try again</Link>.</p>
    </div>
  );
}
