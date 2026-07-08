import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const COOKIE_KEY = "cookie_consent";

// Update Google Consent Mode so analytics/ads storage follows the visitor's
// choice. Gated here rather than firing tags unconditionally on page load.
function updateConsent(granted: boolean) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") {
    const state = granted ? "granted" : "denied";
    w.gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }
}

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    updateConsent(true);
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    updateConsent(false);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-2xl mx-auto bg-charcoal border border-primary-foreground/10 rounded-xl p-5 md:p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-primary-foreground text-sm leading-relaxed mb-1">
                  We use cookies to improve your experience.
                </p>
                <p className="font-body text-primary-foreground/50 text-xs leading-relaxed">
                  Essential cookies keep the site working. Analytics cookies help us improve. See our{" "}
                  <Link to="/privacy" className="text-accent hover:text-gold-light underline transition-colors">
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={accept}
                    className="px-5 py-2 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold text-xs rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={decline}
                    className="px-5 py-2 border border-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground font-body text-xs rounded-lg transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
              <button
                onClick={decline}
                className="text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors shrink-0"
                aria-label="Close cookie banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
