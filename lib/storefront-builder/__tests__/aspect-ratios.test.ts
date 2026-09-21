// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { ASPECT_RATIOS, ASPECT_RATIO_PADDING } from "@/lib/storefront-builder/aspect-ratios";

describe("aspect ratios", () => {
  it("derives a padding percentage for every shape, describing the same shape", () => {
    // The two are read by different heroes — `aspect-ratio` on the card and open
    // ones, `padding-top` on the full-width one — so a drift between them would
    // draw two different pictures from one merchant choice.
    expect(Object.keys(ASPECT_RATIO_PADDING)).toEqual(Object.keys(ASPECT_RATIOS));
    for (const [key, ratio] of Object.entries(ASPECT_RATIOS)) {
      const [w, h] = ratio.split("/").map((part) => Number(part.trim()));
      const percent = Number(ASPECT_RATIO_PADDING[key as keyof typeof ASPECT_RATIO_PADDING].replace("%", ""));
      expect(percent).toBeCloseTo((h / w) * 100, 3);
    }
  });

  it("spells the ratios the way CSS takes them", () => {
    expect(ASPECT_RATIOS["21:9"]).toBe("21 / 9");
    expect(ASPECT_RATIO_PADDING["21:9"]).toBe("42.8571%");
    expect(ASPECT_RATIO_PADDING["1:1"]).toBe("100.0000%");
  });
});
