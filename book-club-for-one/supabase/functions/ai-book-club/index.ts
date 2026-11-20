import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Premium readers' AI allowance. Every request below counts as one question.
//   AI_DAILY_QUESTIONS        free questions per Premium reader per day (UTC)   default 10
//   AI_MONTHLY_BUDGET_PENCE   site-wide monthly AI budget; AI pauses when reached  default 2500 (£25)
//   AI_USD_PER_GBP            exchange rate used to compare the bill with the budget  default 1.27
//   AI_PRICE_IN_PER_M / AI_PRICE_OUT_PER_M   model price in US$ per million tokens  default 0.15 / 0.60
const DAILY_QUESTIONS = Number(Deno.env.get("AI_DAILY_QUESTIONS") || 10);
const MONTHLY_BUDGET_PENCE = Number(Deno.env.get("AI_MONTHLY_BUDGET_PENCE") || 2500);
const USD_PER_GBP = Number(Deno.env.get("AI_USD_PER_GBP") || 1.27);
const PRICE_IN = Number(Deno.env.get("AI_PRICE_IN_PER_M") || 0.15);
const PRICE_OUT = Number(Deno.env.get("AI_PRICE_OUT_PER_M") || 0.60);
const BUDGET_MICRODOLLARS = Math.round((MONTHLY_BUDGET_PENCE / 100) * USD_PER_GBP * 1_000_000);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SYSTEM_PROMPT = `You are an expert literary companion for "The Book Club For One" app.
Your role is to be a spoiler-safe personal book club for a reader.
You receive the book title, the reader's current chapter, and a request type.
CRITICAL RULE: You must NEVER reveal or hint at events that happen AFTER the reader's current chapter.
Always stay within chapters 1 through the reader's current chapter.
If asked about something beyond their chapter, politely say you can't discuss that yet and encourage them to keep reading.
Be warm, insightful, and conversational. Write in clear, engaging prose.
When generating questions, produce exactly the number requested, each on its own line, numbered.
When generating a chapter guide, structure it as: Summary, Key Events, Discussion Points.
When generating character info, list each character with their role and a brief spoiler-safe description.
When generating themes, list each theme with a brief explanation of how it appears so far.
When generating vocabulary, list each word with definition and context from the text so far.
Keep responses concise but rich — aim for 200-400 words unless the request specifically needs more.`;

interface RequestBody {
  bookTitle: string;
  author?: string;
  chapter: number;
  action: string;
  question?: string;
  style?: string;
  count?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Set once a question is taken, so an unexpected failure still gives it back
  let giveBackOnError: (() => Promise<unknown>) | null = null;
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { bookTitle, author, chapter, action, question, style, count } = body;

    // Server-side client: the allowance tables can only be changed with the service role
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: sub } = await admin.from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle();
    const premium = !!sub && (sub.plan === "monthly" || sub.plan === "yearly") && (sub.status === "active" || sub.status === "trialing");

    const allowanceNow = async () => {
      const day = new Date().toISOString().slice(0, 10);
      const [{ data: d }, { data: c }] = await Promise.all([
        admin.from("ai_question_days").select("used").eq("user_id", user.id).eq("day", day).maybeSingle(),
        admin.from("ai_question_credits").select("balance").eq("user_id", user.id).maybeSingle(),
      ]);
      return { daily_limit: DAILY_QUESTIONS, daily_left: Math.max(0, DAILY_QUESTIONS - (d?.used ?? 0)), credits: c?.balance ?? 0 };
    };

    // Read-only check so the page can show "questions left" without spending one
    if (action === "allowance") {
      return json({ premium, allowance: premium ? await allowanceNow() : null });
    }

    if (!premium) {
      return json({ error: "premium_required", message: "Ask-the-book questions are part of Premium." }, 403);
    }

    const month = new Date().toISOString().slice(0, 7);
    const { data: spend } = await admin.from("ai_monthly_spend").select("cost_microdollars").eq("month", month).maybeSingle();
    if ((spend?.cost_microdollars ?? 0) >= BUDGET_MICRODOLLARS) {
      return json({ error: "paused", message: "Book club questions are resting until the 1st of next month. Everything else still works." }, 503);
    }

    const { data: taken, error: takeErr } = await admin.rpc("take_ai_question", { p_user: user.id, p_daily: DAILY_QUESTIONS });
    if (takeErr) return json({ error: "Could not check your questions. Please try again." }, 500);
    if (taken.source === "none") {
      return json({ error: "out_of_questions", message: `You've used today's ${DAILY_QUESTIONS} questions.`, allowance: { daily_limit: DAILY_QUESTIONS, daily_left: 0, credits: 0 } }, 402);
    }
    const giveBack = async () => { giveBackOnError = null; await admin.rpc("return_ai_question", { p_user: user.id, p_source: taken.source }); };
    giveBackOnError = giveBack;
    const allowance = { daily_limit: DAILY_QUESTIONS, daily_left: taken.daily_left, credits: taken.credits };

    if (!bookTitle || !action) {
      await giveBack();
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionPrompts: Record<string, string> = {
      "chapter-guide": `Provide a spoiler-safe chapter companion for "${bookTitle}" by ${author || "unknown author"}, covering only chapters 1 through ${chapter}. Include a brief summary of key events so far, and 3-4 discussion points a reader could reflect on.`,
      "questions": `Generate ${count || 8} discussion questions about "${bookTitle}" by ${author || "unknown author"}, based only on events in chapters 1 through ${chapter}. The style should be ${style || "thoughtful"}. Number each question on its own line.`,
      "characters": `Describe the key characters in "${bookTitle}" by ${author || "unknown author"} as they appear through chapter ${chapter}. For each character, give their name, role, and a brief spoiler-safe description. Only include characters who have appeared by chapter ${chapter}.`,
      "themes": `Identify and explain the main themes in "${bookTitle}" by ${author || "unknown author"} as they appear through chapter ${chapter}. List each theme with a brief explanation of how the author develops it so far.`,
      "vocabulary": `Highlight notable vocabulary words and phrases from "${bookTitle}" by ${author || "unknown author"} through chapter ${chapter}. For each word, give the word, a definition, and how it's used in context.`,
      "missed-details": `What subtle details, foreshadowing, or connections might a reader have missed in "${bookTitle}" by ${author || "unknown author"} through chapter ${chapter}? Highlight 3-5 things worth a closer look, spoiler-safe.`,
      "answer": `A reader is on chapter ${chapter} of "${bookTitle}" by ${author || "unknown author"}. They ask: "${question}". Provide a thoughtful, spoiler-safe answer based only on events up to chapter ${chapter}. Do not reveal anything from later chapters.`,
      "explain": `Explain what has happened so far in "${bookTitle}" by ${author || "unknown author"} through chapter ${chapter} in simple, clear terms. Give a concise recap spoiler-safe through chapter ${chapter}.`,
    };

    const userPrompt = actionPrompts[action] || actionPrompts["explain"];

    const openaiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      await giveBack();
      const errText = await openaiResponse.text();
      return new Response(JSON.stringify({ error: "AI request failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    // Record what this request cost against the monthly budget
    const usage = openaiData.usage || {};
    const cost = Math.round((usage.prompt_tokens || 0) * PRICE_IN + (usage.completion_tokens || 0) * PRICE_OUT);
    await admin.rpc("add_ai_spend", { p_month: month, p_cost: cost });
    if (content) giveBackOnError = null;   // answered: the question is spent
    await admin.from("ai_usage").insert({ user_id: user.id, action, book_title: bookTitle });

    if (!content) {
      await giveBack();
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "questions") {
      const questions = content
        .split("\n")
        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((q: string) => q.length > 0);
      return new Response(JSON.stringify({ questions, allowance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content, allowance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (giveBackOnError) await giveBackOnError().catch(() => {});
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
