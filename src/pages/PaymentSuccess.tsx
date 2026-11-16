import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();

  // New flow: PaymentIntent redirect params
  const paymentIntentId = searchParams.get("payment_intent");
  const speechId = searchParams.get("speech_id");
  const accessTokenParam = searchParams.get("access_token");

  // Legacy flow: Checkout Session params
  const sessionId = searchParams.get("session_id");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [speechLink, setSpeechLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if ((paymentIntentId && speechId) || (sessionId && speechId)) {
      verifyPayment();
    } else {
      setError("Missing payment information.");
      setVerifying(false);
    }
  }, [paymentIntentId, sessionId, speechId]);

  const verifyPayment = async () => {
    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-payment", {
        body: {
          ...(paymentIntentId ? { paymentIntentId } : { sessionId }),
          speechId,
        },
      });

      if (verifyError) throw verifyError;

      if (data?.success) {
        setSuccess(true);
        const link = `${window.location.origin}/speech?id=${data.speechId}&token=${data.accessToken}`;
        setSpeechLink(link);

        // Fire Google Ads purchase conversions
        const w = window as any;
        if (typeof w.gtag === "function") {
          const conversionParams = {
            value: data.amount || 29.0,
            currency: data.currency || "GBP",
            transaction_id: data.transactionId || "",
          };
          w.gtag("event", "conversion", {
            send_to: "AW-670106207/iLsTCMOXksABEN-ExL8C",
            ...conversionParams,
          });
          w.gtag("event", "conversion", {
            send_to: "AW-670106207/dJwDCLjzuoUcEN-ExL8C",
            ...conversionParams,
          });
          w.gtag("event", "conversion", {
            send_to: "AW-670106207/HapQCN74jK8aEN-ExL8C",
            ...conversionParams,
          });
        }
      } else {
        setError(data?.error || "Payment verification failed.");
      }
    } catch (e: any) {
      setError(e.message || "Verification failed. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

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
        {verifying ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Verifying payment...</h1>
            <p className="font-body text-muted-foreground">This will only take a moment.</p>
          </motion.div>
        ) : success ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Payment successful!</h1>
            <p className="font-body text-muted-foreground mb-8">
              Your speech is ready. Access it anytime using the link below.
            </p>
            <Link
              to={speechLink.replace(window.location.origin, "")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-gold-dark text-accent-foreground rounded-lg font-body font-semibold text-base transition-all"
            >
              View My Speech <ExternalLink className="w-4 h-4" />
            </Link>
            <p className="font-body text-xs text-muted-foreground mt-4">
              Bookmark the speech page so you can return anytime.
            </p>
          </motion.div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
