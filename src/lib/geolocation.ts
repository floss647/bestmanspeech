// Tiered pricing by country code
export interface TierPricing {
  price: string;
  priceNum: number;
}

export interface CountryPricing {
  currency: string;
  symbol: string;
  basic: TierPricing;
  deluxe: TierPricing;
  premium: TierPricing;
}

export const currencyPricing: Record<string, CountryPricing> = {
  GB: {
    currency: "GBP", symbol: "£",
    basic:   { price: "£29",   priceNum: 2900 },
    deluxe:  { price: "£39",   priceNum: 3900 },
    premium: { price: "£79",   priceNum: 7900 },
  },
  US: {
    currency: "USD", symbol: "$",
    basic:   { price: "$39",   priceNum: 3900 },
    deluxe:  { price: "$49",   priceNum: 4900 },
    premium: { price: "$99",   priceNum: 9900 },
  },
  AU: {
    currency: "AUD", symbol: "A$",
    basic:   { price: "A$49",  priceNum: 4900 },
    deluxe:  { price: "A$69",  priceNum: 6900 },
    premium: { price: "A$139", priceNum: 13900 },
  },
  CA: {
    currency: "CAD", symbol: "CA$",
    basic:   { price: "CA$39", priceNum: 3900 },
    deluxe:  { price: "CA$59", priceNum: 5900 },
    premium: { price: "CA$109",priceNum: 10900 },
  },
};

const defaultPricing = currencyPricing.GB;

export async function detectUserCurrency(): Promise<{
  country: string;
  currency: string;
  symbol: string;
}> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data.country_code) {
      const countryCode = data.country_code.toUpperCase();
      const pricing = currencyPricing[countryCode];

      if (pricing) {
        return {
          country: countryCode,
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      }
    }

    return {
      country: "GB",
      currency: defaultPricing.currency,
      symbol: defaultPricing.symbol,
    };
  } catch (error) {
    console.warn("Failed to detect user currency, using default:", error);
    return {
      country: "GB",
      currency: defaultPricing.currency,
      symbol: defaultPricing.symbol,
    };
  }
}

export function getPricingForCountry(countryCode: string): CountryPricing {
  const code = countryCode.toUpperCase();
  return currencyPricing[code] || defaultPricing;
}
