import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDestination, classifyDevice, isValidSlug, referrerHost, validateDestination } from "@/lib/tracking";
import { rateLimit } from "@/lib/ops";

// Public redirect for tracking links. Stores only time, coarse device type and
// referring domain. The IP is used transiently (hashed) for rate limiting only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return notFound();
  let db;
  try {
    db = createAdminClient();
  } catch {
    return notFound();
  }
  const { data: link } = await db.from("tracking_links").select("id, org_id, destination_url, utm_source, utm_medium, utm_campaign, utm_content, is_active").eq("slug", slug).maybeSingle();
  if (!link || !link.is_active) return notFound();

  // Re-validate on the way out in case data was changed outside the app.
  const v = validateDestination(link.destination_url);
  if (!v.ok) return notFound();
  const target = buildDestination(link.destination_url, link);

  const ua = req.headers.get("user-agent");
  const device = classifyDevice(ua);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("sha256").update(`${ip}|${day}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 24);
  // Count at most 10 clicks per visitor per link per hour; always redirect.
  if (device !== "bot" && (await rateLimit(`click:${link.id}:${ipHash}`, 3600, 10))) {
    await db.from("link_clicks").insert({ link_id: link.id, org_id: link.org_id, device, referrer_host: referrerHost(req.headers.get("referer")) });
  }
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" } });
}

function notFound() {
  return new NextResponse("This link is not available.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
