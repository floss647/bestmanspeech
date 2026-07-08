import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check, Clock, ArrowLeftRight, Cake, PartyPopper, Briefcase, Flower2 } from "lucide-react";
import { toast } from "sonner";
import SpeechPaywall from "@/components/SpeechPaywall";
import { supabase } from "@/integrations/supabase/client";
import { SPEECH_TYPE_CONFIGS, type Question } from "@/lib/speechQuestions";
import { useGeolocation } from "@/contexts/GeolocationContext";
import {
  Heart, Users, Mic2, Award, Crown, HandHeart, Church,
  GraduationCap, Baby, Trophy, Wine, Star,
} from "lucide-react";

const speechTypeCards = [
  { id: "best-man", icon: Heart, title: "Best Man" },
  { id: "maid-of-honour", icon: Users, title: "Maid of Honour" },
  { id: "father-of-bride", icon: Award, title: "Father of the Bride" },
  { id: "groom", icon: Mic2, title: "Groom's Speech" },
  { id: "mother-of-bride", icon: HandHeart, title: "Mother of the Bride" },
  { id: "bride", icon: Crown, title: "Bride's Speech" },
  { id: "father-of-groom", icon: Church, title: "Father of the Groom" },
  { id: "brother-of-bride", icon: Users, title: "Brother of the Bride" },
  { id: "mother-of-groom", icon: HandHeart, title: "Mother of the Groom" },
  { id: "wedding-vows", icon: Heart, title: "Wedding Vows" },
  { id: "birthday", icon: Cake, title: "Birthday Speech" },
  { id: "anniversary", icon: PartyPopper, title: "Anniversary Speech" },
  { id: "retirement", icon: Briefcase, title: "Retirement Speech" },
  { id: "eulogy", icon: Flower2, title: "Eulogy" },
  { id: "graduation", icon: GraduationCap, title: "Graduation Speech" },
  { id: "baby-shower", icon: Baby, title: "Baby Shower" },
  { id: "engagement-party", icon: Wine, title: "Engagement Party" },
  { id: "corporate-event", icon: Briefcase, title: "Corporate Event" },
  { id: "awards-ceremony", icon: Trophy, title: "Awards Ceremony" },
  { id: "farewell", icon: Users, title: "Farewell Speech" },
  { id: "golf-club", icon: Star, title: "Golf Club / Sports Dinner" },
  { id: "charity-gala", icon: HandHeart, title: "Charity Gala" },
  { id: "keynote", icon: Mic2, title: "Keynote / Conference" },
];

const WriteSpeech = () => {
  const { localize } = useGeolocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const speechType = searchParams.get("type") || "";
  const config = SPEECH_TYPE_CONFIGS[speechType];

  const storageKey = `speech-progress-${speechType}`;

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [speech, setSpeech] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<"questions" | "generating" | "paywall">("questions");
  const [generatingStep, setGeneratingStep] = useState(0);
  const [restored, setRestored] = useState(false);
  const isTransitioning = useRef(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Restore progress from localStorage
  useEffect(() => {
    if (!speechType || restored) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
          setCurrentIndex(parsed.currentIndex ?? 0);
          toast.success("Welcome back! We've saved your answers — pick up where you left off.");
        }
      }
      // Restore lead credentials so progress keeps syncing after a reload.
      const savedLead = localStorage.getItem(leadStorageKey);
      if (savedLead) {
        const { leadId, accessToken } = JSON.parse(savedLead);
        if (leadId && accessToken) {
          leadIdRef.current = leadId;
          leadTokenRef.current = accessToken;
          leadCapturedRef.current = true;
        }
      }
    } catch {}
    setRestored(true);
  }, [speechType, storageKey, restored]);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!speechType || !restored || phase !== "questions") return;
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, currentIndex }));
    } catch {}
  }, [answers, currentIndex, storageKey, speechType, restored, phase]);

  const questions = config?.questions || [];

  const visibleQuestions = questions.filter((q) => {
    if (!q.conditionField) return true;
    return answers[q.conditionField] === q.conditionValue;
  });

  const currentQuestion = currentIndex >= 0 ? visibleQuestions[currentIndex] : null;
  const totalVisible = visibleQuestions.length;
  const isLastQuestion = currentIndex === totalVisible - 1;

  useEffect(() => {
    if (currentQuestion) {
      const timers = [100, 300, 500].map((delay) =>
        setTimeout(() => {
          inputRef.current?.focus();
        }, delay)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [currentIndex, currentQuestion?.id]);

  useEffect(() => {
    if (phase !== "generating") return;
    const steps = [0, 1, 2, 3];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setGeneratingStep(i);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const selectType = (type: string) => {
    setSearchParams({ type });
    setCurrentIndex(-1);
    setAnswers({});
    setSpeech("");
    setPhase("questions");
  };

  const updateAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const canProceed = () => {
    if (currentIndex === -1) return true;
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const val = answers[currentQuestion.id]?.trim();
    if (currentQuestion.type === "email") {
      return !!val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    return !!val;
  };

  const leadCapturedRef = useRef(false);
  const leadIdRef = useRef<string | null>(null);
  const leadTokenRef = useRef<string | null>(null);
  const leadStorageKey = `speech-lead-${speechType}`;

  const captureLeadEmail = useCallback(async (email: string) => {
    if (leadCapturedRef.current || !email || !speechType) return;
    leadCapturedRef.current = true;
    try {
      // Create the lead via an edge function (service role) — the client can no
      // longer write the leads table directly. We keep the returned access token
      // to authorize later progress updates.
      const { data } = await supabase.functions.invoke("create-lead", {
        body: {
          email,
          speechType,
          lastQuestionReached: currentIndex,
          partialAnswers: answers,
        },
      });

      if (data?.leadId && data?.accessToken) {
        leadIdRef.current = data.leadId;
        leadTokenRef.current = data.accessToken;
        try {
          localStorage.setItem(
            leadStorageKey,
            JSON.stringify({ leadId: data.leadId, accessToken: data.accessToken })
          );
        } catch {}
      }

      // Fire Zapier webhook for early lead capture
      supabase.functions.invoke("send-remarketing-webhook", {
        body: {
          email,
          leadId: data?.leadId,
          firstName: "",
          speechType,
          generatedAt: new Date().toISOString(),
          event: "form_started",
        },
      }).catch(() => {}); // fire and forget
    } catch (err) {
      console.error("Lead capture error:", err);
    }
  }, [speechType, currentIndex, answers, leadStorageKey]);

  // Sync partial answers as the user progresses, via the token-authorized
  // edge function.
  useEffect(() => {
    if (!leadIdRef.current || !leadTokenRef.current || !restored || phase !== "questions") return;
    if (Object.keys(answers).length === 0) return;
    const timeout = setTimeout(() => {
      supabase.functions.invoke("update-lead-progress", {
        body: {
          leadId: leadIdRef.current,
          accessToken: leadTokenRef.current,
          partialAnswers: answers,
          lastQuestionReached: currentIndex,
        },
      }).catch(() => {});
    }, 2000); // debounce 2s
    return () => clearTimeout(timeout);
  }, [answers, currentIndex, restored, phase]);

  const goNext = () => {
    if (!canProceed() || isTransitioning.current) return;
    isTransitioning.current = true;
    setTimeout(() => { isTransitioning.current = false; }, 500);
    if (currentIndex === -1) {
      setCurrentIndex(0);
      return;
    }

    // Capture lead when user moves past the email question
    if (currentQuestion?.type === "email" && answers[currentQuestion.id]) {
      captureLeadEmail(answers[currentQuestion.id]);
    }

    if (isLastQuestion) {
      generate();
      return;
    }
    setCurrentIndex((i) => Math.min(i + 1, totalVisible - 1));
  };

  const goBack = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setTimeout(() => { isTransitioning.current = false; }, 500);
    setCurrentIndex((i) => Math.max(i - 1, -1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentQuestion?.type !== "textarea") {
      e.preventDefault();
      goNext();
    }
    if (e.key === "Enter" && currentQuestion?.type === "textarea") {
      if (e.shiftKey) return;
      e.preventDefault();
      goNext();
    }
  };

  const generate = async () => {
    setIsGenerating(true);
    setSpeech("");
    setPhase("generating");
    setGeneratingStep(0);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ speechType, details: answers }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to generate speech");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullSpeech = "";
      let streamDone = false;

      const processBuffer = () => {
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            return;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullSpeech += content;
              setSpeech(fullSpeech);
            }
          } catch {
            // Incomplete JSON — skip this malformed line rather than blocking
            console.warn("Skipped malformed SSE line:", line.slice(0, 80));
          }
        }
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush decoder and process any remaining buffer
          buffer += decoder.decode();
          if (buffer.trim()) {
            buffer += "\n";
            processBuffer();
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }

      setPhase("paywall");
      try { localStorage.removeItem(storageKey); } catch {}

      // Fire remarketing webhook (non-blocking)
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-remarketing-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
      body: JSON.stringify({
            email: answers.email,
            firstName: answers.firstName || "",
            speechType,
            generatedAt: new Date().toISOString(),
            speech: fullSpeech,
            answers,
          }),
        }
      ).catch((err) => console.warn("Remarketing webhook failed:", err));
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
      setPhase("questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const startOver = () => {
    setAnswers({});
    setSpeech("");
    setPhase("questions");
    setCurrentIndex(-1);
    try { localStorage.removeItem(storageKey); } catch {}
  };

  const generatingSteps = [
    { text: localize("Analysing your answers") },
    { text: "Finding the perfect tone and structure" },
    { text: localize("Crafting your personalised speech") },
    { text: "Polishing every line to perfection" },
  ];

  // ─── Type picker (no type selected) ───
  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col">
        <nav className="bg-charcoal">
          <div className="container mx-auto px-6 py-4">
            <a href="/" className="font-display text-xl font-bold text-primary-foreground">
              bestmanspeech.com
            </a>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">
                Powered by Adrian Simpson
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                What type of speech?
              </h1>
              <p className="font-body text-muted-foreground text-lg max-w-lg mx-auto">
                Choose your occasion and we'll guide you through the perfect questions.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {speechTypeCards.map((card, i) => (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => selectType(card.id)}
                  className="group glass-card rounded-xl p-6 text-left hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                    <card.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {localize(card.title)}
                  </h3>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Generating screen ───
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col">
        <nav className="bg-charcoal">
          <div className="container mx-auto px-6 py-4">
            <a href="/" className="font-display text-xl font-bold text-primary-foreground">
              {config.title}
            </a>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8"
            >
              <Sparkles className="w-14 h-14 text-accent mx-auto" />
            </motion.div>

            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Crafting your moment
            </h1>
            <p className="font-body text-muted-foreground text-lg mb-12">
              Great speeches take a little time. Yours is almost ready.
            </p>

            <div className="space-y-5 text-left max-w-sm mx-auto">
              {generatingSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: i <= generatingStep ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                    i < generatingStep ? "bg-accent" : i === generatingStep ? "bg-accent/20 border-2 border-accent" : "bg-muted border border-border"
                  }`}>
                    {i < generatingStep && (
                      <Check className="w-4 h-4 text-accent-foreground" />
                    )}
                    {i === generatingStep && (
                      <motion.div
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-accent"
                      />
                    )}
                  </div>
                  <span
                    className={`font-body text-base ${
                      i <= generatingStep ? "text-foreground font-medium" : "text-muted-foreground/40"
                    }`}
                  >
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Paywall screen ───
  if (phase === "paywall" && speech) {
    return (
      <SpeechPaywall
        speech={speech}
        speechType={speechType}
        speechTitle={config.title}
        answers={answers}
        onStartOver={startOver}
      />
    );
  }

  // ─── Question flow ───
  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col" onKeyDown={handleKeyDown}>
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold text-primary-foreground">
            {localize(config.title)}
          </a>
          {currentIndex >= 0 && (
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-primary-foreground/50">
                {currentIndex + 1} of {totalVisible}
              </span>
              <span className="font-body text-sm text-primary-foreground/50">
                ~{Math.max(1, Math.ceil((totalVisible - currentIndex - 1) * 0.4))} min left
              </span>
            </div>
          )}
        </div>
      </nav>

      {currentIndex >= 0 && (
        <div className="relative">
          <div className="h-1 bg-border">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalVisible) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-center px-4 pt-2 pb-1">
            <span className="text-xs text-muted-foreground/70 flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5 text-accent" /> Progress saved — close anytime
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {currentIndex === -1 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <p className="font-body text-accent tracking-[0.3em] uppercase text-sm mb-4">
                  Powered by Adrian Simpson
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {localize(config.title)}
                </h1>
                <p className="font-body text-muted-foreground text-lg mb-4 max-w-lg mx-auto">
                  Answer a few questions and we'll craft a speech that sounds
                  authentically you.
                </p>
                <p className="font-body text-sm text-muted-foreground/70 mb-8">
                  Ready in under 5 minutes · No commitment
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-body text-sm">Take your time, no rush</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowLeftRight className="w-4 h-4 text-accent" />
                    <span className="font-body text-sm">Go back & edit any answer</span>
                  </div>
                </div>

                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold text-base rounded-lg transition-all duration-300"
                >
                  Start <ArrowRight className="w-4 h-4" />
                </button>

                <p className="font-body text-xs text-muted-foreground/60 mt-4">
                  ✨ Your progress is saved automatically — you can close this tab and come back anytime
                </p>
              </motion.div>
            )}

            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <p className="font-body text-accent text-sm mb-2">{currentIndex + 1} →</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {localize(currentQuestion.label)}
                  {currentQuestion.required && <span className="text-accent">*</span>}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="font-body text-muted-foreground text-sm mb-6">
                    {localize(currentQuestion.subtitle)}
                  </p>
                )}

                <div className="mt-6">
                  {currentQuestion.type === "text" && (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentQuestion.placeholder}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent text-foreground font-body text-lg py-3 outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                  )}

                  {currentQuestion.type === "email" && (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="email"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentQuestion.placeholder}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent text-foreground font-body text-lg py-3 outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                  )}

                  {currentQuestion.type === "date" && (
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="date"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent text-foreground font-body text-lg py-3 outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                  )}

                  {currentQuestion.type === "textarea" && (
                    <textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => updateAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentQuestion.placeholder}
                      rows={4}
                      className="w-full bg-transparent border-b-2 border-border focus:border-accent text-foreground font-body text-lg py-3 outline-none transition-colors placeholder:text-muted-foreground/50 resize-none"
                    />
                  )}

                  {currentQuestion.type === "yesno" && (
                    <div className="flex gap-3 mt-2">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            updateAnswer(opt);
                            setTimeout(() => {
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }));
                              setCurrentIndex((i) => Math.min(i + 1, totalVisible - 1));
                            }, 200);
                          }}
                          className={`px-8 py-3 rounded-lg font-body text-base font-medium border transition-all duration-200 ${
                            answers[currentQuestion.id] === opt
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {currentQuestion.type !== "yesno" && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-body text-xs text-muted-foreground/60">
                      Press <span className="font-medium">Enter ↵</span> to continue
                      {currentQuestion.type === "textarea" && (
                        <>, <span className="font-medium">Shift+Enter</span> for new line</>
                      )}
                    </p>
                    {!currentQuestion.required && (
                      <button
                        onClick={goNext}
                        className="font-body text-xs text-accent hover:text-gold-dark transition-colors font-medium"
                      >
                        Skip this question →
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {currentIndex >= 0 && currentQuestion?.type !== "yesno" && (
        <div className="px-6 py-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 font-body font-semibold text-sm rounded-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLastQuestion
                  ? "bg-accent hover:bg-gold-dark text-accent-foreground"
                  : "bg-charcoal hover:bg-charcoal-light text-primary-foreground"
              }`}
            >
              {isLastQuestion ? (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Speech
                </>
              ) : (
                <>
                  OK <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteSpeech;
