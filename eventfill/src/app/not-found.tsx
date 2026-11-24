import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <div className="flex justify-center"><Logo /></div>
        <p className="mt-10 font-display text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-slate-600">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <div className="mt-6 flex justify-center gap-2"><Button asChild><Link href="/">Home</Link></Button><Button asChild variant="secondary"><Link href="/dashboard">Dashboard</Link></Button></div>
      </div>
    </main>
  );
}
