import { motion } from "framer-motion";
import { Quote, BookOpen, Mic, Award, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const stats = [
  { value: "10,000+", label: "Speeches Written" },
  { value: "25+", label: "Years Experience" },
  { value: "30+", label: "Countries Served" },
];

const highlights = [
  { icon: Mic, title: "World Class Speechwriter", description: "Adrian has written speeches for weddings, funerals, corporate events, and high profile occasions across the globe." },
  { icon: BookOpen, title: "Published Author", description: "His expertise has been featured in leading publications and he's authored guides on the art of speechwriting." },
  { icon: Award, title: "Proven Methodology", description: "Thousands of speeches later, Adrian's methodology is now embedded into our AI, giving everyone access to elite level craft." },
  { icon: Users, title: "Trusted Worldwide", description: "From London to New York, Sydney to Dubai, Adrian's work has moved audiences on every continent." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-charcoal">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">
              The Expert Behind The AI
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Adrian Simpson
            </h1>
            <p className="font-body text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              One of the world's most sought after speechwriters. Decades of experience distilled into an AI that helps you say what matters most.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-8 md:gap-16 mt-12"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold text-accent">{stat.value}</p>
                <p className="font-body text-primary-foreground/50 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28 bg-gradient-warm">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              The Story
            </h2>
            <div className="space-y-6 font-body text-muted-foreground text-base leading-relaxed">
              <p>
                Adrian Simpson has spent over 25 years helping people find the right words for life's biggest moments. From best man speeches that bring the house down to eulogies that honour a life with dignity and warmth, his work spans the full spectrum of human experience.
              </p>
              <p>
                His career has taken him across the world, crafting speeches for intimate family gatherings and audiences of thousands alike. Along the way, he's developed a methodology that balances structure with authenticity, emotion with humour, and impact with sincerity.
              </p>
              <p>
                Now, that methodology powers our AI speechwriting tool. Every speech generated draws on Adrian's proven frameworks, giving you access to world class expertise without the world class price tag.
              </p>
            </div>
          </motion.div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <div className="bg-charcoal rounded-2xl p-10 relative overflow-hidden">
              <Quote className="w-10 h-10 text-accent/30 mb-5" />
              <blockquote className="font-display text-2xl md:text-3xl text-primary-foreground italic leading-relaxed mb-6">
                "A great speech isn't about big words or clever jokes. It's about making people feel something real."
              </blockquote>
              <p className="font-body text-accent text-sm tracking-wider uppercase">
                Adrian Simpson
              </p>
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 md:py-28 bg-charcoal">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-primary-foreground text-center mb-14"
          >
            Why Adrian's Methodology Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="font-body text-primary-foreground/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gradient-warm">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Experience It?
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8">
              Get a speech crafted with Adrian Simpson's methodology in under 10 minutes.
            </p>
            <a
              href="/#speech-types"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-body font-semibold text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
            >
              Get Started
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
