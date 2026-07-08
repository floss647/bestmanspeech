import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="py-12 bg-charcoal border-t border-primary-foreground/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-body text-xl font-extrabold tracking-tight text-primary-foreground">
                bestmanspeech<span className="text-gold">.com</span>
              </span>
            </div>
            <p className="font-body text-primary-foreground/50 text-sm mt-1">
              Powered by Adrian Simpson's expertise
            </p>
          </div>
          <div className="flex items-center gap-8">
            <a href="/about" className="font-body text-primary-foreground/50 hover:text-gold text-sm transition-colors">
              About
            </a>
            <a href="/privacy" className="font-body text-primary-foreground/50 hover:text-gold text-sm transition-colors">
              Privacy
            </a>
            <a href="/terms" className="font-body text-primary-foreground/50 hover:text-gold text-sm transition-colors">
              Terms
            </a>
            <a href="/contact" className="font-body text-primary-foreground/50 hover:text-gold text-sm transition-colors">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="font-body text-primary-foreground/30 text-xs">
            © {new Date().getFullYear()} bestmanspeech.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
