import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { purchaseEmail } from "../_shared/purchaseEmail.ts";
import { OFFER_PRICES } from "../_shared/offer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Catalog prices (minor units) — must match create-payment-intent. Used to
// assert the amount actually charged matches the tier being claimed.
const PRICING: Record<string, Record<string, number>> = {
  basic: { gbp: 2900, usd: 3900, aud: 4900, cad: 3900 },
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

    // Trim the secret key: a stray leading/trailing newline (common when a key
    // is pasted into the dashboard) lands in the Authorization header and makes
    // every Stripe request fail with a connection error.
    const stripe = new Stripe((Deno.env.get("STRIPE_SECRET_KEY") || "").trim(), {
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
      // A follow-up offer was priced server-side in create-payment-intent.
      const offerPrice = paymentIntent.metadata?.offer === "1" && tier === "basic" ? OFFER_PRICES[cur] : undefined;
      if (!expected || (paymentIntent.amount !== expected && paymentIntent.amount !== offerPrice)) {
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
      .select("id, email, access_token, tier, speech_type, country, answers, purchase_email_sent_at, attribution, purchase_tracked_at")
      .single();

    if (updateError) {
      throw new Error(`Failed to update speech: ${updateError.message}`);
    }

    // Credit the sale to Google Analytics from the server, once. The browser tag
    // on the success page is often blocked (Safari, ad blockers), so without this
    // purchases go missing from GA4 and from the Google Ads conversions it feeds.
    // GA4 de-duplicates purchases by transaction_id, so a browser hit as well is fine.
    const mpSecret = Deno.env.get("GA4_MP_SECRET");
    if (mpSecret && !speechData.purchase_tracked_at) {
      const { data: claimedTrack } = await supabaseClient
        .from("speeches")
        .update({ purchase_tracked_at: new Date().toISOString() })
        .eq("id", speechId)
        .is("purchase_tracked_at", null)
        .select("id");
      if (claimedTrack?.length) {
        const attr = (speechData.attribution as Record<string, string>) || {};
        const clientId = attr.ga_client_id || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;
        try {
          const r = await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=G-MPYF6WKEHS&api_secret=${encodeURIComponent(mpSecret)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: clientId,
                events: [{
                  name: "purchase",
                  params: {
                    transaction_id: transactionId,
                    value: amountPaid,
                    currency: currencyPaid,
                    speech_type: speechData.speech_type,
                    source: "server",
                    items: [{ item_id: speechData.tier || "basic", item_name: speechData.speech_type, price: amountPaid, quantity: 1 }],
                  },
                }],
              }),
            },
          );
          if (!r.ok) throw new Error(`GA4 MP ${r.status}`);
        } catch (e) {
          console.error("[verify-payment] GA4 purchase", e);
          await supabaseClient.from("speeches").update({ purchase_tracked_at: null }).eq("id", speechId);
        }
      }
    }

    // Email the buyer their links, once. Claim the send first so a page refresh
    // calling verify-payment again can't send it twice.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && speechData.email && !speechData.purchase_email_sent_at) {
      const { data: claimed } = await supabaseClient
        .from("speeches")
        .update({ purchase_email_sent_at: new Date().toISOString() })
        .eq("id", speechId)
        .is("purchase_email_sent_at", null)
        .select("id");
      if (claimed?.length) {
        const answers = (speechData.answers as Record<string, unknown>) || {};
        const mail = purchaseEmail({
          speechId: speechData.id,
          accessToken: speechData.access_token,
          speechType: speechData.speech_type,
          country: speechData.country,
          firstName: String(answers.firstName || "").trim().split(/\s+/)[0]?.slice(0, 40) || "",
        });
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...mail, to: speechData.email }),
          });
          if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
        } catch (e) {
          console.error("[verify-payment] purchase email", e);
          // Let a later verify retry the email.
          await supabaseClient.from("speeches").update({ purchase_email_sent_at: null }).eq("id", speechId);
        }
      }
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
