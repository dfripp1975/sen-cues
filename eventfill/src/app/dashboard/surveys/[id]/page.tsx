import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireOrg } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/confirm";
import { BarsChart } from "@/components/charts/charts";
import { summariseResponses, type Answers } from "@/lib/surveys";
import { env } from "@/lib/env";
import type { SurveyQuestion } from "@/lib/validation";
import { QuestionEditor, SurveyControls } from "../client";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: survey } = await ctx.supabase.from("surveys").select("*").eq("id", id).eq("org_id", ctx.org.id).maybeSingle();
  if (!survey) notFound();
  const { data: responses } = await ctx.supabase.from("survey_responses").select("answers, created_at").eq("survey_id", id).eq("org_id", ctx.org.id).order("created_at", { ascending: false }).limit(5000);
  const questions = survey.questions as SurveyQuestion[];
  const summary = summariseResponses(questions, (responses ?? []).map((r) => r.answers as Answers));
  const url = `${env.siteUrl}/s/${survey.slug}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 180 });
  return (
    <>
      <PageHeader title={survey.title} eyebrow={<Badge tone={survey.is_open ? "success" : "neutral"}>{survey.is_open ? "Accepting responses" : "Closed"}</Badge>} description={`${responses?.length ?? 0} response(s) · ${survey.anonymous ? "Anonymous" : "Respondents may leave an email"}`} actions={<SurveyControls id={id} open={survey.is_open} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><div><CardTitle>Share</CardTitle><CardDescription>Send the link or print the QR code.</CardDescription></div></CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className="size-44 [&_svg]:size-full" role="img" aria-label="Survey QR code" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="break-all text-center font-mono text-xs text-brand-700">{url}</p>
              <div className="flex gap-2">
                <CopyButton text={url} label="Copy link" />
                <a className="inline-flex h-8 items-center rounded-xl bg-white px-3 text-xs font-semibold ring-1 ring-slate-200" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} download="survey-qr.svg">Download QR</a>
              </div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Questions</CardTitle></CardHeader><CardContent><QuestionEditor id={id} initial={questions} /></CardContent></Card>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Results</h2>
          {summary.map((s) => (
            <Card key={s.question.id}>
              <CardHeader><div><CardTitle className="text-sm">{s.question.label}</CardTitle><CardDescription>{s.answered} answer(s){s.average != null && ` · average ${s.average} / 5`}</CardDescription></div></CardHeader>
              <CardContent>
                {s.question.type === "text" ? (
                  s.texts.length ? <ul className="max-h-64 space-y-2 overflow-y-auto">{s.texts.map((t, i) => <li key={i} className="rounded-lg bg-canvas p-2.5 text-sm">{t}</li>)}</ul> : <p className="text-sm text-slate-500">No answers yet.</p>
                ) : (
                  <BarsChart horizontal data={s.counts.map((c) => ({ label: c.label, value: c.count }))} height={Math.max(120, s.counts.length * 36)} color="#14B8A6" name="Responses" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
