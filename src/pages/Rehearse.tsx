import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, MicOff, Loader2, Users, Headphones, Hand, Flag, Clock, Gauge, MessageSquareQuote,
  CheckCircle2, Wrench, RotateCcw, AlertCircle, ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSpeechTitle } from "@/lib/speechTitles";
import { useRehearsal, type Turn } from "@/hooks/useRehearsal";
import { track } from "@/lib/track";

interface Feedback {
  headline: string;
  summary: string;
  landed?: { line: string; why: string }[];
  fixes?: { title: string; line?: string; how: string }[];
  pace?: string;
  length?: string;
  nextRun?: string;
  stats: {
    spokenWords: number;
    speakingSeconds: number;
    wordsPerMinute: number | null;
    targetMinutes: [number, number];
    estimatedFullMinutes: number | null;
    coverage: number;
    fillerTotal: number;
    fillers: Record<string, number>;
    skipped: string[];
  };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const Rehearse = () => {
  const [params] = useSearchParams();
  const speechId = params.get("id");
  const accessToken = params.get("token");
  const versionIndex = Number(params.get("v") ?? "-1");

  const [speechText, setSpeechText] = useState("");
  const [speechType, setSpeechType] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<"intro" | "live" | "writing" | "report">("intro");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reportError, setReportError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const lastRun = useRef<{ turns: Turn[]; totalMs: number } | null>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const r = useRehearsal(speechId, accessToken, versionIndex);
  const backLink = `/speech?id=${speechId}&token=${accessToken}`;
  const paragraphs = useMemo(
    () => speechText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [speechText],
  );

  useEffect(() => {
    (async () => {
      if (!speechId || !accessToken) {
        setLoadError("This link isn't quite right. Open your speech from your email and try again.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("get-speech", { body: { speechId, accessToken } });
      if (error || !data || data.error || !data.paid) {
        setLoadError("We couldn't find your speech. Open it from your email and try again.");
      } else {
        const versions = Array.isArray(data.versions) && data.versions.length ? data.versions : [{ text: data.generated_speech }];
        const v = versionIndex >= 0 && versionIndex < versions.length ? versionIndex : versions.length - 1;
        setSpeechText(versions[v].text || "");
        setSpeechType(data.speech_type || "");
      }
      setLoading(false);
    })();
  }, [speechId, accessToken, versionIndex]);

  // Section timer while speaking.
  useEffect(() => {
    if (!r.sectionStartedAt) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((Date.now() - (r.sectionStartedAt as number)) / 1000), 250);
    return () => clearInterval(t);
  }, [r.sectionStartedAt]);

  // Keep the current section in view.
  useEffect(() => {
    paraRefs.current[current]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);

  const begin = async () => {
    setPhase("live");
    setCurrent(0);
    track("rehearsal_start", { speech_type: speechType });
    await r.start();
  };

  const toggleSection = () => {
    if (r.status === "speaking") {
      r.endSection(true);
      setCurrent((c) => Math.min(c + 1, Math.max(paragraphs.length - 1, 0)));
    } else {
      r.startSection();
    }
  };

  const requestNotes = async (run: { turns: Turn[]; totalMs: number }) => {
    setPhase("writing");
    setReportError("");
    const { data, error } = await supabase.functions.invoke("rehearsal-feedback", {
      body: { speechId, accessToken, rehearsalId: r.rehearsalId, turns: run.turns, totalMs: run.totalMs },
    });
    let payload = data;
    if (error) {
      try {
        const ctx = (error as unknown as { context?: Response }).context;
        payload = ctx ? await ctx.json() : null;
      } catch { /* noop */ }
    }
    if (payload?.feedback) {
      setFeedback(payload.feedback);
      setPhase("report");
      track("rehearsal_finish", { speech_type: speechType });
    } else {
      setReportError(payload?.error || "We couldn't write your notes just now.");
      setPhase("report");
    }
  };

  const finish = async () => {
    const run = await r.finish();
    lastRun.current = run;
    await requestNotes(run);
  };

  const title = getSpeechTitle(speechType) || "Your speech";
  const busy = r.status === "connecting";
  const speaking = r.status === "speaking";
  const lastAudience = [...r.turns].reverse().find((t) => t.role === "audience")?.text;
  const reaction = r.liveReaction || lastAudience || "";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-warm"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-6">
        <p className="font-body text-muted-foreground text-center max-w-md">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={backLink} className="inline-flex items-center gap-2 font-body text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to my speech
          </Link>
          <span className="font-display text-lg font-bold text-primary-foreground">Rehearsal room</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        {phase === "intro" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-background border border-border rounded-2xl p-6 md:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-body text-xs font-semibold mb-4">
              <Users className="w-4 h-4" /> Live audience
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Rehearse your {title.toLowerCase()} to a live room</h1>
            <p className="font-body text-muted-foreground mb-6 leading-relaxed">
              Say your speech out loud, a section at a time. After each section, the room reacts out loud, just like the real audience would: the laughs, the
              awkward silences, the moments that land. When you finish, you get Adrian's coaching notes on your pace, length and the lines to fix.
            </p>
            <ul className="space-y-3 mb-8 font-body text-sm text-foreground">
              <li className="flex gap-3"><Mic className="w-5 h-5 text-accent shrink-0" /> Tap <strong>Start speaking</strong> and read a section or two from the screen.</li>
              <li className="flex gap-3"><Hand className="w-5 h-5 text-accent shrink-0" /> Tap <strong>Pause for the room</strong> and listen to how they react.</li>
              <li className="flex gap-3"><Flag className="w-5 h-5 text-accent shrink-0" /> Carry on to the end, then tap <strong>Finish</strong> for your notes.</li>
              <li className="flex gap-3"><Headphones className="w-5 h-5 text-accent shrink-0" /> Somewhere quiet works best. Speak as if you're standing in front of them.</li>
            </ul>
            <button onClick={begin} className="w-full md:w-auto px-8 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-colors">
              Enter the room
            </button>
            <p className="font-body text-xs text-muted-foreground mt-3">We'll ask to use your microphone. Your audio is only used for this rehearsal.</p>
          </motion.div>
        )}

        {phase === "live" && (
          <div className="space-y-5">
            {/* The room */}
            <div className="rounded-2xl bg-charcoal text-primary-foreground p-5 md:p-6 min-h-[120px]">
              <div className="flex items-center gap-2 mb-2 font-body text-xs uppercase tracking-widest text-accent">
                <Users className="w-4 h-4" /> The room
                {r.status === "reacting" && <span className="ml-2 inline-flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}</span>}
              </div>
              {busy ? (
                <p className="font-body text-primary-foreground/70 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finding your seat…</p>
              ) : speaking ? (
                <p className="font-body text-primary-foreground/60 italic">The room is listening…</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p key={reaction.slice(0, 20)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-body text-lg leading-relaxed">
                    {reaction || "…"}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>

            {r.error && (
              <div className="flex gap-2 items-start p-4 rounded-xl bg-destructive/10 border border-destructive/20 font-body text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {r.error}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <button
                onClick={toggleSection}
                disabled={busy || r.status === "error" || r.status === "ended"}
                className={`flex-1 inline-flex items-center justify-center gap-3 py-5 rounded-xl font-display font-bold text-lg transition-colors disabled:opacity-50 ${
                  speaking ? "bg-destructive text-white" : "bg-accent hover:bg-gold-dark text-accent-foreground"
                }`}
              >
                {speaking ? (
                  <><MicOff className="w-5 h-5" /> Pause for the room <span className="font-body text-sm font-normal opacity-80">{fmt(elapsed)}</span></>
                ) : (
                  <><Mic className="w-5 h-5" /> {r.turns.some((t) => t.role === "speaker") ? "Carry on speaking" : "Start speaking"}</>
                )}
              </button>
              <button
                onClick={finish}
                disabled={busy || !r.turns.some((t) => t.role === "speaker") && !speaking}
                className="sm:w-44 inline-flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-foreground/20 font-display font-bold text-foreground hover:bg-foreground/5 disabled:opacity-40"
              >
                <Flag className="w-5 h-5" /> Finish
              </button>
            </div>
            {speaking && (
              <p className="font-body text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" /> Listening to you. Read a section or two, then pause for the room.
              </p>
            )}

            {/* Teleprompter */}
            <div className="bg-background border border-border rounded-2xl p-5 md:p-8 max-h-[55vh] overflow-y-auto">
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">Your speech · tap a paragraph to jump to it</p>
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  ref={(el) => { paraRefs.current[i] = el; }}
                  onClick={() => setCurrent(i)}
                  className={`font-body text-lg md:text-xl leading-relaxed mb-5 cursor-pointer whitespace-pre-wrap transition-colors ${
                    i === current ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  {i === current && <span className="inline-block w-1.5 h-5 bg-accent rounded mr-2 align-middle" />}
                  {p}
                </p>
              ))}
            </div>
            {r.remaining !== null && (
              <p className="font-body text-xs text-muted-foreground text-center">{r.remaining} live rehearsals left for this speech after this one.</p>
            )}
          </div>
        )}

        {phase === "writing" && (
          <div className="bg-background border border-border rounded-2xl p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Writing your coaching notes</h2>
            <p className="font-body text-muted-foreground">Going through what you said and how the room took it. This takes about 20 seconds.</p>
          </div>
        )}

        {phase === "report" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {reportError || !feedback ? (
              <div className="bg-background border border-border rounded-2xl p-8 text-center">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                <p className="font-body text-foreground mb-5">{reportError || "Something went wrong."}</p>
                {lastRun.current && lastRun.current.turns.length > 0 && !/enough/i.test(reportError) && (
                  <button onClick={() => requestNotes(lastRun.current!)} className="px-6 py-3 bg-accent text-accent-foreground font-display font-bold rounded-xl mr-3">Try again</button>
                )}
                <button onClick={() => { setPhase("intro"); setFeedback(null); }} className="px-6 py-3 border-2 border-foreground/20 font-display font-bold rounded-xl">Rehearse again</button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-charcoal text-primary-foreground p-6 md:p-8">
                  <p className="font-body text-xs uppercase tracking-widest text-accent mb-2">Adrian's notes</p>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{feedback.headline}</h2>
                  <p className="font-body text-primary-foreground/80 leading-relaxed">{feedback.summary}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat icon={Clock} label="Full speech at this pace" value={feedback.stats.estimatedFullMinutes ? `${feedback.stats.estimatedFullMinutes} min` : fmt(feedback.stats.speakingSeconds)} sub={`Aim for ${feedback.stats.targetMinutes[0]}–${feedback.stats.targetMinutes[1]} min`} />
                  <Stat icon={Gauge} label="Pace" value={feedback.stats.wordsPerMinute ? `${feedback.stats.wordsPerMinute} wpm` : "–"} sub="Comfortable: 120–150" />
                  <Stat icon={MessageSquareQuote} label="Filler words" value={String(feedback.stats.fillerTotal)} sub={Object.keys(feedback.stats.fillers).slice(0, 2).join(", ") || "none heard"} />
                  <Stat icon={ListChecks} label="Speech covered" value={`${feedback.stats.coverage}%`} sub={feedback.stats.skipped.length ? `${feedback.stats.skipped.length} section(s) skipped` : "nothing skipped"} />
                </div>

                {!!feedback.landed?.length && (
                  <Section icon={CheckCircle2} title="What landed">
                    {feedback.landed.map((l, i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <p className="font-body italic text-foreground">“{l.line}”</p>
                        <p className="font-body text-sm text-muted-foreground mt-1">{l.why}</p>
                      </div>
                    ))}
                  </Section>
                )}

                {!!feedback.fixes?.length && (
                  <Section icon={Wrench} title="Three things to fix">
                    {feedback.fixes.map((f, i) => (
                      <div key={i} className="mb-5 last:mb-0">
                        <p className="font-display font-bold text-foreground">{i + 1}. {f.title}</p>
                        {f.line && <p className="font-body italic text-muted-foreground text-sm mt-1">“{f.line}”</p>}
                        <p className="font-body text-sm text-foreground mt-1">{f.how}</p>
                      </div>
                    ))}
                  </Section>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {feedback.pace && <Section icon={Gauge} title="Pace"><p className="font-body text-sm text-foreground">{feedback.pace}</p></Section>}
                  {feedback.length && <Section icon={Clock} title="Length"><p className="font-body text-sm text-foreground">{feedback.length}</p></Section>}
                </div>

                {!!feedback.stats.skipped.length && (
                  <Section icon={ListChecks} title="Sections you skipped">
                    {feedback.stats.skipped.map((s, i) => <p key={i} className="font-body text-sm text-muted-foreground mb-2">{s}</p>)}
                  </Section>
                )}

                {feedback.nextRun && (
                  <div className="rounded-xl bg-accent/10 border border-accent/20 p-5 font-body text-foreground">
                    <strong>Next time:</strong> {feedback.nextRun}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => { setPhase("intro"); setFeedback(null); }} className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold rounded-xl">
                    <RotateCcw className="w-5 h-5" /> Rehearse again
                  </button>
                  <Link to={backLink} className="flex-1 inline-flex items-center justify-center gap-2 py-4 border-2 border-foreground/20 font-display font-bold rounded-xl text-foreground">
                    Back to my speech
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string; sub: string }) => (
  <div className="bg-background border border-border rounded-xl p-4">
    <Icon className="w-4 h-4 text-accent mb-2" />
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="font-body text-xs text-foreground mt-1">{label}</p>
    <p className="font-body text-xs text-muted-foreground">{sub}</p>
  </div>
);

const Section = ({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) => (
  <div className="bg-background border border-border rounded-2xl p-6">
    <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Icon className="w-5 h-5 text-accent" /> {title}</h3>
    {children}
  </div>
);

export default Rehearse;
