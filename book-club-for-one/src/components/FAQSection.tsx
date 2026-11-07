import { useState } from 'react';
import { Plus } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
}

export function FAQSection({ items, title = 'Questions people ask' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (items.length === 0) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="mt-20 grid gap-8 lg:grid-cols-[1fr_2fr]" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-serif text-display-md text-forest-500 dark:text-dark-text">{title}</h2>
        <div className="border-t border-stone dark:border-dark-border">
          {items.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={i} className="border-b border-stone dark:border-dark-border">
                <h3 className="font-sans">
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[1.05rem] font-semibold text-charcoal transition-colors hover:text-forest-500 dark:text-dark-text dark:hover:text-dark-sage"
                    aria-expanded={open}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                  >
                    {item.q}
                    <Plus className={`h-5 w-5 shrink-0 text-terracotta-500 transition-transform duration-200 dark:text-dark-terra ${open ? 'rotate-45' : ''}`} />
                  </button>
                </h3>
                <div
                  id={`faq-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <p className="overflow-hidden pr-10 leading-relaxed text-warmgrey dark:text-dark-sub">
                    <span className="block pb-5">{item.a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
