import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SpeechPaywall from "@/components/SpeechPaywall";
import { SPEECH_TYPE_CONFIGS } from "@/lib/speechQuestions";

const ResumePurchase = () => {
  const [searchParams] = useSearchParams();
  const speechId = searchParams.get("id");
  const accessToken = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [speechData, setSpeechData] = useState<{
    speech: string;
    speechType: string;
    answers: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (!speechId || !accessToken) {
      setError("Invalid link. Please check your email for the correct link.");
      setLoading(false);
      return;
    }
    loadSpeech();
  }, [speechId, accessToken]);

  const loadSpeech = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke("get-speech", {
        body: { speechId, accessToken },
      });

      if (fetchError) {
        setError("Speech not found. It may have expired.");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data.paid) {
        window.location.href = `/speech?id=${speechId}&token=${accessToken}`;
        return;
      }

      setSpeechData({
        speech: data.generated_speech,
        speechType: data.speech_type,
        answers: (data.answers as Record<string, string>) || {},
      });
    } catch (e: any) {
      setError(e.message || "Failed to load speech.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">Loading your speech...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col">
        <nav className="bg-charcoal">
          <div className="container mx-auto px-6 py-4">
            <a href="/" className="font-display text-xl font-bold text-primary-foreground">
              bestmanspeech.com
            </a>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">Something went wrong</h1>
            <p className="font-body text-muted-foreground mb-6">{error}</p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-accent text-accent-foreground rounded-lg font-body font-semibold transition-all hover:bg-gold-dark"
            >
              Go Home
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!speechData) return null;

  const config = SPEECH_TYPE_CONFIGS[speechData.speechType];
  const title = config?.title || "Wedding Speech";

  return (
    <SpeechPaywall
      speech={speechData.speech}
      speechType={speechData.speechType}
      speechTitle={title}
      answers={speechData.answers}
      onStartOver={() => (window.location.href = "/write")}
    />
  );
};

export default ResumePurchase;
