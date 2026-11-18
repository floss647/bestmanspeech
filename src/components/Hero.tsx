import { motion } from "framer-motion";
import { trackStartSpeech } from "@/lib/gtagEvents";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import heroImage from "@/assets/hero-wedding.jpg";
import HeroDemoVideo from "@/components/HeroDemoVideo";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 lg:pt-28">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Best man delivering a speech at a wedding"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/60 to-charcoal/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 max-w-7xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-body text-accent tracking-[0.25em] uppercase text-xs md:text-sm mb-6">
            From the creator of All Speeches Great &amp; Small — the world's highest-rated speechwriter
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="font-display text-5xl md:text-6xl xl:text-7xl font-bold text-primary-foreground leading-[1.1] mb-6"
        >
          Speeches That{" "}
          <span className="text-gradient-gold italic">Move</span> People
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="font-body text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto lg:mx-0 mb-4 leading-relaxed"
        >
          Preview your speech free in 5 minutes. Then make it perfect in your own
          speech suite: edit any line and get unlimited new versions.
        </motion.p>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mb-8"
        >
          <span className="inline-flex items-center gap-1.5 font-body text-sm text-primary-foreground/60">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            4.9/5 rated
          </span>
          <span className="inline-flex items-center gap-1.5 font-body text-sm text-primary-foreground/60">
            <Users className="w-3.5 h-3.5 text-accent" />
            Writing speeches since 2012
          </span>
          <span className="inline-flex items-center gap-1.5 font-body text-sm text-primary-foreground/60">
            <Clock className="w-3.5 h-3.5 text-accent" />
            Ready in under 5 mins
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
        >
          <a
            href="/write"
            onClick={trackStartSpeech}
            className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-bold text-lg rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02]"
          >
            Write My Speech
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#reviews"
            className="inline-flex items-center justify-center px-8 py-5 border border-primary-foreground/30 text-primary-foreground font-body font-medium text-base rounded-lg transition-all duration-300 hover:border-accent hover:text-accent"
          >
            Read the Reviews
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="font-body text-sm text-primary-foreground/50 mt-4"
        >
          No sign-up · Preview free · One payment · Money-back guarantee
        </motion.p>
        </div>

        <HeroDemoVideo variant="wedding" />
      </div>

    </section>
  );
};

export default Hero;
