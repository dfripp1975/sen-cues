import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/auth";
import { isShowcase } from "@/lib/site-mode";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const showcase = isShowcase();
  const user = !showcase && isSupabaseConfigured() ? await getUser().catch(() => null) : null;
  return (
    <div className="bg-white">
      <MarketingHeader signedIn={Boolean(user)} showcase={showcase} />
      <main id="main">{children}</main>
      <MarketingFooter showcase={showcase} />
    </div>
  );
}
