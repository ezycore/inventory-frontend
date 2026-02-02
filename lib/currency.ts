/**
 * Currency utility for dynamic currency formatting
 * Uses currency from auth store user's organization
 */

import { useAuthStore } from "@/services/stores/use-auth-store";

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  BDT: "৳",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  SEK: "kr",
  NZD: "NZ$",
  MXN: "MX$",
  SGD: "S$",
  HKD: "HK$",
  NOK: "kr",
  KRW: "₩",
  TRY: "₺",
  RUB: "₽",
  BRL: "R$",
  ZAR: "R",
  PHP: "₱",
  CZK: "Kč",
  IDR: "Rp",
  MYR: "RM",
  HUF: "Ft",
  ISK: "kr",
  HRK: "kn",
  BGN: "лв",
  RON: "lei",
  DKK: "kr",
  THB: "฿",
  PLN: "zł",
};

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return "";
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Hook to get user's organization currency
 */
export function useCurrency() {
  const user = useAuthStore((state) => state.user);
  const currency = user?.organization?.currency || "";
  const symbol = getCurrencySymbol(currency);

  return {
    currency,
    symbol,
    format: (amount: number, options?: Intl.NumberFormatOptions) => {
      const formatted = amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      });
      return symbol ? `${symbol}${formatted}` : formatted;
    },
  };
}

/**
 * Format currency amount with symbol
 * For use outside of React components
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  options?: Intl.NumberFormatOptions
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return symbol ? `${symbol}${formatted}` : formatted;
}
