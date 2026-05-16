/**
 * Organization Options Constants
 * Centralized location for all organization-related form options
 * Country → Timezone and Currency are LINKED for auto-suggestion
 */

// ============================================
// COUNTRY DATA WITH LINKED TIMEZONE & CURRENCY
// ============================================

export interface CountryConfig {
  label: string;
  value: string;
  flag: string;
  timezone: string;
  currency: string;
}

export const COUNTRY_DATA: CountryConfig[] = [
  {
    label: "United States",
    value: "US",
    flag: "🇺🇸",
    timezone: "America/New_York",
    currency: "USD",
  },
  {
    label: "United Kingdom",
    value: "UK",
    flag: "🇬🇧",
    timezone: "Europe/London",
    currency: "GBP",
  },
  {
    label: "Canada",
    value: "CA",
    flag: "🇨🇦",
    timezone: "America/Toronto",
    currency: "CAD",
  },
  {
    label: "Australia",
    value: "AU",
    flag: "🇦🇺",
    timezone: "Australia/Sydney",
    currency: "AUD",
  },
  {
    label: "Germany",
    value: "DE",
    flag: "🇩🇪",
    timezone: "Europe/Berlin",
    currency: "EUR",
  },
  {
    label: "France",
    value: "FR",
    flag: "🇫🇷",
    timezone: "Europe/Paris",
    currency: "EUR",
  },
  {
    label: "India",
    value: "IN",
    flag: "🇮🇳",
    timezone: "Asia/Kolkata",
    currency: "INR",
  },
  {
    label: "Japan",
    value: "JP",
    flag: "🇯🇵",
    timezone: "Asia/Tokyo",
    currency: "JPY",
  },
  {
    label: "Brazil",
    value: "BR",
    flag: "🇧🇷",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
  },
  {
    label: "China",
    value: "CN",
    flag: "🇨🇳",
    timezone: "Asia/Shanghai",
    currency: "CNY",
  },
  {
    label: "Bangladesh",
    value: "BD",
    flag: "🇧🇩",
    timezone: "Asia/Dhaka",
    currency: "BDT",
  },
  {
    label: "UAE",
    value: "AE",
    flag: "🇦🇪",
    timezone: "Asia/Dubai",
    currency: "AED",
  },
  {
    label: "Singapore",
    value: "SG",
    flag: "🇸🇬",
    timezone: "Asia/Singapore",
    currency: "SGD",
  },
  {
    label: "Pakistan",
    value: "PK",
    flag: "🇵🇰",
    timezone: "Asia/Karachi",
    currency: "PKR",
  },
];

// Derived options for dropdowns
export const COUNTRY_OPTIONS = COUNTRY_DATA.map((c) => ({
  label: `${c.flag} ${c.label}`,
  value: c.value,
}));

export const TIMEZONE_OPTIONS = [
  { label: "Eastern Time (US)", value: "America/New_York" },
  { label: "Central Time (US)", value: "America/Chicago" },
  { label: "Mountain Time (US)", value: "America/Denver" },
  { label: "Pacific Time (US)", value: "America/Los_Angeles" },
  { label: "Toronto", value: "America/Toronto" },
  { label: "São Paulo", value: "America/Sao_Paulo" },
  { label: "London", value: "Europe/London" },
  { label: "Berlin", value: "Europe/Berlin" },
  { label: "Paris", value: "Europe/Paris" },
  { label: "Dubai", value: "Asia/Dubai" },
  { label: "Karachi", value: "Asia/Karachi" },
  { label: "Kolkata", value: "Asia/Kolkata" },
  { label: "Dhaka", value: "Asia/Dhaka" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Shanghai", value: "Asia/Shanghai" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "Sydney", value: "Australia/Sydney" },
];

export const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
  { label: "CAD (C$)", value: "CAD" },
  { label: "AUD (A$)", value: "AUD" },
  { label: "INR (₹)", value: "INR" },
  { label: "BDT (৳)", value: "BDT" },
  { label: "PKR (₨)", value: "PKR" },
  { label: "SGD (S$)", value: "SGD" },
  { label: "AED (د.إ)", value: "AED" },
  { label: "JPY (¥)", value: "JPY" },
  { label: "CNY (¥)", value: "CNY" },
  { label: "BRL (R$)", value: "BRL" },
];

export const INDUSTRY_OPTIONS = [
  { label: "Pharmacy", value: "PHARMACY" },
  { label: "Grocery Store", value: "GROCERY_STORE" },
  { label: "Electronics", value: "ELECTRONICS_STORE" },
  { label: "Fashion & Apparel", value: "FASHION_APPAREL" },
  { label: "Hardware Store", value: "HARDWARE_STORE" },
  { label: "Manufacturing", value: "MANUFACTURING_UNIT" },
  { label: "Wholesale", value: "WHOLESALE_DISTRIBUTOR" },
  { label: "Restaurant & F&B", value: "RESTAURANT_FNB" },
  { label: "Service Business", value: "SERVICE_BUSINESS" },
  { label: "Other", value: "OTHER" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get suggested timezone and currency based on selected country
 */
export function getCountryDefaults(
  countryCode: string,
): { timezone: string; currency: string } | null {
  const country = COUNTRY_DATA.find((c) => c.value === countryCode);
  if (!country) return null;
  return { timezone: country.timezone, currency: country.currency };
}

/**
 * Get country config by code
 */
export function getCountryByCode(code: string): CountryConfig | undefined {
  return COUNTRY_DATA.find((c) => c.value === code);
}

// Type exports
export type CountryCode =
  | "US"
  | "UK"
  | "CA"
  | "AU"
  | "DE"
  | "FR"
  | "IN"
  | "JP"
  | "BR"
  | "CN"
  | "BD"
  | "AE"
  | "SG"
  | "PK";
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "INR"
  | "BDT"
  | "PKR"
  | "SGD"
  | "AED"
  | "JPY"
  | "CNY"
  | "BRL";
export type IndustryType =
  | "PHARMACY"
  | "GROCERY_STORE"
  | "ELECTRONICS_STORE"
  | "FASHION_APPAREL"
  | "HARDWARE_STORE"
  | "MANUFACTURING_UNIT"
  | "WHOLESALE_DISTRIBUTOR"
  | "RESTAURANT_FNB"
  | "SERVICE_BUSINESS"
  | "OTHER";
