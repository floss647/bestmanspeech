import { track, videoHandlers } from "@/lib/track";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Shield, Clock, Users, Award, Lock, RotateCcw, PenLine, RefreshCw, Mic, PlayCircle, ScrollText } from "lucide-react";
import { packageFeatures } from "@/lib/speechPackage";
import { toast } from "sonner";
import { useGeolocation } from "@/contexts/GeolocationContext";
import { getPricingForCountry } from "@/lib/geolocation";
import ReviewsWidget from "@/components/ReviewsWidget";
import { demoPoster, demoVideo, type DemoVariant } from "@/components/SpeechSuiteShowcase";

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

  useEffect(() => {
    track("view_preview", { speech_type: speechType, currency: pricing.currency }, `preview-${speechId}`);
  }, [speechId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Show the whole opening, so people see their own story come back to them:
  // whole paragraphs until we have about 120 words (capped near 170, cut at a
  // sentence end), then a short blurred teaser of what follows.
  const getPersonalisedPreview = () => {
    const paras = speech.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const count = (t: string) => t.split(/\s+/).filter(Boolean).length;
    const shown: string[] = [];
    let words = 0;
    let i = 0;
    while (i < paras.length && words < 120) {
      shown.push(paras[i]);
      words += count(paras[i]);
      i++;
    }
    let visible = shown.join("\n\n");
    let rest = paras.slice(i).join("\n\n");
    if (words > 170 || i >= paras.length) {
      // One very long paragraph (or a short speech): cut at the last sentence end before ~150 words.
      const all = speech.trim().split(/\s+/);
      const head = all.slice(0, Math.min(150, Math.floor(all.length * 0.5))).join(" ");
      const cut = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
      const visibleWords = cut > 40 ? head.slice(0, cut + 1) : head;
      visible = visibleWords;
      rest = speech.trim().slice(visibleWords.length).trim();
    }
    const blurred = rest.split(/\s+/).slice(0, 45).join(" ");
    return { visible, blurred };
  };

  const demoVariant: DemoVariant =
    speechType === "eulogy" ? "eulogy"
    : ["corporate-event", "awards-ceremony", "keynote", "charity-gala", "farewell", "retirement", "golf-club"].includes(speechType) ? "corporate"
    : ["birthday", "anniversary", "graduation", "baby-shower"].includes(speechType) ? "social"
    : "wedding";
  const vt = videoHandlers(`${demoVariant}${isAmerican ? "-us" : ""}`, "paywall");

  const valueCards = [
    {
      icon: Mic,
      title: "Rehearse it with my autocue",
      text: speechType === "eulogy"
        ? "Read it aloud on an autocue, gently marked up with where to pause and breathe. I'll listen back and help you find your pace."
        : "Your speech, marked up with where to pause and when to wait for the laugh. Say it out loud and I'll coach your timing and delivery.",
    },
    {
      icon: PenLine,
      title: "Make it yours",
      text: "Your own speech suite. Change any line, add a joke, cut a story. It's saved for you.",
    },
    {
      icon: RefreshCw,
      title: "Try it different ways",
      text: "Unlimited new versions: funnier, shorter, warmer. Every version is kept, so you never lose a line you liked.",
    },
    {
      icon: ScrollText,
      title: "Know exactly how it will go",
      text: "A timing breakdown, delivery tips and a delivery guide, so you stand up knowing exactly how it will go.",
    },
  ];

  const preview = getPersonalisedPreview();

  const features = packageFeatures.map((f) => ({ ...f, text: localize(f.text) }));

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

        <p className="font-body text-sm text-muted-foreground text-center mb-8">
          <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          We'll keep your speech for you for 24 hours.
        </p>

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
          <div className="relative max-h-[80px] overflow-hidden">
            <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap blur-[6px] select-none pointer-events-none text-sm md:text-base">
              {preview.blurred}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            <p className="font-body text-sm text-muted-foreground font-medium">
              The rest of your speech is ready below
            </p>
          </div>
        </motion.div>

        {/* What you get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            {localize(`It's more than a speech for ${pricing.basic.price}`)}
          </h2>
          <p className="font-body text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            You get your full speech, your own speech suite to shape it, and my rehearsal coach to get you ready to stand up and give it.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl bg-charcoal">
              <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body text-xs font-semibold shadow-lg pointer-events-none">
                <PlayCircle className="w-4 h-4" />
                See the speech suite · 40 sec
              </span>
              <video
                key={isAmerican ? "us" : "uk"}
                className="w-full h-auto block"
                src={demoVideo(demoVariant, isAmerican)}
                poster={demoPoster(demoVariant, isAmerican)}
                controls
                playsInline
                preload="metadata"
                onPlay={vt.onPlay}
                onVolumeChange={vt.onVolumeChange}
                onTimeUpdate={vt.onTimeUpdate}
              />
            </div>
            <div className="space-y-5">
              {valueCards.map((c, i) => (
                <div key={c.title} className={`flex gap-4 rounded-xl p-5 ${i === 0 ? "bg-accent/10 border-2 border-accent" : "bg-background border border-border"}`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-accent" : "bg-accent/10"}`}>
                    <c.icon className={`w-5 h-5 ${i === 0 ? "text-accent-foreground" : "text-accent"}`} />
                  </div>
                  <div>
                    {i === 0 && <p className="font-body text-[11px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">Only at bestmanspeech.com</p>}
                    <h3 className="font-display text-lg font-bold text-foreground mb-1">{c.title}</h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{localize(c.text)}</p>
                  </div>
                </div>
              ))}
            </div>
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
                Speech + Speech Suite
              </span>
              <div className="flex items-center justify-center my-4">
                <span className="font-display text-5xl md:text-6xl font-bold text-accent">
                  {pricing.basic.price}
                </span>
              </div>
              <p className="font-body text-xs text-primary-foreground/60">
                One payment · Opens instantly · Yours to keep
              </p>
              <p className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-accent/15 font-body text-xs font-semibold text-accent">
                <Shield className="w-3.5 h-3.5" />
                100% money-back guarantee
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
              Unlock My Speech Suite — {pricing.basic.price}
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
            <span className="font-body text-xs">Since 2012</span>
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
                A professional speechwriter since 2012, Adrian holds a 4.9/5 rating from 421 verified reviews of his bespoke speechwriting service. His method powers every speech generated on this platform.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span className="font-body text-xs font-semibold text-foreground">421 verified reviews</span>
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
            Reviews of Adrian's bespoke speechwriting service
          </p>
          <ReviewsWidget heading={false} />
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
            Edit it yourself, get unlimited new versions, and keep it all in your own speech suite. 100% money-back guarantee.
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
