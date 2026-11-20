import { motion } from "framer-motion";
import { Mic, ArrowDown } from "lucide-react";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { track } from "@/lib/track";

/** Hero call-out for the rehearsal coach: the thing nobody else offers. */
const RehearsalHeroChip = ({ eulogy = false, delay = 0.35 }: { eulogy?: boolean; delay?: number }) => {
  const { localize } = useGeolocation();
  return (
    <motion.a
      href="#rehearsal-coach"
      onClick={() => track("rehearsal_hero_click", {})}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="group inline-flex items-start gap-3 text-left rounded-xl border border-accent/50 bg-accent/10 hover:bg-accent/20 px-4 py-3 mb-7 max-w-xl transition-colors"
    >
      <span className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
        <Mic className="w-4 h-4 text-accent-foreground" />
      </span>
      <span>
        <span className="block font-body text-[11px] uppercase tracking-[0.2em] text-accent font-semibold mb-0.5">
          Rehearsal coach included
        </span>
        <span className="block font-body text-sm md:text-base text-primary-foreground/90 leading-snug">
          {eulogy
            ? localize("Then practise reading it aloud on my autocue, gently marked up with where to pause and breathe.")
            : localize("Then rehearse it on my autocue. I mark up where to pause and when to wait for the laugh, then coach your delivery.")}
          <span className="inline-flex items-center gap-1 ml-1.5 text-accent font-semibold whitespace-nowrap">
            See it <ArrowDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
          </span>
        </span>
      </span>
    </motion.a>
  );
};

export default RehearsalHeroChip;
