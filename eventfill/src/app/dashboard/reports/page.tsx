import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { listEvents, listSales, listTiers } from "@/lib/data/queries";
import { summariseEvent } from "@/lib/event-summary";
import { today, formatDateRange } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard, Table } from "@/components/ui/misc";
import { BarsChart } from "@/components/charts/charts";
import { formatMoney, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await requireOrg();
  const events = await listEvents(ctx, { includeArchived: true });
  const ids = events.map((e) => e.id);
  const [sales, tiers] = await Promise.all([listSales(ctx, ids), listTiers(ctx, ids)]);
  const asOf = today();
  const s = events.map((e) => summariseEvent(e, sales, tiers, asOf));
  const past = s.filter((x) => x.forecast.eventPassed);
  const totalTickets = s.reduce((a, x) => a + x.forecast.ticketsSold, 0);
  const totalRevenue = s.reduce((a, x) => a + x.forecast.netRevenue, 0);
  const hitRate = past.length ? Math.round((past.filter((x) => x.forecast.ticketsSold >= x.event.ticket_target).length / past.length) * 100) : null;
  return (
    <>
      <PageHeader title="Reports" description="Compare past events and open a detailed, printable report for any event." />
      {events.length === 0 ? <EmptyState icon={BarChart3} title="No events to report on" description="Reports appear once you've added events." /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Events" value={events.length} sub={`${past.length} finished`} />
            <StatCard label="Tickets recorded" value={formatNumber(totalTickets)} />
            <StatCard label="Ticket revenue recorded" value={formatMoney(totalRevenue, ctx.org.currency)} />
            <StatCard label="Finished events that hit target" value={hitRate != null ? `${hitRate}%` : "—"} />
          </div>
          <Card><CardHeader><CardTitle>Tickets sold vs target</CardTitle></CardHeader><CardContent><BarsChart data={s.slice(-12).map((x) => ({ label: x.event.name.slice(0, 14), value: x.forecast.percentOfTarget }))} name="% of target" /></CardContent></Card>
          <Card>
            <CardHeader><CardTitle>Event reports</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <Table>
                <thead><tr><th>Event</th><th>Date</th><th>Sold</th><th>Target</th><th>Revenue</th><th><span className="sr-only">Report</span></th></tr></thead>
                <tbody>{s.map((x) => (
                  <tr key={x.event.id}>
                    <td className="font-medium">{x.event.name}</td><td className="whitespace-nowrap">{formatDateRange(x.event.event_date, x.event.end_date)}</td><td>{formatNumber(x.forecast.ticketsSold)}</td><td>{formatNumber(x.event.ticket_target)}</td><td>{formatMoney(x.forecast.netRevenue, ctx.org.currency)}</td>
                    <td><Link href={`/dashboard/events/${x.event.id}/report`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><FileText className="size-4" /> Report</Link></td>
                  </tr>
                ))}</tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
