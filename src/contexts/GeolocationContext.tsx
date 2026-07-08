import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectUserCurrency, getPricingForCountry, type CountryPricing } from "@/lib/geolocation";

// British → American spelling map
const britishToAmerican: [RegExp, string][] = [
  [/\bpersonalised\b/gi, "personalized"],
  [/\bPersonalised\b/g, "Personalized"],
  [/\bhonour\b/gi, "honor"],
  [/\bHonour\b/g, "Honor"],
  [/\bfavourite\b/gi, "favorite"],
  [/\bFavourite\b/g, "Favorite"],
  [/\bhumour\b/gi, "humor"],
  [/\bHumour\b/g, "Humor"],
  [/\bcolour\b/gi, "color"],
  [/\bColour\b/g, "Color"],
  [/\borganisation\b/gi, "organization"],
  [/\bOrganisation\b/g, "Organization"],
  [/\borganise\b/gi, "organize"],
  [/\bOrganise\b/g, "Organize"],
  [/\brecognise\b/gi, "recognize"],
  [/\bRecognise\b/g, "Recognize"],
  [/\brealise\b/gi, "realize"],
  [/\bRealise\b/g, "Realize"],
  [/\bspecialise\b/gi, "specialize"],
  [/\bSpecialise\b/g, "Specialize"],
  [/\bapologise\b/gi, "apologize"],
  [/\bApologise\b/g, "Apologize"],
  [/\bbehaviour\b/gi, "behavior"],
  [/\bBehaviour\b/g, "Behavior"],
  [/\bcentre\b/gi, "center"],
  [/\bCentre\b/g, "Center"],
  [/\bdefence\b/gi, "defense"],
  [/\bDefence\b/g, "Defense"],
  [/\btravelling\b/gi, "traveling"],
  [/\bTravelling\b/g, "Traveling"],
  [/\bcancelled\b/gi, "canceled"],
  [/\bCancelled\b/g, "Canceled"],
  [/\blabour\b/gi, "labor"],
  [/\bLabour\b/g, "Labor"],
  [/\bneighbour\b/gi, "neighbor"],
  [/\bNeighbour\b/g, "Neighbor"],
  [/\bsavour\b/gi, "savor"],
  [/\bSavour\b/g, "Savor"],
  [/\bflavour\b/gi, "flavor"],
  [/\bFlavour\b/g, "Flavor"],
  [/\bhonourable\b/gi, "honorable"],
  [/\bHonourable\b/g, "Honorable"],
  [/\bfavourable\b/gi, "favorable"],
  [/\bFavourable\b/g, "Favorable"],
  [/\bmarvellous\b/gi, "marvelous"],
  [/\bMarvellous\b/g, "Marvelous"],
  [/\bfavourites\b/gi, "favorites"],
  [/\bFavourites\b/g, "Favorites"],
  [/\bhonours\b/gi, "honors"],
  [/\bHonours\b/g, "Honors"],
  [/\bcolours\b/gi, "colors"],
  [/\bColours\b/g, "Colors"],
  [/\bneighbours\b/gi, "neighbors"],
  [/\bNeighbours\b/g, "Neighbors"],
  [/\bhumourous\b/gi, "humorous"],
  [/\bHumourous\b/g, "Humorous"],
  [/\benthralments\b/gi, "enthrallments"],
  [/\bprogramme\b/gi, "program"],
  [/\bProgramme\b/g, "Program"],
  [/\bcatalogue\b/gi, "catalog"],
  [/\bCatalogue\b/g, "Catalog"],
  [/\bdialogue\b/gi, "dialog"],
  [/\bDialogue\b/g, "Dialog"],
  [/\banalyse\b/gi, "analyze"],
  [/\bAnalyse\b/g, "Analyze"],
];

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

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeolocationState>(defaultState);

  useEffect(() => {
    detectUserCurrency().then((location) => {
      const prices = getPricingForCountry(location.country);
      const isAmerican = americanEnglishCountries.has(location.country);

      setState({
        country: location.country,
        currency: location.currency,
        symbol: location.symbol,
        pricing: prices,
        isAmerican,
        localize: isAmerican
          ? (text: string) => {
              let result = text;
              for (const [pattern, replacement] of britishToAmerican) {
                result = result.replace(pattern, replacement);
              }
              return result;
            }
          : (text: string) => text,
        loading: false,
      });
    });
  }, []);

  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  return useContext(GeolocationContext);
}
