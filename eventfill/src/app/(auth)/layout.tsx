import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="main" className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">Privacy</Link> · <Link href="/terms" className="hover:text-slate-600">Terms</Link> · <Link href="/help" className="hover:text-slate-600">Help</Link>
        </p>
      </main>
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-32 left-10 size-80 rounded-full bg-teal-accent/30 blur-3xl" />
        <div className="relative">
          <p className="font-display text-3xl font-bold leading-tight">Fill More Seats.<br />Sell More Tickets.<br />Grow Every Event.</p>
          <p className="mt-4 max-w-md text-slate-300">Track sales, plan promotion and get an early warning when an event needs attention.</p>
        </div>
      </aside>
    </div>
  );
}
