import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { getIcon } from '@/lib/icons';
import { toolCategories } from '@/data/tools';
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

  const category = toolCategories.find(c => c.id === tool.category);
  const Icon = getIcon(tool.icon);

  return (
    <div className="container-page max-w-5xl py-10 md:py-14">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Tools', to: '/tools' },
        { label: tool.shortTitle },
      ]} />

      <header className="max-w-3xl">
        {category && <p className="eyebrow">{category.name}</p>}
        <h1 className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">{tool.h1}</h1>
        <p className="mt-5 text-lg leading-relaxed text-warmgrey dark:text-dark-sub">{tool.intro}</p>
      </header>

      <section className="panel mt-10 overflow-hidden" aria-label={tool.shortTitle}>
        <div className="flex items-center gap-3 border-b border-stone bg-stone-light/60 px-6 py-3.5 md:px-8 dark:border-dark-border dark:bg-white/[0.02]">
          <Icon className="h-4 w-4 text-terracotta-500 dark:text-dark-terra" strokeWidth={2} />
          <span className="text-sm font-semibold text-forest-500 dark:text-dark-text">{tool.shortTitle}</span>
          <span className="ml-auto text-xs text-warmgrey dark:text-dark-sub">Free · no sign-up needed</span>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </section>

      <div aria-live="polite">
        {results && <div className="mt-8 animate-slide-up">{results}</div>}
      </div>

      <section className="mt-20 grid gap-12 md:grid-cols-2" aria-label="Guide">
        <div>
          <h2 className="font-serif text-display-md text-forest-500 dark:text-dark-text">How it works</h2>
          <ol className="mt-6 space-y-5">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="font-serif text-3xl leading-none text-terracotta-400 dark:text-dark-terra">{i + 1}</span>
                <span className="pt-1 leading-relaxed text-charcoal dark:text-dark-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-serif text-display-md text-forest-500 dark:text-dark-text">Getting the most from it</h2>
          <ul className="mt-6 space-y-3">
            {tool.howToUse.map((tip, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-charcoal dark:text-dark-text">
                <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400 dark:bg-dark-sage" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
          <figure className="mt-8 rounded-2xl border-l-[3px] border-terracotta-400 bg-ivory px-6 py-5 dark:border-dark-terra dark:bg-dark-card">
            <figcaption className="eyebrow">Example</figcaption>
            <blockquote className="mt-2 font-serif text-lg leading-relaxed text-charcoal dark:text-dark-text">
              {tool.example}
            </blockquote>
          </figure>
        </div>
      </section>

      {tool.tips.length > 0 && (
        <section className="mt-20" aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="font-serif text-display-md text-forest-500 dark:text-dark-text">Helpful tips</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {tool.tips.map((tip, i) => (
              <div key={i} className="card">
                <Lightbulb className="h-5 w-5 text-terracotta-500 dark:text-dark-terra" strokeWidth={1.75} />
                <p className="mt-3 text-[0.95rem] leading-relaxed text-charcoal dark:text-dark-text">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdPlaceholder format="inline" />

      <RelatedTools slugs={tool.relatedTools} />

      <FAQSection items={tool.faq} />
    </div>
  );
}
