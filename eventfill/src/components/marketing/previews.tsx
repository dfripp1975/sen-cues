// Small illustrative UI thumbnails (pure CSS/SVG) used on the marketing site.
// They show the shape of each feature, not real customer data.
import { cn } from "@/lib/utils";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-200", className)} aria-hidden>
      <div className="mb-2 flex gap-1">
        <span className="size-1.5 rounded-full bg-red-300" />
        <span className="size-1.5 rounded-full bg-amber-300" />
        <span className="size-1.5 rounded-full bg-emerald-300" />
      </div>
      {children}
    </div>
  );
}

const bars = [18, 26, 22, 34, 30, 42, 38, 50, 46, 58, 54, 66];

export function SalesPreview() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1.5">
        {["Sold", "Revenue", "Target"].map((l, i) => (
          <div key={l} className="rounded-md bg-slate-50 p-1.5">
            <div className="text-[6px] text-slate-400">{l}</div>
            <div className={cn("mt-0.5 h-1.5 rounded", i === 2 ? "w-6 bg-teal-400" : "w-8 bg-slate-700")} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex h-[45%] items-end gap-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${h + 20}%` }} />
        ))}
      </div>
    </Frame>
  );
}

export function RescuePreview() {
  return (
    <Frame className="bg-gradient-to-br from-white to-amber-50/60">
      <div className="rounded-md bg-amber-100 p-1.5">
        <div className="h-1.5 w-20 rounded bg-amber-500" />
        <div className="mt-1 h-1 w-28 rounded bg-amber-300" />
      </div>
      <div className="mt-2 space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-md bg-white p-1.5 ring-1 ring-slate-100">
            <span className={cn("size-2 rounded-full", i === 1 ? "bg-red-400" : i === 2 ? "bg-amber-400" : "bg-slate-300")} />
            <span className="h-1 flex-1 rounded bg-slate-200" />
            <span className="h-2 w-6 rounded bg-brand-100" />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function PlannerPreview() {
  return (
    <Frame>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }, (_, i) => (
          <div key={i} className="aspect-square rounded bg-slate-50 p-0.5">
            {[2, 5, 9, 12, 16, 19].includes(i) && <div className={cn("h-1 rounded", i % 2 ? "bg-teal-400" : "bg-brand-400")} />}
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function LinksPreview() {
  return (
    <Frame>
      <div className="flex gap-2">
        <div className="grid size-12 shrink-0 grid-cols-4 gap-px rounded bg-white p-1 ring-1 ring-slate-200">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={cn((i * 7) % 3 ? "bg-navy" : "bg-white")} />
          ))}
        </div>
        <div className="flex-1 space-y-1.5">
          {[70, 45, 25].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-1 w-8 rounded bg-slate-300" />
              <span className="h-1.5 rounded bg-brand-500" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function ContentPreview() {
  return (
    <Frame>
      <div className="flex gap-1">
        {["Instagram", "LinkedIn", "Email"].map((t, i) => (
          <span key={t} className={cn("rounded-full px-1.5 py-0.5 text-[6px]", i === 0 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-2 space-y-1 rounded-md bg-slate-50 p-2">
        {[100, 92, 96, 60].map((w, i) => (
          <div key={i} className="h-1 rounded bg-slate-300" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-2 h-3 w-14 rounded-md bg-teal-400" />
    </Frame>
  );
}

export function ProfitPreview() {
  return (
    <Frame>
      <div className="flex h-[70%] items-end gap-3 px-2">
        <div className="flex-1 rounded-t bg-emerald-400" style={{ height: "90%" }} />
        <div className="flex-1 rounded-t bg-slate-300" style={{ height: "65%" }} />
        <div className="flex-1 rounded-t bg-brand-500" style={{ height: "30%" }} />
      </div>
      <div className="mt-1 flex justify-around text-[6px] text-slate-400">
        <span>Income</span>
        <span>Costs</span>
        <span>Profit</span>
      </div>
    </Frame>
  );
}

export function SurveyPreview() {
  return (
    <Frame>
      {[80, 55, 30, 15].map((w, i) => (
        <div key={i} className="mb-1.5 flex items-center gap-1.5">
          <span className="h-1 w-6 rounded bg-slate-300" />
          <span className="h-2 rounded bg-teal-400" style={{ width: `${w}%` }} />
        </div>
      ))}
      <div className="mt-2 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={cn("size-2 rounded-sm", s < 5 ? "bg-amber-400" : "bg-slate-200")} />
        ))}
      </div>
    </Frame>
  );
}

export function ForecastPreview() {
  return (
    <Frame>
      <svg viewBox="0 0 100 50" className="h-[80%] w-full">
        <path d="M0 45 L30 35 L55 26" stroke="#4F46E5" strokeWidth="2" fill="none" />
        <path d="M55 26 L100 4" stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        <path d="M55 26 L100 14" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        <path d="M55 26 L100 24" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        <line x1="0" y1="10" x2="100" y2="10" stroke="#CBD5E1" strokeDasharray="2 2" />
      </svg>
    </Frame>
  );
}

export function CompetitorPreview() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={cn("h-3 rounded", i < 3 ? "bg-slate-200" : i % 3 === 0 ? "bg-brand-100" : "bg-slate-50")} />
        ))}
      </div>
    </Frame>
  );
}
