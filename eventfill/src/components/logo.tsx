import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#027653" />
      <rect x="7" y="18" width="4" height="7" rx="1.5" fill="#A3EBB0" />
      <rect x="14" y="13" width="4" height="12" rx="1.5" fill="#C4F7CA" />
      <rect x="21" y="8" width="4" height="17" rx="1.5" fill="#FCE38A" />
    </svg>
  );
}

export function Logo({ href = "/", dark = false }: { href?: string; dark?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight" aria-label="EventFill home">
      <LogoMark />
      <span className={dark ? "text-white" : "text-navy"}>EventFill</span>
    </Link>
  );
}
