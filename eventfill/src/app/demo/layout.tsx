import type { Metadata } from "next";
import Link from "next/link";
import { MobileNav, Sidebar } from "@/components/dashboard/nav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Demo", robots: { index: false } };

function Banner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
      <strong>Demo mode:</strong> every organisation, event and number here is fictional. Nothing you see belongs to a real customer.
      <Link href="/register" className="font-semibold underline">Start free</Link>
    </div>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const footer = (
    <div className="space-y-2 px-1 pt-2">
      <Button asChild className="w-full"><Link href="/register">Create free account</Link></Button>
      <Button asChild variant="ghost" className="w-full"><Link href="/">Back to website</Link></Button>
    </div>
  );
  return (
    <div className="min-h-dvh">
      <Sidebar base="/demo" orgName="Northlight Events (fictional)" planName="Demo · Pro features" footer={footer} />
      <MobileNav base="/demo" orgName="Northlight Events (fictional)" footer={footer} banner={<Banner />} />
      <div className="hidden lg:ml-64 lg:block"><Banner /></div>
      <main id="main" className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
