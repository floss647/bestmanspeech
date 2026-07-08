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
    const { speechId, accessToken } = await req.json();

    if (!speechId || !accessToken) {
      throw new Error("Speech ID and access token are required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseClient
      .from("speeches")
      .select("id, generated_speech, speech_type, answers, paid, tier, email, regenerations_used, max_regenerations, access_token")
      .eq("id", speechId)
      .eq("access_token", accessToken)
      .single();

    if (error || !data) {
      throw new Error("Speech not found or invalid access token");
    }

    // Remove access_token from response
    const { access_token: _, ...speechData } = data;

    // For unpaid speeches, return a truncated preview so the paywall can display it
    if (!speechData.paid) {
      const words = (speechData.generated_speech || "").split(/\s+/);
      const preview = words.slice(0, 100).join(" ");
      return new Response(JSON.stringify({ ...speechData, generated_speech: preview }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify(speechData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[get-speech] error:", msg);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
