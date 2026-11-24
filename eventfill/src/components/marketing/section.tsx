import { cn } from "@/lib/utils";

export function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("px-4 py-16 sm:px-6 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, center = false }: { eyebrow?: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-slate-600">{intro}</p>}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-brand-600 [&_a]:underline">{children}</div>;
}

export function PageHero({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="bg-gradient-to-b from-brand-50/70 to-canvas px-4 pb-10 pt-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-slate-600">{intro}</p>}
      </div>
    </div>
  );
}
