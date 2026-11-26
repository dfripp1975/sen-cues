"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CurrencyPicker } from "@/components/marketing/pricing-table";
import type { Currency } from "@/lib/pricing";

/** Changes the billing currency by updating the page's ?currency= and the saved choice. */
export function BillingCurrencyPicker({ value }: { value: Currency }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <CurrencyPicker
      id="billing-region"
      value={value}
      onChange={(c) => {
        const next = new URLSearchParams(sp.toString());
        next.set("currency", c);
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    />
  );
}
