import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
}

export function FAQSection({ items, title = 'Frequently Asked Questions' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="mt-12">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">{title}</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-charcoal dark:text-dark-text">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-forest-400 dark:text-dark-sage flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <p className="mt-3 text-warmgrey dark:text-dark-sub leading-relaxed animate-fade-in">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
