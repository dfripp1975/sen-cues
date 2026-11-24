import { NextResponse } from "next/server";
import { getOptionalOrgContext } from "@/lib/auth";
import { rateLimit } from "@/lib/ops";

const TABLES = ["events", "ticket_tiers", "ticket_sales", "sales_forecasts", "campaigns", "marketing_tasks", "rescue_actions", "ai_content", "tracking_links", "link_clicks", "competitors", "surveys", "survey_responses", "event_income", "event_expenses", "subscriptions", "audit_logs"];

export async function GET() {
  const ctx = await getOptionalOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!(await rateLimit(`export:${ctx.user.id}`, 3600, 5))) return NextResponse.json({ error: "Too many exports. Try again later." }, { status: 429 });
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user: { id: ctx.user.id, email: ctx.user.email, full_name: ctx.user.fullName },
    organisation: ctx.org,
  };
  for (const t of TABLES) {
    const { data } = await ctx.supabase.from(t).select("*").eq("org_id", ctx.org.id).limit(100000);
    out[t] = data ?? [];
  }
  return new NextResponse(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="eventfill-export-${new Date().toISOString().slice(0, 10)}.json"` } });
}
