"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  ["", "Overview"],
  ["/sales", "Sales"],
  ["/forecast", "Forecast"],
  ["/rescue", "Event Rescue"],
  ["/finance", "Profit"],
  ["/report", "Report"],
] as const;

export function EventTabs({ base, showEdit = true }: { base: string; showEdit?: boolean }) {
  const pathname = usePathname();
  const tabs = showEdit ? [...TABS, ["/edit", "Edit"] as const] : TABS;
  return (
    <nav className="no-print -mx-4 mb-6 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0" aria-label="Event sections">
      <ul className="flex min-w-max gap-1">
        {tabs.map(([href, label]) => {
          const full = `${base}${href}`;
          const active = href === "" ? pathname === base : pathname.startsWith(full);
          return (
            <li key={href}>
              <Link href={full} aria-current={active ? "page" : undefined} className={cn("inline-block border-b-2 px-3 py-2.5 text-sm font-semibold transition", active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-navy")}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
