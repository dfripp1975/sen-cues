import { Link } from 'react-router-dom';
import { getIcon } from '@/lib/icons';
import { getRelatedTools } from '@/data/tools';

interface RelatedToolsProps {
  slugs: string[];
}

export function RelatedTools({ slugs }: RelatedToolsProps) {
  const tools = getRelatedTools(slugs);
  if (tools.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map(tool => {
          const Icon = getIcon(tool.icon);
          return (
            <Link
              key={tool.slug}
              to={`/tools/${tool.slug}`}
              className="card flex flex-col gap-2 hover:shadow-lift transition-all duration-300 group hover:border-forest-300 dark:hover:border-dark-sage"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sage-100 dark:bg-forest-700 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
                </div>
                <h3 className="font-serif font-bold text-sm text-forest-500 dark:text-dark-sage group-hover:text-terracotta-400 dark:group-hover:text-dark-terra transition-colors">
                  {tool.shortTitle}
                </h3>
              </div>
              <p className="text-xs text-warmgrey dark:text-dark-sub line-clamp-2">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
