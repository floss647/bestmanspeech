import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, accessToken, partialAnswers, lastQuestionReached } = await req.json();

    if (!leadId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "leadId and accessToken are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Only update the row whose id AND access_token both match — the token is
    // what proves the caller owns this lead.
    const { data, error } = await supabase
      .from("leads")
      .update({
        partial_answers: partialAnswers && typeof partialAnswers === "object" ? partialAnswers : {},
        last_question_reached: Number.isFinite(lastQuestionReached) ? lastQuestionReached : 0,
      })
      .eq("id", leadId)
      .eq("access_token", accessToken)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[update-lead-progress] error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "An error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
