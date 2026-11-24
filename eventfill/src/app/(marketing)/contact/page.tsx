import type { Metadata } from "next";
import { PageHero, Section } from "@/components/marketing/section";
import { ContactForm } from "./form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Get in touch" intro="Questions, feedback or support — send us a message and we'll reply by email." />
      <Section className="pt-4">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8">
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
