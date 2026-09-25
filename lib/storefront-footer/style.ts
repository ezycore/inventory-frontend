// coding-standard: maintained
import type { CSSProperties } from "react";
import { readableTextOn } from "@/lib/color-contrast";
import type {
  FooterBottomAlign,
  FooterPhoneGroups,
  FooterSpacing,
  StorefrontFooterStyle,
} from "./types";

/**
 * The footer's frame, resolved to what `FooterShell` puts on the element:
 * `data-*` switches the stylesheet reads and custom properties it consumes.
 *
 * Nothing here branches on the device. The phone value travels as a `-m`
 * variable (or a `data-*-m` attribute) beside the desktop one and the
 * stylesheet picks, so the server paints the right state on every device in
 * the first byte — the builder's own rule (`lib/storefront-builder/responsive.ts`).
 *
 * An unset style returns no attributes and only the layout's own padding,
 * which is the pre-existing footer to the pixel.
 */
export interface FooterFrame {
  attrs: Record<string, string>;
  style: CSSProperties;
}

/** Vertical padding per step. `regular` is each layout's own (`defaults`). */
const SPACING: Record<Exclude<FooterSpacing, "regular">, { top: number; bottom: number }> = {
  compact: { top: 22, bottom: 18 },
  roomy: { top: 56, bottom: 40 },
};

const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const LIGHT_INK = "#ffffff";
const DARK_INK = "#111827";
/** The `dark` ground — a near-black that is not the dark theme's own card. */
export const FOOTER_DARK_GROUND = "#15171c";
const DEFAULT_OVERLAY = 55;

function padding(step: FooterSpacing | undefined, defaults: { top: number; bottom: number }) {
  return !step || step === "regular" ? defaults : SPACING[step];
}

/**
 * The ink the footer's text takes, or `undefined` for "the theme's own".
 * Only a ground the theme did not pick (brand, dark, a custom colour, a photo)
 * needs one — `card` and `surface` are theme tokens and already readable.
 */
function footerInk(style: StorefrontFooterStyle): string | undefined {
  if (style.tone === "light") return LIGHT_INK;
  if (style.tone === "dark") return DARK_INK;
  if (style.bgImage?.url) return LIGHT_INK;
  switch (style.ground) {
    case "dark":
      return "#f4f4f5";
    case "brand":
      return "var(--on-primary)";
    case "custom":
      return style.color && HEX.test(style.color) ? readableTextOn(style.color) : undefined;
    default:
      return undefined;
  }
}

function groundColor(style: StorefrontFooterStyle): string | undefined {
  switch (style.ground) {
    case "surface":
      return "var(--surface)";
    case "brand":
      return "var(--primary)";
    case "dark":
      return FOOTER_DARK_GROUND;
    case "custom":
      return style.color && HEX.test(style.color) ? style.color : undefined;
    default:
      return undefined;
  }
}

export function footerFrame(
  style: StorefrontFooterStyle | undefined,
  defaults: { top: number; bottom: number },
): FooterFrame {
  const s = style ?? {};
  const attrs: Record<string, string> = {};
  const vars: Record<string, string> = {};

  const ground = groundColor(s);
  if (ground) {
    attrs["data-ground"] = s.ground ?? "card";
    vars["--ft-bg"] = ground;
  }
  const ink = footerInk(s);
  if (ink) {
    attrs["data-ink"] = "";
    vars["--ft-ink"] = ink;
  }
  if (s.topBorder === false) attrs["data-border"] = "none";

  const desktop = padding(s.spacing?.base, defaults);
  const phone = s.spacing?.mobile ? padding(s.spacing.mobile, defaults) : undefined;
  vars["--ft-pt"] = `${desktop.top}px`;
  vars["--ft-pb"] = `${desktop.bottom}px`;
  if (phone) {
    vars["--ft-pt-m"] = `${phone.top}px`;
    vars["--ft-pb-m"] = `${phone.bottom}px`;
  }

  const css: CSSProperties = { ...(vars as CSSProperties) };
  const photo = s.bgImage?.mediumUrl || s.bgImage?.url;
  if (photo) {
    // The overlay is the text's ground: dark under light ink, light under dark.
    const alpha = Math.min(Math.max(s.overlay ?? DEFAULT_OVERLAY, 0), 90) / 100;
    const veil = ink === DARK_INK ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    css.backgroundImage = `linear-gradient(${veil}, ${veil}), url("${photo.replace(/"/g, "%22")}")`;
    css.backgroundSize = "cover";
    css.backgroundPosition = `${s.bgFocal?.x ?? 50}% ${s.bgFocal?.y ?? 50}%`;
  }
  return { attrs, style: css };
}

/** The © line's arrangement per device; unset follows the layout. */
export function footerBottomAlign(
  style: StorefrontFooterStyle | undefined,
  layoutDefault: FooterBottomAlign,
): { desktop: FooterBottomAlign; phone: FooterBottomAlign } {
  const desktop = style?.bottomAlign?.base ?? layoutDefault;
  return { desktop, phone: style?.bottomAlign?.mobile ?? desktop };
}

/** Whether the link group at `index` starts open on a phone. */
export function footerGroupStartsOpen(mode: FooterPhoneGroups | undefined, index: number): boolean {
  if (mode === "closed") return false;
  if (mode === "first") return index === 0;
  return true;
}
