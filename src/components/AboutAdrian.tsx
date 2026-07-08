import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const AboutAdrian = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-warm">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
              The Expert Behind The AI
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Adrian Simpson
            </h2>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
              Adrian Simpson is one of the world's most sought after speechwriters. 
              With decades of experience crafting speeches for weddings, corporate events, 
              and high profile occasions, his work has moved audiences from London to New York 
              and everywhere in between.
            </p>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-8">
              His methodology, honed through thousands of speeches, is now embedded 
              into our AI, giving you access to world class speechwriting expertise 
              without the world class price tag.
            </p>
            <div className="flex items-center gap-8">
              <div>
                <p className="font-display text-3xl font-bold text-foreground">10,000+</p>
                <p className="font-body text-muted-foreground text-sm">Speeches Written</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <p className="font-display text-3xl font-bold text-foreground">25+</p>
                <p className="font-body text-muted-foreground text-sm">Years Experience</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-charcoal rounded-2xl p-10 relative overflow-hidden">
              <Quote className="w-12 h-12 text-gold/30 mb-6" />
              <blockquote className="font-display text-2xl md:text-3xl text-primary-foreground italic leading-relaxed mb-8">
                "A great speech isn't about big words or clever jokes. It's about 
                making people feel something real."
              </blockquote>
              <p className="font-body text-gold text-sm tracking-wider uppercase">
                Adrian Simpson
              </p>
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gold/5 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutAdrian;
