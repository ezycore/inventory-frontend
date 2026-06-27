/** Currency-aware money formatting (never hardcodes a symbol). */
export function formatMoney(
  amount: number | null | undefined,
  currency?: string,
): string {
  const value = typeof amount === "number" ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || ""} ${value.toFixed(2)}`.trim();
  }
}

/**
 * Storefront money — `BDT 1,250.00` style: currency code prefix + grouped,
 * 2-decimal amount. Matches the Rashid's Mart design's `fmt()`. Defaults to BDT
 * (the demo store's currency) but honours the store's configured currency.
 */
export function money(
  amount: number | null | undefined,
  currency?: string,
): string {
  const value = typeof amount === "number" ? amount : 0;
  const n = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency || "BDT"} ${n}`;
}

/** Inline Taka amount (`৳60`) — used for shipping fees in the design. */
export function taka(amount: number | null | undefined): string {
  const value = typeof amount === "number" ? amount : 0;
  return `৳${value.toLocaleString("en-US")}`;
}

/** Discount percentage from a compare-at/old price, or 0 when not on sale. */
export function discountPct(
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number {
  if (!compareAt || !price || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
