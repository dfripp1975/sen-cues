"use client";
import * as React from "react";
import { Input, Label } from "@/components/ui/form";
import { scenarioProfit } from "@/lib/finance";
import { formatMoney } from "@/lib/utils";

export function ScenarioCalculator({ currency, defaultTickets, defaultPrice, otherIncome, expenses }: { currency: string; defaultTickets: number; defaultPrice: number; otherIncome: number; expenses: number }) {
  const [tickets, setTickets] = React.useState(String(defaultTickets));
  const [price, setPrice] = React.useState(String(defaultPrice));
  const [cost, setCost] = React.useState(String(expenses));
  const r = scenarioProfit(Number(tickets) || 0, Number(price) || 0, otherIncome, Number(cost) || 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label htmlFor="sc-t">Tickets sold</Label><Input id="sc-t" type="number" min={0} value={tickets} onChange={(e) => setTickets(e.target.value)} /></div>
        <div><Label htmlFor="sc-p">Average price ({currency})</Label><Input id="sc-p" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><Label htmlFor="sc-c">Total costs ({currency})</Label><Input id="sc-c" type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-canvas p-4 ring-1 ring-slate-200"><p className="text-xs text-slate-500">Scenario revenue</p><p className="font-display text-xl font-bold">{formatMoney(r.revenue, currency)}</p></div>
        <div className={`rounded-xl p-4 ring-1 ${r.profit >= 0 ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200"}`}><p className="text-xs text-slate-500">Scenario profit</p><p className="font-display text-xl font-bold">{formatMoney(r.profit, currency)}</p></div>
      </div>
      <p className="text-xs text-slate-500">Scenario includes other income of {formatMoney(otherIncome, currency)}. This is a what-if estimate only.</p>
    </div>
  );
}
