import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import type { ToolMeta } from '@/types';

interface ToolCardProps {
  tool: ToolMeta;
  compact?: boolean;
}

export function ToolCard({ tool, compact = false }: ToolCardProps) {
  const Icon = getIcon(tool.icon);

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={`card card-link group flex h-full flex-col ${compact ? 'gap-3 !p-5' : 'gap-5'}`}
    >
      <div className="flex items-start justify-between">
        <span className={`grid place-items-center rounded-xl bg-sage-100 text-forest-500 transition-colors duration-200 group-hover:bg-forest-500 group-hover:text-ivory dark:bg-sage-800 dark:text-dark-sage dark:group-hover:bg-dark-sage dark:group-hover:text-dark-bg ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
          <Icon className={compact ? 'h-[18px] w-[18px]' : 'h-5 w-5'} strokeWidth={1.75} />
        </span>
        <ArrowUpRight className="h-5 w-5 text-warmgrey-light transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-terracotta-500 dark:group-hover:text-dark-terra" />
      </div>
      <div>
        <h3 className={`font-serif font-medium leading-snug text-charcoal dark:text-dark-text ${compact ? 'text-[1.05rem]' : 'text-xl'}`}>
          {tool.shortTitle}
        </h3>
        <p className={`mt-1.5 text-warmgrey dark:text-dark-sub line-clamp-2 ${compact ? 'text-[0.85rem] leading-snug' : 'text-[0.95rem] leading-relaxed'}`}>
          {tool.description}
        </p>
      </div>
    </Link>
  );
}
