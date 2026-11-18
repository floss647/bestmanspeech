import { motion } from "framer-motion";
import { Check, PenLine, RefreshCw, Mic, Clock } from "lucide-react";
import { packageSummary } from "@/lib/speechPackage";
import { videoHandlers } from "@/lib/track";
import { useGeolocation } from "@/contexts/GeolocationContext";

/** Each kind of speech has its own demo, with a fitting example speech on screen. */
export type DemoVariant = "wedding" | "eulogy" | "corporate" | "social";
export const demoVideo = (v: DemoVariant, us = false) => `/media/speech-suite-demo-${v}${us ? "-us" : ""}.mp4`;
export const demoPoster = (v: DemoVariant, us = false) => `/media/speech-suite-demo-${v}${us ? "-us" : ""}-poster.jpg`;

const points = [
  {
    icon: PenLine,
    title: "Edit any line yourself",
    text: "Tap Edit, change a word, add a joke, cut a story. Your changes are saved to your suite.",
  },
  {
    icon: RefreshCw,
    title: "Unlimited new versions",
    text: "One tap for funnier, shorter, warmer or a completely fresh take. Included, as many times as you like.",
  },
  {
    icon: Check,
    title: "Every version kept",
    text: "Flick between versions and keep the best bits of each. Nothing is ever lost.",
  },
  {
    icon: Mic,
    title: "Coached to deliver it",
    text: "A section-by-section timing breakdown, delivery tips and a full guide to the big moment.",
  },
];

/** Explains what a buyer gets after paying. The video is left out when it already sits in the page header. */
const SpeechSuiteShowcase = ({ variant = "wedding", showVideo = true }: { variant?: DemoVariant; showVideo?: boolean }) => {
  const { isAmerican } = useGeolocation();
  const vt = videoHandlers(`${variant}${isAmerican ? "-us" : ""}`, "showcase");
  return (
  <section id="speech-suite" className="py-24 md:py-32 bg-background">
    <div className="container mx-auto px-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">What you get</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Your Speech. Your Own Speech Suite.
        </h2>
        <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">{packageSummary}</p>
      </motion.div>

      <div className={showVideo ? "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" : "max-w-5xl mx-auto"}>
        {showVideo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-charcoal"
        >
          <video
            className="w-full h-auto block"
            key={isAmerican ? "us" : "uk"}
            src={demoVideo(variant, isAmerican)}
            poster={demoPoster(variant, isAmerican)}
            controls
            playsInline
            preload="none"
            onPlay={vt.onPlay}
            onVolumeChange={vt.onVolumeChange}
            onTimeUpdate={vt.onTimeUpdate}
            aria-label="Demo: answering the questions, previewing the speech, then editing it and creating new versions in the speech suite"
          />
        </motion.div>
        )}

        <div className={showVideo ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8"}>
          {points.map((p, i) => (
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
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{p.title}</h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{p.text}</p>
              </div>
            </motion.div>
          ))}
          <p className={`font-body text-sm text-muted-foreground flex items-center gap-2 pt-2 ${showVideo ? "" : "md:col-span-2 justify-center"}`}>
            <Clock className="w-4 h-4 text-accent" />
            Preview your speech free before you pay. One payment, no subscription.
          </p>
        </div>
      </div>
    </div>
  </section>
  );
};

export default SpeechSuiteShowcase;
