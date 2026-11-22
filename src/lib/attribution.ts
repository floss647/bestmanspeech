// Remembers how a visitor arrived (Google/Meta click ids, UTM tags) and their
// GA4 client id, so a purchase can be credited server-side even when the
// browser blocks Google's scripts on the success page.
const KEY = "bms_attr";
const CLICK_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_term"] as const;
const GA4_ID = "G-MPYF6WKEHS";

export type Attribution = Partial<Record<(typeof CLICK_KEYS)[number] | "landing" | "ts" | "ga_client_id", string>>;

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    const found: Attribution = {};
    for (const k of CLICK_KEYS) {
      const v = q.get(k);
      if (v) found[k] = v.slice(0, 300);
    }
    if (!Object.keys(found).length) return;
    // A new ad click replaces the previous one (last click wins).
    found.landing = window.location.pathname.slice(0, 200);
    found.ts = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    /* storage blocked: nothing to remember */
  }
}

function gaCookieId(): string | undefined {
  const m = document.cookie.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/);
  return m?.[1];
}

/** Attribution plus the GA4 client id (waits at most 800 ms for gtag). */
export async function getAttribution(): Promise<Attribution> {
  let stored: Attribution = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    /* ignore */
  }
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  const fromGtag = await new Promise<string | undefined>((resolve) => {
    if (typeof w.gtag !== "function") return resolve(undefined);
    const t = setTimeout(() => resolve(undefined), 800);
    try {
      w.gtag("get", GA4_ID, "client_id", (id: string) => {
        clearTimeout(t);
        resolve(id || undefined);
      });
    } catch {
      clearTimeout(t);
      resolve(undefined);
    }
  });
  const id = fromGtag || gaCookieId();
  return id ? { ...stored, ga_client_id: id } : stored;
}
