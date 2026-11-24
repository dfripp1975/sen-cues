import { NextResponse } from "next/server";
import { getOptionalOrgContext } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOptionalOrgContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  const { data: event } = await ctx.supabase.from("events").select("name").eq("id", id).eq("org_id", ctx.org.id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data } = await ctx.supabase.from("ticket_sales").select("sale_date, quantity, revenue, refunds, refund_amount, source, note, ticket_tiers(name)").eq("event_id", id).eq("org_id", ctx.org.id).order("sale_date");
  const rows = (data ?? []).map((r) => [r.sale_date, (r.ticket_tiers as unknown as { name: string } | null)?.name ?? "", r.quantity, r.revenue, r.refunds, r.refund_amount, r.source, r.note ?? ""]);
  const csv = toCsv(["date", "ticket_type", "quantity", "revenue", "refunds", "refund_amount", "source", "note"], rows);
  const filename = `${event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-sales.csv`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
}
