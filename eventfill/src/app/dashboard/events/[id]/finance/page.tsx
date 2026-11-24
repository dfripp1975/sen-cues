import { requireOrg } from "@/lib/auth";
import { getEvent, listMoney, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { FinanceView } from "@/components/events/finance-view";
import { DeleteMoneyButton, MoneyLineForm } from "@/components/events/forms";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const [sales, tiers, money] = await Promise.all([listSales(ctx, [id]), listTiers(ctx, [id]), listMoney(ctx, id)]);
  return (
    <FinanceView
      s={summariseEvent(event, sales, tiers, today())}
      income={money.income}
      expenses={money.expenses}
      currency={ctx.org.currency}
      incomeForm={<MoneyLineForm eventId={id} kind="income" currency={ctx.org.currency} />}
      expenseForm={<MoneyLineForm eventId={id} kind="expense" currency={ctx.org.currency} />}
      rowAction={(kind, rowId) => <DeleteMoneyButton eventId={id} kind={kind} id={rowId} />}
    />
  );
}
