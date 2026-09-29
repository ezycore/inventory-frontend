// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { CatalogCategory } from "@/lib/storefront-client";
import {
  APPAREL_SAMPLE,
  NEUTRAL_SAMPLE,
  PHARMACY_SAMPLE,
} from "@/lib/storefront-theme-samples";
import { padCategoriesForPreview } from "@/lib/storefront-preview-samples";

describe("padCategoriesForPreview", () => {
  // The most load-bearing of the set: `RailShell` returns null without
  // categories, so a new merchant compared themes with the rail invisible.
  it("supplies departments when the shop has none", () => {
    expect(padCategoriesForPreview([], NEUTRAL_SAMPLE).length).toBeGreaterThanOrEqual(4);
  });

  it("never replaces a real taxonomy", () => {
    const real = [{ _id: "c1", name: "Medicines" }] as unknown as CatalogCategory[];
    expect(padCategoriesForPreview(real, NEUTRAL_SAMPLE)).toBe(real);
  });

  it("names departments after the previewed theme's trade", () => {
    expect(padCategoriesForPreview([], PHARMACY_SAMPLE)).toContainEqual(
      expect.objectContaining({ name: "Prescriptions" }),
    );
    expect(padCategoriesForPreview([], APPAREL_SAMPLE)).toContainEqual(
      expect.objectContaining({ name: "Sarees" }),
    );
  });

  it("gives every sample a routable-looking but synthetic id", () => {
    for (const c of padCategoriesForPreview([], NEUTRAL_SAMPLE)) {
      expect(c._id).toMatch(/^preview-cat-/);
    }
  });
});

/**
 * The gate itself — a null sample means "nobody asked for this", and the pad
 * has to be a no-op.
 *
 * This is the whole safety property. `active` was the gate until 2026-08-17 and
 * it is a different question: it is true for the Customize editor, which
 * previews the merchant's REAL shop, and for anyone who appends `?preview=1` to
 * a live storefront. Padding under it put departments the merchant does not
 * have in front of both.
 * Only the Themes page sends samples.
 */
describe("no samples — the Customize editor and every shopper", () => {
  it("invents no departments", () => {
    expect(padCategoriesForPreview([], null)).toEqual([]);
  });
});
