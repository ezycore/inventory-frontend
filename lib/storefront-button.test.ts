// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { brandButton, buttonMetrics, scaledPadding } from "@/lib/storefront-button";

/**
 * Plan §17, Phase 6 step 8. The contract that keeps every existing shop
 * unchanged: with no Buttons token defined, each value resolves to the literal
 * the button drew before — so every fallback here must be that literal.
 */
describe("brand buttons", () => {
  it("falls back to the button's own corners, padding, type and brand fill", () => {
    expect(brandButton({ radius: 9, padding: "12px 24px", fontSize: 14 })).toEqual({
      background: "var(--btn-bg, var(--primary))",
      color: "var(--btn-fg, var(--on-primary))",
      boxShadow: "var(--btn-ring, none)",
      borderRadius: "var(--btn-radius, 9px)",
      padding: "calc(12px * var(--btn-scale, 1)) calc(24px * var(--btn-scale, 1))",
      fontSize: "calc(14px * var(--btn-scale, 1))",
    });
  });

  it("keeps a CSS radius as written, and scales a minimum height with the size", () => {
    expect(buttonMetrics({ radius: "var(--radius-sm)", padding: 14, fontSize: 12.5, minHeight: 40 })).toEqual({
      borderRadius: "var(--btn-radius, var(--radius-sm))",
      padding: "calc(14px * var(--btn-scale, 1))",
      fontSize: "calc(12.5px * var(--btn-scale, 1))",
      minHeight: "calc(40px * var(--btn-scale, 1))",
    });
  });

  it("scales only the px in a padding — never a zero or the page's own gutter", () => {
    expect(scaledPadding("0 4px")).toBe("0 calc(4px * var(--btn-scale, 1))");
    expect(scaledPadding("14px var(--pad)")).toBe("calc(14px * var(--btn-scale, 1)) var(--pad)");
  });

  it("keeps a solid brand fill over a photo, and adds no ring to a bordered button", () => {
    const overPhoto = brandButton({ radius: 9, padding: "11px 22px", fontSize: 14 }, { overPhoto: true });
    expect(overPhoto.background).toBe("var(--primary)");
    expect(overPhoto.color).toBe("var(--on-primary)");
    expect(overPhoto.boxShadow).toBeUndefined();
    expect(overPhoto.borderRadius).toBe("var(--btn-radius, 9px)");

    const bordered = brandButton({ radius: 8, padding: "10px 8px", fontSize: 13 }, { bordered: true });
    expect(bordered.background).toBe("var(--btn-bg, var(--primary))");
    expect(bordered.boxShadow).toBeUndefined();
  });
});
