import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mic, Square, Loader2, Play, Pause, RotateCcw, Minus, Plus, Clock, Gauge, Hourglass,
  MessageSquareQuote, CheckCircle2, Wrench, AlertCircle, ListChecks, Volume2, Lightbulb, XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSpeechTitle } from "@/lib/speechTitles";
import { toWav16k } from "@/lib/wav";
import { track } from "@/lib/track";

type PauseType = "beat" | "laugh" | "breath";
interface Section { text: string; cue: string; action: string; seconds: number; emphasis: string[]; pauses: { after: string; type: PauseType }[] }
interface Script { wpm: number; targetMinutes: [number, number]; tips: string[]; sections: Section[]; remaining: number; speechType: string; american: boolean }
interface SectionStat { i: number; label: string; planned: number; actual: number | null; wpm: number | null; status: string; pauses: { after: string; type: PauseType; gap: number | null; held: boolean | null }[] }
interface Feedback {
  headline: string; summary: string; timing?: string; pauses?: string; nextRun?: string;
  landed?: { line: string; why: string }[];
  fixes?: { title: string; line?: string; how: string }[];
  stats: {
    speakingSeconds: number; estimatedFullSeconds: number; plannedSeconds: number; targetMinutes: [number, number];
    wordsPerMinute: number | null; coverage: number; fillerTotal: number; pausesHeld: number; pausesTotal: number;
    sections: SectionStat[]; skipped: string[]; stoppedAt?: string | null; hesitations: { before: string; seconds: number }[];
    voice: { label: string; score: number; note: string }[]; emphasis: { phrase: string; hit: boolean; note: string }[]; listened: boolean;
  };
}

const MAX_SECONDS = 15 * 60;
const PAUSE_LABEL: Record<PauseType, string> = { laugh: "wait for the laugh", beat: "pause", breath: "breathe" };
const VOICE_LABEL: Record<string, string> = { energy: "Energy", variety: "Light and shade", warmth: "Warmth", clarity: "Clarity" };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.round(s % 60))).padStart(2, "0")}`;

/** Speech text with the coach's markings: words to hit in gold, pause markers inline. */
function marked(s: Section): ReactNode[] {
  const marks: { at: number; end: number; kind: "em" | PauseType }[] = [];
  const lower = s.text.toLowerCase();
  for (const e of s.emphasis) {
    const at = lower.indexOf(e.toLowerCase());
    if (at >= 0) marks.push({ at, end: at + e.length, kind: "em" });
  }
  for (const p of s.pauses) {
    const at = lower.indexOf(p.after.toLowerCase());
    if (at >= 0) marks.push({ at: at + p.after.length, end: at + p.after.length, kind: p.type });
  }
  marks.sort((a, b) => a.at - b.at || (a.kind === "em" ? -1 : 1));
  const out: ReactNode[] = [];
  let pos = 0;
  marks.forEach((m, k) => {
    if (m.at < pos) return;
    if (m.at > pos) out.push(s.text.slice(pos, m.at));
    if (m.kind === "em") {
      out.push(<strong key={k} className="text-accent font-bold">{s.text.slice(m.at, m.end)}</strong>);
      pos = m.end;
    } else {
      // Keep any punctuation that closes the phrase before the marker.
      const punct = s.text.slice(m.at).match(/^[.,!?;:'"”’)]*/)?.[0] || "";
      if (punct) out.push(punct);
      out.push(
        <span key={k} className={`inline-flex items-center mx-2 px-2 py-0.5 rounded-md align-middle text-[0.55em] font-body font-semibold uppercase tracking-wider ${
          m.kind === "laugh" ? "bg-accent text-accent-foreground" : "bg-white/15 text-white/80"}`}>
          ‖ {PAUSE_LABEL[m.kind]}
        </span>,
      );
      pos = m.at + punct.length;
    }
  });
  out.push(s.text.slice(pos));
  return out;
}

async function invoke<T>(name: string, body: unknown): Promise<{ data?: T; error?: string; code?: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data?.error ? { error: data.error, code: data.code } : { data };
  try {
    const ctx = (error as unknown as { context?: Response }).context;
    const j = ctx ? await ctx.json() : null;
    return { error: j?.error || "Something went wrong. Please try again.", code: j?.code };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

const Rehearse = () => {
  const [params] = useSearchParams();
  const speechId = params.get("id");
  const accessToken = params.get("token");
  const versionIndex = Number(params.get("v") ?? "-1");
  const backLink = `/speech?id=${speechId}&token=${accessToken}`;

  const [script, setScript] = useState<Script | null>(null);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<"loading" | "ready" | "countdown" | "running" | "processing" | "report">("loading");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [retry, setRetry] = useState<{ rehearsalId: string } | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const sectionEls = useRef<(HTMLDivElement | null)[]>([]);
  const clock = useRef(0); // autocue seconds elapsed (scaled by speed)
  const lastSet = useRef(0);
  const raf = useRef<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const title = getSpeechTitle(script?.speechType || "") || "speech";
  const sections = useMemo(() => script?.sections || [], [script]);
  const totalSeconds = useMemo(() => sections.reduce((s, x) => s + x.seconds, 0), [sections]);

  // Load the coached script.
  useEffect(() => {
    (async () => {
      if (!speechId || !accessToken) { setLoadError("This link isn't quite right. Open your speech from your email and try again."); return; }
      const r = await invoke<Script>("rehearsal-prepare", { speechId, accessToken, versionIndex });
      if (r.error || !r.data) { setLoadError(r.error || "We couldn't load your speech."); return; }
      setScript(r.data);
      setPhase("ready");
    })();
  }, [speechId, accessToken, versionIndex]);

  // ── Autocue: each section scrolls past the reading line in its coached time. ──
  const layout = useCallback(() => {
    const el = scroller.current;
    if (!el) return null;
    const line = el.clientHeight * 0.38;
    let t = 0;
    return sections.map((s, i) => {
      const node = sectionEls.current[i];
      const top = node ? node.offsetTop : 0;
      const h = node ? node.offsetHeight : 0;
      const seg = { t0: t, d: Math.max(1, s.seconds), top: top - line, h };
      t += seg.d;
      return seg;
    });
  }, [sections]);

  const positionFor = useCallback((t: number) => {
    const segs = layout();
    if (!segs?.length) return 0;
    const seg = segs.find((s) => t < s.t0 + s.d) || segs[segs.length - 1];
    const f = Math.min(1, Math.max(0, (t - seg.t0) / seg.d));
    return seg.top + f * seg.h;
  }, [layout]);

  const timeFor = useCallback((y: number) => {
    const segs = layout();
    if (!segs?.length) return 0;
    const seg = [...segs].reverse().find((s) => y >= s.top) || segs[0];
    return seg.t0 + Math.min(1, Math.max(0, (y - seg.top) / Math.max(1, seg.h))) * seg.d;
  }, [layout]);

  useEffect(() => {
    if (phase !== "running" || paused) return;
    let last = performance.now();
    const tick = (now: number) => {
      const el = scroller.current;
      if (el) {
        // The speaker scrolled by hand: carry on from where they put it.
        if (Math.abs(el.scrollTop - lastSet.current) > 3) clock.current = timeFor(el.scrollTop);
        clock.current += ((now - last) / 1000) * speed;
        el.scrollTop = Math.max(0, positionFor(clock.current));
        lastSet.current = el.scrollTop;
      }
      last = now;
      setElapsed((Date.now() - startedAt.current) / 1000);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [phase, paused, speed, positionFor, timeFor]);

  const releaseWake = () => { wakeLock.current?.release().catch(() => {}); wakeLock.current = null; };

  const begin = async (withMic: boolean) => {
    setError("");
    setFeedback(null);
    if (withMic) {
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        setError("I need your microphone to coach you. Allow microphone access and try again.");
        return;
      }
    }
    try {
      const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
      wakeLock.current = (await nav.wakeLock?.request("screen")) || null;
    } catch { /* optional */ }
    setPhase("countdown");
    clock.current = 0;
    for (let n = 3; n > 0; n--) { setCountdown(n); await new Promise((r) => setTimeout(r, 1000)); }
    if (scroller.current) { scroller.current.scrollTop = Math.max(0, positionFor(0)); lastSet.current = scroller.current.scrollTop; }
    if (withMic && stream.current) {
      const mr = new MediaRecorder(stream.current);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.start(1000);
      recorder.current = mr;
      setRecording(true);
      track("rehearsal_start", { speech_type: script?.speechType });
    } else {
      setRecording(false);
    }
    startedAt.current = Date.now();
    setElapsed(0);
    setPaused(false);
    setPhase("running");
  };

  const analyse = async (rehearsalId: string) => {
    setPhase("processing");
    setError("");
    setStep("Listening back to your rehearsal…");
    const t = setTimeout(() => setStep("Checking your timing, pauses and emphasis…"), 15000);
    const t2 = setTimeout(() => setStep("Writing your coaching notes…"), 35000);
    const r = await invoke<{ feedback: Feedback }>("rehearsal-feedback", { speechId, accessToken, rehearsalId });
    clearTimeout(t); clearTimeout(t2);
    if (r.data?.feedback) {
      setFeedback(r.data.feedback);
      setRetry(null);
      track("rehearsal_finish", { speech_type: script?.speechType });
    } else {
      setError(r.error || "I couldn't write your notes just now.");
      setRetry({ rehearsalId });
    }
    setPhase("report");
  };

  const stop = async () => {
    releaseWake();
    if (!recording || !recorder.current) { setPhase("ready"); return; }
    setRecording(false);
    setPhase("processing");
    setStep("Saving your recording…");
    const mr = recorder.current;
    recorder.current = null;
    const done = new Promise<void>((res) => { mr.onstop = () => res(); });
    mr.stop();
    await done;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    const seconds = (Date.now() - startedAt.current) / 1000;
    if (seconds < 15) {
      setError("That was a bit short to coach. Read at least a few sections, then tap Stop.");
      setPhase("ready");
      return;
    }
    try {
      const wav = await toWav16k(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" }));
      const s = await invoke<{ rehearsalId: string; path: string; uploadToken: string; remaining: number }>("rehearsal-start", { speechId, accessToken, versionIndex });
      if (!s.data) { setError(s.error || "Couldn't save your rehearsal."); setPhase("ready"); return; }
      setStep("Uploading…");
      const up = await supabase.storage.from("rehearsal-audio").uploadToSignedUrl(s.data.path, s.data.uploadToken, wav, { contentType: "audio/wav" });
      if (up.error) throw up.error;
      setScript((sc) => (sc ? { ...sc, remaining: s.data!.remaining } : sc));
      await analyse(s.data.rehearsalId);
    } catch (e) {
      console.error(e);
      setError("I couldn't upload your recording. Check your connection and try again.");
      setPhase("ready");
    }
  };

  // Stop automatically at the limit.
  useEffect(() => {
    if (recording && elapsed >= MAX_SECONDS) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, recording]);

  const restart = () => {
    clock.current = 0;
    if (scroller.current) { scroller.current.scrollTop = Math.max(0, positionFor(0)); lastSet.current = scroller.current.scrollTop; }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-6">
        <div className="text-center max-w-md">
          <p className="font-body text-muted-foreground mb-6">{loadError}</p>
          <Link to={backLink} className="font-body text-accent underline">Back to my speech</Link>
        </div>
      </div>
    );
  }

  if (phase === "loading" || !script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-warm px-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Marking up your speech</h1>
        <p className="font-body text-muted-foreground max-w-sm">Adding the cues, the pauses and the words to hit, just as I would for a client. The first time takes about 30 seconds.</p>
      </div>
    );
  }

  const live = phase === "countdown" || phase === "running";
  const [tMin, tMax] = script.targetMinutes;

  return (
    <div className="min-h-screen bg-gradient-warm">
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={backLink} className="inline-flex items-center gap-2 font-body text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to my speech
          </Link>
          <span className="font-display text-lg font-bold text-primary-foreground">Rehearsal</span>
        </div>
      </nav>

      {(phase === "ready" || live) && (
        <div className="container mx-auto px-4 md:px-6 py-6 max-w-4xl">
          {phase === "ready" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background border border-border rounded-2xl p-6 md:p-8 mb-5">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Rehearse your {title.toLowerCase()} with the autocue</h1>
              <p className="font-body text-muted-foreground mb-5 leading-relaxed">
                I've marked up your speech the way I would for a client. <strong className="text-accent">Gold words</strong> are the ones to hit,
                and the tags show you where to pause and where to wait for the laugh. Say it out loud as the autocue scrolls,
                then I'll listen back and tell you exactly what to work on.
              </p>
              {!!script.tips.length && (
                <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 mb-5">
                  <p className="font-body text-xs uppercase tracking-widest text-accent font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Before you start</p>
                  <ul className="space-y-1.5 font-body text-sm text-foreground list-disc pl-5">
                    {script.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-1 font-body text-sm text-muted-foreground mb-5">
                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> Coached timing {fmt(totalSeconds)}</span>
                <span className="inline-flex items-center gap-1.5"><Hourglass className="w-4 h-4" /> Aim for {tMin}–{tMax} minutes</span>
                <span className="inline-flex items-center gap-1.5"><Mic className="w-4 h-4" /> {script.remaining} coached rehearsals left</span>
              </div>
              {error && <div className="flex gap-2 items-start p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 font-body text-sm text-destructive"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</div>}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => begin(true)} disabled={script.remaining <= 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl disabled:opacity-50">
                  <Mic className="w-5 h-5" /> Start rehearsal
                </button>
                <button onClick={() => begin(false)} className="sm:w-64 inline-flex items-center justify-center gap-2 py-4 border-2 border-foreground/20 font-display font-bold rounded-xl text-foreground hover:bg-foreground/5">
                  <Play className="w-5 h-5" /> Practise without recording
                </button>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-3">Somewhere quiet, standing up if you can. Your recording is only used for your notes, then deleted.</p>
            </motion.div>
          )}

          <div className="relative rounded-2xl bg-charcoal overflow-hidden" style={{ height: live ? "calc(100vh - 190px)" : "420px" }}>
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-charcoal to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal to-transparent z-10 pointer-events-none" />
            {live && <div className="absolute inset-x-0 z-10 pointer-events-none border-y border-accent/30 bg-accent/5" style={{ top: "calc(38% - 8px)", height: "3.6rem" }} />}
            {live && <div className="absolute left-2 md:left-4 z-20 text-accent text-xl pointer-events-none" style={{ top: "calc(38% + 4px)" }}>▶</div>}
            {phase === "countdown" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-charcoal/70">
                <motion.span key={countdown} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-8xl font-bold text-accent">{countdown}</motion.span>
              </div>
            )}
            <div ref={scroller} onClick={() => phase === "running" && setPaused((p) => !p)}
              className="h-full overflow-y-auto px-8 md:px-14" style={{ scrollbarWidth: "none" }}>
              <div style={{ height: "38%" }} />
              {sections.map((s, i) => (
                <div key={i} ref={(el) => { sectionEls.current[i] = el; }} className="pb-8">
                  {(s.cue || s.action) && (
                    <p className="font-body text-xs md:text-sm uppercase tracking-widest text-accent/90 mb-2">
                      {s.cue}{s.cue && s.action ? " · " : ""}{s.action && <span className="normal-case tracking-normal italic text-white/70">({s.action})</span>}
                    </p>
                  )}
                  <p className="font-body text-2xl md:text-[32px] leading-[1.6] text-white/95 font-medium whitespace-pre-wrap">{marked(s)}</p>
                </div>
              ))}
              <p className="font-display text-2xl text-accent pb-6">The end. Tap Stop for your notes.</p>
              <div style={{ height: "60%" }} />
            </div>
            {phase === "running" && paused && (
              <div className="absolute inset-x-0 bottom-6 z-20 text-center font-body text-sm text-white/80">Paused. Tap the text to carry on.</div>
            )}
          </div>

          {live && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 font-body text-sm text-foreground">
                {recording && <span className="inline-flex items-center gap-1.5 text-destructive font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> REC</span>}
                <span className="tabular-nums font-semibold">{fmt(elapsed)}</span>
                <span className="text-muted-foreground">aim {tMin}–{tMax} min</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSpeed((v) => Math.max(0.6, +(v - 0.1).toFixed(1)))} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" aria-label="Slower"><Minus className="w-4 h-4" /></button>
                <span className="font-body text-xs text-muted-foreground w-16 text-center">Speed {Math.round(speed * 100)}%</span>
                <button onClick={() => setSpeed((v) => Math.min(1.6, +(v + 0.1).toFixed(1)))} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" aria-label="Faster"><Plus className="w-4 h-4" /></button>
                <button onClick={() => setPaused((p) => !p)} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" aria-label="Pause">{paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
                <button onClick={restart} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center" aria-label="Back to the start"><RotateCcw className="w-4 h-4" /></button>
                <button onClick={stop} className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-destructive text-white font-body font-semibold">
                  <Square className="w-4 h-4 fill-current" /> {recording ? "Stop & get notes" : "Stop"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "processing" && (
        <div className="container mx-auto px-6 py-16 max-w-xl text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-5" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">{step}</h2>
          <p className="font-body text-muted-foreground">I'm listening to how you said it, not just what you said: your timing, pauses, energy and the words you hit. This takes about a minute.</p>
        </div>
      )}

      {phase === "report" && (
        <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
          {!feedback ? (
            <div className="bg-background border border-border rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="font-body text-foreground mb-5">{error}</p>
              {retry && <button onClick={() => analyse(retry.rehearsalId)} className="px-6 py-3 bg-accent text-accent-foreground font-display font-bold rounded-xl mr-3">Try again</button>}
              <button onClick={() => { setError(""); setPhase("ready"); }} className="px-6 py-3 border-2 border-foreground/20 font-display font-bold rounded-xl">Back to the autocue</button>
            </div>
          ) : <Report f={feedback} onAgain={() => { setFeedback(null); setPhase("ready"); }} backLink={backLink} />}
        </div>
      )}
    </div>
  );
};

const STATUS: Record<string, { color: string; text: string }> = {
  good: { color: "bg-emerald-500", text: "good" },
  rushed: { color: "bg-amber-500", text: "rushed" },
  slow: { color: "bg-sky-500", text: "slow" },
  skipped: { color: "bg-muted-foreground/40", text: "skipped" },
  "not reached": { color: "bg-transparent", text: "not reached" },
  unclear: { color: "bg-muted-foreground/40", text: "–" },
};

const Report = ({ f, onAgain, backLink }: { f: Feedback; onAgain: () => void; backLink: string }) => {
  const s = f.stats;
  const [tMin, tMax] = s.targetMinutes;
  const full = s.estimatedFullSeconds / 60;
  const lengthOk = full >= tMin - 0.25 && full <= tMax + 0.25;
  const maxBar = Math.max(...s.sections.map((x) => Math.max(x.planned, x.actual || 0)), 1);
  const heldPauses = s.sections.flatMap((x) => x.pauses).filter((p) => p.held !== null);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="rounded-2xl bg-charcoal text-primary-foreground p-6 md:p-8">
        <p className="font-body text-xs uppercase tracking-widest text-accent mb-2">Adrian's notes</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{f.headline}</h2>
        <p className="font-body text-primary-foreground/80 leading-relaxed">{f.summary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile icon={Clock} value={fmt(s.estimatedFullSeconds)} label="Full speech at your pace" sub={`Aim for ${tMin}–${tMax} min`} warn={!lengthOk} />
        <Tile icon={Gauge} value={s.wordsPerMinute ? `${s.wordsPerMinute}` : "–"} label="Words a minute" sub="Sweet spot 120–145" warn={!!s.wordsPerMinute && (s.wordsPerMinute > 155 || s.wordsPerMinute < 105)} />
        <Tile icon={Hourglass} value={s.pausesTotal ? `${s.pausesHeld}/${s.pausesTotal}` : "–"} label="Pauses held" sub="Including laugh-waits" warn={s.pausesTotal > 0 && s.pausesHeld / s.pausesTotal < 0.6} />
        <Tile icon={MessageSquareQuote} value={String(s.fillerTotal)} label="Ums and ers" sub={s.fillerTotal <= 3 ? "Nicely clean" : "Swap them for a pause"} warn={s.fillerTotal > 6} />
      </div>

      {!!f.fixes?.length && (
        <Card icon={Wrench} title="Three things to work on">
          {f.fixes.map((x, i) => (
            <div key={i} className="mb-5 last:mb-0">
              <p className="font-display font-bold text-foreground">{i + 1}. {x.title}</p>
              {x.line && <p className="font-body italic text-muted-foreground text-sm mt-1">“{x.line}”</p>}
              <p className="font-body text-sm text-foreground mt-1">{x.how}</p>
            </div>
          ))}
        </Card>
      )}

      {!!s.voice.length && (
        <Card icon={Volume2} title="How you sounded">
          <div className="space-y-4">
            {s.voice.map((v) => (
              <div key={v.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm font-semibold text-foreground">{VOICE_LABEL[v.label] || v.label}</span>
                  <span className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`w-5 h-2 rounded-full ${n <= v.score ? (v.score <= 2 ? "bg-amber-500" : "bg-accent") : "bg-muted"}`} />)}</span>
                </div>
                <p className="font-body text-sm text-muted-foreground">{v.note}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card icon={Clock} title="Your timing, section by section">
        {f.timing && <p className="font-body text-sm text-foreground mb-4">{f.timing}</p>}
        <div className="space-y-2.5">
          {s.sections.filter((x) => x.status !== "not reached").map((x) => (
            <div key={x.i}>
              <div className="flex justify-between font-body text-xs mb-1">
                <span className="text-foreground truncate pr-3">{x.label}</span>
                <span className="text-muted-foreground shrink-0">{x.actual !== null ? `${x.actual}s` : "–"} / {x.planned}s · <span className="font-semibold">{STATUS[x.status]?.text}</span></span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div className={`absolute inset-y-0 left-0 rounded-full ${STATUS[x.status]?.color}`} style={{ width: `${((x.actual || 0) / maxBar) * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${(x.planned / maxBar) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {s.stoppedAt && <p className="font-body text-sm text-foreground mt-4">You stopped before “{s.stoppedAt}” The full-length estimate assumes you'd carry on at the same pace.</p>}
        <p className="font-body text-xs text-muted-foreground mt-3">Bar: how long you took. Line: the coached timing, including its pauses.</p>
      </Card>

      {(!!f.pauses || heldPauses.length > 0) && (
        <Card icon={Hourglass} title="Pauses and laugh-waits">
          {f.pauses && <p className="font-body text-sm text-foreground mb-3">{f.pauses}</p>}
          <div className="flex flex-wrap gap-2">
            {heldPauses.map((p, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs ${p.held ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                {p.held ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} “…{p.after.split(/\s+/).slice(-4).join(" ")}” {p.gap}s
              </span>
            ))}
          </div>
        </Card>
      )}

      {!!s.emphasis.length && (
        <Card icon={Volume2} title="The words to hit">
          <div className="space-y-2">
            {s.emphasis.map((e, i) => (
              <p key={i} className="font-body text-sm flex gap-2">
                {e.hit ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                <span><strong className="text-foreground">{e.phrase}</strong> <span className="text-muted-foreground">{e.note}</span></span>
              </p>
            ))}
          </div>
        </Card>
      )}

      {!!f.landed?.length && (
        <Card icon={CheckCircle2} title="What landed">
          {f.landed.map((l, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <p className="font-body italic text-foreground">“{l.line}”</p>
              <p className="font-body text-sm text-muted-foreground mt-1">{l.why}</p>
            </div>
          ))}
        </Card>
      )}

      {(!!s.skipped.length || !!s.hesitations.length) && (
        <Card icon={ListChecks} title="Where you lost your way">
          {s.skipped.map((x, i) => <p key={i} className="font-body text-sm text-muted-foreground mb-1.5">Skipped: {x}</p>)}
          {s.hesitations.map((h, i) => <p key={`h${i}`} className="font-body text-sm text-muted-foreground mb-1.5">Stopped for {h.seconds}s before “{h.before}…”</p>)}
        </Card>
      )}

      {f.nextRun && <div className="rounded-xl bg-accent/10 border border-accent/20 p-5 font-body text-foreground"><strong>Next time:</strong> {f.nextRun}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onAgain} className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold rounded-xl">
          <RotateCcw className="w-5 h-5" /> Rehearse again
        </button>
        <Link to={backLink} className="flex-1 inline-flex items-center justify-center gap-2 py-4 border-2 border-foreground/20 font-display font-bold rounded-xl text-foreground">Back to my speech</Link>
      </div>
    </motion.div>
  );
};

const Tile = ({ icon: Icon, value, label, sub, warn }: { icon: typeof Clock; value: string; label: string; sub: string; warn?: boolean }) => (
  <div className={`bg-background border rounded-xl p-4 ${warn ? "border-amber-500/50" : "border-border"}`}>
    <Icon className={`w-4 h-4 mb-2 ${warn ? "text-amber-600" : "text-accent"}`} />
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="font-body text-xs text-foreground mt-1">{label}</p>
    <p className="font-body text-xs text-muted-foreground">{sub}</p>
  </div>
);

const Card = ({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: ReactNode }) => (
  <div className="bg-background border border-border rounded-2xl p-6">
    <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Icon className="w-5 h-5 text-accent" /> {title}</h3>
    {children}
  </div>
);

export default Rehearse;
