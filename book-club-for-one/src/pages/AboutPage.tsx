import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function AboutPage() {
  useSEO({
    title: 'About | The Book Club For One',
    description: 'Learn about The Book Club For One , your personal book club for every book you read.',
    canonical: `${window.location.origin}/about`,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">About The Book Club For One</h1>
      <div className="prose-literary space-y-4">
        <p>The Book Club For One is a free online toolbox for people who love books. We believe reading should be an enriching, engaging experience , and that the right tools can help you get more from every book you pick up.</p>
        <p>Our mission is simple: provide genuinely useful, free reading and book club tools that help you read more, understand more, and enjoy more. From discussion question generators to reading time calculators, from character trackers to book club meeting planners, every tool on this site is designed to be practical, easy to use, and genuinely helpful.</p>
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-8 mb-4">What We Offer</h2>
        <ul className="space-y-2">
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> 20+ free reading and book club tools, all fully functional</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> Book discovery and exploration with detailed book pages</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> A personal book club experience with spoiler-safe chapter companions</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> Optional free accounts to save your reading progress, notes, and predictions</li>
          <li className="flex gap-2"><span className="text-forest-400 dark:text-dark-sage">•</span> Reading calculators to help you plan and track your reading goals</li>
        </ul>
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mt-8 mb-4">Our Principles</h2>
        <p>We respect copyright. All content on this site is original commentary, analysis, and tools. We do not reproduce copyrighted books, provide pirated downloads, or create replacements for purchasing books.</p>
        <p>We believe in free access. The majority of our tools work without registration. Accounts are optional and only needed when you want to save your data.</p>
        <p>We value your privacy. We do not sell your data. Your reading data is yours, stored securely, and only accessible to you.</p>
      </div>
    </div>
  );
}
