import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function PrivacyPage() {
  useSEO({ title: 'Privacy Policy | The Book Club For One', description: 'Privacy policy for The Book Club For One, including Google AdSense and third-party advertising.', canonical: `${window.location.origin}/privacy` });
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]} />
      <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">Privacy Policy</h1>
      <div className="prose-literary space-y-4">
        <p>Last updated: October 2026. This policy describes how The Book Club For One collects, uses, and protects your information.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Information We Collect</h2>
        <p>If you create an account, we collect your email address and any reading data you save, including book lists, reading progress, notes, predictions, and reflections. If you use our tools without an account, we do not collect personal data beyond standard analytics.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">How We Use Your Data</h2>
        <p>Your account data is used solely to provide and improve our services. We use your email for authentication and essential account communications only. We never sell your data to third parties.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Data Security</h2>
        <p>Your data is stored securely using Supabase with row-level security policies. Only you can access your personal reading data. We use encryption for data transmission and storage.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Cookies</h2>
        <p>We use essential cookies for authentication and preference storage. See our Cookies page for details.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Google AdSense and Third-Party Advertising</h2>
        <p>This website uses Google AdSense, a service provided by Google LLC, to display advertisements. Google AdSense uses cookies (small text files stored on your device) to serve ads based on your prior visits to this and other websites.</p>
        <p>Google\'s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet. You may opt out of personalised advertising by visiting Google\'s Ads Settings page at <span className="font-mono text-sm">https://www.google.com/settings/ads</span>.</p>
        <p>Third-party vendors, including Google, use cookies to serve ads based on a user\'s prior visits to this website. These vendors may use information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
        <p>If you would like more information about how Google uses data from this site, please visit <span className="font-mono text-sm">https://policies.google.com/technologies/partner-sites</span> or contact us through our Contact page.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Your Rights</h2>
        <p>You can request deletion of your account and associated data at any time by contacting us. You can use all public tools without creating an account. You can also disable cookies in your browser settings, though this may affect some features of the site.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Third-Party Services</h2>
        <p>We use Supabase for authentication and data storage. We use Google AdSense for advertising. We may use analytics services to understand how visitors use our site. All third-party services are governed by their own privacy policies.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Children\'s Privacy</h2>
        <p>This website is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Contact</h2>
        <p>For privacy questions or requests, please contact us through our Contact page.</p>
      </div>
    </div>
  );
}
