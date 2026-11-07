import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function CookiesPage() {
  useSEO({ title: 'Cookie Policy | The Book Club For One', description: 'Cookie policy for The Book Club For One.', canonical: `${window.location.origin}/cookies` });
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cookies' }]} />
      <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">Cookie Policy</h1>
      <div className="prose-literary space-y-4">
        <p>Last updated: October 2026. This policy explains how The Book Club For One uses cookies.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help with authentication, remembering preferences, and improving user experience.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Cookies We Use</h2>
        <ul className="space-y-2">
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> <strong>Authentication cookies:</strong> Required for account sign-in and session management.</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> <strong>Theme preference:</strong> Remembers your light/dark mode preference.</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> <strong>Analytics cookies:</strong> Help us understand how visitors use our tools (if enabled).</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> <strong>Advertising cookies:</strong> If we implement Google AdSense, cookies may be used to serve relevant ads.</li>
        </ul>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Managing Cookies</h2>
        <p>You can control cookies through your browser settings. Essential cookies (authentication) are required for account features. Non-essential cookies can be disabled without affecting core tool functionality.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Third-Party Cookies</h2>
        <p>If we implement Google AdSense, Google may set cookies for ad personalisation. You can manage Google ad settings through Google's Ads Settings page.</p>
      </div>
    </div>
  );
}
