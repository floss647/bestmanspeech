import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, RefreshCw, Clock, Lightbulb, BookOpen, ChevronDown, ChevronUp, Loader2,
  PenLine, Save, X, Download, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSpeechTitle } from "@/lib/speechTitles";

interface SpeechVersion {
  text: string;
  label: string;
  created_at: string;
  edited_at: string | null;
}

interface SpeechData {
  id: string;
  generated_speech: string;
  tier: string;
  speech_type: string;
  email: string;
  regenerations_used: number;
  max_regenerations: number;
  versions?: SpeechVersion[];
}

// Must match ALLOWED_TONES in supabase/functions/regenerate-speech.
const TONE_OPTIONS = ["funnier", "more emotional", "shorter", "warmer", "lighter", "more formal"];

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
// Roughly 130 spoken words a minute for a wedding speech.
const minutesToSay = (text: string) => Math.max(1, Math.round(wordCount(text) / 130));

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

  // Versions state
  const [versions, setVersions] = useState<SpeechVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [regeneratingTone, setRegeneratingTone] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Accordion state
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (speechId && accessToken) {
      loadSpeech();
    } else {
      setError("Invalid access link. Please check your email for the correct link.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechId, accessToken]);

  // Grow the editor to fit the speech so it reads like a page, not a small box.
  useEffect(() => {
    const el = editorRef.current;
    if (isEditing && el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, draft]);

  // Warn before leaving with unsaved edits.
  const hasUnsavedChanges = isEditing && draft !== (versions[activeVersion]?.text ?? "");
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

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
      const loaded: SpeechVersion[] =
        Array.isArray(data.versions) && data.versions.length > 0
          ? data.versions
          : [{ text: data.generated_speech, label: "Original", created_at: "", edited_at: null }];
      setVersions(loaded);
      setActiveVersion(loaded.length - 1);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentText = versions[activeVersion]?.text ?? "";

  const confirmDiscard = () =>
    !hasUnsavedChanges || window.confirm("You have unsaved changes. Discard them?");

  const switchVersion = (i: number) => {
    if (i === activeVersion || !confirmDiscard()) return;
    setIsEditing(false);
    setActiveVersion(i);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(isEditing ? draft : currentText);
    setCopied(true);
    toast.success("Speech copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSpeech = () => {
    const text = isEditing ? draft : currentText;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getSpeechTitle(speech?.speech_type || "") || "Speech"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEditing = () => {
    setDraft(currentText);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!confirmDiscard()) return;
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!draft.trim()) {
      toast.error("Your speech can't be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("save-speech-edit", {
        body: { speechId, accessToken, index: activeVersion, text: draft },
      });
      if (error || data?.error) throw new Error(data?.error || "Couldn't save your changes. Please try again.");
      setVersions(data.versions);
      setIsEditing(false);
      toast.success("Changes saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load. Please try again.");
      setOpenSection(null);
    } finally {
      setLoadingExtra(null);
    }
  };

  const regenerate = async (tone: string | null) => {
    if (!speech || regeneratingTone !== null || !confirmDiscard()) return;
    setIsEditing(false);
    setRegeneratingTone(tone ?? "fresh");
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-speech", {
        body: { speechId, accessToken, toneAdjustment: tone || undefined },
      });

      if (error || data?.error) throw new Error(data?.error || "Failed to create a new version. Please try again.");

      const next: SpeechVersion[] = Array.isArray(data.versions)
        ? data.versions
        : [...versions, { text: data.speech, label: `Version ${versions.length + 1}`, created_at: "", edited_at: null }];
      setVersions(next);
      setActiveVersion(next.length - 1);
      setSpeech((prev) => (prev ? { ...prev, regenerations_used: data.regenerationsUsed } : prev));
      toast.success("New version ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create a new version. Please try again.");
    } finally {
      setRegeneratingTone(null);
    }
  };

  const title = getSpeechTitle(speech?.speech_type || "");
  const canRegenerate = (speech?.regenerations_used || 0) < (speech?.max_regenerations || 9999);
  const shownText = isEditing ? draft : currentText;

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
            <span className="font-body text-xs font-semibold text-accent uppercase tracking-wide">Your Speech Suite</span>
          </span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your {title}
          </h1>
          <p className="font-body text-muted-foreground">
            This is your own speech suite. Edit any line, ask for new versions as often as you like,
            and come back any time. Everything is saved.
          </p>
        </motion.div>

        {/* Version tabs */}
        {versions.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">Your versions</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {versions.map((v, i) => (
                <button
                  key={i}
                  onClick={() => switchVersion(i)}
                  className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all whitespace-nowrap ${
                    activeVersion === i
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {v.label || (i === 0 ? "Original" : `Version ${i + 1}`)}
                  {v.edited_at && <span className="ml-1.5 text-xs opacity-75">· edited</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {isEditing ? (
            <>
              <button
                onClick={saveEdits}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-gold-dark text-accent-foreground rounded-lg font-body font-semibold text-sm transition-all disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-body font-medium text-sm transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-gold-dark text-accent-foreground rounded-lg font-body font-semibold text-sm transition-all"
              >
                <PenLine className="w-4 h-4" /> Edit speech
              </button>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-body font-medium text-sm transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadSpeech}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-body font-medium text-sm transition-all"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </>
          )}
          <span className="font-body text-xs text-muted-foreground ml-auto">
            {wordCount(shownText).toLocaleString()} words · about {minutesToSay(shownText)} min to say
          </span>
        </div>

        {/* Speech content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-background border rounded-xl p-6 md:p-8 mb-10 ${isEditing ? "border-accent ring-2 ring-accent/20" : "border-border"}`}
        >
          {isEditing ? (
            <>
              <p className="font-body text-xs text-accent font-semibold uppercase tracking-wide mb-3">
                Editing — change anything you like, then save
              </p>
              <textarea
                ref={editorRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Edit your speech"
                className="w-full min-h-[50vh] resize-none bg-transparent font-body text-foreground leading-relaxed text-[15px] outline-none"
              />
            </>
          ) : (
            <div className="font-body text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">
              {currentText}
            </div>
          )}
        </motion.div>

        {/* New versions */}
        {canRegenerate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-background border border-border rounded-xl p-6 mb-10"
          >
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-foreground">Get a new version</h2>
                <p className="font-body text-sm text-muted-foreground">
                  Unlimited, included in your price. Each one is saved as a new version, so you never lose a line you liked.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => regenerate(null)}
                disabled={regeneratingTone !== null}
                className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-charcoal-light text-primary-foreground rounded-lg font-body font-semibold text-sm transition-all disabled:opacity-60"
              >
                {regeneratingTone === "fresh" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Fresh take
              </button>
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone}
                  onClick={() => regenerate(tone)}
                  disabled={regeneratingTone !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-body font-medium text-sm transition-all disabled:opacity-60 capitalize"
                >
                  {regeneratingTone === tone && <Loader2 className="w-4 h-4 animate-spin" />}
                  {tone}
                </button>
              ))}
            </div>
            {regeneratingTone !== null && (
              <p className="font-body text-xs text-muted-foreground mt-3">Writing your new version. This takes about a minute.</p>
            )}
          </motion.div>
        )}

        {/* Coaching extras */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-10"
        >
          <h2 className="font-display text-xl font-bold text-foreground">Get ready to deliver it</h2>
          <ExtraSection
            title="Delivery Tips"
            icon={<Lightbulb className="w-5 h-5" />}
            description="Personalised tips to help you deliver like a pro"
            isOpen={openSection === "delivery-tips"}
            isLoading={loadingExtra === "delivery-tips"}
            content={deliveryTips}
            onToggle={() => loadExtra("delivery-tips")}
          />
          <ExtraSection
            title="Speech Timing Breakdown"
            icon={<Clock className="w-5 h-5" />}
            description="Section-by-section timing with pacing notes"
            isOpen={openSection === "timing-breakdown"}
            isLoading={loadingExtra === "timing-breakdown"}
            content={timingBreakdown}
            onToggle={() => loadExtra("timing-breakdown")}
          />
          <ExtraSection
            title="Professional Delivery Guide"
            icon={<BookOpen className="w-5 h-5" />}
            description="Complete guide from pre-speech prep to the final toast"
            isOpen={openSection === "delivery-guide"}
            isLoading={loadingExtra === "delivery-guide"}
            content={deliveryGuide}
            onToggle={() => loadExtra("delivery-guide")}
          />
        </motion.div>

        <div className="text-center py-8 border-t border-border">
          <p className="font-body text-sm text-muted-foreground">
            Bookmark this page, or use the link in your email, to come back to your speech suite any time.
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
