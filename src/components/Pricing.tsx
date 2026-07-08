import { motion } from "framer-motion";
import { Check, PenLine, RefreshCw, Sparkles, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { trackStartSpeech } from "@/lib/gtagEvents";

const Pricing = ({ speechType }: { speechType?: string }) => {
  const { localize, pricing } = useGeolocation();
  const navigate = useNavigate();

  const features = [
    { icon: Sparkles, text: localize("Full personalised speech based on your answers") },
    { icon: PenLine, text: "Dedicated Speech Editing Suite" },
    { icon: RefreshCw, text: "Unlimited edits & alternative versions" },
    { icon: Check, text: "Tone & style adjustments" },
    { icon: Check, text: "Professional delivery tips & timing guide" },
    { icon: Check, text: "Priority email support" },
    { icon: Shield, text: "100% money-back guarantee" },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 bg-gradient-warm">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            One Price. Everything Included.
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            {localize("Your personalised speech, a dedicated editing suite, and unlimited rewrites. No upsells.")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <div className="rounded-2xl bg-charcoal text-primary-foreground ring-2 ring-gold shadow-2xl shadow-gold/10 p-8 md:p-10">
            <div className="text-center mb-8">
              <span className="font-body text-xs font-semibold tracking-widest uppercase text-gold mb-3 block">
                All-Inclusive Package
              </span>
              <div className="flex items-center justify-center my-4">
                <span className="font-display text-5xl md:text-6xl font-bold text-accent">
                  {pricing.basic.price}
                </span>
              </div>
              <p className="font-body text-sm text-primary-foreground/60">
                One-time purchase · Instant delivery
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <f.icon className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
                  <span className="font-body text-sm text-primary-foreground/80">
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                trackStartSpeech();
                navigate(speechType ? `/write?type=${speechType}` : "/#speech-types");
              }}
              className="block w-full text-center px-6 py-4 bg-gold hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
            >
              Write My Speech
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
