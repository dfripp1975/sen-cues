import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { EventList } from "@/components/events/event-list";
import { PageHeader } from "@/components/ui/misc";
import { DemoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoContext } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function DemoEvents({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const d = demoContext();
  return (
    <>
      <PageHeader eyebrow={<DemoBadge />} title="Events" description="Fictional events showing different sales situations." actions={<Button asChild><Link href="/demo/events/new"><PlusCircle /> New event</Link></Button>} />
      <EventList base="/demo" summaries={d.summaries} q={sp.q} status={sp.status} />
    </>
  );
}
