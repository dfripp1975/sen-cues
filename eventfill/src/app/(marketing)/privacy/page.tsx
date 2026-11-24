import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Prose, Section } from "@/components/marketing/section";

export const metadata: Metadata = { title: "Privacy Policy" };
const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || "EventFill";

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" />
      <Section className="pt-4">
        <Prose>
          <p>This policy explains how {COMPANY} (&quot;we&quot;) collects and uses personal data when you use EventFill. We aim to follow UK GDPR and EU GDPR principles; please contact us with any questions.</p>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account data:</strong> your name, email address and password (stored as a secure hash by our authentication provider).</li>
            <li><strong>Organisation data:</strong> details you enter about your organisation, events, sales, campaigns, finances and notes.</li>
            <li><strong>Billing data:</strong> subscription status and a customer reference. Card details are handled by Stripe and never stored by us.</li>
            <li><strong>Tracking link clicks:</strong> time of click, coarse device type and referring domain. No IP addresses or cookies.</li>
            <li><strong>Survey responses:</strong> answers submitted through your surveys. Surveys are anonymous by default.</li>
            <li><strong>AI usage:</strong> if you use the AI Content Studio, the event details and instructions you provide are sent to our AI provider to generate text.</li>
          </ul>
          <h2>How we use it</h2>
          <p>To provide and secure the service, process payments, provide support, and comply with legal obligations. We do not sell personal data and do not use it for advertising.</p>
          <h2>Lawful bases</h2>
          <p>Contract (providing the service you signed up for), legitimate interests (security, preventing abuse, improving the service) and legal obligation (tax and accounting records).</p>
          <h2>Processors</h2>
          <ul>
            <li>Supabase — database and authentication hosting</li>
            <li>Vercel — application hosting</li>
            <li>Stripe — payments</li>
            <li>Anthropic — AI text generation (only when you use the AI Content Studio)</li>
          </ul>
          <h2>Retention</h2>
          <p>Account data is kept while your account is active. Organisation owners can set a data retention period in settings. When you delete your account, your data is deleted from our live systems; billing records may be retained where the law requires.</p>
          <h2>Your rights</h2>
          <p>You can access, correct, export and delete your data. Export and deletion are available in Settings → Privacy. You can also <Link href="/contact">contact us</Link> or complain to your data protection authority (in the UK, the ICO).</p>
          <h2>Cookies</h2>
          <p>We use only essential cookies needed to keep you signed in and remember your cookie choice. See <Link href="/cookies">Cookie Preferences</Link>.</p>
        </Prose>
      </Section>
    </>
  );
}
