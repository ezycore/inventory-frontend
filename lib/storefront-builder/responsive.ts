// coding-standard: maintained
import type { CSSProperties } from "react";
import type { Responsive } from "./settings";

/**
 * Responsive values become CSS custom properties — never a JavaScript branch.
 *
 * `--<name>` carries the desktop value and `--<name>-m` the phone override; the
 * builder stylesheet (`app/(storefront)/storefront-builder.css`) reads `var(--<name>-m, var(--<name>))`
 * below the storefront's one breakpoint. The server therefore paints the right
 * state on every device in the first byte, with nothing to correct after
 * hydration, and the HTML is identical for every visitor — which is what lets a
 * page be cached.
 *
 * The breakpoint is the storefront's existing one (`max-width: 679px` in
 * `storefront.css`). Keep `MOBILE_MAX_WIDTH` and every `@media` in `app/(storefront)/storefront-builder.css`
 * on it; a second breakpoint on the same page is the worst outcome.
 */
export const MOBILE_MAX_WIDTH = 679;

/** Custom properties for one responsive value; empty when the value is unset. */
export function responsiveVars<T extends string | number>(
  name: string,
  value: Responsive<T> | undefined,
  format: (value: T) => string = String,
): CSSProperties {
  if (!value) return {};
  // A phone-only value leaves the desktop var unset on purpose, so the
  // stylesheet's own fallback keeps drawing the desktop.
  const vars: Record<string, string> = {};
  if (value.base !== undefined) vars[`--${name}`] = format(value.base);
  if (value.mobile !== undefined) vars[`--${name}-m`] = format(value.mobile);
  return vars as CSSProperties;
}

/**
 * The class names that switch a responsive variable on, **one per screen it
 * actually answers for** — `"sfb-cols"`, `"sfb-cols-m"`, or both.
 *
 * ⚠ **Why this is not one class.** A rule like
 * `.sfb-cols { --cols: var(--sfb-cols) }` shadows the inherited value on every
 * element it lands on. When the merchant set a PHONE count only, `--sfb-cols`
 * is undefined, `--cols` computes to the guaranteed-invalid value, and
 * `grid-template-columns: repeat(var(--cols), …)` falls back to `none` — so
 * answering "2 on a phone" silently collapsed the DESKTOP grid to a single
 * column. Emitting the class per screen leaves the untouched screen on the
 * store's own ramp, which is what `responsiveVars` above already promises and
 * what the stylesheet could not deliver on its own.
 */
export function responsiveClasses<T extends string | number>(
  name: string,
  value: Responsive<T> | undefined,
): string | undefined {
  if (!value) return undefined;
  const classes = [
    value.base !== undefined ? name : "",
    value.mobile !== undefined ? `${name}-m` : "",
  ].filter(Boolean);
  return classes.length ? classes.join(" ") : undefined;
}
