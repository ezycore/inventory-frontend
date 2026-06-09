/**
 * Money / decimal precision helpers — single source of truth for the frontend.
 *
 * Every derived monetary value (cart totals, refund amounts, due allocations,
 * payment amounts, etc.) MUST be passed through these helpers before it is
 * displayed or, most importantly, sent to the API. This guarantees the
 * frontend never ships floating-point drift (e.g. 500.00000000000006) that
 * the backend would reject during allocation/reconciliation checks.
 */

/** Default number of decimal places for monetary values. */
export const MONEY_DECIMALS = 2;

/**
 * Round a number to the given number of decimal places using
 * floating-point-safe rounding.
 *
 * @param value - The number to round (non-numbers / NaN become 0).
 * @param decimals - Decimal places to keep (default 2).
 */
export function roundTo(value: number, decimals: number = MONEY_DECIMALS): number {
  if (typeof value !== "number" || isNaN(value)) {
    return 0;
  }
  const multiplier = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Round a monetary value to 2 decimal places.
 * Convenience wrapper around {@link roundTo}.
 */
export function roundMoney(value: number): number {
  return roundTo(value, MONEY_DECIMALS);
}
