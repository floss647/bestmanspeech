import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Mic, ScrollText, Ear, Quote, Play } from "lucide-react";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { videoHandlers } from "@/lib/track";

export type RehearsalVariant = "wedding" | "vows" | "social" | "corporate" | "eulogy";

export const REHEARSAL_VIDEO = "/media/rehearsal-coach.mp4";
export const REHEARSAL_POSTER = "/media/rehearsal-coach-poster.jpg";

const COPY: Record<RehearsalVariant, {
  eyebrow: string; title: string; intro: string;
  points: { icon: typeof Mic; title: string; text: string }[];
  quote: string;
}> = {
  wedding: {
    eyebrow: "The bit nobody else helps with",
    title: "Writing it is the easy bit. We'll get you ready to give it.",
    intro: "Every speech comes with my rehearsal coach. It's what I'd do with you if I were in the room: mark up your speech, run it with you on an autocue, and tell you exactly what to fix.",
    points: [
      { icon: ScrollText, title: "Your speech, marked up by me", text: "The words to hit, where to pause, and exactly where to stop and wait for the laugh. Plus a cue for every section: when to slow down, when to look at the couple, when to raise your glass." },
      { icon: Mic, title: "Rehearse it out loud on an autocue", text: "Your speech scrolls at a good pace for a wedding room, slowing for the pauses and laughs. Speed it up, slow it down or pause it any time." },
      { icon: Ear, title: "Coached on how you actually said it", text: "I listen back to your rehearsal: your timing against the target, the sections you rushed, the laughs you talked over, the words you didn't hit, and your ums. Then three things to fix, with exact directions." },
    ],
    quote: "You gave 'wet his pants' half a second and ploughed on. Land it, stop dead, look up at the room and count three. Let them laugh.",
  },
  vows: {
    eyebrow: "The bit nobody else helps with",
    title: "Writing them is one thing. Saying them is another.",
    intro: "Your vows come with my rehearsal coach. Practise saying them out loud until they feel like yours, so on the day you can look at your partner instead of reading from your phone.",
    points: [
      { icon: ScrollText, title: "Your vows, marked up by me", text: "Where to pause, where to breathe, which words matter most, and where to look up at your partner." },
      { icon: Mic, title: "Say them out loud on an autocue", text: "Your vows scroll at a calm, unhurried pace, waiting at the pauses. Slow it down or pause it any time, and practise as often as you like." },
      { icon: Ear, title: "Coached on how you actually said them", text: "Your pace, the lines you rushed, where your voice dropped, and how long they run, so they match your partner's. Then three things to work on before the day." },
    ],
    quote: "You rushed 'I choose you, every day'. That's your promise. Look up, slow right down, and give it a full breath before the next line.",
  },
  social: {
    eyebrow: "The bit nobody else helps with",
    title: "Writing it is the easy bit. We'll get you ready to give it.",
    intro: "Every speech comes with my rehearsal coach: your speech marked up and run on an autocue, then honest coaching on how you delivered it.",
    points: [
      { icon: ScrollText, title: "Your speech, marked up by me", text: "The words to hit, where to pause, where to wait for the laugh, and a cue for every section so you know how each part should sound." },
      { icon: Mic, title: "Rehearse it out loud on an autocue", text: "Your speech scrolls at a comfortable pace, slowing for the pauses. Speed it up, slow it down or pause it any time." },
      { icon: Ear, title: "Coached on how you actually said it", text: "Your timing, your pace, the pauses you held and the ones you rushed, how warm you sounded, and three specific things to fix before the day." },
    ],
    quote: "You rushed the heartfelt part at 190 words a minute. Slow right down, find their eyes, and let the last line sit for two seconds.",
  },
  corporate: {
    eyebrow: "Rehearse like a professional",
    title: "Don't just get the words. Get ready to deliver them.",
    intro: "Every speech comes with my rehearsal coach, the same preparation I used for live television: a marked-up script on an autocue, and coaching on how you actually delivered it.",
    points: [
      { icon: ScrollText, title: "A presenter's script", text: "Key words to land, where to pause for effect, where to let applause or a laugh settle, and a delivery cue for every section." },
      { icon: Mic, title: "Rehearse on an autocue", text: "Your speech scrolls at a measured pace, slowing for the pauses. Adjust the speed or pause it any time, just like a real prompter." },
      { icon: Ear, title: "Coached on your delivery", text: "Timing against your slot, pace section by section, energy, vocal variety, filler words and the lines that didn't land, with exact fixes." },
    ],
    quote: "Your energy dropped in the thank-yous. Lift your head, slow it down, and give each name its own beat.",
  },
  eulogy: {
    eyebrow: "Help with the hardest part",
    title: "So that on the day, the words feel familiar.",
    intro: "Every eulogy comes with my rehearsal coach. Read it aloud as many times as you need, at a gentle pace, and I'll help you find where to breathe and where to slow down.",
    points: [
      { icon: ScrollText, title: "Gently marked up", text: "Where to pause, where to take a breath before a hard line, and which words matter most, so you know how each part should go." },
      { icon: Mic, title: "Read it aloud on an autocue", text: "Your eulogy scrolls slowly, waiting at the pauses. Pause it whenever you need to. Practise until it feels like yours." },
      { icon: Ear, title: "Kind, honest notes", text: "How long it runs, where you rushed, where to slow down and breathe, so that when you stand up you can get through it in your own voice." },
    ],
    quote: "You hurried the line about her garden. It's the heart of it. Take a breath before it, slow down, and let it rest for a moment.",
  },
};

const RehearsalShowcase = ({ variant = "wedding", tone = "light", quote }: { variant?: RehearsalVariant; tone?: "light" | "warm" | "dark"; quote?: string }) => {
  const { localize } = useGeolocation();
  const c = COPY[variant];
  const dark = tone === "dark";
  const vt = videoHandlers(`rehearsal-${variant}`, "rehearsal-showcase", { silent: true });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  return (
    <section id="rehearsal-coach" className={`py-24 md:py-32 ${dark ? "bg-charcoal" : tone === "warm" ? "bg-gradient-warm" : "bg-background"}`}>
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">{c.eyebrow}</p>
          <h2 className={`font-display text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto ${dark ? "text-primary-foreground" : "text-foreground"}`}>{c.title}</h2>
          <p className={`font-body text-lg max-w-2xl mx-auto ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{localize(c.intro)}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`rounded-2xl overflow-hidden shadow-2xl bg-charcoal border ${dark ? "border-accent/30" : "border-border"}`}
          >
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-auto block"
                src={REHEARSAL_VIDEO}
                poster={REHEARSAL_POSTER}
                controls={started}
                playsInline
                muted
                preload="none"
                onPlay={(e) => { setStarted(true); vt.onPlay(e); }}
                onVolumeChange={vt.onVolumeChange}
                onTimeUpdate={vt.onTimeUpdate}
                aria-label="Demo: the marked-up speech scrolling on the autocue, then the coaching notes after a rehearsal"
              />
              {!started && (
                <button
                  type="button"
                  onClick={() => { setStarted(true); videoRef.current?.play().catch(() => {}); }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-charcoal/40 hover:bg-charcoal/30 transition-colors group"
                  aria-label="Play the 30-second rehearsal coach demo"
                >
                  <span className="w-20 h-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                    <Play className="w-9 h-9 ml-1" fill="currentColor" />
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-charcoal/80 text-primary-foreground font-body text-sm font-semibold">
                    Watch the 30-second demo
                  </span>
                </button>
              )}
            </div>
          </motion.div>

          <div className="space-y-6">
            {c.points.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className={`font-display text-lg font-semibold mb-1 ${dark ? "text-primary-foreground" : "text-foreground"}`}>{p.title}</h3>
                  <p className={`font-body text-sm leading-relaxed ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{localize(p.text)}</p>
                </div>
              </motion.div>
            ))}
            <div className={`rounded-xl text-primary-foreground p-5 flex gap-3 ${dark ? "bg-white/5 border border-accent/30" : "bg-charcoal"}`}>
              <Quote className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-sm italic leading-relaxed">{localize(quote ?? c.quote)}</p>
                <p className="font-body text-xs text-accent mt-2">Example coaching note · included with {variant === "vows" ? "your vows" : "every speech"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RehearsalShowcase;
