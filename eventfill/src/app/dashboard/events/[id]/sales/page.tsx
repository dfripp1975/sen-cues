import { requireOrg } from "@/lib/auth";
import { getEvent, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today } from "@/lib/dates";
import { SalesView } from "@/components/events/views";
import { CsvImportForm, DeleteSaleButton, SaleForm } from "@/components/events/forms";

export default async function SalesPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  const event = await getEvent(ctx, id);
  const [sales, tiers] = await Promise.all([listSales(ctx, [id]), listTiers(ctx, [id])]);
  const asOf = today();
  return (
    <SalesView
      s={summariseEvent(event, sales, tiers, asOf)}
      sales={sales}
      tiers={tiers}
      currency={ctx.org.currency}
      asOf={asOf}
      saleForm={<SaleForm eventId={id} tiers={tiers} currency={ctx.org.currency} />}
      csvForm={<CsvImportForm eventId={id} />}
      rowAction={(saleId) => <DeleteSaleButton eventId={id} saleId={saleId} />}
      exportHref={`/dashboard/events/${id}/sales/export`}
    />
  );
}
