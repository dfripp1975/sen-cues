"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { BarChart3, CalendarDays, ClipboardList, Cog, LayoutDashboard, Link2, Menu, MessageSquareText, Sparkles, Swords, X, LogOut, Shield, HelpCircle, Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  ["", "Overview", LayoutDashboard],
  ["/events", "Events", CalendarDays],
  ["/campaigns", "Marketing planner", ClipboardList],
  ["/content", "AI Content Studio", Sparkles],
  ["/links", "Tracking links", Link2],
  ["/surveys", "Audience surveys", MessageSquareText],
  ["/competitors", "Competitor Watch", Swords],
  ["/reports", "Reports", BarChart3],
  ["/settings", "Settings", Cog],
] as const;

function NavLinks({ base, onNavigate, isAdmin }: { base: string; onNavigate?: () => void; isAdmin?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {NAV_ITEMS.map(([href, label, Icon]) => {
        const full = `${base}${href}`;
        const active = href === "" ? pathname === base : pathname.startsWith(full);
        return (
          <Link key={href} href={full} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-navy")}>
            <Icon className={cn("size-[18px]", active ? "text-brand-600" : "text-slate-400")} aria-hidden />
            {label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <Shield className="size-[18px] text-slate-400" aria-hidden /> Admin
        </Link>
      )}
    </nav>
  );
}

export function Sidebar({ base, orgName, planName, isAdmin, footer }: { base: string; orgName: string; planName: string; isAdmin?: boolean; footer?: React.ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <Logo href={base} />
      <div className="mt-6 rounded-xl bg-canvas px-3 py-2.5 ring-1 ring-slate-200">
        <p className="truncate text-sm font-semibold">{orgName}</p>
        <p className="text-xs text-slate-500">{planName} plan</p>
      </div>
      <div className="mt-5 flex-1 overflow-y-auto">
        <NavLinks base={base} isAdmin={isAdmin} />
      </div>
      <div className="border-t border-slate-100 pt-3">
        {base === "/dashboard" && <Link href="/dashboard/notifications" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"><Bell className="size-[18px]" aria-hidden /> Notifications</Link>}
        <Link href="/help" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"><HelpCircle className="size-[18px]" aria-hidden /> Help Centre</Link>
        {footer}
      </div>
    </aside>
  );
}

export function MobileNav({ base, orgName, isAdmin, footer, banner }: { base: string; orgName: string; isAdmin?: boolean; footer?: React.ReactNode; banner?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
      {banner}
      <div className="flex h-14 items-center justify-between px-4">
        <Logo href={base} />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="grid size-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Open navigation">
              <Menu className="size-5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-xs flex-col bg-white p-4 shadow-lift">
              <div className="flex items-center justify-between">
                <Dialog.Title className="truncate text-sm font-semibold">{orgName}</Dialog.Title>
                <Dialog.Close className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Close navigation">
                  <X className="size-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Dashboard navigation</Dialog.Description>
              <div className="mt-4 flex-1 overflow-y-auto">
                <NavLinks base={base} onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
              </div>
              <div className="border-t border-slate-100 pt-3">{footer}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-navy">
        <LogOut className="size-[18px]" aria-hidden /> Log out
      </button>
    </form>
  );
}
