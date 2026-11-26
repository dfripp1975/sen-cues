import { Check } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { aiCreditsUsed, countActiveEvents } from "@/lib/entitlements";
import { getStripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/env";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Progress, Table } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import { cn, formatMoney } from "@/lib/utils";
import { CheckoutButton, PortalButton } from "../forms";
import { REGIONS, countryCode, currencyForCountry, formatPrice, planPrice, toCurrency, type Currency } from "@/lib/pricing";
import { getVisitorCurrency } from "@/lib/pricing-server";
import { BillingCurrencyPicker } from "./currency-picker";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; plan?: string; interval?: string; currency?: string }> }) {
  const ctx = await requireOrg();
  const sp = await searchParams;
  const interval = sp.interval === "year" ? "year" : "month";
  const [events, credits] = await Promise.all([countActiveEvents(ctx), aiCreditsUsed(ctx)]);
  const sub = ctx.subscription;
  const stripeOn = isStripeConfigured();
  let invoices: { id: string; date: number; amount: number; currency: string; status: string | null; url: string | null | undefined }[] = [];
  if (stripeOn && sub.stripe_customer_id) {
    try {
      const list = await getStripe().invoices.list({ customer: sub.stripe_customer_id, limit: 12 });
      invoices = list.data.map((i) => ({ id: i.id ?? "", date: i.created, amount: i.amount_paid / 100, currency: i.currency.toUpperCase(), status: i.status, url: i.hosted_invoice_url }));
    } catch {
      invoices = [];
    }
  }
  const canManage = ctx.role !== "member";
  // Billing currency: an active subscription keeps the currency it was bought in
  // (Stripe can't switch it); otherwise the choice on this page, the visitor's saved
  // or detected currency, or the organisation's country.
  const subCurrency = sub.plan !== "free" ? toCurrency((sub as { currency?: string | null }).currency) : null;
  const orgCountry = countryCode(ctx.org.country);
  const currency: Currency = subCurrency ?? toCurrency(sp.currency) ?? (orgCountry ? currencyForCountry(orgCountry) : await getVisitorCurrency());
  const region = REGIONS[currency];
  const q = (extra: Record<string, string>) => "?" + new URLSearchParams({ ...(sp.plan ? { plan: sp.plan } : {}), interval, currency, ...extra }).toString();
  const highlight = sp.plan as PlanId | undefined;
  return (
    <div className="space-y-6">
      {sp.checkout === "success" && <Alert tone="success" title="Thanks for subscribing">Your plan updates as soon as Stripe confirms the payment — usually within a few seconds. Refresh this page if it hasn&apos;t changed yet.</Alert>}
      {sp.checkout === "cancelled" && <Alert tone="info">Checkout was cancelled. You haven&apos;t been charged.</Alert>}
      {!stripeOn && <Alert tone="warning" title="Payments not configured">Stripe keys haven&apos;t been added to this deployment yet, so plan changes are unavailable. See the README&apos;s Stripe setup section.</Alert>}
      {sub.status === "past_due" && <Alert tone="danger" title="Payment problem">Your last payment failed. Update your payment method to keep paid features.</Alert>}

      <Card>
        <CardHeader>
          <div><CardTitle>Current plan: {ctx.plan.name}</CardTitle><CardDescription>{sub.plan === "free" ? "Free forever. Upgrade any time." : `${sub.billing_interval === "year" ? "Annual" : "Monthly"} billing · ${sub.cancel_at_period_end ? "Cancels" : "Renews"} on ${formatDate(sub.current_period_end?.slice(0, 10))}`}</CardDescription></div>
          <Badge tone={sub.status === "active" || sub.status === "trialing" ? "success" : "warning"}>{sub.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div><div className="flex justify-between text-sm"><span>Active events</span><span className="font-semibold">{events} / {ctx.plan.activeEvents}</span></div><Progress value={(events / ctx.plan.activeEvents) * 100} className="mt-2" label="Active events used" /></div>
          <div><div className="flex justify-between text-sm"><span>AI credits this month</span><span className="font-semibold">{credits} / {ctx.plan.aiCreditsPerMonth}</span></div><Progress value={ctx.plan.aiCreditsPerMonth ? (credits / ctx.plan.aiCreditsPerMonth) * 100 : 0} className="mt-2" label="AI credits used" /></div>
          {sub.stripe_customer_id && canManage && <div className="sm:col-span-2"><PortalButton /><p className="mt-2 text-xs text-slate-500">Opens Stripe&apos;s secure portal to change plan, update your card, download invoices or cancel. Cancelling keeps paid features until the end of the period.</p></div>}
        </CardContent>
      </Card>

      {canManage ? (
        <div>
          <div className="mb-3">
            {subCurrency ? <p className="text-sm text-slate-600">Your subscription is billed in {subCurrency}.</p> : <BillingCurrencyPicker value={currency} />}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Plans</h2>
            <div className="flex gap-1 rounded-full bg-white p-1 text-sm ring-1 ring-slate-200">
              <a href={q({ interval: "month" })} className={cn("rounded-full px-3 py-1 font-semibold", interval === "month" ? "bg-navy text-white" : "text-slate-600")}>Monthly</a>
              <a href={q({ interval: "year" })} className={cn("rounded-full px-3 py-1 font-semibold", interval === "year" ? "bg-navy text-white" : "text-slate-600")}>Annual</a>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const current = sub.plan === id;
              const price = planPrice(id, currency, interval);
              return (
                <div key={id} className={cn("flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200", highlight === id && "ring-2 ring-brand-600", current && "bg-brand-50/40")}>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="mt-2"><span className="font-display text-3xl font-extrabold">{formatPrice(price, currency)}</span><span className="text-sm text-slate-500">/{interval === "year" ? "year" : "month"}</span></p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm">{p.highlights.map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal-accent" />{h}</li>)}</ul>
                  <div className="mt-5">
                    {current ? <Badge tone="brand">Current plan</Badge> : id === "free" ? (sub.plan !== "free" ? <p className="text-xs text-slate-500">To move to Free, cancel in the billing portal.</p> : null) : <CheckoutButton plan={id} interval={interval} currency={currency} label={sub.plan === "free" ? `Upgrade to ${p.name}` : `Switch to ${p.name}`} variant={highlight === id ? "primary" : "secondary"} />}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">Pay by {region.paymentMethods.join(", ")}. Prices in {currency}; taxes may apply depending on your location.</p>
          <p className="mt-1 text-xs text-slate-500">Downgrading keeps your existing data. If you have more active events than the new plan allows, you won&apos;t be able to add more until you archive some.</p>
        </div>
      ) : (
        <Alert tone="info">Only owners and admins can change the plan.</Alert>
      )}

      <Card>
        <CardHeader><CardTitle>Billing history</CardTitle></CardHeader>
        <CardContent className="pt-3">
          {invoices.length ? (
            <Table><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Invoice</th></tr></thead>
              <tbody>{invoices.map((i) => <tr key={i.id}><td>{new Date(i.date * 1000).toLocaleDateString("en-GB")}</td><td>{formatMoney(i.amount, i.currency)}</td><td><Badge tone={i.status === "paid" ? "success" : "neutral"}>{i.status}</Badge></td><td>{i.url ? <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">View</a> : "—"}</td></tr>)}</tbody></Table>
          ) : <p className="text-sm text-slate-500">No invoices yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
