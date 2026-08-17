/**
 * Mirror of `inventory-backend/src/utils/__tests__/barcode-symbology.test.ts`.
 *
 * Both copies exist so the product form and the label endpoint agree about what
 * can be encoded — if they drift, the form accepts a pairing the server then
 * rejects, which is the bug this rule was written to end.
 */
import { describe, expect, it } from "vitest";

import { checkBarcodeForSymbology, symbologiesFor } from "./barcode-symbology";

/** What the backend generates when the merchant leaves the field blank. */
const AUTO_GENERATED = "BCMSWRDUFF1OQ4";
/** What demo-seed writes: 12 digits, sequential, no valid check digit. */
const SEEDED = "200000000001";

describe("checkBarcodeForSymbology", () => {
  it("lets CODE128 and QR encode anything printable", () => {
    for (const code of [AUTO_GENERATED, SEEDED, "abc-123"]) {
      expect(checkBarcodeForSymbology(code, "CODE128").ok).toBe(true);
      expect(checkBarcodeForSymbology(code, "QR").ok).toBe(true);
    }
  });

  it("rejects an alphanumeric code for every numeric symbology", () => {
    for (const symbology of ["EAN13", "UPC_A", "ITF14"] as const) {
      const result = checkBarcodeForSymbology(AUTO_GENERATED, symbology);
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/digits only/);
    }
  });

  it.each([
    ["EAN13", [12, 13], [11, 14]],
    ["UPC_A", [11, 12], [10, 13]],
    ["ITF14", [13, 14], [12, 15]],
  ] as const)("%s accepts %j digits and rejects %j", (symbology, good, bad) => {
    for (const n of good) {
      expect(checkBarcodeForSymbology("1".repeat(n), symbology).ok).toBe(true);
    }
    for (const n of bad) {
      expect(checkBarcodeForSymbology("1".repeat(n), symbology).ok).toBe(false);
    }
  });

  it("rejects an empty code", () => {
    expect(checkBarcodeForSymbology("", "CODE128").ok).toBe(false);
  });
});

describe("symbologiesFor", () => {
  it("offers only CODE128 and QR for an auto-generated barcode", () => {
    expect(symbologiesFor(AUTO_GENERATED)).toEqual(["CODE128", "QR"]);
  });

  it("offers EAN-13 but not ITF-14 for a seeded 12-digit code", () => {
    const options = symbologiesFor(SEEDED);
    expect(options).toContain("EAN13");
    expect(options).not.toContain("ITF14");
  });
});
