import { Check, Download, PenLine, RefreshCw, Shield, Sparkles, Mic, ScrollText } from "lucide-react";

// One description of what a buyer gets, shared by the homepage, the speech
// landing pages and the checkout so the promise is always worded the same way.
export const packageFeatures = [
  { icon: Sparkles, text: "Your full personalised speech, written from your answers" },
  { icon: PenLine, text: "Your own speech suite: edit any line yourself, saved for you" },
  { icon: RefreshCw, text: "Unlimited new versions: funnier, shorter, warmer and more" },
  { icon: Check, text: "Every version kept, so you never lose a line you liked" },
  { icon: Mic, text: "Adrian's rehearsal coach: your speech marked up on an autocue, then coaching on your timing, pauses and delivery" },
  { icon: ScrollText, text: "Timing breakdown, delivery tips and a delivery guide" },
  { icon: Download, text: "Copy or download your speech any time" },
  { icon: Shield, text: "100% money-back guarantee" },
];

export const packageSummary =
  "Pay once and the speech is yours, in your own speech suite. Edit any line, ask for as many new versions as you like, then rehearse it out loud on my autocue and get coached on how you delivered it.";
