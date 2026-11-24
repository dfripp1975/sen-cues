import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogoMark } from "@/components/logo";
import type { SurveyQuestion } from "@/lib/validation";
import { SurveyForm } from "./form";

export const metadata: Metadata = { title: "Survey", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PublicSurvey({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6,40}$/.test(slug)) notFound();
  let survey;
  try {
    const { data } = await createAdminClient().from("surveys").select("title, questions, is_open, anonymous, organisations(name)").eq("slug", slug).maybeSingle();
    survey = data;
  } catch {
    notFound();
  }
  if (!survey) notFound();
  const orgName = (survey.organisations as unknown as { name: string } | null)?.name;
  return (
    <main id="main" className="min-h-dvh bg-canvas px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-slate-500">{orgName}</p>
        <h1 className="mt-1 text-2xl font-bold">{survey.title}</h1>
        {survey.is_open ? (
          <SurveyForm slug={slug} questions={survey.questions as SurveyQuestion[]} anonymous={survey.anonymous} />
        ) : (
          <p className="mt-6 rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-slate-200">This survey is closed. Thank you for your interest.</p>
        )}
        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400"><LogoMark className="size-5" /> Powered by EventFill · {survey.anonymous ? "Responses are anonymous." : "Your email is optional."}</p>
      </div>
    </main>
  );
}
