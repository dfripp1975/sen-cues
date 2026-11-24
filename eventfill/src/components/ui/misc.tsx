import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Lock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Progress({ value, className, tone = "brand", label }: { value: number; className?: string; tone?: "brand" | "success" | "warning" | "danger"; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const colors = { brand: "bg-brand-600", success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-red-500" };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Alert({ tone = "info", title, children, className, action }: { tone?: "info" | "warning" | "danger" | "success"; title?: string; children?: React.ReactNode; className?: string; action?: React.ReactNode }) {
  const map = {
    info: ["bg-brand-50 ring-brand-200 text-brand-900", Info],
    warning: ["bg-amber-50 ring-amber-200 text-amber-900", AlertTriangle],
    danger: ["bg-red-50 ring-red-200 text-red-900", XCircle],
    success: ["bg-emerald-50 ring-emerald-200 text-emerald-900", CheckCircle2],
  } as const;
  const [cls, Icon] = map[tone];
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl p-4 ring-1 sm:flex-row sm:items-center", cls, className)} role={tone === "danger" || tone === "warning" ? "alert" : "status"}>
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "brand" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ElementType; tone?: "brand" | "teal" | "amber" | "emerald" }) {
  const tones = { brand: "bg-brand-50 text-brand-600", teal: "bg-teal-50 text-teal-600", amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600" };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function UpgradeNotice({ feature, plan }: { feature: string; plan: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-brand-50 to-white px-6 py-12 text-center ring-1 ring-brand-100">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">
        <Lock className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{feature} is on the {plan} plan</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">Upgrade to unlock {feature.toLowerCase()} for your organisation. You can change or cancel your plan at any time.</p>
      <Button asChild className="mt-5">
        <Link href="/dashboard/settings/billing">See plans</Link>
      </Button>
    </div>
  );
}

export function Table({ className, ...p }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className={cn("w-full min-w-[560px] text-left text-sm [&_td]:px-5 [&_td]:py-3 [&_th]:px-5 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_thead]:bg-slate-50 [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100", className)} {...p} />
    </div>
  );
}
