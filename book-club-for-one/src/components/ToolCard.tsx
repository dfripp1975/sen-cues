import { Link } from 'react-router-dom';
import { getIcon } from '@/lib/icons';
import type { ToolMeta } from '@/types';

interface ToolCardProps {
  tool: ToolMeta;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = getIcon(tool.icon);

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="card flex flex-col gap-3 hover:shadow-lift transition-all duration-300 group hover:border-forest-300 dark:hover:border-dark-sage"
    >
      <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-forest-700 flex items-center justify-center group-hover:bg-forest-100 dark:group-hover:bg-forest-600 transition-colors">
        <Icon className="w-6 h-6 text-forest-500 dark:text-dark-sage" />
      </div>
      <div>
        <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage group-hover:text-terracotta-400 dark:group-hover:text-dark-terra transition-colors">
          {tool.shortTitle}
        </h3>
        <p className="text-sm text-warmgrey dark:text-dark-sub mt-1 line-clamp-2">{tool.description}</p>
      </div>
      <span className="text-sm font-semibold text-terracotta-400 dark:text-dark-terra group-hover:underline mt-auto">
        Try Tool →
      </span>
    </Link>
  );
}
