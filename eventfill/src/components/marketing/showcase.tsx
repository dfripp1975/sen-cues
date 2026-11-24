import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface ShowcaseItem {
  title: string;
  category: string;
  description: string;
  audience: string;
  audienceLabel?: string;
  href: string;
  linkLabel: string;
  preview: React.ReactNode;
}

/** Numbered list with a preview thumbnail, matching the reference layout. */
export function ShowcaseList({ items, start = 1 }: { items: ShowcaseItem[]; start?: number }) {
  return (
    <ol className="divide-y divide-slate-200">
      {items.map((item, i) => (
        <li key={item.title} className="grid gap-5 py-8 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="max-w-xs sm:max-w-none">{item.preview}</div>
          <div>
            <h3 className="text-xl font-bold leading-snug">
              {start + i}. {item.title} — {item.category}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-700">{item.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              {item.audienceLabel ?? "Best for"}: {item.audience}
            </p>
            <Link href={item.href} className="link-dotted mt-3 inline-flex items-center gap-1 text-base font-medium text-navy decoration-slate-400 hover:text-brand-700 hover:decoration-brand-500">
              {item.linkLabel}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
