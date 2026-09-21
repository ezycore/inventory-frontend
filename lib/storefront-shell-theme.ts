// coding-standard: maintained
import type { CSSProperties } from "react";
import { brightenForDark, readableTextOn } from "@/lib/color-contrast";

export interface ShellTheme {
  /** Custom properties for the `.sf-shell` element's inline style. */
  style: CSSProperties;
  /** Stamp `data-brand` — a brand colour is set. */
  brand: boolean;
  /** Stamp `data-accent` — a second colour that differs from the brand. */
  accent: boolean;
}

/**
 * The merchant's colours as the custom properties `storefront.css` reads under
 * `.sf-shell[data-brand]` / `[data-accent]`.
 *
 * Both theme variants ship as vars — the stylesheet picks per `data-theme`, so a
 * dark brand is auto-lifted on the dark theme and stays readable.
 *
 * The accent is published only when it actually differs from the brand: an
 * accent equal to the brand is not a second colour, and `--accent*` already
 * falls back to the primary pair in storefront.css, so stamping it would be a
 * no-op that costs two attributes and a stack of vars.
 *
 * Shared by `StoreShell` (which passes the Customize draft first) and the
 * header-less Storefront Builder frame, so a landing page without the shell's
 * JavaScript is still painted in the shop's colours.
 */
export function shellTheme(brandColor?: string, accentColor?: string): ShellTheme {
  const darkBrand = brandColor ? brightenForDark(brandColor) : undefined;
  const accent =
    accentColor && accentColor.toLowerCase() !== brandColor?.toLowerCase()
      ? accentColor
      : undefined;
  const darkAccent = accent ? brightenForDark(accent) : undefined;

  const style = {
    ...(brandColor
      ? {
          "--sf-brand-light": brandColor,
          "--sf-brand-dark": darkBrand,
          "--sf-brand-on-light": readableTextOn(brandColor),
          "--sf-brand-on-dark": readableTextOn(darkBrand ?? brandColor),
        }
      : {}),
    ...(accent
      ? {
          "--sf-accent-light": accent,
          "--sf-accent-dark": darkAccent,
          "--sf-accent-on-light": readableTextOn(accent),
          "--sf-accent-on-dark": readableTextOn(darkAccent ?? accent),
        }
      : {}),
  } as CSSProperties;

  return { style, brand: !!brandColor, accent: !!accent };
}
