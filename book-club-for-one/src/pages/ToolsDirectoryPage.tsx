import { getIcon } from '@/lib/icons';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ToolCard } from '@/components/ToolCard';
import { tools, toolCategories } from '@/data/tools';
import { AdPlaceholder } from '@/components/AdPlaceholder';

export function ToolsDirectoryPage() {
  useSEO({
    title: 'Free Book Club & Reading Tools | The Book Club For One',
    description: 'Free tools to help you read more, plan your reading, run a book club and get more from every book. 20+ free reading and book club tools.',
    canonical: `${window.location.origin}/tools`,
  });

  const groups = toolCategories
    .map(cat => ({ ...cat, items: tools.filter(t => t.category === cat.id) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Tools' }]} />

      <header className="max-w-3xl">
        <p className="eyebrow">{tools.length} free tools</p>
        <h1 className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">
          Free book club &amp; reading tools
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-warmgrey dark:text-dark-sub">
          Plan your reading, run a book club and get more from every book. Everything here works without an account.
        </p>
      </header>

      <nav aria-label="Tool categories" className="sticky top-16 z-30 -mx-4 mt-10 border-y border-stone/70 bg-paper/90 px-4 backdrop-blur-md sm:mx-0 sm:rounded-full sm:border sm:px-2 dark:border-dark-border dark:bg-dark-bg/90">
        <ul className="scrollbar-hide flex gap-1 overflow-x-auto py-2">
          {groups.map(g => (
            <li key={g.id} className="shrink-0">
              <a href={`#${g.id}`} className="block rounded-full px-4 py-1.5 text-sm font-medium text-charcoal/80 transition-colors hover:bg-charcoal/[0.05] hover:text-forest-500 dark:text-dark-text/80 dark:hover:bg-white/[0.06]">
                {g.name} <span className="text-warmgrey-light">{g.items.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map(g => {
        const Icon = getIcon(g.icon);
        return (
          <section key={g.id} id={g.id} className="scroll-mt-36 pt-16" aria-labelledby={`${g.id}-h`}>
            <h2 id={`${g.id}-h`} className="flex items-center gap-3 font-serif text-display-md text-forest-500 dark:text-dark-text">
              <Icon className="h-6 w-6 text-terracotta-500 dark:text-dark-terra" strokeWidth={1.75} />
              {g.name}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.items.map(tool => <ToolCard key={tool.slug} tool={tool} />)}
            </div>
          </section>
        );
      })}

      <AdPlaceholder format="leaderboard" />
    </div>
  );
}
