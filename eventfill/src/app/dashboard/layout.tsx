import { requireOrg, isAdmin } from "@/lib/auth";
import { MobileNav, Sidebar, SignOutButton } from "@/components/dashboard/nav";
import { signOut } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrg();
  const admin = await isAdmin();
  const footer = (
    <>
      <p className="truncate px-3 pt-2 text-xs text-slate-400">{ctx.user.email}</p>
      <SignOutButton action={signOut} />
    </>
  );
  return (
    <div className="min-h-dvh">
      <Sidebar base="/dashboard" orgName={ctx.org.name} planName={ctx.plan.name} isAdmin={admin} footer={footer} />
      <MobileNav base="/dashboard" orgName={ctx.org.name} isAdmin={admin} footer={footer} />
      <main id="main" className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
