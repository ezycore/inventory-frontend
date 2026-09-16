// coding-standard: maintained
import { SPACING_STEPS, type SpacingStep } from "@/lib/storefront-builder/section-style";
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
export type StyleEdge = "top" | "bottom";
export type BackgroundKind = "none" | "color" | "image";

export interface StylePadding {
  top: SpacingStep;
  bottom: SpacingStep;
}

type Align = "left" | "center";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStep = (value: unknown): value is SpacingStep =>
  typeof value === "string" && (SPACING_STEPS as readonly string[]).includes(value);

const readPadding = (value: unknown): StylePadding | undefined =>
  isPlainObject(value) && isStep(value.top) && isStep(value.bottom)
    ? { top: value.top, bottom: value.bottom }
    : undefined;

const readAlign = (value: unknown): Align | undefined =>
  value === "left" || value === "center" ? value : undefined;

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
 *   bottom as a pair and "Default" is the section's own frame, not a step.
 * - On a phone, with a desktop value, the choice is an override and clearing it
 *   goes back to the desktop's; with none, it becomes the desktop value too —
 *   a lone phone override is not a valid box.
 * - "Default" on the desktop clears the padding on every screen.
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

  if (device === "mobile" && base) {
    if (step === undefined) return { ...style, padding: { base } };
    return { ...style, padding: { base, mobile: { ...(mobile ?? base), [edge]: step } } };
  }
  if (step === undefined) return without(style, "padding");
  const next = { ...(base ?? { top: step, bottom: step }), [edge]: step };
  return { ...style, padding: mobile && device === "desktop" ? { base: next, mobile } : { base: next } };
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

  if (device === "mobile" && base) {
    return { ...style, align: value === undefined ? { base } : { base, mobile: value } };
  }
  if (value === undefined) return without(style, "align");
  return { ...style, align: mobile && device === "desktop" ? { base: value, mobile } : { base: value } };
}

/* ---------------------------- width and tone ---------------------------- */

export type StyleWidth = "content" | "wide" | "full";
export type StyleTone = "light" | "dark";

export const widthOf = (style: SectionStyleBox): StyleWidth | undefined =>
  style.width === "content" || style.width === "wide" || style.width === "full" ? style.width : undefined;

/** `auto` is the default and reads as unset, so the control shows "Default" for it. */
export const toneOf = (style: SectionStyleBox): StyleTone | undefined =>
  style.textTone === "light" || style.textTone === "dark" ? style.textTone : undefined;

export const withWidth = (style: SectionStyleBox, width: StyleWidth | undefined): SectionStyleBox =>
  width === undefined ? without(style, "width") : { ...style, width };

export const withTone = (style: SectionStyleBox, tone: StyleTone | undefined): SectionStyleBox =>
  tone === undefined ? without(style, "textTone") : { ...style, textTone: tone };

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
