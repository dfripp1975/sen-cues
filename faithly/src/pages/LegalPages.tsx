import type { ReactNode } from 'react';
import { PageHeader } from '../components/ui';

const OPERATOR = (import.meta.env.VITE_OPERATOR_NAME as string) || 'the operator of this Faithly service';
const CONTACT = (import.meta.env.VITE_CONTACT_EMAIL as string) || '';
const UPDATED = '14 October 2026';

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-0">
      <PageHeader title={title} subtitle={`Last updated ${UPDATED}`} back />
      <div className="space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </div>
  );
}

const Contact = () => (CONTACT ? <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> : <span>the contact address provided by {OPERATOR}</span>);

export function PrivacyPage() {
  return (
    <Doc title="Privacy policy">
      <p>Faithly is provided by {OPERATOR} (“we”). This policy explains what we collect, why, and the choices you have. We follow UK GDPR principles: we collect only what we need and keep your private content private.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong>: email address, optional first name, and password (stored securely by our authentication provider, never readable by us).</li>
        <li><strong>Preferences</strong> you choose during onboarding or in Settings, such as focus areas and Christian tradition. These are optional.</li>
        <li><strong>Content you create</strong>: journal entries, prayers, notes, highlights, bookmarks, AI conversations and progress.</li>
        <li><strong>Usage information</strong>: which days you open the app and how many AI requests you make (used for limits, cost control and aggregate statistics).</li>
        <li><strong>Subscription details</strong> from our payment provider (plan and status). We never see or store your card number.</li>
      </ul>
      <h2>Your private content</h2>
      <p>Journal entries, prayers and AI conversations are protected by database access rules so that only your account can read them. They are not visible to other users, to Faith Circle members, or to administrators through the app. They are never used to train AI models.</p>
      <h2>AI features</h2>
      <p>When you use Ask Faithly, Explain This Verse, Bible Study, prayer suggestions or personalised reflections, the text you submit (and, if you switch on AI memory, the notes you wrote for it) is sent to our AI provider (Google Gemini or OpenAI, depending on configuration) to generate a response. We only use AI provider plans whose terms do not allow your content to be used to train their models. AI responses can be wrong; Faithly is not a pastor, counsellor or medical service.</p>
      <h2>Who we share data with</h2>
      <ul>
        <li>Supabase — database, authentication and server functions (data hosting).</li>
        <li>Our AI provider — only the content needed to answer a request.</li>
        <li>Stripe — payment processing for subscriptions.</li>
        <li>Your browser's push service — only if you enable reminders (the message content is generic).</li>
      </ul>
      <p>We do not sell your data or use it for advertising.</p>
      <h2>Security</h2>
      <p>All data is encrypted in transit (HTTPS). Data is stored with a provider that encrypts data at rest. Access is controlled by row-level security so each account can only reach its own records.</p>
      <h2>Your rights</h2>
      <ul>
        <li>Download all of your data at any time from Settings → Privacy & data.</li>
        <li>Delete your account and all associated personal data from Settings → Privacy & data. Deletion is immediate and permanent.</li>
        <li>Change or withdraw optional preferences, AI memory and reminders at any time.</li>
        <li>Contact us about access, correction or any concern: <Contact />. You can also complain to the Information Commissioner's Office (ico.org.uk).</li>
      </ul>
      <h2>Retention</h2>
      <p>We keep your data while your account exists. When you delete your account, your personal data is deleted from our live database straight away; routine backups expire within our provider's backup window.</p>
      <h2>Children</h2>
      <p>Faithly is intended for people aged 13 and over. If you are under 18, please use it with the knowledge of a parent or guardian.</p>
    </Doc>
  );
}

export function TermsPage() {
  return (
    <Doc title="Terms and conditions">
      <p>These terms apply to your use of Faithly, provided by {OPERATOR}. By creating an account you agree to them.</p>
      <h2>What Faithly is — and is not</h2>
      <p>Faithly is a tool to help you read the Bible, reflect and pray. AI features generate helpful commentary but can make mistakes. Faithly does not claim divine authority, does not speak for God, and is not a substitute for a church, pastor, counsellor, doctor, or emergency service. If you are in danger or crisis, call 999 (UK) or Samaritans on 116 123.</p>
      <h2>Scripture</h2>
      <p>Bible text is the World English Bible, which is in the public domain. Scripture is shown separately from AI-generated commentary so you can tell them apart.</p>
      <h2>Your account</h2>
      <p>Keep your password secure and let us know if you suspect unauthorised use. You are responsible for content you create. Do not use Faithly to harass others, break the law, or attempt to access other people's data.</p>
      <h2>AI usage limits</h2>
      <p>AI requests are limited per day (currently 10 on the free plan and 100 on Premium) because each request has a real cost. Limits reset daily at midnight UTC and may change with notice.</p>
      <h2>Subscriptions</h2>
      <p>Premium is billed monthly (£5.99) or yearly (£39.99) through Stripe until cancelled. You can cancel at any time from Manage subscription; access continues until the end of the paid period. Under UK consumer law you may cancel within 14 days of first subscribing for a refund, unless you have already used Premium features, in which case a proportionate amount may be deducted. Contact <Contact /> for refund requests.</p>
      <h2>Content and changes</h2>
      <p>Devotionals, journeys and other written content are provided for personal use. We may update or remove features, and we will tell you about significant changes to these terms.</p>
      <h2>Liability</h2>
      <p>Faithly is provided “as is”. Nothing in these terms limits liability that cannot be limited under UK law. These terms are governed by the laws of England and Wales.</p>
    </Doc>
  );
}
