import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/#speech-types", label: "Speech Types" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#pricing", label: "Pricing" },
  ];

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-charcoal/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="font-body text-xl font-extrabold tracking-tight text-primary-foreground">
              bestmanspeech<span className="text-gold">.com</span>
            </span>
          </a>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                {l.label}
              </a>
            ))}
            <a
              href="/#speech-types"
              className="font-body text-sm font-semibold px-5 py-2.5 bg-gold hover:bg-gold-dark text-accent-foreground rounded-lg transition-all duration-300"
            >
              Get Started
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-primary-foreground p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-charcoal/95 backdrop-blur-md border-t border-primary-foreground/10 overflow-hidden"
            >
              <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-body text-base text-primary-foreground/70 hover:text-gold transition-colors py-2"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href="/#speech-types"
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-sm font-semibold px-5 py-3 bg-gold hover:bg-gold-dark text-accent-foreground rounded-lg transition-all duration-300 text-center mt-2"
                >
                  Get Started
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </AnimatePresence>
  );
};

export default Navbar;
