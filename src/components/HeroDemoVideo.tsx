import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { demoPoster, demoVideo, type DemoVariant } from "@/components/SpeechSuiteShowcase";

/** The demo video, sized for the top of the page beside the headline. */
const HeroDemoVideo = ({ variant = "wedding" }: { variant?: DemoVariant }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
    className="w-full"
  >
    <div className="relative rounded-2xl overflow-hidden border border-primary-foreground/15 shadow-2xl shadow-black/40 bg-charcoal">
      <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body text-xs md:text-sm font-semibold shadow-lg pointer-events-none">
        <PlayCircle className="w-4 h-4" />
        How it works · 52 sec
      </span>
      <video
        className="w-full h-auto block"
        src={demoVideo(variant)}
        poster={demoPoster(variant)}
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label="Demo: answering the questions, previewing the speech free, then editing it and creating new versions in the speech suite"
      />
    </div>
    <p className="font-body text-base text-primary-foreground/90 mt-3 text-center lg:text-left">
      Watch the whole thing: questions, free preview, then editing and new versions in your speech suite.
    </p>
  </motion.div>
);

export default HeroDemoVideo;
