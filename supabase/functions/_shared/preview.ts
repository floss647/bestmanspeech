/** First `n` words of a speech, keeping the original line and paragraph breaks.
 *  Used for the unpaid preview: the paywall shows the opening paragraphs in full
 *  and blurs a short teaser of what follows, so it needs real paragraph breaks. */
export function previewWords(text: string, n: number): string {
  const tokens = (text || "").match(/\S+\s*/g) || [];
  return tokens.slice(0, n).join("").trimEnd();
}

export const PREVIEW_WORDS = 220;
