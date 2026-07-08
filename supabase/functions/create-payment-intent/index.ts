import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tiered pricing by currency (amounts in minor units)
const PRICING: Record<string, Record<string, number>> = {
  basic: {
    gbp: 2900,
    usd: 3900,
    aud: 4900,
    cad: 3900,
  },
  deluxe: {
    gbp: 3900,
    usd: 4900,
    aud: 6900,
    cad: 5900,
  },
  premium: {
    gbp: 7900,
    usd: 9900,
    aud: 13900,
    cad: 10900,
  },
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  basic: "Basic Speech Package",
  deluxe: "Deluxe Speech Package — Editing Suite & Unlimited Edits",
  premium: "Premium Speech Package — Full Suite, Delivery Coaching & Priority Support",
};

const MAX_REGENERATIONS: Record<string, number> = {
  basic: 3,
  deluxe: 9999,
  premium: 9999,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { speechId, currency, tier } = await req.json();

    if (!speechId) {
      throw new Error("speechId is required");
    }

    const normalizedTier = tier && tier in PRICING ? tier : "basic";
    const normalizedCurrency =
      typeof currency === "string" && currency.toLowerCase() in PRICING[normalizedTier]
        ? currency.toLowerCase()
        : "gbp";

    const unitAmount = PRICING[normalizedTier][normalizedCurrency];

    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up the speech that generate-speech already stored. The full text and
    // the price come from the server, never from the client, so neither can be
    // tampered with here.
    const { data: speechData, error: speechError } = await supabaseServiceClient
      .from("speeches")
      .select("id, email, access_token, paid")
      .eq("id", speechId)
      .single();

    if (speechError || !speechData) {
      throw new Error("Speech not found");
    }
    if (speechData.paid) {
      throw new Error("This speech has already been paid for");
    }

    // Record the selected tier on the speech before charging for it.
    const { error: updateError } = await supabaseServiceClient
      .from("speeches")
      .update({ tier: normalizedTier, max_regenerations: MAX_REGENERATIONS[normalizedTier] })
      .eq("id", speechId);
    if (updateError) {
      throw new Error(`Failed to update speech: ${updateError.message}`);
    }

    const email = speechData.email;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data.length > 0
      ? customers.data[0].id
      : (await stripe.customers.create({ email })).id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: unitAmount,
      currency: normalizedCurrency,
      customer: customerId,
      metadata: {
        speech_id: speechData.id,
        tier: normalizedTier,
        currency: normalizedCurrency,
      },
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: TIER_DESCRIPTIONS[normalizedTier],
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        speechId: speechData.id,
        accessToken: speechData.access_token,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("PaymentIntent error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "An error occurred processing your payment. Please try again." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
