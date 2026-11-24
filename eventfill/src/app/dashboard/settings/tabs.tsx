"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [["/dashboard/settings", "General"], ["/dashboard/settings/team", "Team"], ["/dashboard/settings/billing", "Billing"], ["/dashboard/settings/privacy", "Privacy & data"]];

export function SettingsTabs() {
  const p = usePathname();
  return (
    <nav className="-mx-4 mb-6 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0" aria-label="Settings sections">
      <ul className="flex min-w-max gap-1">
        {TABS.map(([href, label]) => (
          <li key={href}><Link href={href} aria-current={p === href ? "page" : undefined} className={cn("inline-block border-b-2 px-3 py-2.5 text-sm font-semibold", p === href ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-navy")}>{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
