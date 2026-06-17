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
