// coding-standard: maintained
/**
 * What an optional list says when it is empty. The control has to answer two
 * questions — what value am I using, and where does it come from — and a generic
 * "Default" answers neither.
 */
import { describe, expect, it } from "vitest";

import { fieldEmptyChoice } from "../field-empty-choice";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";

describe("fieldEmptyChoice", () => {
  it("names the Customize panel a value is inherited from", () => {
    expect(fieldEmptyChoice("product-grid", "cardImageRatio")).toEqual({
      kind: "inherit",
      label: "Follow Product cards",
    });
    expect(fieldEmptyChoice("single-product", "galleryLayout")).toEqual({
      kind: "inherit",
      label: "Store default",
    });
  });

  it("names the behaviour when empty is an answer no listed value gives", () => {
    expect(fieldEmptyChoice("image-banner", "frame")).toEqual({ kind: "meaning", label: "Whole picture" });
    expect(fieldEmptyChoice("category-promo-cards", "ratio")).toEqual({
      kind: "meaning",
      label: "The card decides",
    });
  });

  it("gives the built-in fallback as a plain value, so no phantom choice is offered", () => {
    expect(fieldEmptyChoice("call-to-action", "align")).toEqual({ kind: "value", value: "left" });
    expect(fieldEmptyChoice("category-tiles", "mode")).toEqual({ kind: "value", value: "tile" });
  });

  it("reads the same field differently per section, and falls back to the shared entry", () => {
    // `imageFit` follows Customize on a hero; `cardImageFit` is shared by every product section.
    expect(fieldEmptyChoice("hero", "imageFit")?.kind).toBe("inherit");
    expect(fieldEmptyChoice("product-carousel", "cardImageFit")?.kind).toBe("inherit");
  });

  it("is undefined for a field nobody has classified, which keeps the old label", () => {
    expect(fieldEmptyChoice("hero", "heading")).toBeUndefined();
  });

  /**
   * A `value` entry claims the section already draws that value when the setting
   * is empty. A value outside the field's own list cannot be true.
   */
  it("only offers values the field actually lists", () => {
    for (const [type, definition] of Object.entries(SECTION_SPECS)) {
      const { settings, blocks } = definition as {
        settings?: Record<string, unknown>;
        blocks?: { settings?: Record<string, unknown> };
      };
      const specs: Record<string, unknown> = { ...settings, ...blocks?.settings };
      for (const [key, spec] of Object.entries(specs)) {
        const field = spec as { type?: string; values?: readonly string[] };
        const empty = fieldEmptyChoice(type, key);
        if (field.type !== "enum" || empty?.kind !== "value") continue;
        expect(field.values, `${type}.${key}`).toContain(empty.value);
      }
    }
  });
});
