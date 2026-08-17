/**
 * Amount-in-words, which prints on every invoice and receipt.
 *
 * The bug these pin: the "Only" / "মাত্র" terminator used to sit inside the
 * paisa branch, so `55.20` got it and `500` did not — losing it on precisely
 * the amounts most likely to be round. On a financial document that word is a
 * fraud control (it stops digits being appended to the written amount), not
 * decoration, so "round totals print without it" is the wrong half to lose.
 */
import { describe, expect, it } from "vitest";

import { amountToWords } from "./number-to-words";

describe("amountToWords", () => {
  describe("the terminator is never optional", () => {
    it.each([0, 1, 100, 500, 1200, 55.2, 99.99, 100.05])(
      "%s ends with Only (en)",
      (value) => {
        expect(amountToWords(value, "en")).toMatch(/ Only$/);
      },
    );

    it.each([0, 1, 100, 500, 1200, 55.2, 99.99])(
      "%s ends with মাত্র (bn)",
      (value) => {
        expect(amountToWords(value, "bn")).toMatch(/ মাত্র$/);
      },
    );
  });

  it("writes a round amount without a fraction", () => {
    expect(amountToWords(500, "en")).toBe("Five Hundred Only");
    expect(amountToWords(500, "bn")).toBe("পাঁচ শত মাত্র");
  });

  it("writes the paisa when there are any", () => {
    expect(amountToWords(55.2, "en")).toBe("Fifty Five and 20 Only");
    expect(amountToWords(100.05, "en")).toBe("One Hundred and 05 Only");
  });

  it("prefixes negatives", () => {
    expect(amountToWords(-250, "en")).toBe("Minus Two Hundred Fifty Only");
    expect(amountToWords(-250, "bn")).toMatch(/^ঋণাত্মক/);
  });

  /** No stray whitespace — the value is interpolated straight into the document. */
  it("never leaves padding at either end", () => {
    for (const value of [0, 500, 55.2, 1200.75]) {
      for (const locale of ["en", "bn"] as const) {
        const words = amountToWords(value, locale);
        expect(words).toBe(words.trim());
        expect(words).not.toMatch(/\s{2,}/);
      }
    }
  });

  it("returns empty for a non-finite amount rather than the word for NaN", () => {
    expect(amountToWords(Number.NaN, "en")).toBe("");
    expect(amountToWords(Number.POSITIVE_INFINITY, "bn")).toBe("");
  });
});
