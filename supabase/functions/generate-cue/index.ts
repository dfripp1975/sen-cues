// Supabase Edge Function: generate-cue
//
// This exists so the Anthropic API key never lives in the app itself.
// The prototype called api.anthropic.com directly from the browser, which is
// fine for a sandboxed preview but not safe to ship — anyone could extract the
// key from the app bundle. This function holds the key server-side instead.
//
// Deploy with:
//   supabase functions deploy generate-cue
// Set the secret with:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Rate limiting: each call is logged to cue_generation_log (service-role only,
// see supabase/schema.sql) and capped at DAILY_LIMIT per user per 24 hours.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SYSTEM_PROMPT = `You are the content engine for SEN Cues, an app that gives parents and carers of children with additional needs practical, in-the-moment support. You write calm, warm, non-judgemental, practical guidance. You are NOT a diagnostic tool. Never state assumptions as facts, always use cautious language such as "may", "might", "for some children", "one possibility is". Never diagnose, never claim to treat autism, ADHD or any condition, never suggest medication. Use British English and British institutions where relevant (CAMHS, EHCP, SENCO, NHS, health visitor, GP). Respond ONLY with valid minified JSON, no markdown fences, no preamble, matching exactly this shape: {"whatMayBeHappening":"1-2 sentences","say":["phrase1","phrase2","phrase3"],"doThis":["action1","action2","action3"],"avoid":["thing to avoid saying or doing 1","thing to avoid 2","thing to avoid 3"],"why":"1-2 sentences in plain English","nextTime":"1 short preventative strategy sentence","quickCue":"one short phrase, under 12 words, a parent could say immediately"}`;

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller has a valid Supabase session (any signed-in user, incl. anonymous)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
    }

    // TODO: check accounts.is_premium for userData.user.id here and reject with
    // 402 if the caller isn't on Premium, once subscriptions are wired up.

    // Per-user daily limit, counted from the service-role-only log table so it
    // can't be bypassed or reset from the app.
    const DAILY_LIMIT = 20;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("cue_generation_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .gte("created_at", since);
    if (countError) {
      return new Response(JSON.stringify({ error: "Could not generate a cue right now" }), { status: 500, headers: corsHeaders });
    }
    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "You've reached today's limit for created cues. It resets within 24 hours — the full cue library is still here for you." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { situation, profileContext } = await req.json();
    if (!situation || typeof situation !== "string") {
      return new Response(JSON.stringify({ error: "Missing situation" }), { status: 400, headers: corsHeaders });
    }

    // Logged before the model call so a failed parse still counts a spend.
    await supabase.from("cue_generation_log").insert({ user_id: userData.user.id });

    const userPrompt = `${profileContext || "No child profile has been set up yet."}\n\nSituation the parent has described: "${situation.slice(0, 600)}"\n\nGenerate the JSON response now.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Could not generate a cue right now" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
