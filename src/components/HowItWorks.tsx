import { motion } from "framer-motion";
import { useGeolocation } from "@/contexts/GeolocationContext";

const steps = [
  {
    number: "01",
    title: "Answer a Few Questions",
    description:
      "Tell us about the person, your relationship and your stories. It takes about five minutes, with no sign-up.",
  },
  {
    number: "02",
    title: "Preview It Free",
    description:
      "Adrian Simpson's method turns your answers into a speech with real structure, laughs and heart. Read the start before you pay.",
  },
  {
    number: "03",
    title: "Unlock Your Speech Suite",
    description:
      "Pay once. Your full speech opens in your own speech suite, saved for you to come back to any time.",
  },
  {
    number: "04",
    title: "Make It Perfect, Then Rehearse It",
    description:
      "Edit any line, ask for unlimited new versions, then rehearse it out loud on Adrian's autocue and get coached on your timing and delivery.",
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
            Four simple steps to a speech that will have the room in your hands.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
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
