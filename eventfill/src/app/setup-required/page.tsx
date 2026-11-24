import Link from "next/link";
import { Logo } from "@/components/logo";

export default function SetupRequired() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-2xl font-bold">Almost there: connect your database</h1>
      <p className="mt-3 text-slate-600">EventFill needs a Supabase project for accounts and data. Add these to <code className="rounded bg-slate-100 px-1">.env.local</code> and restart the app:</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 text-sm text-slate-100">NEXT_PUBLIC_SUPABASE_URL=...{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY=...{"\n"}SUPABASE_SERVICE_ROLE_KEY=...</pre>
      <p className="mt-4 text-slate-600">Full step-by-step instructions are in the README. Meanwhile you can <Link href="/demo" className="text-brand-600 underline">explore the demo</Link>, which needs no setup.</p>
    </main>
  );
}
