import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Volume2 } from "lucide-react";
import { videoHandlers } from "@/lib/track";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { demoPoster, demoVideo, type DemoVariant } from "@/components/SpeechSuiteShowcase";

/** The demo video, sized for the top of the page beside the headline.
 *  Browsers only autoplay muted video, so it starts silent and offers a
 *  "Play with sound" button that restarts it from the top with the voiceover. */
const HeroDemoVideo = ({ variant = "wedding" }: { variant?: DemoVariant }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const { isAmerican } = useGeolocation();
  const vt = videoHandlers(`${variant}${isAmerican ? "-us" : ""}`, "hero");

  const playWithSound = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.loop = false;
    setMuted(false);
    v.play().catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className="relative rounded-2xl overflow-hidden border border-primary-foreground/15 shadow-2xl shadow-black/40 bg-charcoal">
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body text-xs md:text-sm font-semibold shadow-lg pointer-events-none">
          <PlayCircle className="w-4 h-4" />
          How it works · 40 sec
        </span>
        {muted && (
          <button
            type="button"
            onClick={playWithSound}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/75 hover:bg-black/90 text-white font-body text-sm md:text-base font-semibold shadow-lg backdrop-blur-sm transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            Play with sound
          </button>
        )}
        <video
          ref={ref}
          className="w-full h-auto block"
          key={isAmerican ? "us" : "uk"}
          src={demoVideo(variant, isAmerican)}
          poster={demoPoster(variant, isAmerican)}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          onVolumeChange={(e) => {
            setMuted(e.currentTarget.muted);
            vt.onVolumeChange(e);
          }}
          onPlay={vt.onPlay}
          onTimeUpdate={vt.onTimeUpdate}
          aria-label="Demo with voiceover by Adrian Simpson: answering the questions, previewing the speech free, then editing it and creating new versions in the speech suite"
        />
      </div>
      <p className="font-body text-base text-primary-foreground/90 mt-3 text-center lg:text-left">
        Adrian walks you through it: questions, free preview, then editing and new versions in your speech suite.
      </p>
    </motion.div>
  );
};

export default HeroDemoVideo;
