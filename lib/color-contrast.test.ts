// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { brightenForDark, readableTextOn } from "./color-contrast";

describe("readableTextOn", () => {
  it("uses near-black text on light backgrounds", () => {
    expect(readableTextOn("#ffffff")).toBe("#111827");
    expect(readableTextOn("#ffe066")).toBe("#111827");
  });

  it("uses white text on dark backgrounds", () => {
    expect(readableTextOn("#000000")).toBe("#ffffff");
    expect(readableTextOn("#122447")).toBe("#ffffff");
  });

  it("supports 3-digit hex and falls back for unparsable colours", () => {
    expect(readableTextOn("#fff")).toBe("#111827");
    expect(readableTextOn("rebeccapurple")).toBe("#ffffff");
    expect(readableTextOn("rgb(0,0,0)", "#abcdef")).toBe("#abcdef");
  });
});

describe("brightenForDark", () => {
  it("lifts a dark navy brand to a visible colour, keeping the blue hue", () => {
    const lifted = brightenForDark("#122447");
    expect(lifted).not.toBe("#122447");
    expect(lifted).toMatch(/^#[0-9a-f]{6}$/);
    const [r, , b] = [1, 3, 5].map((i) =>
      parseInt(lifted.slice(i, i + 2), 16),
    );
    // Still blue-dominant, and clearly brighter than the near-black page.
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(150);
  });

  it("leaves already-visible colours untouched", () => {
    expect(brightenForDark("#3b82f6")).toBe("#3b82f6");
    expect(brightenForDark("#ffe066")).toBe("#ffe066");
  });

  it("passes unparsable colours through unchanged", () => {
    expect(brightenForDark("hsl(220, 60%, 20%)")).toBe("hsl(220, 60%, 20%)");
  });

  it("lifts pure black to a visible grey", () => {
    expect(brightenForDark("#000000")).toBe("#999999");
  });
});
