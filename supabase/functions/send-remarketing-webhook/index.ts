import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, speechType, generatedAt, speech, answers, event, leadId } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const eventType = event || "speech_generated_no_purchase";

    // Save the speech to DB so we can link back to it (only for completed speeches)
    const origin = "https://www.bestmanspeech.com";
    let resumeLink = "";

    if (eventType === "form_started" && leadId) {
      resumeLink = `${origin}/resume-form?id=${leadId}`;
    }

    if (speech && eventType === "speech_generated_no_purchase") {
      const supabaseServiceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: speechData, error: speechError } = await supabaseServiceClient
        .from("speeches")
        .insert({
          email,
          speech_type: speechType || "best-man",
          answers: answers || {},
          generated_speech: speech,
          paid: false,
        })
        .select("id, access_token")
        .single();

      if (speechError) {
        console.error("Failed to save speech for remarketing:", speechError.message);
      } else {
        resumeLink = `${origin}/resume?id=${speechData.id}&token=${speechData.access_token}`;
      }
    }

    const webhookUrl = Deno.env.get("ZAPIER_REMARKETING_WEBHOOK_URL");
    if (!webhookUrl) {
      console.warn("ZAPIER_REMARKETING_WEBHOOK_URL not set — skipping remarketing webhook");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: firstName || "",
        speech_type: speechType || "unknown",
        generated_at: generatedAt || new Date().toISOString(),
        resume_link: resumeLink,
        source: "wedding-speech-app",
        event: eventType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[send-remarketing-webhook] Zapier returned ${response.status}: ${errorText}`);
      // Don't throw — webhook delivery failure shouldn't block the user
      return new Response(
        JSON.stringify({ success: true, message: "Webhook delivery failed but request handled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[send-remarketing-webhook] error:", msg);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
