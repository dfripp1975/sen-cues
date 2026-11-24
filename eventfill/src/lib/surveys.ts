import type { SurveyQuestion } from "./validation";

export const SURVEY_TEMPLATES: Record<string, SurveyQuestion[]> = {
  pre_event_interest: [
    { id: "q1", type: "yesno", label: "Would you be interested in attending this event?", required: true },
    { id: "q2", type: "choice", label: "Which format would suit you best?", options: ["In person", "Online", "Either"], required: false },
    { id: "q3", type: "choice", label: "What would you expect to pay for a ticket?", options: ["Free", "Under 10", "10–25", "25–50", "Over 50"], required: false },
    { id: "q4", type: "text", label: "What topics or activities would make it worth attending?", required: false },
  ],
  post_event_feedback: [
    { id: "q1", type: "rating", label: "Overall, how would you rate the event?", required: true },
    { id: "q2", type: "rating", label: "How likely are you to attend a future event?", required: false },
    { id: "q3", type: "choice", label: "How did you hear about the event?", options: ["Social media", "Email", "Friend or colleague", "Event listing site", "Other"], required: false },
    { id: "q4", type: "text", label: "What could we improve next time?", required: false },
  ],
  attendance_intention: [
    { id: "q1", type: "choice", label: "How likely are you to attend?", options: ["Definitely", "Probably", "Not sure", "Unlikely"], required: true },
    { id: "q2", type: "text", label: "Is there anything that might stop you attending?", required: false },
  ],
  reasons_not_booking: [
    { id: "q1", type: "choice", label: "What's the main reason you haven't booked yet?", options: ["Price", "Date or time", "Location", "Not sure it's for me", "Haven't decided yet", "Other"], required: true },
    { id: "q2", type: "text", label: "What would make you more likely to book?", required: false },
  ],
  custom: [{ id: "q1", type: "text", label: "Your question here", required: false }],
};

export type Answers = Record<string, string | number | boolean>;

/** Aggregate responses per question for charts. Personal data is never included. */
export function summariseResponses(questions: SurveyQuestion[], responses: Answers[]) {
  return questions.map((q) => {
    const values = responses.map((r) => r[q.id]).filter((v) => v !== undefined && v !== "");
    if (q.type === "rating") {
      const nums = values.map(Number).filter((n) => n >= 1 && n <= 5);
      const avg = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
      const counts = [1, 2, 3, 4, 5].map((n) => ({ label: `${n}★`, count: nums.filter((x) => x === n).length }));
      return { question: q, answered: nums.length, average: avg, counts, texts: [] as string[] };
    }
    if (q.type === "choice" || q.type === "yesno") {
      const opts = q.type === "yesno" ? ["Yes", "No"] : q.options ?? [];
      const norm = values.map((v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)));
      const counts = opts.map((o) => ({ label: o, count: norm.filter((v) => v === o).length }));
      return { question: q, answered: norm.length, average: null, counts, texts: [] as string[] };
    }
    const texts = values.map(String).slice(-50).reverse();
    return { question: q, answered: values.length, average: null, counts: [] as { label: string; count: number }[], texts };
  });
}

/** Validate a public submission against the survey definition. */
export function validateAnswers(questions: SurveyQuestion[], input: Record<string, string>): { ok: true; answers: Answers } | { ok: false; error: string } {
  const answers: Answers = {};
  for (const q of questions) {
    const raw = (input[q.id] ?? "").trim();
    if (!raw) {
      if (q.required) return { ok: false, error: `Please answer: ${q.label}` };
      continue;
    }
    if (q.type === "rating") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, error: "Ratings must be between 1 and 5." };
      answers[q.id] = n;
    } else if (q.type === "choice") {
      if (!(q.options ?? []).includes(raw)) return { ok: false, error: "Invalid choice." };
      answers[q.id] = raw;
    } else if (q.type === "yesno") {
      if (raw !== "Yes" && raw !== "No") return { ok: false, error: "Invalid answer." };
      answers[q.id] = raw;
    } else {
      answers[q.id] = raw.slice(0, 2000);
    }
  }
  return { ok: true, answers };
}
