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
  const vars: Record<string, string> = { [`--${name}`]: format(value.base) };
  if (value.mobile !== undefined) vars[`--${name}-m`] = format(value.mobile);
  return vars as CSSProperties;
}
