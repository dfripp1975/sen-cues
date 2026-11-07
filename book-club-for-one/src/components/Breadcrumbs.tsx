import { Link } from 'react-router-dom';

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
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-warmgrey dark:text-dark-sub">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              {item.to === '/' ? (
                <a href="/" className="underline-offset-4 transition-colors hover:text-forest-500 hover:underline dark:hover:text-dark-sage">
                  {item.label}
                </a>
              ) : item.to ? (
                <Link to={item.to} className="underline-offset-4 transition-colors hover:text-forest-500 hover:underline dark:hover:text-dark-sage">
                  {item.label}
                </Link>
              ) : (
                <span className="text-charcoal dark:text-dark-text" aria-current="page">{item.label}</span>
              )}
              {i < items.length - 1 && <span aria-hidden="true" className="text-stone-dark dark:text-dark-border">/</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
