import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.to ? `${window.location.origin}${item.to}` : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-warmgrey dark:text-dark-sub mb-6">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {item.to ? (
              <Link to={item.to} className="hover:text-forest-500 dark:hover:text-dark-sage transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-charcoal dark:text-dark-text font-medium">{item.label}</span>
            )}
            {i < items.length - 1 && <ChevronRight className="w-3 h-3" />}
          </span>
        ))}
      </nav>
    </>
  );
}
