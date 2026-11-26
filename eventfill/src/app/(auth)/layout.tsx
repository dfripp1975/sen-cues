import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="main" className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-navy/50">
          <Link href="/privacy" className="hover:text-navy">Privacy</Link> · <Link href="/terms" className="hover:text-navy">Terms</Link> · <Link href="/help" className="hover:text-navy">Help</Link>
        </p>
      </main>
      <aside className="hidden p-4 lg:block">
        <div className="flex h-full flex-col justify-between rounded-[2rem] bg-brand-900 p-12 text-white">
          <div className="rounded-2xl bg-white/10 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/product/rescue.webp" alt="" width={2368} height={1356} className="h-auto w-full rounded-xl" />
            <p className="mt-2 text-xs text-brand-100/70">Event Rescue Mode on a demo event</p>
          </div>
          <div>
            <p className="text-4xl font-medium leading-tight tracking-tight">Fill more seats.<br />Sell more tickets.<br />Grow every event.</p>
            <p className="mt-4 max-w-md text-lg text-brand-100/80">Track sales, plan promotion and get an early warning when an event needs attention.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
