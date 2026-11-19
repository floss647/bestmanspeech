import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// A short example eulogy for people searching "eulogy examples". Fictional
// names and details. The page's US-English converter turns "Mum" into "Mom".
const OPENING = [
  "Mum would have hated this. Not the flowers. She'd have loved the flowers, and told you which ones were past their best. What she'd have hated is all of us sitting still in one room, because Margaret Ellis never sat still in her life.",
  "She was born in 1942, the youngest of four, and she spent the next eighty-one years making sure nobody around her went without. Without tea, without a lift, without a talking-to when they needed one. If you knocked on her door, the kettle was on before you'd taken your coat off.",
];
const REST = [
  "She worked at the village school for thirty-one years. Half this town learned to read at her table, and I know because they still stop me in the supermarket to tell me. She could spot a child who was struggling from across the playground, and she never once made them feel small.",
  "At home she was just the same. When Dad got ill, she nursed him for six years without a word of complaint, and still found time to beat every one of us at Scrabble on a Sunday. She cheated, by the way. Everyone knew. Nobody ever had the nerve to say so.",
  "What I'll miss most are the ordinary things. The phone ringing at seven on a Sunday morning, as if nobody else in the world was awake. The way she'd say \"Right then\" before every hard thing, and then just get on and do it.",
  "So that's what I'm going to try to do today. Right then, Mum. Thank you for everything. We'll take it from here.",
];

const SampleEulogy = () => {
  const [open, setOpen] = useState(false);
  return (
    <section id="example" className="bg-cream py-16 md:py-20 scroll-mt-24">
      <div className="container mx-auto px-6 max-w-2xl">
        <p className="font-body text-accent tracking-[0.3em] uppercase text-sm text-center mb-3">An example eulogy</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3">For Mum</h2>
        <p className="font-body text-sm text-muted-foreground text-center mb-10">
          Written the way Adrian writes. The names and details are made up.
        </p>
        <div className="font-display text-lg md:text-xl leading-relaxed text-foreground/90 space-y-5">
          {OPENING.map((p) => <p key={p}>{p}</p>)}
          {open && REST.map((p) => <p key={p}>{p}</p>)}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-1.5 font-body font-semibold text-accent hover:text-gold-dark"
          >
            Read the rest <ChevronDown className="w-4 h-4" />
          </button>
        )}
        <div className="mt-10 p-6 rounded-xl bg-background border border-border text-center">
          <p className="font-body text-base text-foreground/80 mb-4">
            Yours will be built from your own memories: the little things as much as the big ones.
          </p>
          <Link
            to="/write?type=eulogy"
            className="inline-flex items-center justify-center px-7 py-3.5 bg-accent hover:bg-gold-dark text-accent-foreground font-body font-semibold rounded-lg"
          >
            Start my eulogy
          </Link>
          <p className="font-body text-sm text-muted-foreground mt-3">Take your time. Your answers are saved as you go.</p>
        </div>
      </div>
    </section>
  );
};

export default SampleEulogy;
