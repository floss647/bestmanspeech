import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { previewWords, PREVIEW_WORDS } from "../_shared/preview.ts";
import { voiceGuidance } from "../_shared/voice.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { SPEECH_PROMPTS } from "./speechPrompts.ts";

// Number of words returned to the (unpaid) client as a preview. The full speech
// is stored server-side and only released by get-speech once paid = true.

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

    const { speechType, details, country, leadId, leadToken } = await req.json();

    // Only write speeches for real visitors: a valid email that matches a lead saved
    // by the questionnaire (create-lead), and no more than 5 speeches per email a day.
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const email = typeof details?.email === "string" ? details.email.trim() : "";
    const deny = (status: number, error: string) =>
      new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const emailLike = email.replace(/[%_\\]/g, (m: string) => "\\" + m);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return deny(400, "Please enter a valid email address.");
    let leadOk = false;
    if (typeof leadId === "string" && typeof leadToken === "string") {
      const { data: lead } = await db.from("leads").select("email").eq("id", leadId).eq("access_token", leadToken).maybeSingle();
      leadOk = !!lead && (lead.email || "").toLowerCase() === email.toLowerCase();
    }
    if (!leadOk) {
      // Older pages, or the lead save still in flight: look the lead up by email.
      for (let i = 0; i < 4 && !leadOk; i++) {
        const { count } = await db.from("leads").select("id", { count: "exact", head: true })
          .ilike("email", emailLike).gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
        leadOk = (count ?? 0) > 0;
        if (!leadOk) await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!leadOk) {
      console.warn("generate-speech refused: no matching lead", { ip: clientIp, speechType });
      return deny(403, "Please start from the questions page.");
    }
    const { count: todays } = await db.from("speeches").select("id", { count: "exact", head: true })
      .ilike("email", emailLike).gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if ((todays ?? 0) >= 5) return deny(429, "You've written several speeches today. Please come back tomorrow, or reply to our email for help.");

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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("API key not configured");

    const speechConfig = SPEECH_PROMPTS[speechType];
    const cc = typeof country === "string" ? country.slice(0, 2).toUpperCase() : null;
    const systemPrompt = `${speechConfig.systemPrompt}\n\n${voiceGuidance(speechType, cc)}`;
    const userPrompt = speechConfig.userPromptTemplate(details);

    // Generate the full speech server-side (non-streamed) so the complete text
    // never reaches the unpaid client. Uses Claude via the Anthropic API.
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 529) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completion = await response.json();
    const fullSpeech: string = (completion?.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
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

    const { data: speechRow, error: insertError } = await supabase
      .from("speeches")
      .insert({
        email,
        speech_type: speechType,
        answers: details ?? {},
        country: typeof country === "string" ? country.slice(0, 2).toUpperCase() : null,
        generated_speech: fullSpeech,
        paid: false,
        tier: "basic",
        max_regenerations: 9999,
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

    const preview = previewWords(fullSpeech, PREVIEW_WORDS);

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
