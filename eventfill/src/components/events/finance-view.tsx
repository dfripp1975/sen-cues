import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { BarsChart } from "@/components/charts/charts";
import { ScenarioCalculator } from "./scenario";
import { computeProfit } from "@/lib/finance";
import { formatMoney } from "@/lib/utils";
import type { EventSummary } from "@/lib/event-summary";
import type { MoneyRow } from "@/types/db";

const LABELS: Record<string, string> = { sponsorship: "Sponsorship", exhibitor: "Exhibitor fees", other: "Other", venue: "Venue hire", catering: "Catering", staff: "Staff", entertainment: "Entertainment", equipment: "Equipment", marketing: "Marketing", ticketing_fees: "Ticketing fees", suppliers: "Suppliers" };

export function FinanceView({ s, income, expenses, currency, incomeForm, expenseForm, rowAction }: { s: EventSummary; income: MoneyRow[]; expenses: MoneyRow[]; currency: string; incomeForm?: React.ReactNode; expenseForm?: React.ReactNode; rowAction?: (kind: "income" | "expense", id: string) => React.ReactNode }) {
  const p = computeProfit({ ticketRevenue: s.forecast.netRevenue, ticketsSold: s.forecast.ticketsSold, income, expenses, averageTicketPrice: s.lowestPrice });
  const chart = [{ label: "Revenue", value: p.totalRevenue }, { label: "Expenses", value: p.totalExpenses }, { label: "Profit", value: Math.max(0, p.profit) }];
  const list = (rows: MoneyRow[], kind: "income" | "expense") =>
    rows.length ? (
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span><span className="font-medium">{LABELS[r.category] ?? r.category}</span>{r.description && <span className="text-slate-500"> · {r.description}</span>}{r.is_estimate && <Badge tone="warning" className="ml-2">Estimate</Badge>}</span>
            <span className="flex items-center gap-2 font-medium">{formatMoney(r.amount, currency)}{rowAction?.(kind, r.id)}</span>
          </li>
        ))}
      </ul>
    ) : <p className="text-sm text-slate-500">Nothing added yet.</p>;
  return (
    <div className="space-y-6">
      {p.hasEstimates && <Alert tone="warning" title="Includes estimates">{formatMoney(p.estimatedRevenue, currency)} of income and {formatMoney(p.estimatedExpenses, currency)} of expenses are marked as estimates. Ticket revenue comes from recorded sales.</Alert>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total revenue" value={formatMoney(p.totalRevenue, currency)} sub={`Tickets ${formatMoney(s.forecast.netRevenue, currency)} (recorded)`} />
        <StatCard label="Total expenses" value={formatMoney(p.totalExpenses, currency)} />
        <StatCard label={p.hasEstimates ? "Estimated profit" : "Profit"} value={formatMoney(p.profit, currency)} sub={p.margin != null ? `${p.margin}% margin` : "No revenue yet"} tone={p.profit >= 0 ? "emerald" : "amber"} />
        <StatCard label="Break-even tickets" value={p.breakEvenTickets ?? "—"} sub={p.averageRevenuePerTicket != null ? `Avg ${formatMoney(p.averageRevenuePerTicket, currency)} per ticket` : p.breakEvenTickets != null ? "Using lowest tier price" : "Add ticket prices or sales"} tone="teal" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><div><CardTitle>Other income</CardTitle><CardDescription>Ticket revenue is added automatically from sales.</CardDescription></div></CardHeader><CardContent className="space-y-4">{list(income, "income")}{incomeForm}</CardContent></Card>
        <Card><CardHeader><CardTitle>Expenses</CardTitle></CardHeader><CardContent className="space-y-4">{list(expenses, "expense")}{expenseForm}</CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent><BarsChart data={chart} name="Amount" /></CardContent></Card>
        <Card><CardHeader><div><CardTitle>What-if scenario</CardTitle><CardDescription>Try different ticket numbers, prices and costs.</CardDescription></div></CardHeader><CardContent>
          <ScenarioCalculator currency={currency} defaultTickets={Math.max(s.forecast.ticketsSold, s.event.ticket_target)} defaultPrice={p.averageRevenuePerTicket ?? s.lowestPrice ?? 0} otherIncome={income.reduce((a, r) => a + r.amount, 0)} expenses={p.totalExpenses} />
        </CardContent></Card>
      </div>
    </div>
  );
}
