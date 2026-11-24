import { FinanceView } from "@/components/events/finance-view";
import { demoEvent } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const d = demoEvent((await params).id);
  return <FinanceView s={d.s} income={d.income} expenses={d.expenses} currency="GBP" />;
}
