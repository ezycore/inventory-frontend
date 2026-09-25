// coding-standard: maintained
import { SPACING_STEPS, type SpacingStep } from "@/lib/storefront-builder/section-style";
import {
  ANCHOR_PATTERN,
  MAX_BORDER_WIDTH,
  MAX_OVERLAY,
  MIN_BORDER_WIDTH,
  SECTION_ALIGNS,
  SECTION_BORDER_SIDES,
  SECTION_BORDER_TONES,
  SECTION_RADII,
} from "@/lib/storefront-builder/style-specs";
import type { EditorDevice, EditorSection } from "./section-instances";

/**
 * Pure edits to a section's style box (plan §5.2 `SectionStyle`), as the
 * inspector's Style tab makes them.
 *
 * Every write leaves a shape the backend accepts (`checkStyle`): unset is
 * stored as no key at all — never `""` or `"auto"` — so "Default" means the
 * section's own frame, exactly as `sectionFrame` reads it. A section whose
 * style is empty carries no `style` key.
 */

export type SectionStyleBox = Record<string, unknown>;
export type StyleEdge = "top" | "bottom" | "inline";
export type BackgroundKind = "none" | "color" | "image";

export interface StylePadding {
  top: SpacingStep;
  bottom: SpacingStep;
  /** The side gutter. Added after top and bottom, so a stored pair may lack it. */
  inline?: SpacingStep;
}

type Align = (typeof SECTION_ALIGNS)[number];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStep = (value: unknown): value is SpacingStep =>
  typeof value === "string" && (SPACING_STEPS as readonly string[]).includes(value);

const readPadding = (value: unknown): StylePadding | undefined =>
  isPlainObject(value) && isStep(value.top) && isStep(value.bottom)
    ? { top: value.top, bottom: value.bottom, ...(isStep(value.inline) ? { inline: value.inline } : {}) }
    : undefined;

const isOneOf = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  typeof value === "string" && (values as readonly string[]).includes(value) ? (value as T) : undefined;

const readAlign = (value: unknown): Align | undefined => isOneOf(SECTION_ALIGNS, value);

export const styleOf = (section: EditorSection): SectionStyleBox =>
  isPlainObject(section.style) ? section.style : {};

/** The section with `style` replaced — or removed, when nothing is left in it. */
export function withStyle(section: EditorSection, style: SectionStyleBox): EditorSection {
  const { style: _previous, ...rest } = section;
  return Object.keys(style).length === 0 ? rest : { ...rest, style };
}

const without = (style: SectionStyleBox, key: string): SectionStyleBox => {
  const { [key]: _removed, ...rest } = style;
  return rest;
};

/* ------------------------------- padding ------------------------------- */

/** What the padding controls show on `device`, and whether that device set it itself. */
export function paddingFor(style: SectionStyleBox, device: EditorDevice): { value?: StylePadding; own: boolean } {
  const padding = isPlainObject(style.padding) ? style.padding : {};
  const base = readPadding(padding.base);
  if (device === "desktop") return { value: base, own: !!base };
  const mobile = readPadding(padding.mobile);
  return { value: mobile ?? base, own: !!mobile };
}

/**
 * Set one edge on `device`, or clear it with `undefined`.
 *
 * - A first choice fills both edges with it, since the backend stores top and
 *   bottom as a pair and the empty choice is the section's own frame, not a step.
 * - **On a phone the choice is always the phone's**, whether or not the desktop
 *   has one, and clearing it goes back to the desktop's. Writing the base from
 *   the phone tab is what used to move a desktop page nobody was looking at.
 * - Clearing on the desktop drops the padding on every screen.
 */
export function withPadding(
  style: SectionStyleBox,
  edge: StyleEdge,
  step: SpacingStep | undefined,
  device: EditorDevice,
): SectionStyleBox {
  const padding = isPlainObject(style.padding) ? style.padding : {};
  const base = readPadding(padding.base);
  const mobile = readPadding(padding.mobile);

  // ⚠ `inline` is NOT part of that pair. Top and bottom are required together,
  // so a first choice on either fills both; the side gutter is optional and
  // stands alone, and clearing it must leave the pair behind rather than drop
  // the whole padding.
  const seeded = (from: StylePadding | undefined): StylePadding =>
    from ?? { top: step ?? "none", bottom: step ?? "none" };
  const setEdge = (from: StylePadding | undefined): StylePadding | undefined => {
    if (edge !== "inline") return { ...seeded(from), [edge]: step as SpacingStep };
    if (step === undefined) {
      if (!from) return undefined;
      const { inline: _dropped, ...pair } = from;
      return pair;
    }
    return from ? { ...from, inline: step } : { top: "none", bottom: "none", inline: step };
  };

  if (device === "mobile") {
    if (step === undefined && edge !== "inline") {
      return base ? { ...style, padding: { base } } : without(style, "padding");
    }
    const phone = setEdge(mobile ?? base);
    if (!phone) return base ? { ...style, padding: { base } } : without(style, "padding");
    return { ...style, padding: base ? { base, mobile: phone } : { mobile: phone } };
  }
  if (step === undefined && edge !== "inline") return without(style, "padding");
  const next = setEdge(base);
  if (!next) return mobile ? { ...style, padding: { mobile } } : without(style, "padding");
  return { ...style, padding: mobile ? { base: next, mobile } : { base: next } };
}

/* ------------------------------ alignment ------------------------------ */

export function alignFor(style: SectionStyleBox, device: EditorDevice): { value?: Align; own: boolean } {
  const align = isPlainObject(style.align) ? style.align : {};
  const base = readAlign(align.base);
  if (device === "desktop") return { value: base, own: !!base };
  const mobile = readAlign(align.mobile);
  return { value: mobile ?? base, own: !!mobile };
}

/** Same rules as `withPadding`, for the responsive text alignment. */
export function withAlign(style: SectionStyleBox, value: Align | undefined, device: EditorDevice): SectionStyleBox {
  const align = isPlainObject(style.align) ? style.align : {};
  const base = readAlign(align.base);
  const mobile = readAlign(align.mobile);

  if (device === "mobile") {
    if (value === undefined) return base ? { ...style, align: { base } } : without(style, "align");
    return { ...style, align: base ? { base, mobile: value } : { mobile: value } };
  }
  if (value === undefined) return without(style, "align");
  return { ...style, align: mobile && device === "desktop" ? { base: value, mobile } : { base: value } };
}

/* ---------------------------- width and tone ---------------------------- */

export type StyleWidth = "content" | "wide" | "full";
export type StyleTone = "light" | "dark" | "custom";
export type StyleRadius = (typeof SECTION_RADII)[number];
export type StyleBorderSides = (typeof SECTION_BORDER_SIDES)[number];
export type StyleBorderTone = (typeof SECTION_BORDER_TONES)[number];

export const widthOf = (style: SectionStyleBox): StyleWidth | undefined =>
  style.width === "content" || style.width === "wide" || style.width === "full" ? style.width : undefined;

/** `auto` is the default and reads as unset, so the control shows "Default" for it. */
export const toneOf = (style: SectionStyleBox): StyleTone | undefined =>
  style.textTone === "light" || style.textTone === "dark" || style.textTone === "custom"
    ? style.textTone
    : undefined;

export const radiusOf = (style: SectionStyleBox): StyleRadius | undefined =>
  isOneOf(SECTION_RADII, style.radius);

export const borderOf = (style: SectionStyleBox): boolean => style.border === true;

/* The line's own three keys. Each reads as unset when absent, so the controls
   show the choice that draws today's hairline rather than inventing a value. */

export const borderSidesOf = (style: SectionStyleBox): StyleBorderSides | undefined =>
  isOneOf(SECTION_BORDER_SIDES, style.borderSides);

export const borderToneOf = (style: SectionStyleBox): StyleBorderTone | undefined =>
  isOneOf(SECTION_BORDER_TONES, style.borderTone);

export const borderWidthOf = (style: SectionStyleBox): number | undefined =>
  typeof style.borderWidth === "number" &&
  Number.isInteger(style.borderWidth) &&
  style.borderWidth >= MIN_BORDER_WIDTH &&
  style.borderWidth <= MAX_BORDER_WIDTH
    ? style.borderWidth
    : undefined;

export const overlayOf = (style: SectionStyleBox): number | undefined =>
  typeof style.overlay === "number" && Number.isInteger(style.overlay) && style.overlay >= 0 && style.overlay <= MAX_OVERLAY
    ? style.overlay
    : undefined;

export const textColorOf = (style: SectionStyleBox): string | undefined =>
  typeof style.textColor === "string" && HEX_COLOR.test(style.textColor) ? style.textColor : undefined;

/**
 * The link names every OTHER section on the page already carries — what the
 * anchor field lists as suggestions, and what it warns about. Two sections
 * sharing a name would give the page two elements with one `id`, where a link
 * finds whichever comes first.
 */
export const siblingAnchors = (sections: readonly EditorSection[], exceptId: string): string[] => [
  ...new Set(
    sections
      .filter((section) => section.id !== exceptId)
      .map((section) => anchorOf(styleOf(section)))
      .filter((anchor): anchor is string => anchor !== undefined),
  ),
];

export const anchorOf = (style: SectionStyleBox): string | undefined =>
  typeof style.anchor === "string" && new RegExp(ANCHOR_PATTERN).test(style.anchor) ? style.anchor : undefined;

export const withWidth = (style: SectionStyleBox, width: StyleWidth | undefined): SectionStyleBox =>
  width === undefined ? without(style, "width") : { ...style, width };

/**
 * ⚠ Clearing the tone leaves `textColor` alone. Hidden is not erased: a merchant
 * who tries `light` and comes back to `custom` finds the colour they picked.
 * `sectionFrame` reads it only on `custom`, so the stored value draws nothing
 * meanwhile.
 */
export const withTone = (style: SectionStyleBox, tone: StyleTone | undefined): SectionStyleBox =>
  tone === undefined ? without(style, "textTone") : { ...style, textTone: tone };

export const withRadius = (style: SectionStyleBox, radius: StyleRadius | undefined): SectionStyleBox =>
  radius === undefined ? without(style, "radius") : { ...style, radius };

/**
 * ⚠ Switching the line OFF leaves its sides, tone and thickness alone — the
 * rule `withTone` follows for `textColor`. `sectionFrame` reads none of them
 * while `border` is absent, so nothing is drawn meanwhile, and a merchant who
 * turns the line back on finds the line they had built.
 */
export const withBorder = (style: SectionStyleBox, border: boolean): SectionStyleBox =>
  border ? { ...style, border: true } : without(style, "border");

export const withBorderSides = (style: SectionStyleBox, sides: StyleBorderSides | undefined): SectionStyleBox =>
  sides === undefined ? without(style, "borderSides") : { ...style, borderSides: sides };

export const withBorderTone = (style: SectionStyleBox, tone: StyleBorderTone | undefined): SectionStyleBox =>
  tone === undefined ? without(style, "borderTone") : { ...style, borderTone: tone };

export const withBorderWidth = (style: SectionStyleBox, width: number | undefined): SectionStyleBox =>
  width === undefined ? without(style, "borderWidth") : { ...style, borderWidth: width };

export const withOverlay = (style: SectionStyleBox, overlay: number | undefined): SectionStyleBox =>
  overlay === undefined ? without(style, "overlay") : { ...style, overlay };

/**
 * Keep what is typed until it is a whole `#RRGGBB`, the same way the background
 * colour does — the backend refuses a partial hex, so storing one as it is typed
 * would make the section unsaveable halfway through the word.
 */
export const withTextColor = (style: SectionStyleBox, color: string | undefined): SectionStyleBox =>
  color && HEX_COLOR.test(color) ? { ...style, textColor: color } : without(style, "textColor");

export const withAnchor = (style: SectionStyleBox, anchor: string | undefined): SectionStyleBox => {
  const trimmed = anchor?.trim();
  return trimmed && new RegExp(ANCHOR_PATTERN).test(trimmed)
    ? { ...style, anchor: trimmed }
    : without(style, "anchor");
};

/* ------------------------------ background ------------------------------ */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export interface StyleBackground {
  kind?: BackgroundKind;
  color?: string;
  image?: unknown;
}

export function backgroundOf(style: SectionStyleBox): StyleBackground {
  if (!isPlainObject(style.background)) return {};
  const { kind, color, image } = style.background;
  return {
    kind: kind === "none" || kind === "color" || kind === "image" ? kind : undefined,
    color: typeof color === "string" && HEX_COLOR.test(color) ? color : undefined,
    image: isPlainObject(image) ? image : undefined,
  };
}

/**
 * Choose what is behind the section. Switching kind drops the other kind's
 * value, so a picture never lingers under a colour; a colour is stored only once
 * it is a whole `#RRGGBB`, since the backend refuses anything else.
 */
export function withBackground(
  style: SectionStyleBox,
  kind: BackgroundKind | undefined,
  value?: { color?: string; image?: unknown },
): SectionStyleBox {
  if (kind === undefined) return without(style, "background");
  const background: Record<string, unknown> = { kind };
  if (kind === "color" && value?.color && HEX_COLOR.test(value.color)) background.color = value.color;
  if (kind === "image" && isPlainObject(value?.image)) background.image = value.image;
  return { ...style, background };
}
