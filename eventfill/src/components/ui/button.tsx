import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-[0.98]",
        secondary: "bg-white text-navy ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy",
        dark: "bg-navy text-white hover:bg-slate-800",
        danger: "bg-red-600 text-white hover:bg-red-700",
        teal: "bg-teal-accent text-white hover:bg-teal-600",
        link: "text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
