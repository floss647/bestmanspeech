import { motion } from "framer-motion";
import { useGeolocation } from "@/contexts/GeolocationContext";

const steps = [
  {
    number: "01",
    title: "Tell Us About Your Speech",
    description:
      "Share the occasion, your relationship to the person, and any stories or details you'd like to include.",
  },
  {
    number: "02",
    title: "Adrian's Method Takes Over",
    description:
      "Our AI applies Adrian Simpson's proven speechwriting framework: structure, tone, timing, and emotional beats.",
  },
  {
    number: "03",
    title: "Receive Your Speech",
    description:
      "Get a polished, personalised speech that sounds like you, only better. Refine it until it's perfect.",
  },
];

const HowItWorks = () => {
  const { localize } = useGeolocation();
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-charcoal">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
            The Process
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            How It Works
          </h2>
          <p className="font-body text-primary-foreground/60 text-lg max-w-xl mx-auto">
            Three simple steps to a speech that will have the room in your hands.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="text-center md:text-left"
            >
              <span className="font-display text-6xl font-bold text-gradient-gold block mb-4">
                {step.number}
              </span>
              <h3 className="font-display text-xl font-semibold text-primary-foreground mb-3">
                {step.title}
              </h3>
              <p className="font-body text-primary-foreground/60 text-sm leading-relaxed">
                {localize(step.description)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
