import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalOrgContext, getUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "./form";
import { getVisitorCurrency } from "@/lib/pricing-server";

export const metadata: Metadata = { title: "Set up your account" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const ctx = await getOptionalOrgContext();
  if (ctx?.org.onboarding_completed) redirect("/dashboard");
  const sp = await searchParams;
  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50/60 to-canvas px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Logo href="/onboarding" />
        <main id="main" className="mt-10">
          <h1 className="text-3xl font-bold">Welcome to EventFill</h1>
          <p className="mt-2 text-slate-600">A few quick questions so we can set things up for you. You can change any of this later.</p>
          <OnboardingForm defaultName={(user.user_metadata?.full_name as string) ?? ""} plan={sp.plan} interval={sp.interval} currency={await getVisitorCurrency()} />
        </main>
      </div>
    </div>
  );
}
