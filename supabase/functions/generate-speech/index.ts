import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { SPEECH_PROMPTS } from "./speechPrompts.ts";

// Number of words returned to the (unpaid) client as a preview. The full speech
// is stored server-side and only released by get-speech once paid = true.
const PREVIEW_WORDS = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter: max 5 requests per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

const MAX_DETAILS_LENGTH = 10000; // characters

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";
    
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again in a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { speechType, details } = await req.json();

    // Validate input size
    const detailsStr = JSON.stringify(details);
    if (detailsStr.length > MAX_DETAILS_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Input too large. Please shorten your answers." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate speech type
    if (!SPEECH_PROMPTS[speechType]) {
      return new Response(
        JSON.stringify({ error: `Unknown speech type: ${speechType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const speechConfig = SPEECH_PROMPTS[speechType];
    const systemPrompt = speechConfig.systemPrompt;
    const userPrompt = speechConfig.userPromptTemplate(details);

    // Generate the full speech server-side (non-streamed) so the complete text
    // never reaches the unpaid client.
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completion = await response.json();
    const fullSpeech: string = completion?.choices?.[0]?.message?.content ?? "";
    if (!fullSpeech.trim()) {
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persist the full speech (unpaid). get-speech gates release on paid = true.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const email = typeof details?.email === "string" ? details.email : "";
    const { data: speechRow, error: insertError } = await supabase
      .from("speeches")
      .insert({
        email,
        speech_type: speechType,
        answers: details ?? {},
        generated_speech: fullSpeech,
        paid: false,
        tier: "basic",
        max_regenerations: 3,
      })
      .select("id, access_token")
      .single();

    if (insertError || !speechRow) {
      console.error("Failed to store speech:", insertError?.message);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const preview = fullSpeech.split(/\s+/).slice(0, PREVIEW_WORDS).join(" ");

    return new Response(
      JSON.stringify({
        speechId: speechRow.id,
        accessToken: speechRow.access_token,
        preview,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-speech error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
