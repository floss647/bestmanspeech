import { motion } from "framer-motion";
import { trackStartSpeech } from "@/lib/gtagEvents";

const CTASection = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-warm relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Speech Is Waiting
          </h2>
          <p className="font-body text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Stop staring at a blank page. In minutes, you'll have a speech 
            that sounds authentically you, crafted by the best in the business.
          </p>
          <a
            href="/write"
            onClick={trackStartSpeech}
            className="inline-flex items-center justify-center px-10 py-4 bg-charcoal hover:bg-charcoal-light text-primary-foreground font-body font-semibold text-base rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-charcoal/20"
          >
            Start Writing Your Speech
          </a>
          <p className="font-body text-muted-foreground text-sm mt-6">
            No account needed · Ready in minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
