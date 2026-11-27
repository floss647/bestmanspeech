// Tiered pricing by country code
export interface TierPricing {
  price: string;
  priceNum: number;
}

export interface CountryPricing {
  currency: string;
  symbol: string;
  /** "Your speech": full speech + one new version, no coach. */
  speech: TierPricing;
  /** Upgrade from "Your speech" to "Speech + Coach". */
  upgrade: TierPricing;
  /** "Speech + Coach": everything. */
  basic: TierPricing;
  deluxe: TierPricing;
  premium: TierPricing;
}

export const currencyPricing: Record<string, CountryPricing> = {
  GB: {
    currency: "GBP", symbol: "£",
    speech:  { price: "£19",   priceNum: 1900 },
    upgrade: { price: "£10",   priceNum: 1000 },
    basic:   { price: "£29",   priceNum: 2900 },
    deluxe:  { price: "£39",   priceNum: 3900 },
    premium: { price: "£79",   priceNum: 7900 },
  },
  US: {
    currency: "USD", symbol: "$",
    speech:  { price: "$29",   priceNum: 2900 },
    upgrade: { price: "$10",   priceNum: 1000 },
    basic:   { price: "$39",   priceNum: 3900 },
    deluxe:  { price: "$49",   priceNum: 4900 },
    premium: { price: "$99",   priceNum: 9900 },
  },
  AU: {
    currency: "AUD", symbol: "A$",
    speech:  { price: "A$39",  priceNum: 3900 },
    upgrade: { price: "A$10",  priceNum: 1000 },
    basic:   { price: "A$49",  priceNum: 4900 },
    deluxe:  { price: "A$69",  priceNum: 6900 },
    premium: { price: "A$139", priceNum: 13900 },
  },
  CA: {
    currency: "CAD", symbol: "CA$",
    speech:  { price: "CA$29", priceNum: 2900 },
    upgrade: { price: "CA$10", priceNum: 1000 },
    basic:   { price: "CA$39", priceNum: 3900 },
    deluxe:  { price: "CA$59", priceNum: 5900 },
    premium: { price: "CA$109",priceNum: 10900 },
  },
};

const defaultPricing = currencyPricing.GB;

const MARKETS: Record<string, string> = { us: "US", uk: "GB", gb: "GB", au: "AU", ca: "CA" };
const STORE_KEY = "bms_cc";

const store = {
  get(): string | null { try { return localStorage.getItem(STORE_KEY); } catch { return null; } },
  set(v: string) { try { localStorage.setItem(STORE_KEY, v); } catch { /* storage blocked */ } },
};

/** Country from the time zone, used only when every lookup has failed. */
export function countryFromTimeZone(): string {
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { /* ignore */ }
  if (/^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit)/.test(tz)) return "CA";
  if (tz.startsWith("America/") || tz.startsWith("US/") || tz === "Pacific/Honolulu") return "US";
  if (tz.startsWith("Australia/")) return "AU";
  return "GB";
}

/**
 * The visitor's country, known straight away without a network call:
 * 1. ?mkt=us|uk|au|ca on the link (set on ad final URLs), remembered for later pages;
 * 2. the bms_cc cookie set by the Netlify edge function from Netlify's geolocation;
 * 3. the country remembered from an earlier visit.
 * Returns null if none of these is available yet.
 */
export function knownCountry(): string | null {
  // Build-time prerender of the US copy of a page sets this.
  if (typeof window === "undefined") return (globalThis as { __BMS_SSR_CC?: string }).__BMS_SSR_CC ?? null;
  try {
    const mkt = new URLSearchParams(window.location.search).get("mkt")?.toLowerCase();
    if (mkt && MARKETS[mkt]) { store.set(MARKETS[mkt]); return MARKETS[mkt]; }
  } catch { /* ignore */ }
  const m = document.cookie.match(/(?:^|;\s*)bms_cc=([A-Z]{2})/);
  if (m) { store.set(m[1]); return m[1]; }
  const saved = store.get();
  return saved && /^[A-Z]{2}$/.test(saved) ? saved : null;
}

function result(country: string) {
  const pricing = currencyPricing[country] || defaultPricing;
  return { country, currency: pricing.currency, symbol: pricing.symbol };
}

export async function detectUserCurrency(): Promise<{
  country: string;
  currency: string;
  symbol: string;
}> {
  const known = knownCountry();
  if (known) return result(known);
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error(`ipapi ${response.status}`);
    const data = await response.json();
    if (data.country_code) {
      const code = String(data.country_code).toUpperCase();
      store.set(code);
      return result(code);
    }
    throw new Error("no country_code");
  } catch (error) {
    // Never assume UK: fall back to the visitor's time zone.
    console.warn("Country lookup failed, using time zone:", error);
    try {
      const w = window as unknown as { gtag?: (...a: unknown[]) => void };
      w.gtag?.("event", "geo_lookup_failed", { reason: String(error).slice(0, 80) });
    } catch { /* ignore */ }
    return result(countryFromTimeZone());
  }
}

export function getPricingForCountry(countryCode: string): CountryPricing {
  const code = countryCode.toUpperCase();
  return currencyPricing[code] || defaultPricing;
}
