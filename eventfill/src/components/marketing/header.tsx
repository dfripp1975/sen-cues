"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  ["/features", "Features"],
  ["/how-it-works", "How it works"],
  ["/pricing", "Pricing"],
  ["/demo", "Demo"],
  ["/help", "Help"],
] as const;

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={cn("rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy", pathname === href && "text-navy")}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Start Free</Link>
              </Button>
            </>
          )}
        </div>
        <button className="grid size-10 place-items-center rounded-lg md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-slate-200 bg-white px-4 pb-5 pt-2 md:hidden" aria-label="Mobile">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">
              {label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {signedIn ? (
              <Button asChild className="col-span-2">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="secondary">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Start Free</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
