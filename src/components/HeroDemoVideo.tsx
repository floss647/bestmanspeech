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
    <div className="rounded-2xl overflow-hidden border border-primary-foreground/15 shadow-2xl shadow-black/40 bg-charcoal">
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
    <p className="font-body text-sm text-primary-foreground/60 mt-3 flex items-center justify-center lg:justify-start gap-2">
      <PlayCircle className="w-4 h-4 text-accent" />
      See how it works in under a minute
    </p>
  </motion.div>
);

export default HeroDemoVideo;
