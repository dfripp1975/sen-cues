import Link from "next/link";
import { Bell } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils";

export default async function NotificationsPage() {
  const ctx = await requireOrg();
  const { data } = await ctx.supabase.from("notifications").select("id, title, body, href, read_at, created_at").eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(50);
  const unread = (data ?? []).filter((n) => !n.read_at).map((n) => n.id);
  if (unread.length) await ctx.supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unread);
  return (
    <>
      <PageHeader title="Notifications" />
      {!data?.length ? <EmptyState icon={Bell} title="You're all caught up" description="Billing changes and rescue plans will appear here." /> : (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          {data.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-5 py-4">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-slate-200" : "bg-brand-600"}`} />
              <div className="flex-1">
                {n.href?.startsWith("/") ? <Link href={n.href} className="font-medium hover:text-brand-600">{n.title}</Link> : <p className="font-medium">{n.title}</p>}
                {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
              </div>
              <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
