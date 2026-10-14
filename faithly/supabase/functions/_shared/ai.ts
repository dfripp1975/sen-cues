// AI provider abstraction. Supports Google Gemini and OpenAI behind one interface.
// Keys are read from Edge Function secrets and never leave the server.

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIResult {
  text: string;
  provider: 'gemini' | 'openai';
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export class AINotConfiguredError extends Error {}
export class AIProviderError extends Error {}

export function configuredProvider(): 'gemini' | 'openai' | null {
  const preferred = (Deno.env.get('AI_PROVIDER') ?? '').toLowerCase();
  const hasGemini = !!Deno.env.get('GEMINI_API_KEY');
  const hasOpenAI = !!Deno.env.get('OPENAI_API_KEY');
  if (preferred === 'openai' && hasOpenAI) return 'openai';
  if (preferred === 'gemini' && hasGemini) return 'gemini';
  if (hasGemini) return 'gemini';
  if (hasOpenAI) return 'openai';
  return null;
}

/** Calls the configured provider and returns its JSON text. */
export async function generateJson(req: AIRequest): Promise<AIResult> {
  const provider = configuredProvider();
  if (!provider) throw new AINotConfiguredError('No AI provider key is configured.');
  return provider === 'gemini' ? callGemini(req) : callOpenAI(req);
}

async function callGemini(req: AIRequest): Promise<AIResult> {
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: req.maxTokens ?? 2048,
        temperature: req.temperature ?? 0.6,
      },
    }),
  });
  if (!res.ok) throw new AIProviderError(`Gemini error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!text) throw new AIProviderError(`Gemini returned no content (finishReason: ${data?.candidates?.[0]?.finishReason ?? 'unknown'})`);
  return {
    text,
    provider: 'gemini',
    model,
    inputTokens: data?.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

async function callOpenAI(req: AIRequest): Promise<AIResult> {
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
  // OPENAI_BASE_URL allows OpenAI-compatible endpoints (e.g. Azure OpenAI proxies or a local mock in tests).
  const base = (Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: req.system }, ...req.messages],
      response_format: { type: 'json_object' },
      max_completion_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.6,
    }),
  });
  if (!res.ok) throw new AIProviderError(`OpenAI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new AIProviderError('OpenAI returned no content');
  return {
    text,
    provider: 'openai',
    model,
    inputTokens: data?.usage?.prompt_tokens ?? 0,
    outputTokens: data?.usage?.completion_tokens ?? 0,
  };
}

/** Parse model JSON defensively (strips code fences some models add). */
export function parseModelJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(cleaned) as T;
}
