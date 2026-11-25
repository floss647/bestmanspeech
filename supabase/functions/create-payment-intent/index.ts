import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { OFFER_PRICES, offerActive } from "../_shared/offer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tiered pricing by currency (amounts in minor units)
const PRICING: Record<string, Record<string, number>> = {
  // "Your speech": the full speech plus one new version, no rehearsal coach.
  speech: { gbp: 1500, usd: 1900, aud: 2900, cad: 2500 },
  // Upgrade from "Your speech" to "Speech + Coach" (the difference).
  upgrade: { gbp: 1400, usd: 2000, aud: 2000, cad: 1400 },
  // "Speech + Coach": everything (kept as "basic" for existing data).
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
  speech: "Your Speech",
  upgrade: "Upgrade to Speech + Coach",
  basic: "Speech + Coach",
  deluxe: "Deluxe Speech Package — Editing Suite & Unlimited Edits",
  premium: "Premium Speech Package — Full Suite, Delivery Coaching & Priority Support",
};

const MAX_REGENERATIONS: Record<string, number> = {
  speech: 1,
  upgrade: 9999,
  basic: 9999,
  deluxe: 9999,
  premium: 9999,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { speechId, currency, tier, attribution } = await req.json();

    if (!speechId) {
      throw new Error("speechId is required");
    }

    const normalizedTier = tier && tier in PRICING ? tier : "basic";
    const normalizedCurrency =
      typeof currency === "string" && currency.toLowerCase() in PRICING[normalizedTier]
        ? currency.toLowerCase()
        : "gbp";

    let unitAmount = PRICING[normalizedTier][normalizedCurrency];

    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up the speech that generate-speech already stored. The full text and
    // the price come from the server, never from the client, so neither can be
    // tampered with here.
    const { data: speechData, error: speechError } = await supabaseServiceClient
      .from("speeches")
      .select("id, email, access_token, paid, tier, offer_until")
      .eq("id", speechId)
      .single();

    if (speechError || !speechData) {
      throw new Error("Speech not found");
    }
    const isUpgrade = normalizedTier === "upgrade";
    if (isUpgrade) {
      if (!speechData.paid || speechData.tier !== "speech") {
        throw new Error("This speech already includes the rehearsal coach");
      }
    } else if (speechData.paid) {
      throw new Error("This speech has already been paid for");
    }

    // Follow-up email offer: lower price while offer_until is in the future.
    const onOffer = normalizedTier === "basic" && offerActive(speechData.offer_until) && !!OFFER_PRICES[normalizedCurrency];
    if (onOffer) unitAmount = OFFER_PRICES[normalizedCurrency];

    // The tier is applied by verify-payment from what was actually paid; here we
    // only note the choice on unpaid speeches (never on an upgrade).
    if (!isUpgrade) {
      const { error: updateError } = await supabaseServiceClient
        .from("speeches")
        .update({ tier: normalizedTier, max_regenerations: MAX_REGENERATIONS[normalizedTier] })
        .eq("id", speechId);
      if (updateError) {
        throw new Error(`Failed to update speech: ${updateError.message}`);
      }
    }

    const email = speechData.email;

    // Trim the secret key: a stray leading/trailing newline (common when a key
    // is pasted into the dashboard) lands in the Authorization header and makes
    // every Stripe request fail with a connection error.
    const stripe = new Stripe((Deno.env.get("STRIPE_SECRET_KEY") || "").trim(), {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data.length > 0
      ? customers.data[0].id
      : (await stripe.customers.create({ email })).id;

    // Remember how this buyer arrived, so verify-payment can credit the sale to
    // Google Analytics / Google Ads server-side (browsers often block the tags).
    if (attribution && typeof attribution === "object") {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(attribution as Record<string, unknown>)) {
        if (/^(gclid|gbraid|wbraid|fbclid|utm_source|utm_medium|utm_campaign|utm_term|landing|ts|ga_client_id)$/.test(k) && typeof v === "string") {
          clean[k] = v.slice(0, 300);
        }
      }
      if (Object.keys(clean).length) {
        await supabaseServiceClient.from("speeches").update({ attribution: clean }).eq("id", speechData.id);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: unitAmount,
      currency: normalizedCurrency,
      customer: customerId,
      metadata: {
        speech_id: speechData.id,
        tier: normalizedTier,
        currency: normalizedCurrency,
        offer: onOffer ? "1" : "0",
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
        amount: unitAmount,
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
