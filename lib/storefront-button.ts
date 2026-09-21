// coding-standard: maintained
import type { CSSProperties } from "react";

/**
 * The store's button choices (Customize → Buttons: shape, style, size — plan
 * §5.1 `buttons`) applied to one button's own measurements.
 *
 * The storefront's buttons were drawn one by one — 8px corners in the cart
 * drawer, 9px on the buy panel, 12px/22px padding here, 14px there — so there
 * is no single "default button" to restyle. Instead every brand button states
 * what it has always been, and reads the store's tokens (`--btn-radius`,
 * `--btn-bg`, `--btn-fg`, `--btn-ring`, `--btn-scale`, set in storefront.css
 * only for a non-default choice) with those literals as the fallback. A store
 * that never opened Buttons defines none of the tokens, so each button resolves
 * to exactly the values it had: backward compatible by construction, not by a
 * matching set of defaults someone has to keep in step.
 */

/** A length as a button's style has always written it: px as a number, or any CSS value. */
type Length = number | string;

export interface ButtonMetrics {
  /** The corners this button has always had; a Buttons shape replaces them. */
  radius: Length;
  /** Its padding as written ("12px 22px", 14, "0 4px"); a Buttons size scales the px in it. */
  padding: Length;
  /** Its type size in px; scaled with the padding. */
  fontSize: number;
  /** A minimum height it keeps, scaled with the rest. */
  minHeight?: number;
}

const SCALE = "var(--btn-scale, 1)";

const cssLength = (value: Length) => (typeof value === "number" ? `${value}px` : value);

/**
 * Padding with each px length multiplied by the size token. Anything that is not
 * a plain px length (`0`, `var(--pad)`) is left as it is — the size of a button
 * is its own padding, never the page's.
 */
export function scaledPadding(padding: Length): string {
  if (typeof padding === "number") return `calc(${padding}px * ${SCALE})`;
  return padding
    .trim()
    .split(/\s+/)
    .map((token) => (/^\d*\.?\d+px$/.test(token) ? `calc(${token} * ${SCALE})` : token))
    .join(" ");
}

/**
 * A button's shape and size only — for a plain button (a secondary, an outline
 * already) that sits beside a brand one and must keep the same corners and size
 * as it, but not its fill.
 */
export function buttonMetrics({ radius, padding, fontSize, minHeight }: ButtonMetrics): CSSProperties {
  return {
    borderRadius: `var(--btn-radius, ${cssLength(radius)})`,
    padding: scaledPadding(padding),
    fontSize: `calc(${fontSize}px * ${SCALE})`,
    ...(minHeight === undefined ? {} : { minHeight: `calc(${minHeight}px * ${SCALE})` }),
  };
}

/**
 * A brand-coloured button: shape and size (`buttonMetrics`) plus the fill the
 * store's Buttons style gives it.
 *
 * `overPhoto` keeps the solid brand fill whatever the style — a clear outline
 * button in the brand colour can disappear into a hero picture. `bordered` is a
 * button that already draws a brand-colour border, which the Outline style's
 * ring would only thicken.
 */
export function brandButton(
  metrics: ButtonMetrics,
  { overPhoto = false, bordered = false }: { overPhoto?: boolean; bordered?: boolean } = {},
): CSSProperties {
  const fill: CSSProperties = overPhoto
    ? { background: "var(--primary)", color: "var(--on-primary)" }
    : {
        background: "var(--btn-bg, var(--primary))",
        color: "var(--btn-fg, var(--on-primary))",
        ...(bordered ? {} : { boxShadow: "var(--btn-ring, none)" }),
      };
  return { ...fill, ...buttonMetrics(metrics) };
}
