import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

    if (!bookTitle || !action) {
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
      const errText = await openaiResponse.text();
      return new Response(JSON.stringify({ error: "AI request failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
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
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
