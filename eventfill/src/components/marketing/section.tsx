import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({ children, className, id, inner }: { children: React.ReactNode; className?: string; id?: string; inner?: string }) {
  return (
    <section id={id} className={cn("px-4 py-16 sm:px-6 sm:py-24 lg:px-8", className)}>
      <div className={cn("mx-auto max-w-7xl", inner)}>{children}</div>
    </section>
  );
}

/** A small rounded label that links somewhere real, with an arrow. */
export function Chip({ href, children, tone = "mint" }: { href: string; children: React.ReactNode; tone?: "mint" | "lavender" | "white" }) {
  const tones = { mint: "bg-brand-50 text-brand-700 hover:bg-brand-100", lavender: "bg-plum-soft text-plum hover:bg-lavender", white: "bg-white/15 text-white hover:bg-white/25" };
  return (
    <Link href={href} className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition", tones[tone])}>
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/** Heading on the left, a short paragraph and link on the right. */
export function SplitHeading({ chip, title, intro, link }: { chip?: React.ReactNode; title: string; intro?: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-10 grid gap-6 md:grid-cols-2 md:items-end">
      <div>
        {chip && <div className="mb-5">{chip}</div>}
        <h2 className="max-w-xl text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      </div>
      {(intro || link) && (
        <div className="md:pl-10">
          {intro && <p className="text-lg text-navy/80 sm:text-xl">{intro}</p>}
          {link && (
            <Link href={link.href} className="mt-2 inline-flex items-center gap-1 border-b-2 border-brand-600 pb-0.5 text-lg font-medium hover:text-brand-700">
              {link.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function SectionHeading({ title, intro, center = false }: { eyebrow?: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      <h2 className="text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-navy/75">{intro}</p>}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-navy/80 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-navy [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-brand-700 [&_a]:underline">{children}</div>;
}

export function PageHero({ title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="px-4 pb-8 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl">{title}</h1>
        {intro && <p className="mt-5 text-lg text-navy/75 sm:text-xl">{intro}</p>}
      </div>
    </div>
  );
}
