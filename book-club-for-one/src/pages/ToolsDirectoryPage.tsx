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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Tools' }]} />

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
        Free Book Club & Reading Tools
      </h1>
      <p className="text-lg text-warmgrey dark:text-dark-sub mb-8 max-w-3xl">
        Free tools to help you read more, plan your reading, run a book club and get more from every book.
      </p>

      {toolCategories.map(cat => {
        const catTools = tools.filter(t => t.category === cat.id);
        const Icon = getIcon(cat.icon);
        return (
          <section key={cat.id} className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6 flex items-center gap-2">
              <Icon className="w-6 h-6 text-sage-400 dark:text-dark-sage" />
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catTools.map(tool => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}

      <AdPlaceholder format="leaderboard" />
    </div>
  );
}
