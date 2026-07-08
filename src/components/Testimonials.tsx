import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useGeolocation } from "@/contexts/GeolocationContext";

const testimonials = [
  {
    name: "James W.",
    role: "Best Man, London",
    text: "I was dreading the speech. This tool gave me something I was genuinely proud to deliver. People were crying and laughing. Best compliment of the night: 'Did you hire a writer?'",
    stars: 5,
  },
  {
    name: "Sarah M.",
    role: "Maid of Honour, Edinburgh",
    text: "The AI captured exactly what I wanted to say but couldn't find the words for. My best friend cried the whole way through. Absolutely worth every penny.",
    stars: 5,
  },
  {
    name: "David R.",
    role: "Father of the Bride, Manchester",
    text: "At 62, I've been to a lot of weddings. I can honestly say this was the best father of the bride speech I've ever heard, and it was mine. Thank you, Adrian.",
    stars: 5,
  },
  {
    name: "Tom H.",
    role: "Best Man, Bristol",
    text: "Saved me weeks of stress. The speech was personal, funny, and heartfelt. Got a standing ovation and the groom actually teared up.",
    stars: 5,
  },
  {
    name: "Emily K.",
    role: "Maid of Honour, Sydney",
    text: "I rewrote my speech four times before finding this. Within minutes I had something beautiful that sounded exactly like me. My best friend said it was the highlight of the day.",
    stars: 5,
  },
  {
    name: "Mark L.",
    role: "Best Man, New York",
    text: "I'm not a public speaker at all, but this made me sound like one. Everyone kept asking how I wrote something so good. Worth every cent.",
    stars: 5,
  },
];

const Testimonials = () => {
  const { localize } = useGeolocation();
  return (
    <section className="py-24 md:py-32 bg-charcoal">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
            Real Results
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Standing Ovations
          </h2>
          <p className="font-body text-primary-foreground/60 text-lg max-w-xl mx-auto">
            Don't take our word for it. Here's what our speakers have to say.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-primary-foreground/10 rounded-xl p-8 hover:border-gold/30 transition-colors duration-300"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
                <p className="font-body text-primary-foreground/80 text-sm leading-relaxed mb-6">
                  "{localize(testimonial.text)}"
                </p>
                <div>
                  <p className="font-body font-semibold text-primary-foreground text-sm">
                    {testimonial.name}
                  </p>
                  <p className="font-body text-primary-foreground/50 text-xs">
                    {localize(testimonial.role)}
                  </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
