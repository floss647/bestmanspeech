// Coached script for the autocue: marks every section of the speech with how to
// deliver it (cue, stage direction, words to hit, where to pause or wait for the
// laugh) and how long it should take. Cached per speech version.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { audienceFor } from "../_shared/audiences.ts";
import {
  adminClient, claudeJson, corsHeaders, json, loadPaidSpeech, MAX_REHEARSALS, paragraphsOf, rehearsalsUsed, sha256,
} from "../_shared/rehearsal.ts";

type PauseType = "beat" | "laugh" | "breath";
interface Section {
  text: string;
  cue: string;
  action: string;
  seconds: number;
  emphasis: string[];
  pauses: { after: string; type: PauseType }[];
}
interface Markup {
  wpm: number;
  targetMinutes: [number, number];
  tips: string[];
  sections: Section[];
}

const PAUSE_SECONDS: Record<PauseType, number> = { beat: 1, breath: 1.5, laugh: 3 };

function buildPrompt(type: string, paras: string[], american: boolean) {
  const a = audienceFor(type);
  return `You are Adrian Simpson: a former BBC Top Gear and Sky News presenter who has written and coached speeches since 2012. You are marking up a client's speech so they can deliver it from an autocue. Most of them are nervous, rarely speak in public, and will rush. Your markings are what turn a script into a performance.

THE OCCASION: ${a.occasion}.
THE ROOM: ${a.room}
TARGET LENGTH: ${a.targetMinutes[0]}-${a.targetMinutes[1]} minutes.

For EACH numbered section below, give:
- "cue": how to deliver it, max 6 words, a direction a presenter would understand (e.g. "Big smile, relaxed and chatty", "Slow down, soften your voice", "Build the energy", "Straight-faced, let it land").
- "action": a short physical stage direction if one helps, else "" (e.g. "Look at Sarah", "Turn to the parents' table", "Pick up your glass", "Raise your glass high"). Use names from the speech. Use sparingly: at most one in three sections.
- "emphasis": 1-3 EXACT phrases copied character-for-character from that section's text (1-4 words each) that the speaker should hit: the punch word of a joke, a name at an emotional moment, the key word of a line. Never emphasise filler.
- "pauses": EXACT phrases copied character-for-character from the section that END a moment needing a pause, with type "laugh" (after a punchline: stop and wait for the laugh to peak and fade), "beat" (a short dramatic pause before or after a key line, or a change of subject), or "breath" (before an emotional or important line). Every joke's punchline gets a "laugh" pause. ${a.humourWelcome ? "" : "This is not an occasion for laughs, so use beat and breath only."} 0-3 per section.
- "seconds": how long the section should take delivered well at about 130 words a minute, INCLUDING its pauses (laugh pauses ~3s, beats ~1s, breaths ~1.5s).

Also give:
- "tips": exactly 3 short, specific, practical tips for delivering THIS speech in THIS room (max 22 words each). If the whole speech would take longer than ${a.targetMinutes[1]} minutes at 130 words a minute (it is about ${Math.round(paras.join(" ").split(/\s+/).length / 130)} minutes), make the first tip a specific cut: which story or section to trim, e.g. the hardest moment and how to handle it, where they will be tempted to rush, how to open.

${american ? "Use American English." : "Use British English."} Write cues and tips in plain, warm, direct language. In tips, NEVER mention section numbers (the speaker can't see them): name the story or quote its first few words.

Return ONLY JSON:
{"tips":["","",""],"sections":[{"i":0,"cue":"","action":"","emphasis":[""],"pauses":[{"after":"","type":"laugh"}],"seconds":0}]}
Include every section, in order, with its "i".

THE SPEECH (${paras.length} sections):
${paras.map((p, i) => `[${i}] ${p}`).join("\n\n")}`;
}

/** Keeps only phrases that really occur in the text (matched case-insensitively), using the text's own casing. */
function realPhrase(text: string, phrase: unknown): string | null {
  if (typeof phrase !== "string" || !phrase.trim()) return null;
  const p = phrase.trim().replace(/^["'“”‘’]+|["'“”‘’.,!?;:]+$/g, "");
  if (!p) return null;
  const at = text.toLowerCase().indexOf(p.toLowerCase());
  return at >= 0 ? text.slice(at, at + p.length) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { speechId, accessToken, versionIndex } = await req.json();
    if (!speechId || !accessToken) return json({ error: "Missing speech details" }, 400);

    const db = adminClient();
    const speech = await loadPaidSpeech(db, speechId, accessToken, versionIndex);
    if (!speech) return json({ error: "Speech not found" }, 404);
    const paras = paragraphsOf(speech.text);
    if (!paras.length) return json({ error: "This speech is empty." }, 422);

    const a = audienceFor(speech.speech_type);
    const remaining = Math.max(0, MAX_REHEARSALS - (await rehearsalsUsed(db, speechId)));
    const hash = await sha256(speech.text);

    const { data: cached } = await db.from("rehearsal_scripts").select("markup").eq("speech_id", speechId).eq("text_hash", hash).maybeSingle();
    if (cached?.markup) return json({ ...(cached.markup as Markup), remaining, speechType: speech.speech_type, american: speech.american });

    type Raw = { tips?: string[]; sections?: { i?: number; cue?: string; action?: string; emphasis?: unknown[]; pauses?: { after?: unknown; type?: string }[]; seconds?: number }[] };
    const raw = await claudeJson<Raw>(buildPrompt(speech.speech_type, paras, speech.american), 8000, "rehearsal-prepare");
    const byIndex = new Map((raw?.sections || []).map((s) => [Number(s.i), s]));

    const sections: Section[] = paras.map((text, i) => {
      const r = byIndex.get(i) || {};
      const emphasis = [...new Set((r.emphasis || []).map((e) => realPhrase(text, e)).filter((e): e is string => !!e))].slice(0, 3);
      const pauses = (r.pauses || [])
        .map((p) => ({ after: realPhrase(text, p.after), type: (["beat", "laugh", "breath"].includes(String(p.type)) ? p.type : "beat") as PauseType }))
        .filter((p): p is { after: string; type: PauseType } => !!p.after)
        .filter((p) => a.humourWelcome || p.type !== "laugh")
        .slice(0, 3);
      const words = text.split(/\s+/).filter(Boolean).length;
      const base = (words / 130) * 60 + pauses.reduce((s, p) => s + PAUSE_SECONDS[p.type], 0);
      const seconds = typeof r.seconds === "number" && r.seconds > base * 0.7 && r.seconds < base * 1.6 ? r.seconds : base;
      return {
        text,
        cue: typeof r.cue === "string" ? r.cue.slice(0, 60) : "",
        action: typeof r.action === "string" ? r.action.slice(0, 60) : "",
        seconds: Math.round(seconds),
        emphasis,
        pauses,
      };
    });

    const markup: Markup = {
      wpm: 130,
      targetMinutes: a.targetMinutes,
      tips: (raw?.tips || []).filter((t) => typeof t === "string").slice(0, 3),
      sections,
    };
    // Only cache a real markup, so a failed Claude call is retried next time.
    if (raw?.sections?.length) {
      await db.from("rehearsal_scripts").upsert({ speech_id: speechId, text_hash: hash, markup }, { onConflict: "speech_id,text_hash" });
    }
    return json({ ...markup, remaining, speechType: speech.speech_type, american: speech.american });
  } catch (e) {
    console.error("[rehearsal-prepare]", e);
    return json({ error: "Something went wrong preparing your rehearsal." }, 500);
  }
});
