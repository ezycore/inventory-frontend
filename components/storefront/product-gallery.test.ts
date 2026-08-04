// coding-standard: maintained
/**
 * The hover-zoom origin math. It is the one part of the gallery that can be
 * wrong without looking wrong in a screenshot: an unclamped origin pans past
 * the image edge and shows page background inside the frame, and only on the
 * few pointermove events that report a coordinate outside the box.
 */
import { describe, expect, it } from "vitest";
import { zoomOrigin } from "./product-gallery";

const RECT = { left: 100, top: 50, width: 400, height: 400 };

describe("zoomOrigin", () => {
  it("maps the pointer to its percentage position inside the hero", () => {
    expect(zoomOrigin(RECT, 300, 250)).toBe("50.00% 50.00%");
    expect(zoomOrigin(RECT, 100, 50)).toBe("0.00% 0.00%");
    expect(zoomOrigin(RECT, 500, 450)).toBe("100.00% 100.00%");
    expect(zoomOrigin(RECT, 200, 150)).toBe("25.00% 25.00%");
  });

  it("clamps a coordinate reported outside the box", () => {
    expect(zoomOrigin(RECT, 40, 20)).toBe("0.00% 0.00%");
    expect(zoomOrigin(RECT, 620, 700)).toBe("100.00% 100.00%");
  });

  it("centers rather than dividing by zero on an unmeasured box", () => {
    expect(zoomOrigin({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toBe("50% 50%");
  });
});
