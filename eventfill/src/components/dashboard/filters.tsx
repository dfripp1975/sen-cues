"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/form";

export function QueryFilter({ name, options, label, className }: { name: string; options: [string, string][]; label: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className={className}>
      <span className="sr-only">{label}</span>
      <Select
        value={sp.get(name) ?? options[0][0]}
        onChange={(e) => {
          const next = new URLSearchParams(sp.toString());
          if (e.target.value === options[0][0]) next.delete(name);
          else next.set(name, e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="h-9 w-auto min-w-40"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </Select>
    </label>
  );
}
