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
import { REHEARSAL_POSTER, REHEARSAL_VIDEO } from "@/components/RehearsalShowcase";
import PayReassurance from "@/components/PayReassurance";
import { forVows } from "@/lib/vowsText";

interface SpeechPaywallProps {
  speech: string;
  speechId: string;
  accessToken: string;
  speechType: string;
  speechTitle: string;
  answers: Record<string, string>;
  onStartOver: () => void;
  /** Set when this person arrived from the limited-time follow-up offer email. */
  offerUntil?: string | null;
}

// Must match supabase/functions/_shared/offer.ts
const OFFER_PRICE: Record<string, { now: string; was: string }> = {
  GBP: { now: "£22", was: "£29" },
  USD: { now: "$29", was: "$39" },
  AUD: { now: "A$39", was: "A$49" },
  CAD: { now: "CA$29", was: "CA$39" },
};

const SpeechPaywall = ({ speech, speechId, accessToken, speechType, speechTitle, answers, onStartOver, offerUntil }: SpeechPaywallProps) => {
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [clip, setClip] = useState<"rehearse" | "suite">("rehearse");
  const { country, currency: currencyCode, symbol, localize, isAmerican } = useGeolocation();
  const navigate = useNavigate();

  const userEmail = answers.email || "";
  const pricing = getPricingForCountry(country);
  const offer = offerUntil && new Date(offerUntil).getTime() > Date.now() ? OFFER_PRICE[pricing.currency] : undefined;
  const price = offer ? offer.now : pricing.basic.price;
  const offerEnds = offerUntil
    ? new Date(offerUntil).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })
    : "";

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
  const vr = videoHandlers("rehearsal-coach", "paywall", { silent: true });

  // Vows customers should never read "speech" or "wait for the laugh".
  const isVows = speechType === "wedding-vows";
  const say = (t: string) => (isVows ? forVows(localize(t)) : localize(t));

  const valueCards = [
    {
      icon: Mic,
      title: isVows ? "Practise them on my autocue" : "Rehearse it with my autocue",
      text: isVows
        ? "Your vows, marked up with where to pause and breathe. Say them out loud and I'll coach your pace, so every promise lands the way you mean it."
        : speechType === "eulogy"
        ? "Read it aloud on an autocue, gently marked up with where to pause and breathe. I'll listen back and help you find your pace."
        : "Your speech, marked up with where to pause and when to wait for the laugh. Say it out loud and I'll coach your timing and delivery.",
    },
    {
      icon: PenLine,
      title: "Make it yours",
      text: isVows
        ? "Your own suite. Change any line, add a memory, rework a promise. It's saved for you."
        : "Your own speech suite. Change any line, add a joke, cut a story. It's saved for you.",
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

  const features = packageFeatures.map((f) => ({ ...f, text: say(f.text) }));

  const scrollToPrices = () => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handlePurchase = (tier: "basic" | "speech" = "basic") => {
    if (!userEmail) {
      toast.error("Email address is missing. Please go back and complete all questions.");
      return;
    }
    track("select_tier", { tier, speech_type: speechType });

    navigate("/checkout", {
      state: {
        tier,
        tierName: say(tier === "speech" ? "Your Speech" : "Speech + Coach"),
        price: tier === "speech" ? pricing.speech.price : price,
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
            onClick={scrollToPrices}
            disabled={loadingPurchase}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-bold text-sm rounded-lg transition-all duration-300"
          >
            <Lock className="w-3.5 h-3.5" />
            Unlock · {price}
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
            <span className="font-body text-sm text-accent font-medium">{isVows ? "Your vows are ready" : "Your speech is ready"}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {isVows ? "Your wedding vows are ready. One step left." : `Your ${speechTitle} is ready. One step left.`}
          </h1>
          {primaryName && (
            <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
              {isVows
                ? `Your vows for ${primaryName} are one click away`
                : localize(`Your expertly crafted speech for ${primaryName} is one click away`)}
            </p>
          )}
        </motion.div>

        {offer ? (
          <div className="max-w-xl mx-auto mb-8 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-center">
            <p className="font-display text-lg font-bold text-foreground">
              Your offer: <span className="line-through text-muted-foreground font-normal mr-1">{offer.was}</span> {offer.now}
            </p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Ends {offerEnds}. Same money-back guarantee.
            </p>
          </div>
        ) : (
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {say("We'll keep your speech for you for 24 hours.")}
          </p>
        )}

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
              {isVows ? "The rest of your vows are ready below" : "The rest of your speech is ready below"}
            </p>
          </div>
        </motion.div>

        {/* One clear next step, straight under the preview */}
        <div className="max-w-md mx-auto mb-12 text-center">
          <p className="font-display text-4xl font-bold text-foreground">{price}</p>
          <p className="font-body text-sm text-muted-foreground mt-1 mb-4">
            {say("Your full speech + my rehearsal coach · One payment · Yours to keep")}
          </p>
          <button
            onClick={() => handlePurchase("basic")}
            disabled={loadingPurchase}
            className="w-full py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
          >
            {isVows ? "Unlock My Vows" : "Unlock My Speech"} — {price}
          </button>
          <p className="inline-flex items-center gap-1.5 mt-3 font-body text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-accent" />
            Love it or your money back
          </p>
          <button
            onClick={() => handlePurchase("speech")}
            disabled={loadingPurchase}
            className="block mx-auto mt-3 font-body text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {say("Or just the speech, without the coach, for ")}{pricing.speech.price}
          </button>

          {/* What it saves you, then the trust signals people look for before paying */}
          <ul className="mt-6 space-y-2.5 text-left">
            {[
              isVows
                ? ["Skip the blank page", "Your vows done tonight, not after weeks of putting it off"]
                : ["Skip the blank page", "Done in minutes, not evenings of staring at a screen"],
              ["Written my way", "The method I use for my bespoke clients, since 2012"],
              ["Unlimited changes", isVows ? "New versions and edits until they sound like you" : "New versions and edits until it sounds like you"],
              ["Love it or your money back", "Email me and I'll refund you in full"],
            ].map(([title, sub]) => (
              <li key={title} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 mt-1 shrink-0 text-accent" />
                <span className="font-body text-sm">
                  <span className="font-semibold text-foreground">{title}</span>
                  <span className="block text-muted-foreground">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-center gap-1.5 font-body text-xs text-muted-foreground">
            <span className="flex text-accent">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </span>
            4.9/5 from 421 verified reviews of my bespoke speechwriting
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 font-body text-[11px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span className="mr-1">Secure checkout by Stripe</span>
            {["Visa", "Mastercard", "Amex"].map((c) => (
              <span key={c} className="px-1.5 py-0.5 rounded border border-border bg-background font-semibold">{c}</span>
            ))}
          </div>
        </div>

        {/* What you get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            {isVows ? `Everything you need to say them well, for ${price}` : localize(`It's more than a speech for ${price}`)}
          </h2>
          <p className="font-body text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            {isVows
              ? "You get your full vows, your own suite to shape them, and my rehearsal coach so you can say them without your voice going."
              : "You get your full speech, your own speech suite to shape it, and my rehearsal coach to get you ready to stand up and give it."}
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex gap-2 mb-3" role="tablist">
                {([
                  ["rehearse", "Watch the rehearsal coach"],
                  ["suite", isVows ? "See your own suite" : "See the speech suite"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={clip === k}
                    onClick={() => setClip(k)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full font-body text-xs font-semibold transition-colors ${clip === k ? "bg-accent text-accent-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl bg-charcoal">
                {clip === "rehearse" ? (
                  <video
                    key="rehearse"
                    className="w-full h-auto block"
                    src={REHEARSAL_VIDEO}
                    poster={REHEARSAL_POSTER}
                    controls
                    playsInline
                    preload="metadata"
                    onPlay={vr.onPlay}
                    onVolumeChange={vr.onVolumeChange}
                    onTimeUpdate={vr.onTimeUpdate}
                  />
                ) : (
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
                )}
              </div>
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
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{say(c.text)}</p>
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
                {isVows ? "Vows + Coach · Most popular" : "Speech + Coach · Most popular"}
              </span>
              <div className="flex items-center justify-center my-4">
                <span className="font-display text-5xl md:text-6xl font-bold text-accent">
                  {price}
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
              onClick={() => handlePurchase("basic")}
              disabled={loadingPurchase}
              className="w-full py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
            >
              {isVows ? "Unlock My Vows" : "Unlock My Speech"} — {price}
            </button>

            <PayReassurance thing={isVows ? "vows" : "speech"} dark className="mt-5" />
          </div>

          {/* The cheaper option, kept small so there's one clear choice */}
          <p className="mt-4 text-center font-body text-sm text-muted-foreground">
            <button
              onClick={() => handlePurchase("speech")}
              disabled={loadingPurchase}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {say("Or just the speech for ")}{pricing.speech.price}
            </button>
            {localize(" (no rehearsal coach; you can add it later for ")}{pricing.upgrade.price}).
          </p>
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
                Former BBC Top Gear & Sky News presenter · Speechwriter since 2012
              </p>
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
                Adrian presented on BBC Top Gear and Sky News before becoming a professional speechwriter in 2012, so he knows what it takes to stand up and deliver. He holds a 4.9/5 rating from 421 verified reviews of his bespoke speechwriting service. His method powers every speech generated on this platform.
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
            {isVows ? "Ready to say the words you mean?" : "Ready to deliver the speech of a lifetime?"}
          </h2>
          <p className="font-body text-muted-foreground mb-6 max-w-lg mx-auto">
            {isVows
              ? "Edit them yourself, get unlimited new versions, and keep them all in your own suite. 100% money-back guarantee."
              : "Edit it yourself, get unlimited new versions, and keep it all in your own speech suite. 100% money-back guarantee."}
          </p>
          <button
            onClick={scrollToPrices}
            className="inline-flex items-center gap-2 px-10 py-5 bg-accent hover:bg-gold-dark text-accent-foreground font-display font-bold text-lg rounded-xl transition-all duration-300"
          >
            {isVows ? "Unlock My Vows" : "Unlock My Speech"} · {price}
          </button>
          <PayReassurance thing={isVows ? "vows" : "speech"} className="mt-6 max-w-md mx-auto text-left" />
        </motion.div>
      </div>
    </div>
  );
};

export default SpeechPaywall;
