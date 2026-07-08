import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, speechType, lastQuestionReached, partialAnswers } = await req.json();

    const cleanEmail = typeof email === "string" ? email.trim() : "";
    if (!EMAIL_RE.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (typeof speechType !== "string" || speechType.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Speech type is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("leads")
      .insert({
        email: cleanEmail,
        speech_type: speechType,
        last_question_reached: Number.isFinite(lastQuestionReached) ? lastQuestionReached : 0,
        partial_answers: partialAnswers && typeof partialAnswers === "object" ? partialAnswers : {},
      })
      .select("id, access_token")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Insert failed");
    }

    return new Response(
      JSON.stringify({ leadId: data.id, accessToken: data.access_token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-lead] error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
