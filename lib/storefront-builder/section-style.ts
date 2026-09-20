// coding-standard: maintained
import type { CSSProperties } from "react";
import { responsiveVars } from "./responsive";
import { readImage, type Responsive } from "./settings";

/**
 * The common style box every builder section carries (plan §5.2
 * `SectionStyle`): background, vertical padding, width, alignment and text tone.
 *
 * Resolved to CSS custom properties and two data attributes on the section
 * element, which `app/(storefront)/storefront-builder.css` turns into layout. Like `readSettings`, anything
 * invalid falls back to the default rather than failing the section — the
 * backend has already refused invalid style on save.
 */

export const SPACING_STEPS = ["none", "sm", "md", "lg", "xl"] as const;
export type SpacingStep = (typeof SPACING_STEPS)[number];

/** Fluid, so one step reads proportionately on a phone and a desktop. */
const SPACING: Record<SpacingStep, string> = {
  none: "0px",
  sm: "clamp(12px, 2vw, 20px)",
  md: "clamp(24px, 4vw, 40px)",
  lg: "clamp(40px, 6vw, 64px)",
  xl: "clamp(56px, 9vw, 96px)",
};

export type SectionWidth = "content" | "wide" | "full";
export type SectionTone = "auto" | "light" | "dark";
type Align = "left" | "center";

export interface SectionFrame {
  /** Custom properties for the section element. */
  style: CSSProperties;
  width: SectionWidth;
  tone: SectionTone;
}

/**
 * A section type's own frame where the style box sets nothing: the padding, band
 * and width it has on the classic home page, so a home moved onto the builder
 * keeps its spacing. CSS values rather than spacing steps — the home page's
 * sections were never spaced in steps, and they are not merchant choices.
 */
export interface FrameDefaults {
  top: string;
  bottom: string;
  /** A full-width tint behind the section, in the theme's own colour. */
  band?: "surface" | "accent-soft";
  width?: SectionWidth;
}

const DEFAULT_PADDING = { top: "md", bottom: "md" } as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const oneOf = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  typeof value === "string" && (values as readonly string[]).includes(value) ? (value as T) : undefined;

const readPadding = (value: unknown): { top: SpacingStep; bottom: SpacingStep } | undefined => {
  if (!isPlainObject(value)) return undefined;
  const top = oneOf(SPACING_STEPS, value.top);
  const bottom = oneOf(SPACING_STEPS, value.bottom);
  return top && bottom ? { top, bottom } : undefined;
};

const readAlign = (value: unknown): Responsive<Align> | undefined => {
  if (!isPlainObject(value)) return undefined;
  const base = oneOf(["left", "center"] as const, value.base);
  const mobile = oneOf(["left", "center"] as const, value.mobile);
  // A phone value with no desktop one stands on its own: the desktop keeps the
  // section's own alignment, which is what the merchant left it on.
  if (!base) return mobile ? { mobile } : undefined;
  return mobile ? { base, mobile } : { base };
};

/**
 * Resolve a section instance's `style` into the element's frame. `defaults` is
 * the section type's own frame (`FrameDefaults`); without one, unset padding is
 * `md`, the background none and the width the content column.
 */
export function sectionFrame(raw: unknown, defaults?: FrameDefaults): SectionFrame {
  const style = isPlainObject(raw) ? raw : {};
  const vars: Record<string, string> = {};

  const padding = isPlainObject(style.padding) ? style.padding : {};
  const base = readPadding(padding.base);
  const mobile = readPadding(padding.mobile);
  if (base || !defaults) {
    vars["--sfb-pt"] = SPACING[(base ?? DEFAULT_PADDING).top];
    vars["--sfb-pb"] = SPACING[(base ?? DEFAULT_PADDING).bottom];
  } else {
    vars["--sfb-pt"] = defaults.top;
    vars["--sfb-pb"] = defaults.bottom;
  }
  if (mobile) {
    vars["--sfb-pt-m"] = SPACING[mobile.top];
    vars["--sfb-pb-m"] = SPACING[mobile.bottom];
  }

  const background = isPlainObject(style.background) ? style.background : {};
  if (background.kind === "color" && typeof background.color === "string" && HEX_COLOR.test(background.color)) {
    vars["--sfb-bg"] = background.color;
  } else if (background.kind === "image") {
    const image = readImage(background.image);
    // JSON string quoting is valid CSS string syntax; the URL is already a
    // plain http(s) link with no whitespace, so it cannot break out of url().
    if (image) vars["--sfb-bg-image"] = `url(${JSON.stringify(image.url)})`;
  } else if (defaults?.band) {
    // An explicit "none" takes the band away; anything unset keeps it.
    vars["--sfb-bg"] = background.kind === "none" ? "transparent" : `var(--${defaults.band})`;
  }

  return {
    style: { ...(vars as CSSProperties), ...responsiveVars("sfb-align", readAlign(style.align)) },
    width: oneOf(["content", "wide", "full"] as const, style.width) ?? defaults?.width ?? "content",
    tone: oneOf(["auto", "light", "dark"] as const, style.textTone) ?? "auto",
  };
}
