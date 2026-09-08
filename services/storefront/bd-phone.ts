// coding-standard: maintained

/**
 * Bangladeshi mobile validation for the storefront, mirroring the backend's
 * `src/utils/phone-bd.ts`.
 *
 * **This is a cross-repo contract, not a convenience.** Guest checkout makes the
 * phone the buyer's identity — it keys customer matching, the per-buyer coupon
 * limit, the delivery-risk score and order rate limiting — and the server rejects
 * a number it cannot normalise with `INVALID_PHONE`. If this file and the backend
 * disagree, the checkout either blocks a number the server would have accepted or
 * lets one through to a 400 at submit, which is the worst place to learn.
 *
 * Keep the operator list and the accepted forms in lockstep with the backend.
 */

/** Every live BD mobile operator prefix (after the leading 0). */
const OPERATOR_PREFIXES = ["13", "14", "15", "16", "17", "18", "19"];

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Bengali numerals are a normal way to type a number here, not an edge case. */
const toWesternDigits = (input: string): string =>
  input.replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)));

/**
 * Reduce any accepted form to the local 11-digit one (`01712345678`), or `null`
 * when it is not a valid BD mobile.
 */
export function normalizeBdPhone(input: string | undefined | null): string | null {
  if (!input) return null;
  const digits = toWesternDigits(input).replace(/\D/g, "");
  if (!digits) return null;

  let local = digits;
  if (local.startsWith("880")) local = local.slice(3);
  // A bare 10-digit number is the local form with the leading 0 dropped, which is
  // how a number pasted out of a spreadsheet arrives.
  if (local.length === 10 && !local.startsWith("0")) local = `0${local}`;

  if (local.length !== 11 || !local.startsWith("0")) return null;
  if (!OPERATOR_PREFIXES.includes(local.slice(1, 3))) return null;
  return local;
}

/** True when the server will accept this number on the guest path. */
export const isValidBdPhone = (input: string | undefined | null): boolean =>
  normalizeBdPhone(input) !== null;

/**
 * What to SUBMIT in a `phone` field — the server stores this form (see the
 * backend's `canonicalizeBdPhone`), so sending the raw text only meant the value
 * the buyer sees in their order confirmation differed from the one the merchant
 * and the courier get. Anything that is not a BD mobile is passed through
 * trimmed and untouched.
 */
export function canonicalizeBdPhone(
  input: string | undefined | null,
): string | undefined {
  const trimmed = input?.trim();
  if (!trimmed) return undefined;
  return normalizeBdPhone(trimmed) ?? trimmed;
}
