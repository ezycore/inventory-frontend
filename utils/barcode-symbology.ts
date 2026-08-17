// coding-standard: maintained
/**
 * Which barcode values a symbology will actually encode.
 *
 * **Mirror of `inventory-backend/src/utils/barcode-symbology.ts`** — same
 * contract as `utils/tax.ts` ↔ `applyLineTaxes`. Change both together, or the
 * form will accept a pairing the label endpoint then rejects.
 *
 * EAN-13, UPC-A and ITF-14 are check-digit symbologies: the last digit is a
 * computed checksum, so the encoder takes the digits either *without* it (and
 * computes it) or at full length *with* a correct one. CODE128 and QR take
 * arbitrary text.
 *
 * This matters because the app's own values do not satisfy the numeric ones: an
 * auto-generated barcode is alphanumeric (`BC…`) and the seeded codes are
 * 12-digit sequences with no valid check digit.
 */

export type BarcodeSymbology = "CODE128" | "EAN13" | "UPC_A" | "ITF14" | "QR";

const NUMERIC_RULES: Partial<
  Record<BarcodeSymbology, { label: string; lengths: number[] }>
> = {
  EAN13: { label: "EAN-13", lengths: [12, 13] },
  UPC_A: { label: "UPC-A", lengths: [11, 12] },
  ITF14: { label: "ITF-14", lengths: [13, 14] },
};

export interface BarcodeCheckResult {
  ok: boolean;
  reason?: string;
}

/**
 * Can `symbology` encode `code`? Character set and length only — a wrong check
 * digit on an otherwise well-formed code is left to the encoder, which owns
 * those checksums; reimplementing them here would be a second source of truth.
 */
export const checkBarcodeForSymbology = (
  code: string,
  symbology: BarcodeSymbology = "CODE128",
): BarcodeCheckResult => {
  const value = (code ?? "").trim();
  if (!value) return { ok: false, reason: "Barcode is empty." };

  const rule = NUMERIC_RULES[symbology];
  if (!rule) return { ok: true };

  if (!/^\d+$/.test(value)) {
    return {
      ok: false,
      reason: `${rule.label} accepts digits only. Use CODE128 or QR for this barcode.`,
    };
  }
  if (!rule.lengths.includes(value.length)) {
    return {
      ok: false,
      reason: `${rule.label} needs ${rule.lengths.join(" or ")} digits; this has ${value.length}.`,
    };
  }
  return { ok: true };
};

/** The symbologies that can encode a given code. */
export const symbologiesFor = (code: string): BarcodeSymbology[] =>
  (["CODE128", "EAN13", "UPC_A", "ITF14", "QR"] as BarcodeSymbology[]).filter(
    (s) => checkBarcodeForSymbology(code, s).ok,
  );
