import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Shield, Clock, Users, Award, Lock, RotateCcw, Sparkles, PenLine, RefreshCw, Timer } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { getPricingForCountry } from "@/lib/geolocation";
import ReviewsWidget from "@/components/ReviewsWidget";

interface SpeechPaywallProps {
  speech: string;
  speechId: string;
  accessToken: string;
  speechType: string;
  speechTitle: string;
  answers: Record<string, string>;
  onStartOver: () => void;
}

const SpeechPaywall = ({ speech, speechId, accessToken, speechType, speechTitle, answers, onStartOver }: SpeechPaywallProps) => {
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const { country, currency: currencyCode, symbol, localize, isAmerican } = useGeolocation();
  const navigate = useNavigate();

  const userEmail = answers.email || "";
  const pricing = getPricingForCountry(country);

  const getPersonName = () => {
    const map: Record<string, string[]> = {
      "best-man":        ["groomName"],
      "groom":           ["brideName"],
      "bride":           ["groomName"],
      "father-of-bride": ["daughterName"],
      "mother-of-bride": ["daughterName"],
      "brother-of-bride":["sisterName"],
      "maid-of-honour":  ["brideName"],
      "father-of-groom": ["sonName"],
      "mother-of-groom": ["sonName"],
      "wedding-vows":    ["partnerName"],
      "birthday":        ["birthdayPersonName"],
      "retirement":      ["retireeName"],
      "anniversary":     ["coupleName"],
      "eulogy":          ["deceasedName"],
      "graduation":      ["graduateName"],
      "baby-shower":     ["parentNames"],
      "engagement-party":["coupleNames"],
      "corporate-event": ["companyName"],
      "awards-ceremony": ["awardName", "recipientName"],
      "farewell":        ["leaverName"],
      "golf-club":       ["clubName"],
      "charity-gala":    ["charityName"],
      "keynote":         ["eventName"],
    };
    const fields = map[speechType] || [];
    for (const field of fields) {
      if (answers[field]) return answers[field];
    }
    return answers.personName || answers.firstName || "";
  };
  const primaryName = getPersonName();

  // 24-hour countdown urgency timer
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  useEffect(() => {
    const savedExpiry = sessionStorage.getItem(`speech-expiry-${speechType}`);
    const expiry = savedExpiry ? parseInt(savedExpiry) : Date.now() + 24 * 60 * 60 * 1000;
    if (!savedExpiry) sessionStorage.setItem(`speech-expiry-${speechType}`, expiry.toString());

    const tick = () => {
      const diff = Math.max(0, expiry - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [speechType]);

  const getPersonalisedPreview = () => {
    const words = speech.split(/\s+/);
    const visibleText = words.slice(0, 40).join(" ");
    const blurredText = words.slice(40, 70).join(" ");
    return { visible: visibleText, blurred: blurredText };
  };

  const preview = getPersonalisedPreview();

  const features = [
    { icon: Sparkles, text: localize("Full personalised speech") },
    { icon: PenLine, text: "Dedicated Speech Editing Suite" },
    { icon: RefreshCw, text: "Unlimited edits & rewrites" },
    { icon: Check, text: "Tone & style adjustments" },
    { icon: Check, text: "Professional delivery tips & timing guide" },
    { icon: Check, text: "Priority email support" },
    { icon: Shield, text: "100% money-back guarantee" },
  ];

  const handlePurchase = () => {
    if (!userEmail) {
      toast.error("Email address is missing. Please go back and complete all questions.");
      return;
    }

    navigate("/checkout", {
      state: {
        tier: "basic",
        tierName: "All-Inclusive",
        price: pricing.basic.price,
        speechId,
        accessToken,
        speechType,
        speechTitle,
        answers,
        email: userEmail,
        currency: currencyCode,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Nav */}
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold text-primary-foreground">
            {speechTitle}
          </a>
          <button
            onClick={handlePurchase}
            disabled={loadingPurchase}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-bold text-sm rounded-lg transition-all duration-300"
          >
            <Lock className="w-3.5 h-3.5" />
            Unlock My Speech — {pricing.basic.price}
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Check className="w-4 h-4 text-accent" />
            <span className="font-body text-sm text-accent font-medium">Your speech is ready</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Unlock Your {speechTitle}
          </h1>
          {primaryName && (
            <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
              {localize(`Your expertly crafted speech${primaryName ? ` for ${primaryName}` : ""} is one click away`)}
            </p>
          )}
        </motion.div>

        {/* Urgency countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center gap-2 mb-8 py-3 px-5 rounded-lg bg-destructive/10 border border-destructive/20 mx-auto w-fit"
        >
          <Timer className="w-4 h-4 text-destructive" />
          <span className="font-body text-sm font-medium text-destructive">
            Speech saved for {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </motion.div>

        {/* Blurred speech preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-background border border-border rounded-xl p-6 md:p-8 mb-10 overflow-hidden max-w-3xl mx-auto"
        >
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 pb-3 border-b border-border">
            {speechTitle}{primaryName ? ` for ${primaryName}` : ""}
          </h2>
          <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap mb-2 text-sm md:text-base">
            {preview.visible}
          </div>
          <div className="relative max-h-[80px]">
            <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap blur-[6px] select-none pointer-events-none text-sm md:text-base">
              {preview.blurred}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            <p className="font-body text-sm text-muted-foreground font-medium">
              Unlock your full speech below
            </p>
          </div>
        </motion.div>

        {/* Single Price Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg mx-auto mb-10"
          id="pricing-section"
        >
          <div className="rounded-2xl bg-charcoal text-primary-foreground ring-2 ring-accent shadow-2xl shadow-accent/10 p-8 md:p-10">
            <div className="text-center mb-6">
              <span className="font-body text-xs font-semibold tracking-widest uppercase text-accent mb-3 block">
                All-Inclusive Package
              </span>
              <div className="flex items-center justify-center my-4">
                <span className="font-display text-5xl md:text-6xl font-bold text-accent">
                  {pricing.basic.price}
                </span>
              </div>
              <p className="font-body text-xs text-primary-foreground/60">
                One-time · Instant delivery
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5">
                  <f.icon className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                  <span className="font-body text-sm text-primary-foreground/80">
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={handlePurchase}
              disabled={loadingPurchase}
              className="w-full py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
            >
              Unlock My Speech — {pricing.basic.price}
            </button>

            <p className="font-body text-xs text-primary-foreground/50 text-center mt-3">
              <Shield className="w-3 h-3 inline mr-1" />
              100% Money-Back Guarantee
            </p>
          </div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-12 text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="font-body text-xs">Secure checkout</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />
            ))}
            <span className="font-body text-xs ml-1">4.9/5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="font-body text-xs">10,000+ speeches</span>
          </div>
        </motion.div>

        {/* About the Creator — authority block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background border border-border rounded-2xl p-8 md:p-10 mb-12 max-w-3xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-charcoal flex items-center justify-center shrink-0 overflow-hidden border-2 border-accent/30">
              <span className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">AS</span>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">
                Created by Adrian Simpson
              </h3>
              <p className="font-body text-accent font-semibold text-sm mb-3">
                World's Highest-Rated Speechwriter · Founder of All Speeches Great & Small
              </p>
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
                With over 10,000 speeches written and a 4.9/5 star rating from verified clients, Adrian is the most reviewed and highest-rated professional speechwriter in the world. His proven methodology powers every speech generated on this platform.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span className="font-body text-xs font-semibold text-foreground">10,000+ speeches</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 text-accent fill-accent" />
                  ))}
                  <span className="font-body text-xs font-semibold text-foreground ml-1">4.9/5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="font-body text-xs font-semibold text-foreground">Verified reviews</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verified Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            Verified Reviews from Real Clients
          </h2>
          <p className="font-body text-muted-foreground text-center mb-8">
            Join 10,000+ people who nailed their speech
          </p>
          <ReviewsWidget />
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-12 border-t border-border"
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Ready to deliver the speech of a lifetime?
          </h2>
          <p className="font-body text-muted-foreground mb-6 max-w-lg mx-auto">
            Unlimited edits, a dedicated editing suite, and a 100% money-back guarantee.
          </p>
          <button
            onClick={handlePurchase}
            className="inline-flex items-center gap-2 px-10 py-5 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
          >
            Unlock My Speech — {pricing.basic.price}
          </button>
          <p className="font-body text-xs text-muted-foreground mt-3">
            <Shield className="w-3 h-3 inline mr-1" />
            Secure · Instant delivery · Money back guarantee
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpeechPaywall;
