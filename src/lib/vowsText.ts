/** Reword shared "speech" copy for the wedding vows page. */
const RULES: [RegExp, string][] = [
  [/\bYour Speech\. Your Own Speech Suite\./g, "Your Vows. Your Own Suite."],
  [/\bthen rehearse it out loud on my autocue and get coached on how you delivered it\b/g, "then practise them out loud on my autocue and get coached on how you said them"],
  [/\bthe speech is yours\b/gi, "your vows are yours"],
  [/\bYour full (personali[sz]ed) speech\b/g, "Your full $1 vows"],
  [/\byour own speech suite\b/gi, "your own suite"],
  [/\bin your speech suite\b/gi, "in your own suite"],
  [/\bSpeech \+ Speech Suite\b/g, "Vows + Your Own Suite"],
  [/\bWrite My Speech\b/g, "Write My Wedding Vows"],
  [/\bYour Speech\. Your Own Speech Suite\./g, "Your Vows. Your Own Suite."],
  [/\bYour speech marked up\b/g, "Your vows marked up"],
  [/\byour speech marked up\b/g, "your vows marked up"],
  [/\bincluded with every speech\b/gi, "included with your vows"],
  [/\bYour speech\b/g, "Your vows"],
  [/\byour speech\b/g, "your vows"],
  [/\bto edit it in\b/g, "to edit them in"],
  [/\brehearse it out loud\b/g, "practise them out loud"],
  [/\bhow you delivered it\b/g, "how you said them"],
];

export const forVows = (text: string) => RULES.reduce((t, [re, to]) => t.replace(re, to), text);
