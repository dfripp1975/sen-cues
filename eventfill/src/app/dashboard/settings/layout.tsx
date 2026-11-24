import Link from "next/link";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "./tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsTabs />
      {children}
      <p className="mt-10 text-xs text-slate-400">Need help? <Link href="/contact" className="underline">Contact support</Link>.</p>
    </>
  );
}
