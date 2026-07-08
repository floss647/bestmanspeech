import { motion } from "framer-motion";
import { trackStartSpeech } from "@/lib/gtagEvents";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import heroImage from "@/assets/hero-wedding.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-6">
            From the creator of All Speeches Great &amp; Small — the world's highest-rated speechwriter
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-[1.1] mb-6"
        >
          Speeches That{" "}
          <span className="text-gradient-gold italic">Move</span> People
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="font-body text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          Answer a few simple questions about your relationship — and get a
          heartfelt, personalised speech in under 5 minutes.
        </motion.p>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8"
        >
          <span className="inline-flex items-center gap-1.5 font-body text-sm text-primary-foreground/60">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            4.9/5 rated
          </span>
          <span className="inline-flex items-center gap-1.5 font-body text-sm text-primary-foreground/60">
            <Users className="w-3.5 h-3.5 text-accent" />
            10,000+ speeches delivered
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
          className="flex flex-col sm:flex-row gap-4 justify-center"
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
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-5 border border-primary-foreground/30 text-primary-foreground font-body font-medium text-base rounded-lg transition-all duration-300 hover:border-accent hover:text-accent"
          >
            See How It Works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="font-body text-sm text-primary-foreground/50 mt-4"
        >
          No sign-up required · Preview your speech for free
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-1.5"
        >
          <div className="w-1.5 h-3 bg-accent rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
