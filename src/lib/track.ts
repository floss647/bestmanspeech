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

/** Video events for the demo videos. A view only counts once the sound is on
 *  (the hero video autoplays muted for everyone, which isn't a real watch).
 *  Sends video_start, video_progress (50%) and video_complete, once each per page. */
export function videoHandlers(title: string, placement: string) {
  const base = { video_title: title, video_provider: "self", placement };
  const key = (step: string) => `video-${placement}-${title}-${step}`;
  const listening = (v: HTMLVideoElement) => !v.muted && v.volume > 0;
  return {
    onPlay: (e: { currentTarget: HTMLVideoElement }) => {
      if (listening(e.currentTarget)) track("video_start", base, key("start"));
    },
    onVolumeChange: (e: { currentTarget: HTMLVideoElement }) => {
      const v = e.currentTarget;
      if (listening(v) && !v.paused) track("video_start", base, key("start"));
    },
    onTimeUpdate: (e: { currentTarget: HTMLVideoElement }) => {
      const v = e.currentTarget;
      if (!listening(v) || !v.duration) return;
      const pct = v.currentTime / v.duration;
      if (pct >= 0.5) track("video_progress", { ...base, video_percent: 50 }, key("50"));
      if (pct >= 0.95) track("video_complete", { ...base, video_percent: 100 }, key("100"));
    },
  };
}
