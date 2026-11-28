"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
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

function Announcement() {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return (
    <div className="relative bg-brand-100 px-10 py-2 text-center text-sm text-brand-900">
      <span className="font-medium">Event Rescue Mode warns you weeks before an event falls short.</span>{" "}
      <Link href="/demo/events/demo-1/rescue" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
        See it on a demo event <ArrowRight className="size-3.5" aria-hidden />
      </Link>
      <button onClick={() => setHidden(true)} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md hover:bg-brand-200" aria-label="Dismiss announcement">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function MarketingHeader({ signedIn, showcase = false }: { signedIn: boolean; showcase?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <Announcement />
      <header className="sticky top-0 z-40 border-b border-navy/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-[0.95rem] text-navy/80 transition hover:bg-canvas hover:text-navy", pathname === href && "text-navy")}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {showcase ? (
              <Button asChild>
                <Link href="/contact">Get in touch</Link>
              </Button>
            ) : signedIn ? (
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-[0.95rem] text-navy/80 hover:text-navy">Log in</Link>
                <Button asChild>
                  <Link href="/register">Start free</Link>
                </Button>
              </>
            )}
          </div>
          <button className="grid size-10 place-items-center rounded-lg lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" className="border-t border-navy/8 bg-white px-4 pb-5 pt-2 lg:hidden" aria-label="Mobile">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-3 text-base text-navy hover:bg-canvas">
                {label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {showcase ? (
                <Button asChild className="col-span-2">
                  <Link href="/contact">Get in touch</Link>
                </Button>
              ) : signedIn ? (
                <Button asChild className="col-span-2">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="mint">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Start free</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
