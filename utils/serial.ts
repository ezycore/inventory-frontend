// coding-standard: maintained
/**
 * Serial / IMEI code helpers — backend `docs/plan/sale-serials.md`.
 *
 * Mirrors the backend's `src/utils/serial.ts` (`normalizeSerial`,
 * `isLikelyImei`) exactly: the counter normalises what it shows and checks,
 * the server normalises what it stores, and the two must agree or a warning
 * would point at a code the server spells differently. Change both together.
 */

/** Longest code the server accepts, after normalising. */
export const MAX_SERIAL_LENGTH = 40;

/** Drop every whitespace character, uppercase. Hyphens and slashes stay. */
export const normalizeSerial = (code: string): string => code.replace(/\s+/g, "").toUpperCase();

/** Normalise a list, dropping empties. Order is kept — it is the unit order on the line. */
export const normalizeSerials = (codes: readonly string[] | undefined): string[] =>
  (codes ?? []).map(normalizeSerial).filter((code) => code.length > 0);

/**
 * 15 digits with a valid Luhn check digit. Advice only — the UI warns, nothing
 * refuses on it (some phones print a 16-digit IMEISV).
 */
export const isLikelyImei = (code: string): boolean => {
  if (!/^\d{15}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = Number(code[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
};

/** Codes that appear more than once in the list (normalised). */
export const duplicateSerials = (codes: readonly string[]): Set<string> => {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const code of normalizeSerials(codes)) {
    if (seen.has(code)) twice.add(code);
    seen.add(code);
  }
  return twice;
};

/** Fit a list of codes to a line's quantity: keep the first `quantity`, pad with blanks. */
export const fitSerialSlots = (codes: readonly string[] | undefined, quantity: number): string[] => {
  const slots = [...(codes ?? [])].slice(0, Math.max(0, quantity));
  while (slots.length < quantity) slots.push("");
  return slots;
};
