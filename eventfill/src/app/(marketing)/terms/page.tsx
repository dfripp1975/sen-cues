import type { Metadata } from "next";
import { PageHero, Prose, Section } from "@/components/marketing/section";

export const metadata: Metadata = { title: "Terms and Conditions" };
const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || "EventFill";

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms and Conditions" />
      <Section className="pt-4">
        <Prose>
          <p>These terms govern your use of EventFill, provided by {COMPANY}. By creating an account you agree to them.</p>
          <h2>The service</h2>
          <p>EventFill provides tools to track ticket sales, plan marketing and analyse events. It does not sell tickets and is not affiliated with any ticketing platform. Forecasts, recommendations and AI-generated content are estimates and suggestions only; we do not guarantee ticket sales, attendance or any particular result.</p>
          <h2>Your account</h2>
          <ul>
            <li>Keep your login details secure and tell us about any unauthorised use.</li>
            <li>You are responsible for the content you add and for having the right to use it.</li>
            <li>Organisation owners are responsible for the team members they invite.</li>
          </ul>
          <h2>Acceptable use</h2>
          <p>You must not use EventFill to send unsolicited bulk messages, scrape other websites, upload malicious files, attempt to access other customers&apos; data, or break any law, including data protection and consumer protection law. Promotions you create must be genuine.</p>
          <h2>Subscriptions and payment</h2>
          <p>Paid plans are billed in advance monthly or annually through Stripe, in the currency you choose at checkout, and renew automatically until cancelled. You can cancel at any time; access continues until the end of the paid period. Plan limits are enforced by the service. We may change prices with at least 30 days&apos; notice.</p>
          <h2>AI content</h2>
          <p>AI-generated drafts may contain mistakes. Review and edit all content before publishing. AI credits are limited per plan and do not roll over.</p>
          <h2>Availability and liability</h2>
          <p>We aim for high availability but do not guarantee uninterrupted service. To the extent permitted by law, our liability is limited to the fees you paid in the 12 months before the claim. Nothing limits liability that cannot be limited by law.</p>
          <h2>Ending your account</h2>
          <p>You can delete your account at any time. We may suspend accounts that breach these terms.</p>
          <h2>Governing law</h2>
          <p>These terms are governed by the laws of England and Wales, unless mandatory local law says otherwise.</p>
        </Prose>
      </Section>
    </>
  );
}
