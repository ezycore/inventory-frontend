// coding-standard: maintained

/**
 * Hero-slide focal point — where a photo must not be cropped away.
 *
 * One upload fills a wide desktop hero and a 16:9 mobile photo row. A centred
 * cover crop can still lose an off-centre face, product or logo, so this point
 * records the subject that must survive both frames.
 *
 * This module is the ONE place a stored `{ x, y }` becomes the CSS that acts on
 * it, the same rule `mediaFitFor`/`mediaRatioFor` follow in
 * `storefront-templates.ts` (it lives here rather than there only because that
 * file is at its size limit). Two callers, and they must never drift: the
 * storefront carousel paints with it, and the Customize picker previews with it.
 */

/** Percent of the image's own box: 0/0 is its top-left corner, 100/100 bottom-right. */
export interface StoreFocalPoint {
  x: number;
  y: number;
}

/** What an unset focal point means, and where the picker starts. */
export const CENTRE_FOCAL: StoreFocalPoint = { x: 50, y: 50 };

/** Percentages come from a pointer position, so they can land outside the box. */
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * `focal` → `background-position`.
 *
 * Undefined in, undefined out — the stylesheet already says `center`, so an
 * unset point must leave that rule alone rather than re-stating it as an inline
 * `50% 50%` that would outrank any future override.
 */
export function focalPosition(
  focal?: StoreFocalPoint | null,
): string | undefined {
  if (!focal) return undefined;
  return `${clampPercent(focal.x)}% ${clampPercent(focal.y)}%`;
}
