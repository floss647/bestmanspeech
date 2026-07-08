import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ResumeForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const leadId = searchParams.get("id");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leadId || !token) {
      setError("Invalid link. Please check your email for the correct link.");
      setLoading(false);
      return;
    }
    loadLead();
  }, [leadId, token]);

  const loadLead = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke("get-lead", {
        body: { leadId, accessToken: token },
      });

      if (fetchError) {
        setError("Could not load your progress. The link may have expired.");
        return;
      }

      if (data?.error) {
        if (data.converted) {
          setError("Great news — you've already completed this form! Head to your email for your speech link.");
        } else {
          setError(data.error);
        }
        return;
      }

      // Restore answers to localStorage and redirect to /write
      const storageKey = `speech-progress-${data.speech_type}`;
      const partialAnswers = data.partial_answers || {};
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers: partialAnswers,
          currentIndex: data.last_question_reached ?? 0,
        })
      );

      // Navigate to write page with the correct speech type
      navigate(`/write?type=${data.speech_type}`, { replace: true });
    } catch (e: any) {
      setError(e.message || "Failed to load your progress.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-foreground">Restoring your progress...</p>
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
              href="/write"
              className="inline-flex items-center px-6 py-3 bg-accent text-accent-foreground rounded-lg font-body font-semibold transition-all hover:bg-gold-dark"
            >
              Start a New Speech
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default ResumeForm;
