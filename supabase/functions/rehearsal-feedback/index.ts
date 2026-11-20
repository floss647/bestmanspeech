// Coaching report for a finished live-audience rehearsal.
// The browser sends the transcript of what the speaker said (section by
// section, with how long each section took) and the room's reactions. We
// measure the numbers here (length, pace, hedging words, sections skipped)
// and ask Claude, as Adrian, for the coaching notes. Saved on the rehearsal.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { audienceFor } from "../_shared/audiences.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Turn = { role: "speaker" | "audience"; text: string; ms?: number };

const FILLERS = [
  "um", "umm", "uh", "er", "erm", "ah",
  "you know", "i mean", "sort of", "kind of", "basically", "actually", "literally", "like i said",
];

const words = (t: string) => (t.toLowerCase().match(/[a-z0-9']+/g) || []);

function countFillers(text: string): Record<string, number> {
  const lower = " " + text.toLowerCase().replace(/[^a-z' ]+/g, " ") + " ";
  const out: Record<string, number> = {};
  for (const f of FILLERS) {
    const n = lower.split(` ${f} `).length - 1;
    if (n > 0) out[f] = n;
  }
  return out;
}

const STOP = new Set(("the a an and or but of to in on at for with is was it i you he she we they my his her our their that this be are as so just " +
  "have had has not all me him them your from by what when who how there then than very really").split(" "));

/** Script paragraphs the speaker left out (fewer than a third of their key words heard). */
function skippedSections(script: string, spoken: string): string[] {
  const heard = new Set(words(spoken));
  return script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => words(p).length >= 12)
    .filter((p) => {
      const key = [...new Set(words(p).filter((w) => w.length > 2 && !STOP.has(w)))];
      if (key.length < 5) return false;
      const hit = key.filter((w) => heard.has(w)).length;
      return hit / key.length < 0.33;
    })
    .map((p) => p.split(/\s+/).slice(0, 14).join(" ") + "…");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { speechId, accessToken, rehearsalId, turns, totalMs } = await req.json();
    if (!speechId || !accessToken || !rehearsalId || !Array.isArray(turns)) {
      return json({ error: "Missing rehearsal details" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: speech } = await supabase
      .from("speeches")
      .select("id, speech_type, country")
      .eq("id", speechId)
      .eq("access_token", accessToken)
      .eq("paid", true)
      .single();
    if (!speech) return json({ error: "Speech not found" }, 404);

    const { data: rehearsal } = await supabase
      .from("rehearsals")
      .select("id, speech_text, feedback")
      .eq("id", rehearsalId)
      .eq("speech_id", speechId)
      .single();
    if (!rehearsal) return json({ error: "Rehearsal not found" }, 404);
    if (rehearsal.feedback) return json({ feedback: rehearsal.feedback });

    const clean: Turn[] = (turns as Turn[])
      .filter((t) => t && (t.role === "speaker" || t.role === "audience") && typeof t.text === "string")
      .slice(0, 200)
      .map((t) => ({
        role: t.role,
        text: t.text.slice(0, 6000),
        ms: typeof t.ms === "number" && t.ms > 0 ? Math.min(t.ms, 15 * 60_000) : undefined,
      }));
    const speakerTurns = clean.filter((t) => t.role === "speaker" && t.text.trim());
    const spoken = speakerTurns.map((t) => t.text).join("\n\n");
    const spokenWords = words(spoken).length;
    if (spokenWords < 20) {
      return json({ error: "We didn't hear enough of the speech to coach it. Try again and speak a few sections." }, 422);
    }

    const speakingMs = speakerTurns.reduce((s, t) => s + (t.ms || 0), 0);
    const speakingMinutes = speakingMs / 60000;
    const wpm = speakingMinutes > 0.2 ? Math.round(spokenWords / speakingMinutes) : null;
    const scriptWords = words(rehearsal.speech_text || "").length;
    const a = audienceFor(speech.speech_type);
    // Estimated full-length time: if they only did part, scale up by script length.
    const coverage = scriptWords ? Math.min(1, spokenWords / scriptWords) : 1;
    const estFullMinutes = speakingMinutes > 0 && coverage > 0.2 ? speakingMinutes / coverage : null;
    const fillers = countFillers(spoken);
    const fillerTotal = Object.values(fillers).reduce((s, n) => s + n, 0);
    const skipped = skippedSections(rehearsal.speech_text || "", spoken);

    const stats = {
      spokenWords,
      speakingSeconds: Math.round(speakingMs / 1000),
      totalSeconds: typeof totalMs === "number" ? Math.round(totalMs / 1000) : null,
      wordsPerMinute: wpm,
      targetMinutes: a.targetMinutes,
      estimatedFullMinutes: estFullMinutes ? Math.round(estFullMinutes * 10) / 10 : null,
      coverage: Math.round(coverage * 100),
      fillers,
      fillerTotal,
      skipped,
    };

    const american = ["US", "CA"].includes(String(speech.country || "").toUpperCase());
    const transcript = clean
      .map((t) => (t.role === "speaker" ? `SPEAKER${t.ms ? ` (${Math.round(t.ms / 1000)}s)` : ""}: ${t.text}` : `ROOM: ${t.text}`))
      .join("\n")
      .slice(0, 30000);

    const prompt = `You are Adrian Simpson, a former BBC and Sky News presenter and professional speechwriter since 2012. Someone has just rehearsed their speech out loud to a simulated audience at ${a.occasion}. Give them honest, specific, encouraging coaching notes, like a great coach backstage.

THEIR PREPARED SPEECH:
${(rehearsal.speech_text || "").slice(0, 15000)}

WHAT THEY ACTUALLY SAID, SECTION BY SECTION, AND HOW THE ROOM REACTED:
${transcript}

MEASURED:
- Words spoken: ${spokenWords} of about ${scriptWords} in the script (${stats.coverage}% covered)
- Speaking time: ${Math.round(speakingMs / 1000)} seconds${wpm ? `, about ${wpm} words per minute (a comfortable pace for a speech is roughly 120 to 150)` : ""}
- Target length for this occasion: ${a.targetMinutes[0]} to ${a.targetMinutes[1]} minutes${estFullMinutes ? `; at this pace the full speech would take about ${stats.estimatedFullMinutes} minutes` : ""}
- Hedging / filler words heard: ${fillerTotal ? JSON.stringify(fillers) : "none detected (note: the transcription tends to drop 'um' and 'er')"}
- Sections of the script that seem to have been skipped: ${skipped.length ? skipped.join(" | ") : "none"}

Write in ${american ? "American" : "British"} English, warm and direct, second person ("you"). Quote their actual words when you praise or fix something. Never invent things they didn't say. Don't comment on accent. If they only rehearsed part of it, coach what they did and say so.

Reply with ONLY a JSON object, no markdown, in exactly this shape:
{
  "headline": "one encouraging sentence summing up the run-through",
  "summary": "2 or 3 sentences: overall impression, the single biggest thing to work on",
  "landed": [{"line": "short quote from what they said", "why": "why it worked"}],
  "fixes": [{"title": "short name of the issue", "line": "short quote it applies to, or empty", "how": "exactly what to do differently"}],
  "pace": "one or two sentences on pace and pauses, using the numbers",
  "length": "one or two sentences on length versus the target",
  "nextRun": "one sentence: what to focus on in the next rehearsal"
}
Give 2 or 3 items in "landed" and exactly 3 in "fixes".`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      console.error("[rehearsal-feedback] anthropic", resp.status, (await resp.text()).slice(0, 300));
      return json({ error: "We couldn't write your notes just now. Please try again." }, 502);
    }
    const body = await resp.json();
    const raw: string = body?.content?.[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    let notes: Record<string, unknown> = {};
    try {
      notes = match ? JSON.parse(match[0]) : {};
    } catch {
      notes = {};
    }
    if (!notes.headline) {
      console.error("[rehearsal-feedback] bad notes", raw.slice(0, 300));
      return json({ error: "We couldn't write your notes just now. Please try again." }, 502);
    }

    const feedback = { ...notes, stats };
    await supabase
      .from("rehearsals")
      .update({
        finished_at: new Date().toISOString(),
        turns: clean,
        duration_seconds: stats.totalSeconds,
        stats,
        feedback,
      })
      .eq("id", rehearsalId);

    return json({ feedback });
  } catch (e) {
    console.error("[rehearsal-feedback] error", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong writing your notes." }, 500);
  }
});
