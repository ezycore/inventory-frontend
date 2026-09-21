// coding-standard: maintained
import type { CSSProperties } from "react";
import { responsiveVars } from "./responsive";
import { readImage, type Responsive } from "./settings";
import {
  SECTION_ALIGNS,
  SECTION_TONES,
  SECTION_WIDTHS,
  SPACING_STEPS,
  type SpacingStep,
} from "./style-specs";

/**
 * The common style box every builder section carries (plan §5.2
 * `SectionStyle`): background, vertical padding, width, alignment and text tone.
 *
 * Resolved to CSS custom properties and two data attributes on the section
 * element, which `app/(storefront)/storefront-builder.css` turns into layout. Like `readSettings`, anything
 * invalid falls back to the default rather than failing the section — the
 * backend has already refused invalid style on save.
 */

// The vocabulary lives in `style-specs.ts`, which the backend's validator is
// generated from; re-exported here because the editor reaches the style box
// through this module and there must not be a second copy to keep in step.
export { SPACING_STEPS, type SpacingStep };

/** Fluid, so one step reads proportionately on a phone and a desktop. */
const SPACING: Record<SpacingStep, string> = {
  none: "0px",
  sm: "clamp(12px, 2vw, 20px)",
  md: "clamp(24px, 4vw, 40px)",
  lg: "clamp(40px, 6vw, 64px)",
  xl: "clamp(56px, 9vw, 96px)",
};

export type SectionWidth = (typeof SECTION_WIDTHS)[number];
export type SectionTone = (typeof SECTION_TONES)[number];
type Align = (typeof SECTION_ALIGNS)[number];

export interface SectionFrame {
  /** Custom properties for the section element. */
  style: CSSProperties;
  width: SectionWidth;
  tone: SectionTone;
  /**
   * The merchant chose a width on the Style tab, rather than leaving the
   * section its own.
   *
   * ⚠ **Not the same question as `width`**, which answers "content" for both an
   * unset box and an explicit Page column. Six sections carry a built-in column
   * of their own — `rich-text` and `faq` at 780px, `selected-products` and
   * `collections-row` at 980, `order-form` at 560, `video` at 880/420 — and
   * until 2026-09-21 that column silently beat the Width control, the Hero's W1
   * six times over. They now keep it only while this is false, which is the
   * same inverted precedence `ownsWidth` uses and for the same reason: a section
   * nobody has styled must not move.
   */
  styledWidth: boolean;
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
  /**
   * The section moves its own text, so the frame must not also try.
   *
   * `--sfb-align` is applied by `.sfb-sec { text-align: var(--sfb-align, left) }`,
   * which reaches every word in the section. A section with an alignment control
   * of its own — the hero's, on the Content tab — would then have two, and the
   * Style tab's would keep applying a value the merchant can no longer see or
   * clear once that control is hidden. Hiding the control is therefore not
   * enough on its own; the variables have to stop being emitted too.
   */
  ownsAlign?: boolean;
  /**
   * The section's own settings decide its width, so the Style tab's must not
   * also. The full-bleed hero is the case: its Layout control is already named
   * "Full width", and the Style tab offered a second control with the same
   * three options and the same words, which won.
   *
   * ⚠ **Not mechanically the same as `ownsAlign`.** Align is a variable that
   * simply stops being emitted. Width is a precedence chain —
   * `oneOf(…, style.width) ?? defaults?.width ?? "content"` — so this has to
   * INVERT that `??` and let the frame's own width win over the stored one.
   * Copying the `ownsAlign` shape here compiles and does nothing.
   *
   * Like `ownsAlign`, it travels with hiding the control: hide it without this
   * and a stored width keeps applying where nobody can see or clear it.
   */
  ownsWidth?: boolean;
}

/**
 * A heading row is a flex row, and `text-align` cannot move a flex item — which
 * is why the Style tab's alignment did nothing to eight sections' headings until
 * 2026-09-21. The frame emits the matching `justify-content` beside `--sfb-align`
 * and `.sfb-title-row` reads it; a classic page sets neither, so its rows keep
 * `space-between`.
 *
 * Typed as a total `Record`, so widening `SECTION_ALIGNS` (Phase 2 adds `right`)
 * fails to compile until this maps the new value too.
 */
const TITLE_JUSTIFY: Record<Align, string> = {
  left: "flex-start",
  center: "center",
};

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
  const base = oneOf(SECTION_ALIGNS, value.base);
  const mobile = oneOf(SECTION_ALIGNS, value.mobile);
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

  const align = readAlign(style.align);

  return {
    style: {
      ...(vars as CSSProperties),
      // Omitted entirely for a section that aligns its own text — see `ownsAlign`.
      ...(defaults?.ownsAlign
        ? {}
        : {
            ...responsiveVars("sfb-align", align),
            ...responsiveVars("sfb-title-justify", align, (value) => TITLE_JUSTIFY[value]),
          }),
    },
    // The frame first where it owns the width — see `ownsWidth`, and note this
    // is an inverted `??` rather than an omitted variable.
    width: defaults?.ownsWidth
      ? (defaults.width ?? "content")
      : (oneOf(SECTION_WIDTHS, style.width) ?? defaults?.width ?? "content"),
    tone: oneOf(SECTION_TONES, style.textTone) ?? "auto",
    // A section that owns its width has no Width control to obey.
    styledWidth: !defaults?.ownsWidth && oneOf(SECTION_WIDTHS, style.width) !== undefined,
  };
}
