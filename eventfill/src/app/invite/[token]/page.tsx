import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default async function AcceptInvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) redirect("/login?error=link");
  const user = await getUser();
  if (!user) redirect(`/login?next=/invite/${token}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (!error) {
    await supabase.from("organisations").select("id").limit(1);
    redirect("/dashboard");
  }
  return (
    <main id="main" className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="flex justify-center"><Logo /></div>
      <h1 className="mt-8 text-2xl font-bold">We couldn&apos;t accept this invite</h1>
      <p className="mt-2 text-slate-600">{/different email/.test(error.message) ? `This invite was sent to a different email address than the one you're logged in with (${user.email}).` : "The invite may have expired or already been used. Ask your teammate for a new link."}</p>
      <Link href="/dashboard" className="mt-6 inline-block text-brand-600 underline">Go to dashboard</Link>
    </main>
  );
}
