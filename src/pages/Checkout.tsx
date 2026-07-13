import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowLeft, Loader2, Check, Star, PenLine, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Load Stripe lazily. If the key is missing we return null instead of throwing —
// throwing here would run at module load and white-screen the whole app, since
// this page is imported eagerly. A missing key only disables the checkout page.
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface CheckoutState {
  tier: string;
  tierName: string;
  price: string;
  speechId: string;
  accessToken: string;
  speechType: string;
  speechTitle: string;
  answers: Record<string, string>;
  email: string;
  currency: string;
}

const CheckoutForm = ({ speechId, accessToken, price }: {
  speechId: string;
  accessToken: string;
  price: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Validation failed");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?speech_id=${speechId}&access_token=${accessToken}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          business: { name: "bestmanspeech.com" },
        }}
      />

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="font-body text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-accent hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground font-body font-bold text-base rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay {price}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-body text-xs">Secure payment</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          <span className="font-body text-xs">Instant delivery</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          <span className="font-body text-xs">Money back guarantee</span>
        </div>
      </div>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [speechId, setSpeechId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const state = location.state as CheckoutState | null;

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
      return;
    }
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    if (!state) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          tier: state.tier,
          speechId: state.speechId,
          currency: state.currency,
        },
      });

      if (fnError) throw fnError;
      if (!data?.clientSecret) throw new Error("Failed to create payment session");

      setClientSecret(data.clientSecret);
      setSpeechId(state.speechId);
      setAccessToken(state.accessToken);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError("Failed to initialize checkout. Please go back and try again.");
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-screen bg-gradient-warm">
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold text-primary-foreground">
            bestmanspeech.com
          </a>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Order summary */}
          <div className="bg-background border border-border rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Order Summary</h2>
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-sm text-foreground font-medium">
                {state.tierName} Speech Package
              </span>
              <span className="font-display text-lg font-bold text-foreground">{state.price}</span>
            </div>
            <div className="space-y-2 mb-4">
              {state.tier !== "basic" && (
                <div className="flex items-center gap-2">
                  <PenLine className="w-3.5 h-3.5 text-accent" />
                  <span className="font-body text-xs text-muted-foreground">Speech Editing Suite access</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-accent" />
                <span className="font-body text-xs text-muted-foreground">
                  Unlimited edits &amp; rewrites
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span className="font-body text-xs text-muted-foreground">100% money-back guarantee</span>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-semibold text-foreground">Total</span>
                <span className="font-display text-xl font-bold text-accent">{state.price}</span>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="bg-background border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-6">Payment Details</h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
                <p className="font-body text-sm text-muted-foreground">Preparing secure checkout...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="font-body text-sm text-destructive mb-4">{error}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-charcoal text-primary-foreground rounded-lg font-body font-semibold text-sm transition-all hover:bg-charcoal-light"
                >
                  Go Back
                </button>
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#b8860b",
                      colorBackground: "hsl(30, 15%, 97%)",
                      colorText: "hsl(220, 20%, 12%)",
                      colorDanger: "#df1b41",
                      fontFamily: "Inter, system-ui, sans-serif",
                      borderRadius: "8px",
                      spacingUnit: "4px",
                    },
                    rules: {
                      ".Input": {
                        border: "1px solid hsl(30, 15%, 88%)",
                        boxShadow: "none",
                        padding: "12px",
                      },
                      ".Input:focus": {
                        border: "1px solid hsl(38, 65%, 50%)",
                        boxShadow: "0 0 0 1px hsl(38, 65%, 50%)",
                      },
                      ".Label": {
                        fontWeight: "500",
                        marginBottom: "6px",
                      },
                    },
                  },
                }}
              >
                <CheckoutForm
                  speechId={speechId}
                  accessToken={accessToken}
                  price={state.price}
                />
              </Elements>
            ) : null}
          </div>

          <p className="font-body text-xs text-muted-foreground text-center mt-6">
            <Shield className="w-3 h-3 inline mr-1" />
            Your payment is processed securely by Stripe. We never store your card details.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
