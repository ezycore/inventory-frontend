// coding-standard: maintained

/**
 * A column count as a whole CSS track list.
 *
 * ⚠ **The variable carries the track list, not the number.** A rule written as
 * `repeat(var(--cols, 3), …)` needs a second selector to know whether the
 * merchant answered at all, and the obvious one — `[style*="--cols"]` — also
 * matches `--cols-m`, so a phone-only answer switches the DESKTOP to a track
 * list built from a variable that is not set there. Putting the whole list in
 * the variable lets the stylesheet's own `var(…, <the row's own layout>)`
 * fallback be the unset case, which is what keeps a row nobody has touched
 * rendering exactly as before.
 */
export const TRACK = (columns: number): string => `repeat(${columns}, minmax(0, 1fr))`;
