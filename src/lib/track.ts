// Funnel events for Google Analytics 4 (property bestmanspeech.com - GA4).
// Steps: start_questions → share_email → finish_questions → view_preview → begin_checkout → purchase
type Params = Record<string, string | number | boolean | undefined>;

const GA4_ID = "G-MPYF6WKEHS";
const sent = new Set<string>();

/** Send a GA4 event. `onceKey` stops the same step being counted twice in one page session. */
export function track(event: string, params: Params = {}, onceKey?: string) {
  if (typeof window === "undefined") return;
  if (onceKey) {
    if (sent.has(onceKey)) return;
    sent.add(onceKey);
  }
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", event, { ...params, send_to: GA4_ID });
}
