// Starts a live-audience rehearsal for a paid speech.
// Checks the speech access token, enforces the per-speech rehearsal cap,
// records the rehearsal, briefs an OpenAI Realtime "audience" for this
// occasion, and returns a short-lived client secret for the browser's
// WebRTC connection. The OpenAI API key never leaves the server.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { readVersions } from "../_shared/versions.ts";
import { audienceFor } from "../_shared/audiences.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const MAX_REHEARSALS = 10;

// Tried in order until OpenAI accepts one; override with OPENAI_REALTIME_MODEL.
const MODEL_CANDIDATES = [
  Deno.env.get("OPENAI_REALTIME_MODEL"),
  "gpt-realtime-mini",
  "gpt-realtime",
].filter((m): m is string => !!m);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function buildInstructions(
  speechType: string,
  speechText: string,
  answers: Record<string, unknown>,
  american: boolean,
): string {
  const a = audienceFor(speechType);
  const facts = Object.entries(answers || {})
    .filter(([k, v]) => k !== "email" && typeof v === "string" && v.trim())
    .map(([k, v]) => `- ${k}: ${String(v).slice(0, 400)}`)
    .join("\n")
    .slice(0, 4000);

  return `You are the AUDIENCE at ${a.occasion}. You are not a coach, not an assistant and not a person in a conversation. You are the room.

THE ROOM
${a.room}

HOW THE ROOM REACTS
${a.reactions}

WHAT HAPPENS
- The speaker is rehearsing their real speech out loud, one section at a time. After each section they pause for your reaction.
- Each time, react to what they ACTUALLY just said, as the room would. Describe it in the present tense in 1 or 2 short sentences, like a narrator: what the guests do, who laughs, who looks moved, how the couple or key people react. You may occasionally include one short line from a guest in quotes.
- Be honest. If a line lands, show it. If a joke falls flat, is too long, too private or too crude for this room, show that too (polite silence, awkward glances). If they rush or mumble an important line, the room misses it. Honest reactions are what make this useful; never be cruel.
- Reference specific names and details from what they said, so it feels real.
- Keep every reaction short: no more than about 30 words. Then stop. Do not ask questions, do not say "please continue", do not summarise.
- Never give coaching, tips or scores. A full coaching report comes afterwards.
- When they finish (a closing toast, "raise your glasses", or clearly the end), react to the ending as the room would (${a.humourWelcome ? "applause, cheers or a standing toast, as fits" : "a respectful, moved silence, perhaps quiet thanks"}), then say in one short sentence that they can tap Finish for their coaching notes.
- If they speak to you directly (e.g. "how was that?"), answer in one sentence as a guest in the room, then tell them to tap Finish for the full notes.
- ${american ? "Use American English and American wedding customs." : "Use British English and British customs."}
- Voice: warm, natural, a little understated. Speak at a relaxed pace.

THE OPENING
Your very first turn, before they start: ${a.opening} Keep it under 25 words.

THE SPEECH THEY HAVE PREPARED (you have read it; they may change or skip bits)
--- SPEECH ---
${speechText.slice(0, 20000)}
--- END SPEECH ---

BACKGROUND FROM THE SPEAKER (names and details)
${facts || "- none"}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { speechId, accessToken, versionIndex } = await req.json();
    if (!speechId || !accessToken) return json({ error: "Missing speech details" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("[rehearsal-start] OPENAI_API_KEY is not set");
      return json({ error: "Live rehearsal isn't available right now. Please try again later." }, 503);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: speech, error } = await supabase
      .from("speeches")
      .select("id, speech_type, answers, generated_speech, versions, created_at, country, paid")
      .eq("id", speechId)
      .eq("access_token", accessToken)
      .eq("paid", true)
      .single();
    if (error || !speech) return json({ error: "Speech not found" }, 404);

    const { count } = await supabase
      .from("rehearsals")
      .select("id", { count: "exact", head: true })
      .eq("speech_id", speechId);
    const used = count ?? 0;
    if (used >= MAX_REHEARSALS) {
      return json({
        error: `You've used all ${MAX_REHEARSALS} live rehearsals for this speech. Email adrian@allspeechesgreatandsmall.com if you need more.`,
        code: "limit_reached",
      }, 429);
    }

    const versions = readVersions(speech);
    const idx = Number.isInteger(versionIndex) && versionIndex >= 0 && versionIndex < versions.length
      ? versionIndex
      : versions.length - 1;
    const speechText = versions[idx]?.text || speech.generated_speech || "";
    const american = ["US", "CA"].includes(String(speech.country || "").toUpperCase());

    const instructions = buildInstructions(
      speech.speech_type,
      speechText,
      (speech.answers as Record<string, unknown>) || {},
      american,
    );

    let mint: { value?: string; client_secret?: { value?: string }; expires_at?: number } | null = null;
    let modelUsed = "";
    let lastErr = "";
    for (const model of MODEL_CANDIDATES) {
      const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        signal: AbortSignal.timeout(15_000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          expires_after: { anchor: "created_at", seconds: 600 },
          session: {
            type: "realtime",
            model,
            instructions,
            max_output_tokens: 150,
            audio: {
              input: {
                format: { type: "audio/pcm", rate: 24000 },
                transcription: { model: "whisper-1" },
                // The speaker decides when a section ends (tap), so no VAD:
                // the room never interrupts mid-sentence.
                turn_detection: null,
              },
              output: { format: { type: "audio/pcm", rate: 24000 }, voice: "marin" },
            },
          },
        }),
      });
      const text = await r.text();
      if (r.ok) {
        mint = JSON.parse(text);
        modelUsed = model;
        break;
      }
      lastErr = `${r.status} ${text.slice(0, 300)}`;
      console.warn(`[rehearsal-start] mint failed for ${model}: ${lastErr}`);
      // Only try another model when the model itself was the problem.
      if (!/model/i.test(text)) break;
    }

    const clientSecret = mint?.value ?? mint?.client_secret?.value;
    if (!clientSecret) {
      console.error("[rehearsal-start] could not mint session:", lastErr);
      return json({ error: "We couldn't open the rehearsal room. Please try again in a moment." }, 502);
    }

    const { data: row, error: insErr } = await supabase
      .from("rehearsals")
      .insert({ speech_id: speechId, speech_text: speechText })
      .select("id")
      .single();
    if (insErr || !row) {
      console.error("[rehearsal-start] insert failed", insErr?.message);
      return json({ error: "We couldn't open the rehearsal room. Please try again." }, 500);
    }

    return json({
      rehearsalId: row.id,
      clientSecret,
      model: modelUsed,
      remaining: MAX_REHEARSALS - used - 1,
      speechText,
    });
  } catch (e) {
    console.error("[rehearsal-start] error", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong opening the rehearsal room." }, 500);
  }
});
