import { describe, it, expect } from "vitest";
import { SURVEY_TEMPLATES, summariseResponses, validateAnswers } from "@/lib/surveys";

const qs = SURVEY_TEMPLATES.post_event_feedback;

describe("surveys", () => {
  it("validates required answers and option values", () => {
    expect(validateAnswers(qs, {}).ok).toBe(false);
    expect(validateAnswers(qs, { q1: "7" }).ok).toBe(false);
    expect(validateAnswers(qs, { q1: "5", q3: "Hacked" }).ok).toBe(false);
    const ok = validateAnswers(qs, { q1: "4", q3: "Email", q4: "More coffee" });
    expect(ok).toEqual({ ok: true, answers: { q1: 4, q3: "Email", q4: "More coffee" } });
  });
  it("summarises responses for charts", () => {
    const s = summariseResponses(qs, [{ q1: 5, q3: "Email" }, { q1: 3, q3: "Email", q4: "Great" }]);
    expect(s[0].average).toBe(4);
    expect(s[2].counts.find((c) => c.label === "Email")!.count).toBe(2);
    expect(s[3].texts).toEqual(["Great"]);
  });
});
