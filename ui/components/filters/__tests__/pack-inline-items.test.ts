// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { packInlineItems } from "../use-inline-overflow";

/**
 * The filter bar packs chips left and folds the rest into the Advanced panel.
 *
 * It used to assume every chip was the same fixed 160px, which is what made
 * placeholders render cut off: a chip could not be widened to fit its own
 * (translated) placeholder without the packing miscounting the row.
 */
const GAP = 8;

describe("packInlineItems", () => {
  it("packs items at their own widths, not a uniform one", () => {
    // 224 + 8 + 160 = 392 fits; a third chip would need 560.
    expect(packInlineItems(400, [224, 160, 160], GAP)).toBe(2);
  });

  it("counts no gap before the first item", () => {
    expect(packInlineItems(160, [160], GAP)).toBe(1);
    expect(packInlineItems(159, [160], GAP)).toBe(0);
  });

  it("stops at the first item that does not fit rather than skipping it", () => {
    // Order is the bar's render order; a narrow chip behind a wide one must not
    // jump the queue, or the row and the panel would disagree about which
    // filters are inline.
    expect(packInlineItems(400, [288, 288, 100], GAP)).toBe(1);
  });

  it("fits everything when there is room", () => {
    expect(packInlineItems(2000, [288, 160, 160], GAP)).toBe(3);
  });

  it("fits nothing in a container with no usable width", () => {
    expect(packInlineItems(0, [160, 160], GAP)).toBe(0);
  });
});
