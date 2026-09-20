// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { sectionFrame } from "@/lib/storefront-builder/section-style";
import {
  alignFor,
  backgroundOf,
  paddingFor,
  styleOf,
  toneOf,
  withAlign,
  withBackground,
  withPadding,
  withStyle,
  withTone,
  withWidth,
} from "../section-style-edits";
import type { EditorSection } from "../section-instances";

const section = (style?: unknown): EditorSection => ({
  id: "cta-1",
  type: "call-to-action",
  v: 1,
  enabled: true,
  settings: {},
  ...(style === undefined ? {} : { style: style as Record<string, unknown> }),
});

describe("withStyle", () => {
  it("drops the style key when nothing is left in it", () => {
    expect(withStyle(section({ width: "wide" }), {})).not.toHaveProperty("style");
    expect(withStyle(section(), { width: "wide" }).style).toEqual({ width: "wide" });
  });
});

describe("padding", () => {
  it("fills both edges with a first choice, then changes one edge at a time", () => {
    const first = withPadding({}, "top", "lg", "desktop");
    expect(first).toEqual({ padding: { base: { top: "lg", bottom: "lg" } } });
    expect(withPadding(first, "bottom", "none", "desktop")).toEqual({ padding: { base: { top: "lg", bottom: "none" } } });
  });

  it("keeps a phone override apart from the desktop value, and clears back to it", () => {
    const desktop = withPadding({}, "top", "md", "desktop");
    const phone = withPadding(desktop, "top", "sm", "mobile");
    expect(phone).toEqual({ padding: { base: { top: "md", bottom: "md" }, mobile: { top: "sm", bottom: "md" } } });
    expect(paddingFor(phone, "mobile")).toEqual({ value: { top: "sm", bottom: "md" }, own: true });
    expect(paddingFor(desktop, "mobile")).toEqual({ value: { top: "md", bottom: "md" }, own: false });

    // Changing the desktop keeps the phone's own value.
    expect(withPadding(phone, "bottom", "xl", "desktop")).toEqual({
      padding: { base: { top: "md", bottom: "xl" }, mobile: { top: "sm", bottom: "md" } },
    });
    expect(withPadding(phone, "top", undefined, "mobile")).toEqual({ padding: { base: { top: "md", bottom: "md" } } });
  });

  /**
   * The phone tab used to write the desktop's own spacing when it had none, so a
   * merchant tightening a section on their phone tightened it on every screen.
   */
  it("keeps a phone choice off the desktop, and clearing on desktop clears every screen", () => {
    expect(withPadding({}, "bottom", "xl", "mobile")).toEqual({ padding: { mobile: { top: "xl", bottom: "xl" } } });
    const phoneOnly = withPadding({}, "bottom", "xl", "mobile");
    expect(paddingFor(phoneOnly, "desktop")).toEqual({ value: undefined, own: false });
    expect(withPadding(phoneOnly, "bottom", undefined, "mobile")).toEqual({});
    const both = { padding: { base: { top: "md", bottom: "md" }, mobile: { top: "sm", bottom: "sm" } }, width: "wide" };
    expect(withPadding(both, "top", undefined, "desktop")).toEqual({ width: "wide" });
  });
});

describe("alignment", () => {
  it("keeps a phone-only alignment off the desktop, and renders it as the phone var alone", () => {
    const phoneOnly = withAlign({}, "center", "mobile");
    expect(phoneOnly).toEqual({ align: { mobile: "center" } });
    expect(alignFor(phoneOnly, "desktop")).toEqual({ value: undefined, own: false });
    expect(alignFor(phoneOnly, "mobile")).toEqual({ value: "center", own: true });
    const frame = sectionFrame(phoneOnly);
    expect(frame.style).toMatchObject({ "--sfb-align-m": "center" });
    expect(frame.style).not.toHaveProperty("--sfb-align");
    expect(withAlign(phoneOnly, undefined, "mobile")).toEqual({});
  });

  it("follows the same desktop and phone rules", () => {
    const desktop = withAlign({}, "center", "desktop");
    expect(desktop).toEqual({ align: { base: "center" } });
    const phone = withAlign(desktop, "left", "mobile");
    expect(phone).toEqual({ align: { base: "center", mobile: "left" } });
    expect(alignFor(phone, "mobile")).toEqual({ value: "left", own: true });
    expect(withAlign(phone, undefined, "mobile")).toEqual({ align: { base: "center" } });
    expect(withAlign(phone, undefined, "desktop")).toEqual({});
  });
});

describe("width and text colour", () => {
  it("stores a choice and removes the key for Default; auto reads as Default", () => {
    expect(withWidth({}, "full")).toEqual({ width: "full" });
    expect(withWidth({ width: "full" }, undefined)).toEqual({});
    expect(withTone({}, "light")).toEqual({ textTone: "light" });
    expect(toneOf({ textTone: "auto" })).toBeUndefined();
  });
});

describe("background", () => {
  const image = { url: "https://cdn.example.com/bg.webp", publicId: "org/pages/bg" };

  it("stores a colour only once it is a whole hex, and drops the other kind's value on a switch", () => {
    expect(withBackground({}, "color", { color: "#12" })).toEqual({ background: { kind: "color" } });
    const colour = withBackground({}, "color", { color: "#1A2B3C" });
    expect(backgroundOf(colour)).toEqual({ kind: "color", color: "#1A2B3C", image: undefined });
    expect(withBackground(colour, "image", { image })).toEqual({ background: { kind: "image", image } });
    expect(withBackground(colour, undefined)).toEqual({});
    expect(withBackground({}, "none")).toEqual({ background: { kind: "none" } });
  });
});

describe("what the renderer makes of it", () => {
  it("draws every edit the Style tab can make", () => {
    let style = withPadding({}, "top", "xl", "desktop");
    style = withPadding(style, "top", "none", "mobile");
    style = withAlign(style, "center", "desktop");
    style = withWidth(style, "wide");
    style = withTone(style, "light");
    style = withBackground(style, "color", { color: "#0F172A" });
    const frame = sectionFrame(styleOf(withStyle(section(), style)));
    expect(frame.width).toBe("wide");
    expect(frame.tone).toBe("light");
    expect(frame.style).toMatchObject({
      "--sfb-pt-m": "0px",
      "--sfb-bg": "#0F172A",
      "--sfb-align": "center",
    });
  });
});
