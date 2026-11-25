// Length and voice rules added to every speech prompt (first draft and new
// versions). They override the word counts and spelling in the older prompts.
const AMERICAN = new Set(["US", "CA"]);

export const isAmericanCountry = (country?: string | null) => !!country && AMERICAN.has(country.toUpperCase());

export function lengthRule(speechType: string, country?: string | null): string {
  if (speechType === "wedding-vows") return "250 to 350 words (about 2 minutes spoken). Vows are short: every line should earn its place.";
  if (isAmericanCountry(country)) return "700 to 900 words (about 5 to 6 minutes spoken), the normal length for an American toast or speech.";
  return "";
}

export function voiceGuidance(speechType: string, country?: string | null): string {
  const length = lengthRule(speechType, country);
  const lines = [
    "LENGTH AND VOICE (these rules override any word count, spelling or style instruction above):",
    length && `- Length: ${length}`,
    "- Write the way people actually talk when they speak from the heart: use contractions naturally (I'm, you're, didn't, I'll, we've). Avoid stiff, formal phrasing like \"I did not\" or \"I would not\" unless it is for emphasis.",
    isAmericanCountry(country)
      ? "- The speaker is American and speaking at an American event. Write in natural American English: American spelling (honor, favorite, color), American vocabulary and idioms. Never use British expressions such as \"round the bend\", \"cross\" (meaning annoyed), \"brilliant\", \"cheeky\", \"mate\", \"lovely\", \"fortnight\", \"queue\", \"loo\", \"cheers\" or \"pub\", unless the speaker used them in their answers."
      : "- Write in natural British English with British spelling.",
  ];
  return lines.filter(Boolean).join("\n");
}
