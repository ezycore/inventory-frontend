import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESIGN,
  DESIGN_DENSITIES,
  DESIGN_FONTS,
  DESIGN_RADII,
  DESIGN_SCALES,
  DESIGN_SURFACES,
  DESIGN_NAV_HOVERS,
  DESIGN_WIDTHS,
  DESIGN_BUTTON_SHAPES,
  DESIGN_BUTTON_SIZES,
  DESIGN_BUTTON_STYLES,
  DESIGN_HEADING_CASES,
  DESIGN_HEADING_WEIGHTS,
  designAttrs,
  resolveDesign,
} from "@/lib/storefront-theme";

describe("resolveDesign", () => {
  it("returns the built-in look when nothing is saved", () => {
    expect(resolveDesign(undefined)).toEqual(DEFAULT_DESIGN);
    expect(resolveDesign({})).toEqual(DEFAULT_DESIGN);
  });

  it("honours every id the catalogues offer", () => {
    for (const font of DESIGN_FONTS) {
      expect(resolveDesign({ font: font.id }).font).toBe(font.id);
    }
    for (const scale of DESIGN_SCALES) {
      expect(resolveDesign({ scale: scale.id }).scale).toBe(scale.id);
    }
    for (const density of DESIGN_DENSITIES) {
      expect(resolveDesign({ density: density.id }).density).toBe(density.id);
    }
    for (const radius of DESIGN_RADII) {
      expect(resolveDesign({ radius: radius.id }).radius).toBe(radius.id);
    }
    for (const surface of DESIGN_SURFACES) {
      expect(resolveDesign({ surface: surface.id }).surface).toBe(surface.id);
    }
  });

  // An unknown id must never reach the DOM: it would match no CSS block, so the
  // store would silently render unstyled rather than fall back to the default.
  it("falls back on an unknown or empty id", () => {
    expect(resolveDesign({ font: "comic-sans" })).toEqual(DEFAULT_DESIGN);
    expect(resolveDesign({ scale: "", density: "  " })).toEqual(DEFAULT_DESIGN);
  });

  it("resolves each axis independently", () => {
    expect(resolveDesign({ font: "serif", scale: "bogus" })).toEqual({
      ...DEFAULT_DESIGN,
      font: "serif",
    });
  });

  // The catalogue is the allow-list, so the first entry of each list IS the
  // default. A reorder that broke this would silently restyle every store that
  // had never opened the Design part.
  it("keeps the defaults as the first entry of each catalogue", () => {
    expect(DEFAULT_DESIGN).toEqual({
      font: DESIGN_FONTS[0].id,
      surface: DESIGN_SURFACES[0].id,
      scale: DESIGN_SCALES[0].id,
      density: DESIGN_DENSITIES[0].id,
      radius: DESIGN_RADII[0].id,
      width: DESIGN_WIDTHS[0].id,
      navHover: DESIGN_NAV_HOVERS[0].id,
      navChildHover: DESIGN_NAV_HOVERS[0].id,
      buttonShape: DESIGN_BUTTON_SHAPES[0].id,
      buttonStyle: DESIGN_BUTTON_STYLES[0].id,
      buttonSize: DESIGN_BUTTON_SIZES[0].id,
      headingWeight: DESIGN_HEADING_WEIGHTS[0].id,
      headingCase: DESIGN_HEADING_CASES[0].id,
    });
  });

  // Phase 6 step 8: each new axis's default is "as drawn today" and must stay
  // the resolved answer for a store that has never saved it.
  it("resolves a store saved before Buttons existed to the as-drawn defaults", () => {
    const saved = resolveDesign({ font: "serif", radius: "pill" });
    expect(saved).toMatchObject({
      buttonShape: "auto",
      buttonStyle: "solid",
      buttonSize: "md",
      headingWeight: "default",
      headingCase: "default",
    });
    expect(resolveDesign({ buttonShape: "blob", buttonSize: "xl" })).toEqual(DEFAULT_DESIGN);
    for (const shape of DESIGN_BUTTON_SHAPES) {
      expect(resolveDesign({ buttonShape: shape.id }).buttonShape).toBe(shape.id);
    }
    for (const style of DESIGN_BUTTON_STYLES) {
      expect(resolveDesign({ buttonStyle: style.id }).buttonStyle).toBe(style.id);
    }
  });

  // The whole point of the axis: `--maxw` and `--cols` move together, and the
  // CSS only has blocks for the non-defaults. An id that reached the DOM without
  // a matching block would render a shop with no width rule at all.
  it("falls back to contained for an unknown width", () => {
    expect(resolveDesign({ width: "ultrawide" }).width).toBe("contained");
  });

  it("keeps a known width", () => {
    expect(resolveDesign({ width: "full" }).width).toBe("full");
  });
});

describe("designAttrs", () => {
  // storefront.css only defines blocks for the non-defaults — the .sf-root
  // values remain the single definition of the built-in look. Stamping a
  // default would need a duplicate CSS block that could drift from it.
  it("omits an axis left at its default", () => {
    expect(designAttrs(DEFAULT_DESIGN)).toEqual({
      "data-font": undefined,
      "data-surface": undefined,
      "data-scale": undefined,
      "data-density": undefined,
      "data-radius": undefined,
      "data-width": undefined,
      "data-nav-hover": undefined,
      "data-nav-child-hover": undefined,
    });
  });

  it("stamps only the axes that differ", () => {
    expect(designAttrs({ ...DEFAULT_DESIGN, density: "airy" })).toEqual({
      "data-font": undefined,
      "data-surface": undefined,
      "data-scale": undefined,
      "data-density": "airy",
      "data-radius": undefined,
      "data-width": undefined,
      "data-nav-hover": undefined,
      "data-nav-child-hover": undefined,
    });
  });

  it("stamps every axis when all are set", () => {
    expect(
      designAttrs({
        font: "serif",
        surface: "parchment",
        scale: "lg",
        density: "airy",
        radius: "sharp",
        width: "full",
        navHover: "underline",
        navChildHover: "highlight",
        buttonShape: "pill",
        buttonStyle: "outline",
        buttonSize: "lg",
        headingWeight: "heavy",
        headingCase: "upper",
      }),
    ).toEqual({
      "data-font": "serif",
      "data-surface": "parchment",
      "data-scale": "lg",
      "data-density": "airy",
      "data-radius": "sharp",
      "data-width": "full",
      "data-nav-hover": "underline",
      "data-nav-child-hover": "highlight",
      "data-button-shape": "pill",
      "data-button-style": "outline",
      "data-button-size": "lg",
      "data-heading-weight": "heavy",
      "data-heading-case": "upper",
    });
  });
});
