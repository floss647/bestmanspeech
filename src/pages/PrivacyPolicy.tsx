import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <nav className="bg-charcoal">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold text-primary-foreground">
            bestmanspeech.com
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="font-body text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="prose-custom space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              This website is operated by bestmanspeech.com ("we", "us", "our"). We are committed to protecting your personal data and respecting your privacy. This policy explains how we collect, use, and protect your information when you use our speech writing service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-3">We collect the following information when you use our service:</p>
            <ul className="list-disc pl-6 space-y-2 font-body text-muted-foreground">
              <li><strong className="text-foreground">Email address</strong>: provided by you when generating a speech, used to deliver your speech and for communication about your order.</li>
              <li><strong className="text-foreground">Speech questionnaire answers</strong>: the personal details and stories you share to help us generate your speech.</li>
              <li><strong className="text-foreground">Payment information</strong>: processed securely by our payment provider (Stripe). We do not store your card details.</li>
              <li><strong className="text-foreground">Usage data</strong>: anonymised data about how you interact with our website, collected via cookies and analytics tools.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 font-body text-muted-foreground">
              <li>To generate and deliver your personalised speech</li>
              <li>To process your payment</li>
              <li>To send you your completed speech via email</li>
              <li>To improve our service and user experience</li>
              <li>To send you relevant marketing communications (only with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">4. Legal Basis for Processing</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We process your data on the following legal bases: (a) performance of a contract, to deliver the speech you have requested; (b) legitimate interest, to improve our services; (c) consent, for marketing communications and non essential cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share your data with trusted third-party service providers who help us operate our service, including payment processors (Stripe), email delivery services, and hosting providers. All third parties are contractually required to protect your data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We retain your speech data and email address for up to 12 months after your purchase to allow you to access your speech. After this period, your data will be securely deleted unless we are required by law to retain it for longer.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-3">Under data protection law, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 font-body text-muted-foreground">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your experience on our website. Essential cookies are necessary for the site to function. Analytics and marketing cookies are only set with your consent. You can manage your cookie preferences at any time using the cookie banner.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">9. Security</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We take appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. All data is transmitted via encrypted connections (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
            <p className="font-body text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or wish to exercise your rights, please contact us at the email address provided on our website.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link to="/" className="font-body text-accent hover:text-gold-dark text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
