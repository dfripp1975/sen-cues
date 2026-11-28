// Showcase mode: the public website and demo only, with no accounts, payments
// or database. Used to show EventFill to prospective clients before launch.
//
// SHOWCASE_MODE=true   always a showcase
// SHOWCASE_MODE=false  always the full app (needs Supabase)
// not set              a showcase whenever Supabase isn't configured
import { isSupabaseConfigured } from "./env";

export function isShowcase(): boolean {
  const v = process.env.SHOWCASE_MODE?.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return !isSupabaseConfigured();
}

/** The main call to action: sign up in the full app, get in touch in a showcase. */
export function primaryCta(): { href: string; label: string } {
  return isShowcase() ? { href: "/contact", label: "Get in touch" } : { href: "/register", label: "Start free" };
}

/** How visitors reach you in a showcase. Both optional; set at least one. */
export function contactDetails(): { email: string | null; bookingUrl: string | null } {
  const email = process.env.CONTACT_EMAIL?.trim() || null;
  const booking = process.env.BOOKING_URL?.trim() || null;
  return {
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    bookingUrl: booking && /^https:\/\/\S+$/.test(booking) ? booking : null,
  };
}
