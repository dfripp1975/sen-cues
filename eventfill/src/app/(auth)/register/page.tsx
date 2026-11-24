import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./form";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string; next?: string }> }) {
  const sp = await searchParams;
  const plan = sp.plan && ["starter", "growth", "pro"].includes(sp.plan) ? sp.plan : null;
  const invite = sp.next && /^\/invite\/[a-f0-9]{48}$/.test(sp.next) ? sp.next : null;
  const next = invite ?? (plan ? `/onboarding?plan=${plan}&interval=${sp.interval === "year" ? "year" : "month"}` : "/onboarding");
  return (
    <>
      <h1 className="text-2xl font-bold">Start filling your events</h1>
      <p className="mt-1 text-sm text-slate-500">
        Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
      </p>
      <RegisterForm next={next} />
    </>
  );
}
