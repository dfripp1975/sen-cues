import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY to the new prices (each with
// GBP, USD, EUR, CAD and AUD amounts as currency options). The old $5 / $48
// prices are the fallback until then.
const PRICE_MAP: Record<string, string> = {
  monthly: Deno.env.get("STRIPE_PRICE_MONTHLY") || "price_1UQVwMRvqoxvOpTZCIDIo8Tx",
  yearly: Deno.env.get("STRIPE_PRICE_YEARLY") || "price_1UQVwfRvqoxvOpTZNI0b86IU",
};
// Currencies the prices carry; any other visitor is charged in USD, or in their
// own currency when Adaptive Pricing is switched on in the Stripe dashboard.
const CURRENCIES = new Set(["gbp", "usd", "eur", "cad", "aud"]);
const MULTI_CURRENCY = !!(Deno.env.get("STRIPE_PRICE_MONTHLY") && Deno.env.get("STRIPE_PRICE_YEARLY"));

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Payments not configured" }), {
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

    const { plan, currency } = await req.json();
    const wanted = String(currency || "").toLowerCase();
    if (!plan || !PRICE_MAP[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-12-18.acacia",
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await adminClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      }, { onConflict: "user_id" });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      ...(MULTI_CURRENCY && CURRENCIES.has(wanted) ? { currency: wanted } : {}),
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/pricing?upgrade=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
