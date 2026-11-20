// Coaching notes for an autocue rehearsal.
//  1. Transcribes the recording with word timings (Whisper) and, in parallel, has an
//     audio model LISTEN to it for energy, monotone, warmth, clarity and emphasis.
//  2. Lines the transcript up against the coached script to measure each section's
//     timing, which pauses and laugh-waits were held, hesitations and skipped sections.
//  3. Claude, writing as Adrian, turns all of that into notes with stage directions.
// The recording is deleted once analysed.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { audienceFor } from "../_shared/audiences.ts";
import {
  adminClient, AUDIO_BUCKET, claudeJson, corsHeaders, json, loadPaidSpeech, paragraphsOf, sha256,
} from "../_shared/rehearsal.ts";

type PauseType = "beat" | "laugh" | "breath";
interface Section { text: string; cue: string; action: string; seconds: number; emphasis: string[]; pauses: { after: string; type: PauseType }[] }
interface Word { word: string; start: number; end: number }

const AUDIO_MODELS = [Deno.env.get("OPENAI_AUDIO_MODEL"), "gpt-audio", "gpt-audio-mini", "gpt-4o-audio-preview"]
  .filter((m): m is string => !!m);
const PAUSE_NEEDED: Record<PauseType, number> = { laugh: 1.2, beat: 0.6, breath: 0.6 };
const FILLERS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm"]);

const norm = (t: string) => (t.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9']+/g) || []);

/** Base64 in chunks: std's encodeBase64 needs ~40x the file size in memory. */
function toBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const CHUNK = 0x8000 * 3;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    let s = "";
    for (let j = 0; j < sub.length; j += 0x8000) s += String.fromCharCode(...sub.subarray(j, j + 0x8000));
    parts.push(btoa(s));
  }
  return parts.join("");
}

/** The first `seconds` of a 16-bit PCM WAV, with a corrected header. */
function wavHead(buf: Uint8Array, seconds: number): Uint8Array {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const bytesPerSec = dv.getUint32(28, true);
  const keep = Math.min(buf.length - 44, Math.floor((seconds * bytesPerSec) / 2) * 2);
  if (keep >= buf.length - 44) return buf;
  const out = new Uint8Array(44 + keep);
  out.set(buf.subarray(0, 44 + keep));
  const ov = new DataView(out.buffer);
  ov.setUint32(4, 36 + keep, true);
  ov.setUint32(40, keep, true);
  return out;
}

function wavSeconds(buf: Uint8Array) {
  if (buf.length < 44) return 0;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const rate = dv.getUint32(24, true), channels = dv.getUint16(22, true), bits = dv.getUint16(34, true);
  return rate && channels && bits ? (buf.length - 44) / (rate * channels * (bits / 8)) : 0;
}

async function transcribe(audio: Uint8Array, key: string): Promise<{ text: string; words: Word[] } | null> {
  const form = new FormData();
  form.append("file", new Blob([audio as Uint8Array<ArrayBuffer>], { type: "audio/wav" }), "rehearsal.wav");
  form.append("model", "whisper-1");
  form.append("language", "en");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  // Whisper drops hesitations unless the prompt shows them.
  form.append("prompt", "Umm, so, uh, I just wanted to say... er, hmm. Okay, um, here goes.");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) {
    console.error("[rehearsal-feedback] whisper", r.status, (await r.text()).slice(0, 300));
    return null;
  }
  const d = await r.json();
  return { text: d.text || "", words: (d.words || []).map((w: Word) => ({ word: w.word, start: w.start, end: w.end })) };
}

interface Listening {
  energy?: { score: number; note: string };
  variety?: { score: number; note: string };
  warmth?: { score: number; note: string };
  clarity?: { score: number; note: string };
  pace?: string;
  fillersHeard?: number;
  emphasis?: { phrase: string; hit: boolean; note: string }[];
  moments?: { quote: string; heard: string; verdict: string }[];
  summary?: string;
}

async function listen(audio: Uint8Array, key: string, occasion: string, emphasis: string[]): Promise<Listening | null> {
  const prompt = `You are an elite speech delivery coach LISTENING to a recording of someone rehearsing ${occasion}. Judge what you HEAR (the voice), not just the words: energy, pitch variation, warmth, pace, pauses, emphasis, volume and clarity.

Be honest. Most nervous speakers sound flatter and faster than they think. If the delivery is flat or monotone, say so plainly and score it low. Do not inflate.

Their coach marked these words and phrases to emphasise. For each one you can hear in the recording, say whether they actually stressed it:
${emphasis.length ? emphasis.map((e) => `- "${e}"`).join("\n") : "- (none marked)"}

Return ONLY JSON:
{
 "energy": {"score": 1-5, "note": "what you heard, one sentence"},
 "variety": {"score": 1-5, "note": "pitch and tonal variation; flag monotone explicitly"},
 "warmth": {"score": 1-5, "note": "did the emotion live in the voice at the heartfelt moments?"},
 "clarity": {"score": 1-5, "note": "volume, projection, articulation, trailing off"},
 "pace": "one sentence on how the pace sounded and where it rushed or dragged",
 "fillersHeard": integer count of um / uh / er / erm you heard,
 "emphasis": [{"phrase": "exact phrase from the list", "hit": true/false, "note": "max 15 words"}],
 "moments": [{"quote": "a short line from the speech", "heard": "how it was delivered, max 25 words", "verdict": "landed" | "missed"}],
 "summary": "two sentences: the single most important thing you heard"
}
Give 3-6 moments, mixing what landed and what missed.`;
  for (const model of AUDIO_MODELS) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        modalities: ["text"],
        messages: [{ role: "user", content: [
          { type: "input_audio", input_audio: { data: toBase64(audio), format: "wav" } },
          { type: "text", text: prompt },
        ] }],
      }),
    });
    if (!r.ok) {
      const body = (await r.text()).slice(0, 300);
      console.error("[rehearsal-feedback] listen", model, r.status, body);
      if (r.status === 404 || /model/i.test(body)) continue;
      return null;
    }
    const d = await r.json();
    const msg = d.choices?.[0]?.message || {};
    const text: string = typeof msg.content === "string" ? msg.content
      : Array.isArray(msg.content) ? msg.content.map((c: { text?: string }) => c.text || "").join("") : "";
    const m = text.match(/\{[\s\S]*\}/);
    try {
      if (m) return JSON.parse(m[0]);
    } catch { /* fall through */ }
    console.error("[rehearsal-feedback] listen unparsed", model, JSON.stringify(d).slice(0, 600));
    return null;
  }
  return null;
}

/** Lines the timed transcript up against the script sections. */
function analyseTiming(sections: Section[], words: Word[]) {
  const tw = words.map((w) => ({ ...w, n: norm(w.word)[0] || "" })).filter((w) => w.n && !FILLERS.has(w.n));
  const index = new Map<string, number[]>();
  for (let i = 0; i + 2 < tw.length; i++) {
    const g = `${tw[i].n} ${tw[i + 1].n} ${tw[i + 2].n}`;
    if (!index.has(g)) index.set(g, []);
    index.get(g)!.push(i);
  }
  const find = (g: string, from: number, to = Infinity) => (index.get(g) || []).find((i) => i >= from && i <= to);
  const grams = (toks: string[]) => toks.slice(0, Math.max(0, toks.length - 2)).map((_, i) => `${toks[i]} ${toks[i + 1]} ${toks[i + 2]}`);

  let cursor = 0;
  const pauseEnds = new Set<number>();
  const out = sections.map((s, i) => {
    const toks = norm(s.text).filter((t) => !FILLERS.has(t));
    const g = grams(toks);
    const heard = g.filter((x) => index.has(x)).length;
    const said = g.length === 0 || heard / g.length >= 0.25;
    let start: number | undefined, end: number | undefined;
    if (said) {
      for (const x of g.slice(0, 8)) { const k = find(x, cursor); if (k !== undefined) { start = k; break; } }
      if (start !== undefined) {
        for (const x of g.slice(-8).reverse()) { const k = find(x, start); if (k !== undefined) { end = k + 2; break; } }
      }
    }
    const t0 = start !== undefined ? tw[start].start : null;
    const t1 = end !== undefined ? tw[Math.min(end, tw.length - 1)].end : null;
    const actual = t0 !== null && t1 !== null && t1 > t0 ? t1 - t0 : null;
    if (end !== undefined) cursor = end + 1;

    // Pauses the coach marked: how long a gap followed each one?
    const pauses = s.pauses.map((p) => {
      const pt = norm(p.after).filter((t) => !FILLERS.has(t)).slice(-3);
      let gap: number | null = null;
      if (start !== undefined && pt.length) {
        const lo = start, hi = (end ?? start) + 3;
        for (let k = lo; k <= Math.min(hi, tw.length - 1) - (pt.length - 1); k++) {
          if (pt.every((t, j) => tw[k + j]?.n === t)) {
            const last = k + pt.length - 1;
            pauseEnds.add(last);
            gap = last + 1 < tw.length ? Math.max(0, tw[last + 1].start - tw[last].end) : null;
            break;
          }
        }
      }
      return { after: p.after, type: p.type, gap: gap === null ? null : Math.round(gap * 10) / 10, held: gap === null ? null : gap >= PAUSE_NEEDED[p.type] };
    });

    const ratio = actual && s.seconds ? actual / s.seconds : null;
    const wpm = actual ? (toks.length / actual) * 60 : null;
    const status = !said ? "skipped" : ratio === null ? "unclear"
      : ratio < 0.8 || (wpm !== null && wpm > 170 && ratio < 0.95) ? "rushed" : ratio > 1.4 ? "slow" : "good";
    return {
      i,
      label: s.text.split(/\s+/).slice(0, 7).join(" ") + "…",
      planned: s.seconds,
      actual: actual === null ? null : Math.round(actual),
      wpm: wpm === null ? null : Math.round(wpm),
      status,
      pauses,
      endIndex: end,
    };
  });

  // Sections after the last one said weren't skipped: the speaker stopped there.
  const lastSaid = Math.max(-1, ...out.filter((x) => x.status !== "skipped" && x.status !== "unclear").map((x) => x.i));
  for (const x of out) if (x.i > lastSaid && x.status === "skipped") x.status = "not reached";

  // Hesitations: long silences that weren't at a marked pause.
  const hesitations: { before: string; seconds: number }[] = [];
  for (let k = 0; k + 1 < tw.length; k++) {
    const gap = tw[k + 1].start - tw[k].end;
    if (gap >= 3 && !pauseEnds.has(k)) {
      hesitations.push({ before: tw.slice(k + 1, k + 7).map((w) => w.word.trim()).join(" "), seconds: Math.round(gap * 10) / 10 });
    }
  }
  return { sections: out, hesitations: hesitations.slice(0, 5) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const db = adminClient();
  let audioPath: string | null = null;
  try {
    const { speechId, accessToken, rehearsalId } = await req.json();
    if (!speechId || !accessToken || !rehearsalId) return json({ error: "Missing rehearsal details" }, 400);
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "Rehearsal coaching isn't available right now." }, 503);

    const speech = await loadPaidSpeech(db, speechId, accessToken);
    if (!speech) return json({ error: "Speech not found" }, 404);
    const { data: rehearsal } = await db.from("rehearsals").select("id, speech_text, feedback, audio_path")
      .eq("id", rehearsalId).eq("speech_id", speechId).maybeSingle();
    if (!rehearsal) return json({ error: "Rehearsal not found" }, 404);
    if (rehearsal.feedback) return json({ feedback: rehearsal.feedback });
    audioPath = rehearsal.audio_path;
    if (!audioPath) return json({ error: "We didn't receive your recording. Please try again." }, 422);

    const { data: blob, error: dlErr } = await db.storage.from(AUDIO_BUCKET).download(audioPath);
    if (dlErr || !blob) return json({ error: "We didn't receive your recording. Please try again." }, 422);
    const audio = new Uint8Array(await blob.arrayBuffer());
    const recordedSeconds = wavSeconds(audio);
    if (recordedSeconds < 10) return json({ error: "That recording was too short to coach. Try again and read at least a few sections." }, 422);

    const scriptText: string = rehearsal.speech_text || speech.text;
    const { data: cached } = await db.from("rehearsal_scripts").select("markup").eq("speech_id", speechId)
      .eq("text_hash", await sha256(scriptText)).maybeSingle();
    const sections: Section[] = (cached?.markup as { sections?: Section[] })?.sections
      || paragraphsOf(scriptText).map((text) => ({ text, cue: "", action: "", seconds: Math.round((text.split(/\s+/).length / 130) * 60), emphasis: [], pauses: [] }));
    const a = audienceFor(speech.speech_type);

    const [tx, heard] = await Promise.all([
      transcribe(audio, key),
      listen(wavHead(audio, 8 * 60), key, a.occasion, sections.flatMap((s) => s.emphasis).slice(0, 14)),
    ]);
    if (!tx || norm(tx.text).length < 15) {
      return json({ error: "We couldn't hear enough of your speech. Check your microphone and try again somewhere quiet." }, 422);
    }

    const timing = analyseTiming(sections, tx.words);
    const said = timing.sections.filter((s) => s.status !== "skipped");
    const skipped = timing.sections.filter((s) => s.status === "skipped");
    const notReached = timing.sections.filter((s) => s.status === "not reached");
    const speakingSeconds = tx.words.length ? tx.words[tx.words.length - 1].end - tx.words[0].start : recordedSeconds;
    const totalPlanned = sections.reduce((s, x) => s + x.seconds, 0);
    const saidPlanned = said.reduce((s, x) => s + x.planned, 0);
    const paceRatio = saidPlanned ? speakingSeconds / saidPlanned : 1;
    const estimatedFullSeconds = Math.round(speakingSeconds + [...skipped, ...notReached].reduce((s, x) => s + x.planned * paceRatio, 0));
    const allPauses = said.flatMap((s) => s.pauses).filter((p) => p.held !== null);
    const spokenTokens = norm(tx.text);
    const fillerTotal = Math.max(spokenTokens.filter((t) => FILLERS.has(t)).length, Number(heard?.fillersHeard) || 0);
    const contentWords = spokenTokens.filter((t) => !FILLERS.has(t)).length;

    const stats = {
      speakingSeconds: Math.round(speakingSeconds),
      estimatedFullSeconds,
      plannedSeconds: totalPlanned,
      targetMinutes: a.targetMinutes,
      wordsPerMinute: speakingSeconds > 10 ? Math.round((contentWords / speakingSeconds) * 60) : null,
      coverage: Math.round((said.reduce((s, x) => s + x.planned, 0) / Math.max(1, totalPlanned)) * 100),
      fillerTotal,
      pausesHeld: allPauses.filter((p) => p.held).length,
      pausesTotal: allPauses.length,
      sections: timing.sections.map(({ endIndex: _e, ...s }) => s),
      skipped: skipped.map((s) => s.label),
      stoppedAt: notReached.length ? notReached[0].label : null,
      hesitations: timing.hesitations,
      voice: heard ? (["energy", "variety", "warmth", "clarity"] as const)
        .map((k) => heard[k] ? { label: k, score: Math.max(1, Math.min(5, Math.round(Number(heard[k]!.score) || 3))), note: String(heard[k]!.note || "") } : null)
        .filter(Boolean) : [],
      emphasis: heard?.emphasis || [],
      listened: !!heard,
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    const speakerName = String((speech.answers as Record<string, unknown>).firstName || "").trim().split(/\s+/)[0] || "";
    const prompt = `You are Adrian Simpson: former BBC Top Gear and Sky News presenter, speechwriter and speech coach since 2012. A client has just rehearsed their speech out loud from your coached autocue script. Write their coaching notes. They are probably nervous and not a natural speaker: be warm and encouraging, but honest and SPECIFIC. Every fix must be something they can do on the next run, ending with a directable stage cue, e.g. 'Drop your voice on "my brother", pause two seconds, then raise your glass.'

THE SPEAKER: ${speakerName ? `${speakerName}, the person giving this speech. Other names in the speech are the people they're talking about, not them.` : "the person giving this speech (don't name them; names in the speech are other people)."}
OCCASION: ${a.occasion}. TARGET: ${a.targetMinutes[0]}-${a.targetMinutes[1]} minutes.

YOUR COACHED SCRIPT (cue, stage direction, words to hit, pauses) AND HOW THEY DID EACH SECTION:
${sections.map((s, i) => {
  const t = timing.sections[i];
  return `[${i}] ${s.text}
   coached: cue "${s.cue}"${s.action ? `, action "${s.action}"` : ""}; hit ${s.emphasis.map((e) => `"${e}"`).join(", ") || "-"}; pauses ${s.pauses.map((p) => `${p.type} after "${p.after}"`).join(", ") || "-"}; planned ${s.seconds}s
   measured: ${t.status === "skipped" ? "SKIPPED" : t.status === "not reached" ? "NOT REACHED (they stopped before this; don't critique it)" : `${t.actual ?? "?"}s (${t.status})${t.wpm ? `, ${t.wpm} wpm` : ""}`}${t.pauses.length ? `; pauses: ${t.pauses.map((p) => `${p.type} after "${p.after}" ${p.gap === null ? "not found" : `${p.gap}s ${p.held ? "HELD" : "NOT HELD"}`}`).join("; ")}` : ""}`;
}).join("\n")}

MEASUREMENTS
- ${notReached.length ? `They stopped after section ${notReached[0].i - 1} (${notReached.length} sections not reached). Coach what they did; estimate the full length from their pace.` : "They reached the end."}
- Spoke for ${fmt(speakingSeconds)}; at this pace the whole speech would take about ${fmt(estimatedFullSeconds)} (target ${a.targetMinutes[0]}-${a.targetMinutes[1]} min; coached timing ${fmt(totalPlanned)}).
- Pace ${stats.wordsPerMinute ?? "?"} words a minute (comfortable for a speech: 120-145).
- Marked pauses held: ${stats.pausesHeld} of ${stats.pausesTotal}.
- Filler words (um/uh/er): ${fillerTotal}.
- Long hesitations (3s+ silences, possibly lost their place): ${timing.hesitations.map((h) => `${h.seconds}s before "${h.before}"`).join("; ") || "none"}.

WHAT A COACH HEARD IN THE RECORDING (voice, not words)
${heard ? JSON.stringify({ energy: heard.energy, variety: heard.variety, warmth: heard.warmth, clarity: heard.clarity, pace: heard.pace, emphasis: heard.emphasis, moments: heard.moments, summary: heard.summary }) : "Not available for this recording: base your notes on the timing and transcript, and do not comment on tone of voice."}

WHAT THEY SAID (transcript)
${tx.text.slice(0, 12000)}

${speech.american ? "Write in American English." : "Write in British English."} Address them as "you". No scores, no jargon.
Return ONLY JSON:
{
 "headline": "one sentence verdict, max 22 words",
 "summary": "2-3 sentences: what's working and the single biggest thing to change",
 "timing": "2 sentences on length and pace, using the numbers, naming the sections they rushed",
 "pauses": "1-2 sentences on the pauses and laugh-waits, naming one they must hold next time",
 "landed": [{"line": "short quote from their speech", "why": "max 25 words"}],
 "fixes": [{"title": "max 6 words", "line": "the line it applies to, quoted from the script", "how": "what to do, ending with a stage cue, max 45 words"}],
 "nextRun": "one sentence: the one thing to focus on in the next rehearsal"
}
Give 2-3 "landed" and exactly 3 "fixes", most important first.`;

    const notes = await claudeJson<Record<string, unknown>>(prompt, 2500, "rehearsal-feedback");
    if (!notes) return json({ error: "We couldn't write your notes just now. Please try again in a minute." }, 502);

    const feedback = { ...notes, stats };
    await db.from("rehearsals").update({
      finished_at: new Date().toISOString(),
      duration_seconds: Math.round(recordedSeconds),
      transcript: { text: tx.text, words: tx.words.length },
      stats,
      feedback,
      audio_path: null,
    }).eq("id", rehearsalId);
    await db.storage.from(AUDIO_BUCKET).remove([audioPath]);
    audioPath = null;
    return json({ feedback });
  } catch (e) {
    console.error("[rehearsal-feedback]", e);
    return json({ error: "Something went wrong writing your notes. Please try again." }, 500);
  }
});
