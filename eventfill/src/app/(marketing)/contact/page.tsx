import type { Metadata } from "next";
import { CalendarDays, Mail } from "lucide-react";
import { PageHero, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { contactDetails, isShowcase } from "@/lib/site-mode";
import { PLANS, isPlanId } from "@/lib/plans";
import { ContactForm } from "./form";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  if (!isShowcase()) {
    return (
      <>
        <PageHero title="Get in touch" intro="Questions, feedback or support — send us a message and we'll reply by email." />
        <Section className="pt-4">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8">
            <ContactForm />
          </div>
        </Section>
      </>
    );
  }
  // Showcase: no database to store messages, so offer email and/or a booking link.
  const { email, bookingUrl } = contactDetails();
  const sp = await searchParams;
  const plan = isPlanId(sp.plan) ? PLANS[sp.plan].name : null;
  const subject = encodeURIComponent(plan ? `EventFill: ${plan} plan` : "EventFill");
  return (
    <>
      <PageHero title="Get in touch" intro={plan ? `Interested in the ${plan} plan? Tell us about your events and we'll show you how EventFill could help.` : "Tell us about your events and we'll show you how EventFill could help fill them."} />
      <Section className="pt-4">
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {email && (
            <div className="rounded-3xl bg-mint p-8">
              <Mail className="size-7 text-brand-700" aria-hidden />
              <h2 className="mt-4 text-2xl font-medium">Email us</h2>
              <p className="mt-2 text-navy/75">We&apos;ll reply by email.</p>
              <Button asChild className="mt-6">
                <a href={`mailto:${email}?subject=${subject}`}>{email}</a>
              </Button>
            </div>
          )}
          {bookingUrl && (
            <div className="rounded-3xl bg-lavender p-8">
              <CalendarDays className="size-7 text-plum" aria-hidden />
              <h2 className="mt-4 text-2xl font-medium">Book a call</h2>
              <p className="mt-2 text-navy/75">Pick a time to walk through EventFill together.</p>
              <Button asChild className="mt-6">
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">Choose a time</a>
              </Button>
            </div>
          )}
          {!email && !bookingUrl && <p className="text-navy/70 sm:col-span-2">Contact details haven&apos;t been added yet. Set CONTACT_EMAIL or BOOKING_URL in the hosting settings.</p>}
        </div>
      </Section>
    </>
  );
}
