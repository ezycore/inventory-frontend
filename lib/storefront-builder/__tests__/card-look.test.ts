// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { sectionCardLook } from "@/lib/storefront-builder/card-media";

/**
 * A product section's card chrome — the corners and the buy button's fill.
 *
 * The rule an unset value has to keep: **emit nothing.** The attributes select
 * CSS rules that redefine `--radius-md` and the `--btn-*` group, so writing
 * `data-card-buttons="solid"` for a merchant who never asked would override a
 * shop that chose Outline store-wide, on every section, the day this shipped.
 */
describe("sectionCardLook", () => {
  it("writes nothing for a section that set neither", () => {
    expect(sectionCardLook({})).toEqual({});
  });

  it("writes only what was answered", () => {
    expect(sectionCardLook({ cardCorners: "round" })).toEqual({ "data-card-corners": "round" });
    expect(sectionCardLook({ cardButtons: "outline" })).toEqual({ "data-card-buttons": "outline" });
    expect(sectionCardLook({ cardCorners: "sharp", cardButtons: "soft" })).toEqual({
      "data-card-corners": "sharp",
      "data-card-buttons": "soft",
    });
  });
});

/**
 * Which sections offer it, asserted rather than left to the eye: the five that
 * draw a real `ProductCard`, and deliberately NOT `selected-products`, whose
 * `PickGrid` has "no border, no background, no buttons" — two controls with
 * nothing on the page to change.
 */
describe("the sections that carry it", () => {
  const has = (type: string, key: string) =>
    key in (SECTION_SPECS[type as keyof typeof SECTION_SPECS].settings as Record<string, unknown>);

  it("is on every section that draws a product card", () => {
    for (const type of [
      "product-grid",
      "product-carousel",
      "related-products",
      "collection-grid",
      "product-main",
    ]) {
      expect([type, has(type, "cardCorners"), has(type, "cardButtons")]).toEqual([type, true, true]);
    }
  });

  it("is absent where the cards have no chrome to change", () => {
    expect(has("selected-products", "cardCorners")).toBe(false);
    expect(has("selected-products", "cardButtons")).toBe(false);
    // Its photo settings stay — `PickGrid` does draw a photograph.
    expect(has("selected-products", "cardImageRatio")).toBe(true);
  });
});
