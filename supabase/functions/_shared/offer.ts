// Limited-time follow-up offer: $10 off (or the local equivalent) for 48 hours,
// sent only in the third follow-up email. The offer lives on the speech row
// (offer_until), so it is tied to that person's link and expires server-side.
export const OFFER_HOURS = 48;

// Minor units, basic tier only. Full prices: gbp 2900, usd 3900, aud 4900, cad 3900.
export const OFFER_PRICES: Record<string, number> = {
  gbp: 2200,
  usd: 2900,
  aud: 3900,
  cad: 2900,
};

export const offerActive = (until: string | null | undefined, now = Date.now()) =>
  !!until && new Date(until).getTime() > now;
