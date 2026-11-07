import { getRelatedTools } from '@/data/tools';
import { ToolCard } from './ToolCard';

interface RelatedToolsProps {
  slugs: string[];
}

export function RelatedTools({ slugs }: RelatedToolsProps) {
  const tools = getRelatedTools(slugs);
  if (tools.length === 0) return null;

  return (
    <section className="mt-20" aria-labelledby="related-tools">
      <h2 id="related-tools" className="font-serif text-display-md text-forest-500 dark:text-dark-text">
        Try these next
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map(tool => (
          <ToolCard key={tool.slug} tool={tool} compact />
        ))}
      </div>
    </section>
  );
}
