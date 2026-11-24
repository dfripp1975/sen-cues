import { ForecastView } from "@/components/events/views";
import { demoEvent } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = demoEvent((await params).id);
  return <ForecastView s={d.s} sales={d.sales} asOf={d.asOf} allowed isDemo />;
}
