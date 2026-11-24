import Link from "next/link";
import { Logo } from "@/components/logo";

const COLS = [
  ["Product", [["/features", "Features"], ["/how-it-works", "How it works"], ["/pricing", "Pricing"], ["/demo", "Explore demo"]]],
  ["Company", [["/about", "About"], ["/contact", "Contact"], ["/help", "Help Centre"]]],
  ["Legal", [["/privacy", "Privacy Policy"], ["/terms", "Terms and Conditions"], ["/cookies", "Cookie Preferences"]]],
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">Fill More Seats. Sell More Tickets. Grow Every Event.</p>
          <p className="mt-4 max-w-xs text-xs text-slate-400">EventFill is independent and works alongside your ticketing platform. It is not affiliated with Eventbrite, Ticket Tailor or Humanitix.</p>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title}>
            <h2 className="text-sm font-semibold">{title}</h2>
            <ul className="mt-3 space-y-2">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-navy">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">© {new Date().getFullYear()} EventFill. All rights reserved.</div>
    </footer>
  );
}
