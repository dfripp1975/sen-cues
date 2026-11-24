import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", {
  variants: {
    tone: {
      neutral: "bg-slate-50 text-slate-600 ring-slate-200",
      brand: "bg-brand-50 text-brand-700 ring-brand-200",
      success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      warning: "bg-amber-50 text-amber-800 ring-amber-200",
      danger: "bg-red-50 text-red-700 ring-red-200",
      teal: "bg-teal-50 text-teal-700 ring-teal-200",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...p} />;
}

export function DemoBadge() {
  return <Badge tone="warning">Demo data</Badge>;
}
