import { useState, type ReactNode } from 'react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from './Breadcrumbs';
import { FAQSection } from './FAQSection';
import { RelatedTools } from './RelatedTools';
import { AdPlaceholder } from './AdPlaceholder';
import type { ToolMeta } from '@/types';

interface ToolLayoutProps {
  tool: ToolMeta;
  children: ReactNode;
  results?: ReactNode;
}

export function ToolLayout({ tool, children, results }: ToolLayoutProps) {
  const [showExample] = useState(true);

  useSEO({
    title: tool.seoTitle,
    description: tool.metaDescription,
    canonical: `${window.location.origin}/tools/${tool.slug}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.h1,
      description: tool.metaDescription,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      url: `${window.location.origin}/tools/${tool.slug}`,
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Tools', to: '/tools' },
        { label: tool.shortTitle },
      ]} />

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">{tool.h1}</h1>
      <p className="text-lg text-warmgrey dark:text-dark-sub leading-relaxed mb-8 max-w-3xl">{tool.intro}</p>

      <div className="card mb-8">
        {children}
      </div>

      {results && (
        <>
          <div className="mb-8">{results}</div>
          <AdPlaceholder format="inline" />
        </>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">How It Works</h2>
        <ol className="space-y-3">
          {tool.howItWorks.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-forest-500 dark:bg-forest-400 text-white dark:text-dark-bg flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-charcoal dark:text-dark-text leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">How to Use It</h2>
        <ul className="space-y-2">
          {tool.howToUse.map((tip, i) => (
            <li key={i} className="flex gap-2 text-charcoal dark:text-dark-text">
              <span className="text-forest-400 dark:text-dark-sage">•</span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {showExample && (
        <section className="mt-8">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">Example</h2>
          <div className="tool-result">
            <p className="text-charcoal dark:text-dark-text leading-relaxed">{tool.example}</p>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">Helpful Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tool.tips.map((tip, i) => (
            <div key={i} className="card">
              <p className="text-sm text-charcoal dark:text-dark-text leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      <AdPlaceholder format="inline" />

      <RelatedTools slugs={tool.relatedTools} />

      <FAQSection items={tool.faq} />

      <section className="mt-12 text-center">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">Ready to Explore More?</h2>
        <p className="text-warmgrey dark:text-dark-sub mb-6">Discover more free reading and book club tools.</p>
        <a href="/tools" className="btn-accent">Browse All Tools</a>
      </section>
    </div>
  );
}
