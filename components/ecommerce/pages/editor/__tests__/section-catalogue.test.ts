// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import { fieldHint, fieldLabel, valueLabel } from "../section-catalogue";

describe("valueLabel", () => {
  it("names a card photo option exactly as Customize does", () => {
    const label = (source: string, value: string) =>
      TEMPLATE_OPTIONS[source].find((option) => option.value === value)?.label;
    expect(valueLabel("tall", "cardImageRatio")).toBe(label("imageRatio", "tall"));
    expect(valueLabel("crop", "cardImageFit")).toBe(label("imageFit", "crop"));
    expect(valueLabel("fit", "cardImageFit")).toBe(label("imageFit", "fit"));
  });

  it("keeps its own wording for a setting that is not a Customize choice", () => {
    expect(valueLabel("crop", "imageFit")).toBe("Fill and crop");
    expect(valueLabel("manual")).toBe("Picked by hand");
  });

  it("gives an unknown value a readable fallback", () => {
    expect(valueLabel("mapPin")).toBe("Map pin");
    expect(valueLabel("some-new-value")).toBe("Some new value");
  });
});

describe("fieldLabel", () => {
  it("labels a setting it has never heard of from its key", () => {
    expect(fieldLabel("cardImageRatio")).toBe("Card photo shape");
    expect(fieldLabel("secondaryButtonColour")).toBe("Secondary button colour");
  });

  /* X11 — a tile row's `align` and the Style tab's Text alignment were both
     called "Alignment" and answer different questions: one places each tile
     inside its own column, the other moves the heading above it. */
  it("names a tile row's own alignment apart from the section's text alignment", () => {
    for (const type of ["collections-row", "category-tiles"]) {
      expect(fieldLabel("align", type)).toBe("Tile position");
      expect(fieldHint("align", type)).toContain("inside its own column");
      expect(fieldHint("align", type)).toContain("Text alignment");
    }
    // Every other section keeps the shared word, including the one section whose
    // `align` really does move its text.
    expect(fieldLabel("align")).toBe("Alignment");
    expect(fieldLabel("align", "call-to-action")).toBe("Alignment");
    expect(fieldHint("align", "call-to-action")).toBeUndefined();
  });
});
