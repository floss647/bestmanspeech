import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, RefreshCw, Clock, Lightbulb, BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSpeechTitle } from "@/lib/speechTitles";

interface SpeechData {
  id: string;
  generated_speech: string;
  tier: string;
  speech_type: string;
  email: string;
  regenerations_used: number;
  max_regenerations: number;
}

const SpeechDashboard = () => {
  const [searchParams] = useSearchParams();
  const speechId = searchParams.get("id");
  const accessToken = searchParams.get("token");

  const [speech, setSpeech] = useState<SpeechData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Extras state
  const [deliveryTips, setDeliveryTips] = useState("");
  const [timingBreakdown, setTimingBreakdown] = useState("");
  const [deliveryGuide, setDeliveryGuide] = useState("");
  const [loadingExtra, setLoadingExtra] = useState<string | null>(null);

  // Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toneAdjustment, setToneAdjustment] = useState("");
  const [speechVersions, setSpeechVersions] = useState<string[]>([]);
  const [activeVersion, setActiveVersion] = useState(0);

  // Accordion state
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (speechId && accessToken) {
      loadSpeech();
    } else {
      setError("Invalid access link. Please check your email for the correct link.");
      setLoading(false);
    }
  }, [speechId, accessToken]);

  const loadSpeech = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke("get-speech", {
        body: { speechId, accessToken },
      });

      if (fetchError || data?.error) {
        setError("Speech not found. This link may have expired or the payment hasn't been completed.");
        return;
      }

      if (!data.paid) {
        setError("This speech hasn't been paid for yet.");
        return;
      }

      setSpeech(data);
      setSpeechVersions([data.generated_speech]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const text = speechVersions[activeVersion];
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Speech copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExtra = async (type: string) => {
    if (openSection === type) {
      setOpenSection(null);
      return;
    }
    setOpenSection(type);

    if (type === "delivery-tips" && deliveryTips) return;
    if (type === "timing-breakdown" && timingBreakdown) return;
    if (type === "delivery-guide" && deliveryGuide) return;

    setLoadingExtra(type);
    try {
      const { data, error } = await supabase.functions.invoke("generate-speech-extras", {
        body: { speechId, accessToken, type },
      });

      if (error) throw error;

      if (type === "delivery-tips") setDeliveryTips(data.content);
      if (type === "timing-breakdown") setTimingBreakdown(data.content);
      if (type === "delivery-guide") setDeliveryGuide(data.content);
    } catch (e: any) {
      toast.error(e.message || "Failed to load. Please try again.");
      setOpenSection(null);
    } finally {
      setLoadingExtra(null);
    }
  };

  const regenerate = async () => {
    if (!speech) return;
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-speech", {
        body: { speechId, accessToken, toneAdjustment: toneAdjustment || undefined },
      });

      if (error) throw error;

      setSpeechVersions((prev) => [...prev, data.speech]);
      setActiveVersion(speechVersions.length);
      setSpeech((prev) => prev ? { ...prev, regenerations_used: data.regenerationsUsed } : prev);
      setToneAdjustment("");
      toast.success("New version generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to regenerate. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const tier = speech?.tier || "deluxe";
  const title = getSpeechTitle(speech?.speech_type || "");
  // Deluxe tier: everything unlocked
  const canRegenerate = (speech?.regenerations_used || 0) < (speech?.max_regenerations || 9999);
  const hasDeliveryTips = true;
  const hasTimingBreakdown = true;
  const hasDeliveryGuide = true;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">Loading your speech...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">Access Error</h1>
          <p className="font-body text-muted-foreground mb-6">{error}</p>
          <a href="/" className="inline-flex items-center px-6 py-3 bg-accent text-accent-foreground rounded-lg font-body font-semibold transition-all hover:bg-gold-dark">
            Go Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold text-primary-foreground">
            {title}
          </a>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30">
            <span className="font-body text-xs font-semibold text-accent uppercase tracking-wide">{tier}</span>
          </span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your {title}
          </h1>
          <p className="font-body text-muted-foreground">
            Crafted with Adrian Simpson's methodology. Copy, practise, and deliver with confidence.
          </p>
        </motion.div>

        {/* Version tabs */}
        {speechVersions.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-4 overflow-x-auto">
            {speechVersions.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveVersion(i)}
                className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all whitespace-nowrap ${
                  activeVersion === i
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {i === 0 ? "Original" : `Version ${i + 1}`}
              </button>
            ))}
          </motion.div>
        )}

        {/* Speech content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background border border-border rounded-xl p-6 md:p-8 mb-6"
        >
          <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">
            {speechVersions[activeVersion]}
          </div>
        </motion.div>

        {/* Action bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3 mb-10"
        >
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-gold-dark text-accent-foreground rounded-lg font-body font-semibold text-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Speech"}
          </button>
        </motion.div>

        {/* Tier-specific features */}
        {(hasDeliveryTips || hasTimingBreakdown || hasDeliveryGuide || canRegenerate) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-10"
          >
            <h2 className="font-display text-xl font-bold text-foreground">
              Your Speech Editing Suite
            </h2>

            {hasDeliveryTips && (
              <ExtraSection
                title="Delivery Tips"
                icon={<Lightbulb className="w-5 h-5" />}
                description="Personalised tips to help you deliver like a pro"
                isOpen={openSection === "delivery-tips"}
                isLoading={loadingExtra === "delivery-tips"}
                content={deliveryTips}
                onToggle={() => loadExtra("delivery-tips")}
              />
            )}

            {hasTimingBreakdown && (
              <ExtraSection
                title="Speech Timing Breakdown"
                icon={<Clock className="w-5 h-5" />}
                description="Section-by-section timing with pacing notes"
                isOpen={openSection === "timing-breakdown"}
                isLoading={loadingExtra === "timing-breakdown"}
                content={timingBreakdown}
                onToggle={() => loadExtra("timing-breakdown")}
              />
            )}

            {hasDeliveryGuide && (
              <ExtraSection
                title="Professional Delivery Guide"
                icon={<BookOpen className="w-5 h-5" />}
                description="Complete guide from pre-speech prep to the final toast"
                isOpen={openSection === "delivery-guide"}
                isLoading={loadingExtra === "delivery-guide"}
                content={deliveryGuide}
                onToggle={() => loadExtra("delivery-guide")}
              />
            )}

            {canRegenerate && (
              <div className="bg-background border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <RefreshCw className="w-5 h-5 text-accent mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-bold text-foreground">Generate New Version</h3>
                    <p className="font-body text-sm text-muted-foreground">
                      Unlimited regenerations — try different tones and styles
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-body text-sm text-muted-foreground block mb-1.5">
                      Tone adjustment (optional)
                    </label>
                    <input
                      type="text"
                      value={toneAdjustment}
                      onChange={(e) => setToneAdjustment(e.target.value)}
                      placeholder="e.g. funnier, more emotional, shorter, more formal..."
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground font-body text-sm outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <button
                    onClick={regenerate}
                    disabled={isRegenerating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal hover:bg-charcoal-light text-primary-foreground rounded-lg font-body font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" /> Generate Alternative
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="text-center py-8 border-t border-border">
          <p className="font-body text-sm text-muted-foreground">
            Bookmark this page to return to your speech anytime.
          </p>
          <p className="font-body text-xs text-muted-foreground/60 mt-1">
            Created with Adrian Simpson's speechwriting methodology
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Collapsible extra section ───

interface ExtraSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  onToggle: () => void;
}

const ExtraSection = ({ title, icon, description, isOpen, isLoading, content, onToggle }: ExtraSectionProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(`${title} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-accent">{icon}</span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
          <p className="font-body text-sm text-muted-foreground">{description}</p>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4">
              {isLoading ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  <span className="font-body text-sm text-muted-foreground">Generating your {title.toLowerCase()}...</span>
                </div>
              ) : (
                <>
                  <div className="font-body text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {content}
                  </div>
                  {content && (
                    <button
                      onClick={handleCopy}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-body font-medium text-sm transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : `Copy ${title}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpeechDashboard;
