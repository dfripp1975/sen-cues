import type { Metadata } from "next";
import { PageHero, Prose, Section } from "@/components/marketing/section";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="Built for the people behind the events" />
      <Section className="pt-4">
        <Prose>
          <p>Most event organisers don&apos;t have a marketing department. They have a spreadsheet, a booking page and a worry that grows as the date gets closer. EventFill exists to replace that worry with a clear picture and a plan.</p>
          <h2>What we believe</h2>
          <ul>
            <li><strong>Honest numbers.</strong> Every figure shows where it came from. Estimates are labelled as estimates. Link clicks are never presented as ticket sales.</li>
            <li><strong>Act early.</strong> The cheapest time to fix a slow-selling event is weeks before, not the night before.</li>
            <li><strong>Simple and affordable.</strong> EventFill is designed to run at low cost so it can stay affordable for small organisers.</li>
            <li><strong>Respect for audiences.</strong> No scraping, no unsolicited bulk messaging, and privacy-conscious tracking.</li>
          </ul>
          <h2>What EventFill isn&apos;t</h2>
          <p>EventFill is not a ticketing platform and doesn&apos;t post to social networks on your behalf. It works alongside the tools you already use.</p>
        </Prose>
      </Section>
    </>
  );
}
