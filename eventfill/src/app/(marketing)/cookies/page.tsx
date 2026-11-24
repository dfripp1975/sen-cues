import type { Metadata } from "next";
import { PageHero, Prose, Section } from "@/components/marketing/section";
import { CookiePreferences } from "./preferences";

export const metadata: Metadata = { title: "Cookie Preferences" };

export default function CookiesPage() {
  return (
    <>
      <PageHero title="Cookie Preferences" intro="EventFill uses as few cookies as possible." />
      <Section className="pt-4">
        <Prose>
          <h2>Essential cookies (always on)</h2>
          <p>These keep you signed in securely (authentication session cookies set by Supabase) and remember your cookie choice. The service can&apos;t work without them.</p>
          <h2>Analytics cookies</h2>
          <p>EventFill does not currently use analytics or advertising cookies. If that changes, they will be off by default and only enabled with your consent here.</p>
        </Prose>
        <div className="mx-auto mt-8 max-w-3xl">
          <CookiePreferences />
        </div>
      </Section>
    </>
  );
}
