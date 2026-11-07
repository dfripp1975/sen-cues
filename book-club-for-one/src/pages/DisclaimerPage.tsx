import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function DisclaimerPage() {
  useSEO({ title: 'Disclaimer | The Book Club For One', description: 'Disclaimer for The Book Club For One.', canonical: `${window.location.origin}/disclaimer` });
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Disclaimer' }]} />
      <h1 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">Disclaimer</h1>
      <div className="prose-literary space-y-4">
        <p>Last updated: October 2026.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">No Warranty</h2>
        <p>The Book Club For One provides free tools and content for informational and entertainment purposes only. All tools are provided "as is" without warranty of any kind. We do not guarantee the accuracy, completeness, or reliability of any tool output, calculation, or book information.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Copyright Notice</h2>
        <p>The Book Club For One does not reproduce copyrighted book text, provide pirated downloads, or create replacements for purchasing books. All content on this site is original commentary, analysis, and utility tools. Book titles, author names, and metadata are used for identification and reference purposes only.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Tool Accuracy</h2>
        <p>Our reading calculators provide estimates based on average reading speeds and standard assumptions. Individual reading experiences vary. Use results as guidance, not as definitive measurements.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">AI Content</h2>
        <p>Where AI features are available, AI-generated content is produced by automated systems and may contain inaccuracies. AI responses should not be treated as authoritative literary analysis. Always verify important information independently.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">External Links</h2>
        <p>We may link to external websites for reference. We are not responsible for the content or practices of external sites.</p>
        <h2 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-6 mb-2">Advertising</h2>
        <p>If advertising is implemented on this site, ads are served by third-party networks. We do not control ad content and are not responsible for advertised products or services.</p>
      </div>
    </div>
  );
}
