/**
 * Money for the shop and the admin — one implementation, two names.
 *
 * Two judgement calls live here, both pinned by format.test.ts:
 *
 * - the **sign**, not the ISO code. `BDT 800.00` reads like a remittance form,
 *   and the rest of the app already prints `৳` everywhere.
 * - decimals **only when the amount has them**. A hard 2 put a meaningless
 *   `.00` on every price in the catalogue and widened every discount badge.
 */

/** Widest float noise a percentage calculation can leave on a whole number. */
const EPSILON = 0.005;

/**
 * Storefront money — `৳1,250.50` / `৳800` / `$12.50`. Defaults to BDT (every
 * caller that omits the currency is a BD store) but honours the store's
 * configured currency.
 */
export function money(
  amount: number | null | undefined,
  currency?: string,
): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  const code = currency || "BDT";

  // Round first, then ask whether it is whole: 800.000000001 must print as
  // `৳800`, not `৳800.00` next to a neighbouring `৳800`.
  const rounded = Math.round(value * 100) / 100;
  const digits = Math.abs(rounded - Math.round(rounded)) < EPSILON ? 0 : 2;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      // `symbol` still yields "BDT" — only the narrow form gives us `৳`.
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
      .format(rounded)
      // Intl separates code-style output with U+00A0; a normal space keeps the
      // string comparable and copy-pasteable.
      .replace(/[  ]/g, " ");
  } catch {
    // Unknown/invalid currency code — still show the number.
    const n = rounded.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    return `${code} ${n}`.trim();
  }
}

/** Currency-aware money formatting. Kept as an alias so the storefront and the
 * admin cannot drift back into printing the same price two ways. */
export const formatMoney = money;

/** Discount percentage from a compare-at/old price, or 0 when not on sale. */
export function discountPct(
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number {
  if (!compareAt || !price || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * A timestamp for the buyer — `17 Aug 2026, 18:31`.
 *
 * Spelled out rather than left to `toLocaleString()` defaults, which is what the
 * tracking page and the parcel feed each did separately and disagreed about: a
 * bare `toLocaleString()` follows the *browser's* locale while
 * `toLocaleString("en-BD")` resolves to US month-first, so one page printed
 * `25/08/2026` above `8/17/2026` for dates two days apart. Day-first with a named
 * month is unambiguous in either reading, and `bn-BD` renders it in Bangla
 * numerals and month names for free.
 */
export function dateTime(value?: string | Date, langCode = "en-BD"): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(langCode, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
