import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Catalog prices (minor units) — must match create-payment-intent. Used to
// assert the amount actually charged matches the tier being claimed.
const PRICING: Record<string, Record<string, number>> = {
  basic: { gbp: 4900, usd: 5900, aud: 8900, cad: 7900 },
  deluxe: { gbp: 3900, usd: 4900, aud: 6900, cad: 5900 },
  premium: { gbp: 7900, usd: 9900, aud: 13900, cad: 10900 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sessionId, speechId, paymentIntentId } = body;

    if (!speechId) {
      throw new Error("Speech ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let amountPaid = 0;
    let currencyPaid = "GBP";
    let transactionId = "";

    if (paymentIntentId) {
      // New flow: PaymentIntent-based verification
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        throw new Error("Payment not completed");
      }

      if (paymentIntent.metadata?.speech_id !== speechId) {
        throw new Error("Speech ID does not match this payment");
      }

      // Assert the amount charged matches the catalog price for the claimed tier
      // and currency, so a smaller/mismatched payment can't unlock the speech.
      const tier = paymentIntent.metadata?.tier ?? "";
      const cur = (paymentIntent.currency || "").toLowerCase();
      const expected = PRICING[tier]?.[cur];
      if (!expected || paymentIntent.amount !== expected) {
        throw new Error("Payment amount does not match the expected price");
      }

      amountPaid = (paymentIntent.amount || 0) / 100;
      currencyPaid = (paymentIntent.currency || "gbp").toUpperCase();
      transactionId = paymentIntentId;
    } else if (sessionId) {
      // Legacy flow: Checkout Session-based verification
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      if (session.metadata?.speech_id !== speechId) {
        throw new Error("Speech ID does not match this payment session");
      }

      amountPaid = (session.amount_total || 0) / 100;
      currencyPaid = (session.currency || "gbp").toUpperCase();
      transactionId = sessionId;
    } else {
      throw new Error("Session ID or Payment Intent ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: speechData, error: updateError } = await supabaseClient
      .from("speeches")
      .update({
        paid: true,
        stripe_session_id: transactionId,
      })
      .eq("id", speechId)
      .select("id, email, access_token, tier, generated_speech")
      .single();

    if (updateError) {
      throw new Error(`Failed to update speech: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        speechId: speechData.id,
        accessToken: speechData.access_token,
        email: speechData.email,
        amount: amountPaid,
        currency: currencyPaid,
        transactionId,
        message: "Payment verified. Check your email for your speech.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Verification error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "Payment verification failed. Please try again or contact support." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
