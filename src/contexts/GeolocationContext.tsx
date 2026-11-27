import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toAmerican, startUsEnglish } from "@/lib/usEnglish";
import { detectUserCurrency, getPricingForCountry, knownCountry, type CountryPricing } from "@/lib/geolocation";

const americanEnglishCountries = new Set(["US", "CA"]);

interface GeolocationState {
  country: string;
  currency: string;
  symbol: string;
  pricing: CountryPricing;
  isAmerican: boolean;
  localize: (text: string) => string;
  loading: boolean;
}

const defaultPricing: CountryPricing = {
  currency: "GBP",
  symbol: "£",
  speech:  { price: "£19", priceNum: 1900 },
  upgrade: { price: "£10", priceNum: 1000 },
  basic:   { price: "£29", priceNum: 2900 },
  deluxe:  { price: "£39", priceNum: 3900 },
  premium: { price: "£79", priceNum: 7900 },
};

const defaultState: GeolocationState = {
  country: "GB",
  currency: "GBP",
  symbol: "£",
  pricing: defaultPricing,
  isAmerican: false,
  localize: (text: string) => text,
  loading: true,
};

const GeolocationContext = createContext<GeolocationState>(defaultState);

function stateFor(country: string, loading: boolean): GeolocationState {
  const prices = getPricingForCountry(country);
  const isAmerican = americanEnglishCountries.has(country);
  return {
    country,
    currency: prices.currency,
    symbol: prices.symbol,
    pricing: prices,
    isAmerican,
    localize: isAmerican ? toAmerican : (text: string) => text,
    loading,
  };
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
  // Start in the right country when it is already known (ad link, Netlify cookie,
  // earlier visit), so US visitors never see the UK version first.
  const [state, setState] = useState<GeolocationState>(() => {
    const known = knownCountry();
    return known ? stateFor(known, false) : defaultState;
  });

  useEffect(() => {
    if (!state.loading) return;
    detectUserCurrency().then((location) => setState(stateFor(location.country, false)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // American visitors get American spelling everywhere on the page, including
  // text from data files and anything that appears later.
  useEffect(() => {
    if (!state.isAmerican) return;
    return startUsEnglish();
  }, [state.isAmerican]);

  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  return useContext(GeolocationContext);
}
