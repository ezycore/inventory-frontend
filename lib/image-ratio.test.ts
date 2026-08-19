/**
 * The shape check behind every image field's warning.
 *
 * Two things these pin, and both are judgement calls rather than arithmetic:
 * **what is close enough to stay silent**, and **what the sentence tells the
 * merchant**. A warning that fires on a 4% difference gets ignored within a
 * week, and one that says only "wrong size" sends them to find out what the
 * right size was — so both are worth a test.
 */
import { describe, it, expect } from "vitest";

import {
  RECOMMENDED,
  describeRatio,
  ratioWarning,
} from "@/lib/image-ratio";

describe("describeRatio", () => {
  it("uses the same words the upload hints use", () => {
    expect(describeRatio({ w: 1600, h: 1600 })).toBe("square");
    expect(describeRatio({ w: 1600, h: 640 })).toBe("2.5:1");
    expect(describeRatio({ w: 1200, h: 900 })).toBe("4:3");
    expect(describeRatio({ w: 1080, h: 1920 })).toBe("9:16");
  });

  it("falls back to a decimal for a shape with no tidy name", () => {
    expect(describeRatio({ w: 1000, h: 730 })).toBe("1.37:1");
    expect(describeRatio({ w: 730, h: 1000 })).toBe("1:1.37");
  });
});

describe("ratioWarning", () => {
  const square = RECOMMENDED.product;

  it("says nothing when the shape already matches", () => {
    expect(ratioWarning({ w: 1600, h: 1600 }, square)).toBeNull();
    expect(ratioWarning({ w: 800, h: 800 }, square)).toBeNull();
  });

  /**
   * The tolerance earns its keep here. A photo a few percent off loses a sliver
   * nobody can see, and warning about it is how a warning becomes wallpaper.
   */
  it("stays quiet for a near miss", () => {
    expect(ratioWarning({ w: 1600, h: 1500 }, square)).toBeNull(); // 6.7% out
  });

  it("speaks up for a real mismatch", () => {
    expect(ratioWarning({ w: 1600, h: 1200 }, square)).not.toBeNull(); // 33% out
    expect(ratioWarning({ w: 1080, h: 1920 }, square)).not.toBeNull(); // portrait
  });

  it("names the picture, the target, and what gets cut", () => {
    const message = ratioWarning({ w: 1200, h: 1800 }, square)!;

    expect(message).toContain("1200 × 1800");
    expect(message).toContain("2:3");
    expect(message).toContain("1600 × 1600");
    expect(message).toContain("square");
    // Too tall for the slot, so the crop takes the ends off.
    expect(message).toContain("top and bottom");
    expect(message).toContain("still upload");
  });

  it("says SIDES when the picture is too wide instead", () => {
    const message = ratioWarning({ w: 3000, h: 1000 }, square)!;
    expect(message).toContain("the sides will be cropped off");
  });

  /**
   * The case that started all of this: every seeded hero was a 3:2 photograph
   * in a slot the product's own hint says is 2.5:1.
   */
  it("catches a 3:2 photo dropped into the 2.5:1 hero slot", () => {
    expect(ratioWarning({ w: 2400, h: 1600 }, RECOMMENDED.heroSlide)).toContain(
      "2.5:1",
    );
  });

  it("never divides by zero on a degenerate size", () => {
    expect(ratioWarning({ w: 100, h: 0 }, square)).toBeNull();
    expect(ratioWarning({ w: 0, h: 100 }, square)).toBeNull();
  });
});

describe("RECOMMENDED", () => {
  /**
   * These numbers are copies of the hint strings shown beside each field. If a
   * hint is reworded, this table has to move with it — the whole point is that
   * the warning and the hint quote the same size.
   */
  it("matches the sizes the hints promise", () => {
    expect(RECOMMENDED.product).toEqual({ w: 1600, h: 1600 });
    expect(RECOMMENDED.category).toEqual({ w: 600, h: 600 });
    expect(RECOMMENDED.heroSlide).toEqual({ w: 1600, h: 640 });
    expect(RECOMMENDED.heroBanner).toEqual({ w: 1200, h: 900 });
  });

  it("describes the hero slot as the hint's own 2.5:1", () => {
    expect(describeRatio(RECOMMENDED.heroSlide)).toBe("2.5:1");
  });
});
