import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/ops";

// Daily job (see vercel.json). Deletes old click and survey data per each
// organisation's retention setting, and prunes old rate-limit rows.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const db = createAdminClient();
    const { data: orgs } = await db.from("organisations").select("id, data_retention_months");
    let orgsProcessed = 0;
    for (const o of orgs ?? []) {
      const cutoff = new Date();
      cutoff.setUTCMonth(cutoff.getUTCMonth() - o.data_retention_months);
      await db.from("link_clicks").delete().eq("org_id", o.id).lt("clicked_at", cutoff.toISOString());
      await db.from("survey_responses").delete().eq("org_id", o.id).lt("created_at", cutoff.toISOString());
      orgsProcessed++;
    }
    await db.from("rate_limits").delete().lt("window_start", new Date(Date.now() - 2 * 86400000).toISOString());
    await db.from("app_errors").delete().lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString());
    return NextResponse.json({ ok: true, orgsProcessed });
  } catch (e) {
    await logError("cron-retention", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
