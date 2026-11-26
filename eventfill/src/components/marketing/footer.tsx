import Link from "next/link";
import { Logo } from "@/components/logo";

const COLS = [
  ["Product", [["/features", "Features"], ["/features#rescue", "Event Rescue Mode"], ["/features#forecast", "Sales forecasting"], ["/features#planner", "Marketing planner"], ["/features#links", "Tracking links"], ["/features#content", "AI Content Studio"]]],
  ["Get started", [["/register", "Start free"], ["/demo", "Explore the demo"], ["/how-it-works", "How it works"], ["/pricing", "Pricing"]]],
  ["Company", [["/about", "About"], ["/contact", "Contact"], ["/help", "Help Centre"], ["/login", "Log in"]]],
  ["Privacy & legal", [["/privacy", "Privacy Policy"], ["/terms", "Terms and Conditions"], ["/cookies", "Cookie Preferences"]]],
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-navy/8 bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-navy/65">Fill more seats. Sell more tickets. Grow every event.</p>
          </div>
          {COLS.map(([title, links]) => (
            <div key={title}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-navy/55">{title}</h2>
              <ul className="mt-4 space-y-2.5">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-navy/80 hover:text-brand-700">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-navy/8 pt-6 text-sm text-navy/55 sm:flex-row sm:items-center sm:justify-between">
          <p>EventFill © {new Date().getFullYear()}</p>
          <p className="max-w-xl sm:text-right">EventFill is independent and works alongside your ticketing platform. It is not affiliated with Eventbrite, Ticket Tailor or Humanitix.</p>
        </div>
      </div>
    </footer>
  );
}
