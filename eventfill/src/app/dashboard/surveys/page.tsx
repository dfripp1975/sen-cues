import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { listEvents } from "@/lib/data/queries";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SURVEY_TYPES } from "@/lib/validation";
import { NewSurveyButton } from "./client";

export const metadata: Metadata = { title: "Audience surveys" };
const TYPE_LABEL = Object.fromEntries(SURVEY_TYPES) as Record<string, string>;

export default async function SurveysPage() {
  const ctx = await requireOrg();
  const [events, { data: surveys }] = await Promise.all([listEvents(ctx), ctx.supabase.from("surveys").select("id, title, survey_type, is_open, event_id, created_at, survey_responses(count)").eq("org_id", ctx.org.id).order("created_at", { ascending: false })]);
  return (
    <>
      <PageHeader title="Audience surveys" description="Learn what your audience wants, why people don't book, and how events went." actions={<NewSurveyButton events={events.map((e) => ({ id: e.id, name: e.name }))} />} />
      {!surveys?.length ? (
        <EmptyState icon={MessageSquareText} title="No surveys yet" description="Create a survey and share the link or QR code with your audience." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {surveys.map((s) => (
            <li key={s.id}>
              <Link href={`/dashboard/surveys/${s.id}`} className="block rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200 hover:ring-brand-300">
                <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{s.title}</h2><Badge tone={s.is_open ? "success" : "neutral"}>{s.is_open ? "Open" : "Closed"}</Badge></div>
                <p className="mt-1 text-sm text-slate-500">{TYPE_LABEL[s.survey_type] ?? s.survey_type} · {events.find((e) => e.id === s.event_id)?.name ?? "No event"}</p>
                <p className="mt-3 text-sm font-medium">{(s.survey_responses as unknown as { count: number }[])[0]?.count ?? 0} response(s)</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
