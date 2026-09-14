// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { sectionFrame } from "@/lib/storefront-builder/section-style";
import { responsiveVars } from "@/lib/storefront-builder/responsive";

describe("sectionFrame", () => {
  it("applies the defaults when a section has no style", () => {
    const frame = sectionFrame(undefined);
    expect(frame.width).toBe("content");
    expect(frame.tone).toBe("auto");
    expect(frame.style).toEqual({
      "--sfb-pt": "clamp(24px, 4vw, 40px)",
      "--sfb-pb": "clamp(24px, 4vw, 40px)",
    });
  });

  it("emits phone padding and alignment as separate -m properties", () => {
    const frame = sectionFrame({
      padding: { base: { top: "lg", bottom: "none" }, mobile: { top: "sm", bottom: "sm" } },
      align: { base: "left", mobile: "center" },
      width: "full",
      textTone: "light",
    });
    expect(frame.style).toMatchObject({
      "--sfb-pt": "clamp(40px, 6vw, 64px)",
      "--sfb-pb": "0px",
      "--sfb-pt-m": "clamp(12px, 2vw, 20px)",
      "--sfb-pb-m": "clamp(12px, 2vw, 20px)",
      "--sfb-align": "left",
      "--sfb-align-m": "center",
    });
    expect(frame.width).toBe("full");
    expect(frame.tone).toBe("light");
  });

  it("uses a colour or image background only when it is valid", () => {
    expect(sectionFrame({ background: { kind: "color", color: "#1A2B3C" } }).style).toMatchObject({
      "--sfb-bg": "#1A2B3C",
    });
    expect(sectionFrame({ background: { kind: "color", color: "red" } }).style).not.toHaveProperty("--sfb-bg");
    expect(
      sectionFrame({ background: { kind: "image", image: { url: "https://cdn.example/b.webp" } } }).style,
    ).toMatchObject({ "--sfb-bg-image": 'url("https://cdn.example/b.webp")' });
    expect(
      sectionFrame({ background: { kind: "image", image: { url: "javascript:alert(1)" } } }).style,
    ).not.toHaveProperty("--sfb-bg-image");
  });

  it("falls back to defaults for invalid values", () => {
    const frame = sectionFrame({ width: "huge", textTone: "neon", padding: { base: { top: "xxl" } } });
    expect(frame.width).toBe("content");
    expect(frame.tone).toBe("auto");
    expect(frame.style).toMatchObject({ "--sfb-pt": "clamp(24px, 4vw, 40px)" });
  });
});

describe("responsiveVars", () => {
  it("omits the phone property until an override is set", () => {
    expect(responsiveVars("cols", { base: 4 })).toEqual({ "--cols": "4" });
    expect(responsiveVars("cols", { base: 4, mobile: 2 })).toEqual({ "--cols": "4", "--cols-m": "2" });
    expect(responsiveVars("cols", undefined)).toEqual({});
  });
});
