import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Server-side AI content generation. The API key never leaves the server.
// Provider is configurable via AI_PROVIDER (currently "anthropic"); adding a
// new provider means implementing `generate` for it below.

export const CONTENT_TYPES = [
  ["event_description", "Event description"],
  ["headline", "Promotional headlines"],
  ["instagram_caption", "Instagram caption"],
  ["facebook_post", "Facebook post"],
  ["linkedin_post", "LinkedIn post"],
  ["tiktok_script", "TikTok video script"],
  ["marketing_email", "Marketing email"],
  ["event_reminder", "Event reminder"],
  ["partnership_outreach", "Partnership outreach message"],
  ["campaign_ideas", "Promotional campaign ideas"],
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number][0];
export const CONTENT_TYPE_LABELS = Object.fromEntries(CONTENT_TYPES) as Record<ContentType, string>;

export const TONES = ["Friendly", "Professional", "Exciting", "Warm and community-focused", "Concise and direct", "Playful"];

export interface GenerateInput {
  contentType: ContentType;
  eventName: string;
  eventDate?: string | null;
  venue?: string | null;
  isOnline?: boolean;
  bookingUrl?: string | null;
  eventDescription?: string | null;
  audience: string;
  platform: string;
  tone: string;
  objective: string;
  keyInfo: string;
  variationOf?: string | null;
}

export interface GenerateResult {
  text: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export class AiUnavailableError extends Error {}

// USD per million tokens, used for the admin cost estimate only.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
};

export function aiModel(): string {
  return process.env.AI_MODEL || "claude-opus-5-5";
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? PRICING["claude-opus-5-5"];
  return Math.round(((inputTokens * p.in + outputTokens * p.out) / 1_000_000) * 100000) / 100000;
}

const SYSTEM_PROMPT = `You write promotional copy for event organisers using a tool called EventFill.

Rules you must always follow:
- Use only the facts provided. Never invent speakers, performers, prices, dates, venues, statistics, reviews, testimonials, attendee numbers or awards.
- Where a useful detail is missing, leave a clearly marked placeholder in square brackets, e.g. [speaker name].
- Never create false urgency or scarcity. Only mention limited places or deadlines if the organiser's information says so.
- Never promise outcomes (e.g. guaranteed jobs, income or results).
- Keep to the requested platform's norms (length, hashtags, line breaks) and the requested tone.
- Write in clear, inclusive language. Output only the finished copy, with no preamble or commentary.`;

function buildPrompt(i: GenerateInput): string {
  const lines = [
    `Write: ${CONTENT_TYPE_LABELS[i.contentType]}`,
    `Platform: ${i.platform}`,
    `Tone: ${i.tone}`,
    `Target audience: ${i.audience}`,
    `Promotional objective: ${i.objective}`,
    "",
    "Event facts:",
    `- Name: ${i.eventName}`,
    i.eventDate ? `- Date: ${i.eventDate}` : null,
    i.isOnline ? "- Format: online" : i.venue ? `- Venue: ${i.venue}` : null,
    i.bookingUrl ? `- Booking link: ${i.bookingUrl}` : "- Booking link: [booking link]",
    i.eventDescription ? `- Organiser's description: ${i.eventDescription.slice(0, 1500)}` : null,
    i.keyInfo ? `- Important information from the organiser: ${i.keyInfo.slice(0, 1500)}` : null,
  ].filter((l) => l !== null);
  if (i.variationOf) {
    lines.push("", "Write a clearly different alternative to this previous version (new angle and opening):", i.variationOf.slice(0, 2000));
  }
  if (i.contentType === "headline") lines.push("", "Give 5 headline options, one per line.");
  if (i.contentType === "campaign_ideas") lines.push("", "Give 5 practical, low-cost campaign ideas as a short numbered list.");
  return lines.join("\n");
}

export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  const provider = process.env.AI_PROVIDER || "anthropic";
  if (provider !== "anthropic") throw new AiUnavailableError(`AI provider "${provider}" is not supported yet.`);
  if (!process.env.ANTHROPIC_API_KEY) throw new AiUnavailableError("AI generation is not configured.");

  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  const model = aiModel();
  // Server-side refusal fallback is supported on current Opus/Fable/Sonnet 5.5 models.
  const supportsFallback = /^claude-(opus-5|fable-5|sonnet-5-5)/.test(model);

  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 4000, // short copy; bounded to keep per-request cost predictable
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildPrompt(input) }],
      ...(supportsFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });

    if (response.stop_reason === "refusal") {
      throw new AiUnavailableError("The AI declined this request. Try rewording the important information.");
    }
    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    if (!text) throw new AiUnavailableError("The AI returned an empty response. Please try again.");
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    return {
      text: response.stop_reason === "max_tokens" ? `${text}\n\n[Output was cut short — try generating again.]` : text,
      provider,
      model: response.model,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
    };
  } catch (e) {
    if (e instanceof AiUnavailableError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiUnavailableError("The AI provider rejected the API key. Check ANTHROPIC_API_KEY.");
    if (e instanceof Anthropic.RateLimitError) throw new AiUnavailableError("The AI service is busy. Please try again in a minute.");
    if (e instanceof Anthropic.APIError) throw new AiUnavailableError("The AI service returned an error. Please try again.");
    throw e;
  }
}

/** Clearly labelled example used when no AI key is configured. Not AI-generated. */
export function exampleTemplate(i: GenerateInput): string {
  const where = i.isOnline ? "online" : i.venue ? `at ${i.venue}` : "[venue]";
  return [
    "[EXAMPLE TEMPLATE — not AI-generated. Edit before using.]",
    "",
    `Join us for ${i.eventName}${i.eventDate ? ` on ${i.eventDate}` : ""}, ${where}.`,
    "",
    `[One sentence on who it's for: ${i.audience || "your audience"}.]`,
    "[Two or three specific things attendees will get from the event.]",
    i.keyInfo ? `\n${i.keyInfo}` : "",
    "",
    `Book your place: ${i.bookingUrl || "[booking link]"}`,
  ].join("\n");
}
