import { Star, Shield, Clock, CheckCircle2, Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { trackStartSpeech } from "@/lib/gtagEvents";
import heroWedding from "@/assets/hero-wedding.jpg";
import heroSocial from "@/assets/hero-social.jpg";
import heroCorporate from "@/assets/hero-corporate.jpg";
import heroEulogy from "@/assets/hero-eulogy.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewsWidget from "@/components/ReviewsWidget";
import Pricing from "@/components/Pricing";
import AsSeenIn from "@/components/AsSeenIn";

const heroImages: Record<string, string> = {
  wedding: heroWedding,
  social: heroSocial,
  corporate: heroCorporate,
  eulogy: heroEulogy,
};

export interface LandingPageData {
  slug: string;
  speechType: string;
  category: "wedding" | "social" | "corporate";
  title: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  heroCtaText: string;
  testimonials: { name: string; role: string; text: string }[];
  faqs: { q: string; a: string }[];
  benefits: string[];
}

const TrustBar = () => (
  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
        ))}
      </div>
      <span className="font-body text-sm text-primary-foreground/70">4.9/5 rating</span>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-accent" />
      <span className="font-body text-sm text-primary-foreground/70">10,000+ speeches delivered</span>
    </div>
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-accent" />
      <span className="font-body text-sm text-primary-foreground/70">Money back guarantee</span>
    </div>
  </div>
);

/** Sticky mobile CTA bar */
const StickyMobileCTA = ({ speechType, ctaText }: { speechType: string; ctaText: string }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 safe-bottom"
        >
          <Link
            to={`/write?type=${speechType}`}
            onClick={trackStartSpeech}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-bold text-sm rounded-lg transition-all duration-300"
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const { localize } = useGeolocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-display text-base font-semibold text-foreground pr-4">{localize(q)}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-body text-muted-foreground text-sm leading-relaxed pb-5">{localize(a)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SpeechLandingPage = ({ data }: { data: LandingPageData }) => {
  const { localize } = useGeolocation();
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Sticky mobile CTA */}
      <StickyMobileCTA speechType={data.speechType} ctaText={localize(data.heroCtaText)} />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImages[data.speechType === "eulogy" ? "eulogy" : data.category] || heroImages.social} alt={data.metaTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/85 via-charcoal/65 to-charcoal/90" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-6"
          >
            Powered by Adrian Simpson's expertise
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.1] mb-6"
          >
            {localize(data.headline)}{" "}
            <span className="text-gradient-gold italic">{localize(data.headlineAccent)}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            {localize(data.subtitle)}
          </motion.p>

          {/* Risk-reversal hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-body text-sm text-primary-foreground/60 mb-6"
          >
            Ready in under 5 minutes · No sign-up required
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-4"
          >
            <Link
              to={`/write?type=${data.speechType}`}
              onClick={trackStartSpeech}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
            >
              <Sparkles className="w-4 h-4" />
              {localize(data.heroCtaText)}
            </Link>
          </motion.div>

          {/* Risk-reversal micro-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-body text-sm text-primary-foreground/50 mb-8"
          >
            No sign-up required · Preview your speech for free
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <TrustBar />
          </motion.div>
        </div>
      </section>

      <AsSeenIn />

      {/* How it works, quick 3 step */}
      <section className="py-20 md:py-28 bg-gradient-warm">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">Simple Process</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Your {data.title} in 3 Steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Answer Questions", desc: "Tell us about the person and your relationship. The more detail, the better the speech." },
              { step: "2", title: "AI Crafts Your Speech", desc: "Our AI uses Adrian Simpson's proven methodology to write a speech that sounds authentically you." },
              { step: "3", title: "Deliver with Confidence", desc: "Get your polished, ready to deliver speech. Edit, rehearse, and own the room." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mx-auto mb-4">
                  <span className="font-display text-lg font-bold text-accent">{item.step}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — moved up, right after How It Works */}
      <Pricing speechType={data.speechType} />

      <ReviewsWidget />

      {/* Benefits */}
      <section className="py-20 md:py-28 bg-charcoal">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">Why Choose Us</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                Not Just Another AI Writer
              </h2>
              <p className="font-body text-primary-foreground/60 leading-relaxed mb-6">
                Every speech is built on the methodology of Adrian Simpson, one of the world's leading speechwriters. This isn't a template. It's a {localize("personalised")} speech that sounds like you wrote it on your best day.
              </p>
              <Link
                to={`/write?type=${data.speechType}`}
                onClick={trackStartSpeech}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold text-sm rounded-lg transition-all duration-300"
              >
                Start Writing <Sparkles className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {data.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="font-body text-primary-foreground/80 text-sm">{localize(benefit)}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guarantee Banner */}
      <section className="py-12 bg-accent/10 border-y border-accent/20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Shield className="w-8 h-8 text-accent" />
            <div className="text-center md:text-left">
              <p className="font-display text-lg font-semibold text-foreground">Money Back Guarantee</p>
              <p className="font-body text-muted-foreground text-sm">Not happy with your speech? We'll work with you to fix it, or give you your money back.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-gradient-warm">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">Real Results</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              What Our Customers Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-7"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed mb-5">"{localize(t.text)}"</p>
                <p className="font-body font-semibold text-foreground text-sm">{t.name}</p>
                <p className="font-body text-muted-foreground/70 text-xs">{localize(t.role)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-charcoal">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="divide-y divide-primary-foreground/10">
            {data.faqs.map((faq, i) => (
              <div key={i} className="border-b border-primary-foreground/10 last:border-b-0">
                <FAQItemDark q={faq.q} a={faq.a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-warm pb-28 md:pb-28">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Write Your {localize(data.title)}?
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8">
              Answer a few questions and get a {localize("personalised")} speech in minutes. No templates. No filler.
            </p>
            <Link
              to={`/write?type=${data.speechType}`}
              onClick={trackStartSpeech}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold text-base rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
            >
              <Sparkles className="w-4 h-4" />
              {localize(data.heroCtaText)}
            </Link>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground">Takes 5 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground">Money back guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/** FAQ for dark backgrounds */
const FAQItemDark = ({ q, a }: { q: string; a: string }) => {
  const { localize } = useGeolocation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-display text-base font-semibold text-primary-foreground pr-4">{localize(q)}</span>
        <ChevronDown className={`w-5 h-5 text-primary-foreground/50 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-body text-primary-foreground/60 text-sm leading-relaxed pb-5">{localize(a)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpeechLandingPage;
