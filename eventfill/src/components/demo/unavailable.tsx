import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/site-mode";

const NAMES: Record<string, string> = { campaigns: "Marketing planner", content: "AI Content Studio", links: "Tracking links", surveys: "Audience surveys", competitors: "Competitor Watch", reports: "Reports", settings: "Settings", new: "Creating events", edit: "Editing events" };

export function DemoUnavailable({ rest }: { rest: string[] }) {
  const name = NAMES[rest[rest.length - 1]] ?? NAMES[rest[0]] ?? "This section";
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center shadow-card ring-1 ring-slate-200">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Sparkles className="size-6" /></span>
      <h1 className="mt-4 text-2xl font-bold">{name} isn&apos;t part of the demo</h1>
      <p className="mt-2 max-w-md text-slate-600">The demo shows the dashboard, events, sales, forecasts, Event Rescue Mode, profit and reports with fictional data. Create a free account to use {name.toLowerCase()} with your own events.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild><Link href={primaryCta().href}>{primaryCta().href === "/register" ? "Create free account" : "Get in touch"}</Link></Button>
        <Button asChild variant="secondary"><Link href="/demo">Back to demo overview</Link></Button>
      </div>
    </div>
  );
}
