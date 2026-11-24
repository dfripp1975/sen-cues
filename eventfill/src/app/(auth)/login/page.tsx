import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";
import { Alert } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; verified?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">
        New to EventFill? <Link href={sp.next?.startsWith("/invite/") ? `/register?next=${encodeURIComponent(sp.next)}` : "/register"} className="font-semibold text-brand-600 hover:underline">Create an account</Link>
      </p>
      {sp.error && <Alert tone="danger" className="mt-5">That link is invalid or has expired. Please try again.</Alert>}
      {sp.verified && <Alert tone="success" className="mt-5">Email confirmed. You can now log in.</Alert>}
      <LoginForm next={sp.next} />
    </>
  );
}
