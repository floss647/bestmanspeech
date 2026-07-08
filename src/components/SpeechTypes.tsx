import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Users, Mic2, GlassWater, PartyPopper, Award,
  Briefcase, Trophy, GraduationCap, Baby, Cake, Star,
  Wine, Church, Crown, HandHeart,
} from "lucide-react";
import { useGeolocation } from "@/contexts/GeolocationContext";

const categories = [
  { id: "all", label: "All Speeches" },
  { id: "wedding", label: "Wedding" },
  { id: "social", label: "Social & Family" },
  { id: "corporate", label: "Corporate & Professional" },
];

const speechTypes = [
  // Wedding
  { id: "best-man", slug: "best-man-speech", icon: Heart, title: "Best Man", description: "Funny, heartfelt, and perfectly pitched. The speech everyone remembers.", category: "wedding" },
  { id: "maid-of-honour", slug: "maid-of-honour-speech", icon: Users, title: "Maid of Honour", description: "Celebrate your best friend with warmth, wit, and genuine emotion.", category: "wedding" },
  { id: "father-of-bride", slug: "father-of-the-bride-speech", icon: Award, title: "Father of the Bride", description: "The perfect balance of pride, humour, and a tear or two.", category: "wedding" },
  { id: "groom", slug: "groom-speech", icon: Mic2, title: "Groom's Speech", description: "Thank everyone who matters and set the tone for the celebration.", category: "wedding" },
  { id: "mother-of-bride", slug: "mother-of-the-bride-speech", icon: HandHeart, title: "Mother of the Bride", description: "A heartfelt tribute filled with love, wisdom, and memories.", category: "wedding" },
  { id: "bride", slug: "bride-speech", icon: Crown, title: "Bride's Speech", description: "Your moment to speak from the heart and surprise the room.", category: "wedding" },
  { id: "father-of-groom", slug: "father-of-the-groom-speech", icon: Church, title: "Father of the Groom", description: "Welcome a new family member with warmth and pride.", category: "wedding" },
  { id: "brother-of-bride", slug: "brother-of-the-bride-speech", icon: Users, title: "Brother of the Bride", description: "Celebrate your sister with warmth, wit, and genuine pride.", category: "wedding" },
  { id: "mother-of-groom", slug: "mother-of-the-groom-speech", icon: HandHeart, title: "Mother of the Groom", description: "A heartfelt tribute to your son and his new chapter.", category: "wedding" },
  { id: "wedding-vows", slug: "wedding-vows", icon: Wine, title: "Wedding Vows", description: "Promise forever with words that are deeply personal and unforgettable.", category: "wedding" },

  // Social & Family
  { id: "birthday", slug: "birthday-speech", icon: Cake, title: "Birthday Speech", description: "Mark a milestone birthday with stories that matter.", category: "social" },
  { id: "retirement", slug: "retirement-speech", icon: Star, title: "Retirement Speech", description: "Celebrate a career and the person behind it.", category: "social" },
  { id: "eulogy", slug: "eulogy-writer", icon: Church, title: "Eulogy", description: "Honour a life with dignity, love, and authenticity.", category: "social" },
  { id: "graduation", slug: "graduation-speech", icon: GraduationCap, title: "Graduation Speech", description: "Inspire the next chapter with wisdom and heart.", category: "social" },
  { id: "baby-shower", slug: "baby-shower-speech", icon: Baby, title: "Baby Shower", description: "Welcome the newest arrival with joy and warmth.", category: "social" },
  { id: "anniversary", slug: "anniversary-speech", icon: Heart, title: "Anniversary Speech", description: "Celebrate years of love with the words they deserve.", category: "social" },
  { id: "engagement-party", slug: "engagement-party-speech", icon: PartyPopper, title: "Engagement Party", description: "Kick off the celebration with the perfect words.", category: "social" },

  // Corporate
  { id: "corporate-event", slug: "corporate-event-speech", icon: Briefcase, title: "Corporate Event", description: "Confident, polished, and audience-appropriate.", category: "corporate" },
  { id: "awards-ceremony", slug: "awards-ceremony-speech", icon: Trophy, title: "Awards Ceremony", description: "Present or accept with charisma and gratitude.", category: "corporate" },
  { id: "farewell", slug: "farewell-speech", icon: Users, title: "Farewell Speech", description: "Say goodbye to a colleague with class and warmth.", category: "corporate" },
  { id: "golf-club", slug: "golf-club-speech", icon: Star, title: "Golf Club / Sports Dinner", description: "Witty after dinner speaking for the clubhouse crowd.", category: "corporate" },
  { id: "charity-gala", slug: "charity-gala-speech", icon: HandHeart, title: "Charity Gala", description: "Inspire generosity with a speech that moves the room.", category: "corporate" },
  { id: "keynote", slug: "keynote-speech", icon: Mic2, title: "Keynote / Conference", description: "Open or close an event with impact and authority.", category: "corporate" },
];

const SpeechTypes = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { localize } = useGeolocation();

  const filtered =
    activeCategory === "all"
      ? speechTypes
      : speechTypes.filter((s) => s.category === activeCategory);

  return (
    <section id="speech-types" className="py-24 md:py-32 bg-gradient-warm">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">
            What's Your Occasion?
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Every Speech, Perfected
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            From weddings to boardrooms, Adrian's methodology makes every word count.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-200 border ${
                activeCategory === cat.id
                  ? "border-gold bg-gold/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-gold/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((speech) => (
              <motion.a
                key={speech.id}
                href={`/${speech.slug}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer glass-card rounded-xl p-7 hover:shadow-xl hover:shadow-gold/5 transition-all duration-500 hover:-translate-y-1 block"
              >
                <div className="w-11 h-11 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors duration-300">
                  <speech.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1.5">
                  {localize(speech.title)}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {localize(speech.description)}
                </p>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default SpeechTypes;
