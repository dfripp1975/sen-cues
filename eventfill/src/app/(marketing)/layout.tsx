import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/auth";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = isSupabaseConfigured() ? await getUser().catch(() => null) : null;
  return (
    <>
      <MarketingHeader signedIn={Boolean(user)} />
      <main id="main">{children}</main>
      <MarketingFooter />
    </>
  );
}
