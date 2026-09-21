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
    /* A hero's `imageFit` follows nothing — no hero calls `useStoreImageFit()` —
       so it cannot be the shared `inherit` entry. It draws the listed `fit`
       value, which is a different answer again; see the dedicated test below.
       `cardImageFit` is the shared entry, and it really does follow the
       Customize panel for every product section. */
    expect(fieldEmptyChoice("hero", "imageFit")?.kind).toBe("value");
    expect(fieldEmptyChoice("product-carousel", "cardImageFit")?.kind).toBe("inherit");
  });

  /**
   * A `meaning` that describes what one of the field's OWN values already draws
   * puts the same answer on the list twice, and the merchant has no way to tell
   * the two apart. `hero.imageFit` shipped that way and only a browser pass
   * caught it: the list read "Whole picture" and "Show the whole picture", and
   * `heroSlidePhoto` maps unset and `fit` to the same `canvas`.
   *
   * There is no mechanical check for this — whether a phrase duplicates a value
   * is a question about the renderer, not the data — so each `meaning` entry
   * carries a comment saying which answer no listed value gives, and this test
   * pins the one that got it wrong.
   */
  it("does not offer one answer twice: an empty fit IS the listed 'fit' value", () => {
    expect(fieldEmptyChoice("hero", "imageFit")).toEqual({ kind: "value", value: "fit" });

    // The `meaning` entries that remain each name something no value lists: a
    // picture drawn at its own proportions where every listed value is a ratio,
    // and two answers that differ by layout or breakpoint.
    expect(fieldEmptyChoice("image-banner", "frame")).toEqual({ kind: "meaning", label: "Whole picture" });
    expect(fieldEmptyChoice("gallery", "frame")).toEqual({ kind: "meaning", label: "Whole picture" });
  });

  /**
   * Every optional enum the hero shipped in 2026-09-21's shape work, together,
   * because the one that was MISSED shipped a phantom "Default" to the editor
   * and only a browser pass found it. A generic "Default" answers neither of the
   * two questions at the top of this file.
   */
  it("classifies every one of the hero's shape and placement settings", () => {
    // Two ratios at two breakpoints on a card, so no listed value says it.
    expect(fieldEmptyChoice("hero", "frame")).toEqual({ kind: "meaning", label: "The layout decides" });
    // "picture" on a card, "text" on an open hero — naming either would lie
    // about the other.
    expect(fieldEmptyChoice("hero", "mobileFirst")).toEqual({
      kind: "meaning",
      label: "The layout decides",
    });
    // These two DO draw one listed value, so they name it rather than a meaning.
    expect(fieldEmptyChoice("hero", "imageSide")).toEqual({ kind: "value", value: "right" });
    expect(fieldEmptyChoice("hero", "mobileCopy")).toEqual({ kind: "value", value: "title-only" });
    // The hero draws its picture right where `image-text` draws it left: the
    // same field name, two renderers, and each entry equals its own.
    expect(fieldEmptyChoice("image-text", "imageSide")).toEqual({ kind: "value", value: "left" });
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
