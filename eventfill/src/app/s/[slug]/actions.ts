"use server";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAnswers } from "@/lib/surveys";
import { rateLimit } from "@/lib/ops";
import { formToObject } from "@/lib/action";
import type { SurveyQuestion } from "@/lib/validation";
import type { ActionState } from "@/components/ui/action-form";

export async function submitSurvey(slug: string, _: ActionState, fd: FormData): Promise<ActionState> {
  if (!/^[a-z0-9]{6,40}$/.test(slug)) return { ok: false, error: "Survey not found." };
  const input = formToObject(fd);
  if (input.website) return { ok: true }; // honeypot
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${slug}`).digest("hex").slice(0, 24);
  if (!(await rateLimit(`survey:${ipHash}`, 3600, 5))) return { ok: false, error: "Too many responses from this device. Please try again later." };
  const db = createAdminClient();
  const { data: survey } = await db.from("surveys").select("id, org_id, questions, is_open, anonymous").eq("slug", slug).maybeSingle();
  if (!survey || !survey.is_open) return { ok: false, error: "This survey is closed." };
  const result = validateAnswers(survey.questions as SurveyQuestion[], input);
  if (!result.ok) return { ok: false, error: result.error };
  let email: string | null = null;
  if (!survey.anonymous && input.email && input.consent === "on") {
    const e = z.email().safeParse(input.email);
    if (!e.success) return { ok: false, error: "Enter a valid email address or leave it blank." };
    email = e.data;
  }
  const { error } = await db.from("survey_responses").insert({ survey_id: survey.id, org_id: survey.org_id, answers: result.answers, respondent_email: email });
  if (error) return { ok: false, error: "We couldn't save your response. Please try again." };
  return { ok: true, message: "Thank you — your response has been recorded." };
}
