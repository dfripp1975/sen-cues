import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { monthStartISO } from "@/lib/entitlements";
import { PLANS, PLAN_ORDER, isPlanId } from "@/lib/plans";
import { DEFAULT_CURRENCY, formatPrice, planPrice, toCurrency, type Currency } from "@/lib/pricing";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, StatCard, Table } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { DonutChart } from "@/components/charts/charts";
import { formatMoney, timeAgo } from "@/lib/utils";
import { ResolveButton } from "./resolve";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const count = async (db: ReturnType<typeof createAdminClient>, table: string) => (await db.from(table).select("*", { count: "exact", head: true })).count ?? 0;

export default async function AdminPage() {
  await requireAdmin();
  let db;
  try { db = createAdminClient(); } catch { return <main className="p-8"><Alert tone="danger">SUPABASE_SERVICE_ROLE_KEY is not configured.</Alert></main>; }
  const [orgs, subs, usage, errors, support, events, campaigns, links, surveys, content, rescue] = await Promise.all([
    db.from("organisations").select("id, name, created_at, onboarding_completed").order("created_at", { ascending: false }).limit(500),
    db.from("subscriptions").select("org_id, plan, status, billing_interval, cancel_at_period_end, currency"),
    db.from("ai_usage").select("estimated_cost_usd, input_tokens, output_tokens").gte("created_at", monthStartISO()).limit(100000),
    db.from("app_errors").select("id, route, message, created_at").order("created_at", { ascending: false }).limit(20),
    db.from("support_messages").select("id, name, email, topic, message, status, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(20),
    count(db, "events"), count(db, "campaigns"), count(db, "tracking_links"), count(db, "surveys"), count(db, "ai_content"), count(db, "rescue_actions"),
  ]);
  const subRows = subs.data ?? [];
  const paidActive = subRows.filter((s) => s.plan !== "free" && ["active", "trialing", "past_due"].includes(s.status));
  // Monthly recurring revenue at list price, kept per currency (no exchange-rate conversion).
  const mrrBy = new Map<Currency, number>();
  for (const s of paidActive) {
    if (!isPlanId(s.plan)) continue;
    const c = toCurrency(s.currency) ?? DEFAULT_CURRENCY;
    const monthly = s.billing_interval === "year" ? planPrice(s.plan, c, "year") / 12 : planPrice(s.plan, c, "month");
    mrrBy.set(c, (mrrBy.get(c) ?? 0) + monthly);
  }
  const mrrText = mrrBy.size ? [...mrrBy].map(([c, v]) => formatPrice(Math.round(v), c)).join(" + ") : formatPrice(0, DEFAULT_CURRENCY);
  const dist = PLAN_ORDER.map((p) => ({ label: PLANS[p].name, value: subRows.filter((s) => (p === "free" ? s.plan === "free" || !paidActive.includes(s) : s.plan === p && paidActive.includes(s))).length }));
  const aiCost = (usage.data ?? []).reduce((a, r) => a + Number(r.estimated_cost_usd), 0);
  const planOf = (id: string) => { const s = subRows.find((x) => x.org_id === id); return s ? `${s.plan}${s.plan !== "free" ? ` · ${s.status}` : ""}` : "free"; };
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><Logo href="/admin" /><div className="flex items-center gap-3"><Badge tone="danger">Admin</Badge><Link href="/dashboard" className="text-sm text-brand-600 underline">Back to app</Link></div></header>
      <main id="main" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">SaaS administration</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Organisations" value={orgs.data?.length ?? 0} sub={`${(orgs.data ?? []).filter((o) => !o.onboarding_completed).length} not finished onboarding`} />
          <StatCard label="Active paid subscriptions" value={paidActive.length} sub={`${paidActive.filter((s) => s.cancel_at_period_end).length} cancelling`} tone="emerald" />
          <StatCard label="MRR (list price)" value={mrrText} sub="Per currency, from list prices; excludes discounts and tax" tone="teal" />
          <StatCard label="AI cost this month" value={formatMoney(aiCost, "USD")} sub={`${usage.data?.length ?? 0} generations (estimated)`} tone="amber" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Subscription distribution</CardTitle></CardHeader><CardContent><DonutChart data={dist} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Feature usage (all time)</CardTitle></CardHeader><CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">{[["Events", events], ["Campaigns", campaigns], ["Tracking links", links], ["Surveys", surveys], ["Saved AI content", content], ["Rescue actions", rescue]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-canvas p-3"><dt className="text-slate-500">{k}</dt><dd className="text-xl font-bold">{v}</dd></div>)}</dl>
          </CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Open support messages</CardTitle></CardHeader><CardContent>
          {support.data?.length ? <ul className="space-y-3">{support.data.map((m) => <li key={m.id} className="rounded-xl bg-canvas p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{m.name} <span className="font-normal text-slate-500">&lt;{m.email}&gt; · {m.topic} · {timeAgo(m.created_at)}</span></p><ResolveButton id={m.id} /></div><p className="mt-2 whitespace-pre-line text-slate-700">{m.message}</p></li>)}</ul> : <p className="text-sm text-slate-500">No open messages.</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Recent organisations</CardTitle></CardHeader><CardContent className="pt-3">
          <Table><thead><tr><th>Organisation</th><th>Created</th><th>Plan</th></tr></thead><tbody>{(orgs.data ?? []).slice(0, 25).map((o) => <tr key={o.id}><td>{o.name}</td><td>{timeAgo(o.created_at)}</td><td>{planOf(o.id)}</td></tr>)}</tbody></Table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Recent application errors</CardTitle></CardHeader><CardContent>
          {errors.data?.length ? <ul className="space-y-2 font-mono text-xs">{errors.data.map((e) => <li key={e.id} className="rounded-lg bg-red-50 p-2 text-red-900"><span className="font-semibold">{e.route}</span> · {timeAgo(e.created_at)}<br />{e.message}</li>)}</ul> : <p className="text-sm text-slate-500">No errors logged.</p>}
        </CardContent></Card>
      </main>
    </div>
  );
}
