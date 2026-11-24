// Event profit calculations. Distinguishes actual from estimated amounts.

export interface MoneyLine {
  category: string;
  amount: number;
  is_estimate: boolean;
}

export interface ProfitInput {
  ticketRevenue: number; // net of refunds, from recorded sales (actual)
  ticketsSold: number;
  income: MoneyLine[]; // sponsorship, exhibitor, other
  expenses: MoneyLine[];
  averageTicketPrice?: number | null; // used for break-even when no sales yet
}

export interface ProfitSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  margin: number | null; // %
  breakEvenTickets: number | null;
  averageRevenuePerTicket: number | null;
  estimatedRevenue: number;
  estimatedExpenses: number;
  hasEstimates: boolean;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeProfit(p: ProfitInput): ProfitSummary {
  const otherIncome = p.income.reduce((s, l) => s + Number(l.amount), 0);
  const totalRevenue = r2(p.ticketRevenue + otherIncome);
  const totalExpenses = r2(p.expenses.reduce((s, l) => s + Number(l.amount), 0));
  const profit = r2(totalRevenue - totalExpenses);
  const avgPerTicket = p.ticketsSold > 0 ? p.ticketRevenue / p.ticketsSold : p.averageTicketPrice ?? null;
  // Break-even: tickets needed so that ticket revenue + other income covers expenses.
  const shortfall = totalExpenses - otherIncome;
  const breakEvenTickets = avgPerTicket && avgPerTicket > 0 ? Math.max(0, Math.ceil(shortfall / avgPerTicket)) : null;
  const group = (lines: MoneyLine[]) =>
    lines.reduce<Record<string, number>>((acc, l) => ((acc[l.category] = r2((acc[l.category] ?? 0) + Number(l.amount))), acc), {});
  return {
    totalRevenue,
    totalExpenses,
    profit,
    margin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 1000) / 10 : null,
    breakEvenTickets,
    averageRevenuePerTicket: p.ticketsSold > 0 ? r2(p.ticketRevenue / p.ticketsSold) : null,
    estimatedRevenue: r2(p.income.filter((l) => l.is_estimate).reduce((s, l) => s + Number(l.amount), 0)),
    estimatedExpenses: r2(p.expenses.filter((l) => l.is_estimate).reduce((s, l) => s + Number(l.amount), 0)),
    hasEstimates: p.income.some((l) => l.is_estimate) || p.expenses.some((l) => l.is_estimate),
    incomeByCategory: group(p.income),
    expensesByCategory: group(p.expenses),
  };
}

/** What-if scenario: projected profit at a given ticket count and price. */
export function scenarioProfit(tickets: number, price: number, otherIncome: number, expenses: number) {
  const revenue = r2(tickets * price + otherIncome);
  return { revenue, profit: r2(revenue - expenses) };
}
