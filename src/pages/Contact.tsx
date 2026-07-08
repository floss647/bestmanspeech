import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (form.name.length > 100 || form.email.length > 255 || form.message.length > 2000) {
      toast({ title: "One or more fields exceed the maximum length", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    });
    setLoading(false);

    if (error) {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }

    // Fire Google Ads contact form conversions
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", "conversion", { send_to: "AW-670106207/S3xdCNT0rMABEN-ExL8C" });
      w.gtag("event", "conversion", { send_to: "AW-670106207/70OlCIniya4ZEN-ExL8C" });
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="font-body text-muted-foreground text-lg">
              Have a question or need help with your speech? Drop us a message and we'll get back to you.
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Message Sent!
              </h2>
              <p className="font-body text-muted-foreground">
                Thanks for reaching out. We'll get back to you as soon as possible.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6 bg-card rounded-2xl p-8 shadow-lg border border-border"
            >
              <div>
                <label htmlFor="name" className="block font-body text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-body text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block font-body text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-body text-sm font-semibold px-6 py-3.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
