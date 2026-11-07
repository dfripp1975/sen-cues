import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function TermsPage() {
  useSEO({ title: 'Terms of Service | The Book Club For One', description: 'Terms of service for The Book Club For One.', canonical: `${window.location.origin}/terms` });
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Terms' }]} />
      <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">Terms of Service</h1>
      <div className="prose-literary space-y-4">
        <p>Last updated: October 2026. By using The Book Club For One, you agree to these terms.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Use of Our Services</h2>
        <p>The Book Club For One provides free reading and book club tools for personal, non-commercial use. You may use our tools without creating an account. Account features require registration with a valid email address.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">User Content</h2>
        <p>You retain ownership of any notes, predictions, reflections, and reading lists you save. You are responsible for the content you create. We do not moderate private user content, but illegal or harmful content may be removed if reported.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Copyright</h2>
        <p>All tools, commentary, analysis, and original content on this site are owned by The Book Club For One. We respect copyright law. We do not reproduce copyrighted books or provide pirated content. Book metadata and cover representations are used for identification purposes only.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Disclaimer</h2>
        <p>Our tools are provided "as is" without warranty. We strive for accuracy but cannot guarantee that all tool results, calculations, or book information are error-free. See our Disclaimer page for full details.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Account Termination</h2>
        <p>You may delete your account at any time. We reserve the right to terminate accounts that violate these terms or engage in abuse of our services.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the site after changes constitutes acceptance of the updated terms.</p>
      </div>
    </div>
  );
}
