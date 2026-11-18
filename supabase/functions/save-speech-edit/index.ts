import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { MAX_VERSION_CHARS, readVersions } from "../_shared/versions.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

// Saves the buyer's own edits to one version of a paid speech.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { speechId, accessToken, index, text } = await req.json();

    if (!speechId || !accessToken || typeof index !== "number" || typeof text !== "string") {
      return json({ error: "Missing details. Please refresh and try again." }, 400);
    }
    if (!text.trim()) {
      return json({ error: "Your speech can't be empty." }, 400);
    }
    if (text.length > MAX_VERSION_CHARS) {
      return json({ error: "That speech is too long to save." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: speech, error } = await supabase
      .from("speeches")
      .select("id, generated_speech, created_at, versions, paid")
      .eq("id", speechId)
      .eq("access_token", accessToken)
      .eq("paid", true)
      .single();

    if (error || !speech) {
      return json({ error: "Speech not found or access denied" }, 404);
    }

    const versions = readVersions(speech);
    if (!Number.isInteger(index) || index < 0 || index >= versions.length) {
      return json({ error: "That version no longer exists. Please refresh." }, 400);
    }

    versions[index] = { ...versions[index], text, edited_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from("speeches")
      .update({ versions })
      .eq("id", speechId);

    if (updateError) {
      console.error("[save-speech-edit] update failed:", updateError.message);
      return json({ error: "Couldn't save your changes. Please try again." }, 500);
    }

    return json({ versions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[save-speech-edit] error:", msg);
    return json({ error: "Couldn't save your changes. Please try again." }, 500);
  }
});
