// coding-standard: maintained
/**
 * Every picture shape the builder offers, as CSS `aspect-ratio` values.
 *
 * One map, because five sections name the same shapes and four of them had
 * grown a private copy: `image-banner`, `gallery`, `image-text` and `video`
 * each declared their own `RATIOS`, and the hero was about to be the fifth.
 * Four copies of one table is four chances for "4:5" to mean different things
 * on two screens of the same editor, and the first ratio anybody adds lands in
 * one of them.
 *
 * Keys are the enum values in `section-specs.ts`; each section indexes this
 * with its own subset, so a section that offers three shapes still cannot ask
 * for a fourth. Adding a shape here does NOT offer it anywhere — the section's
 * spec decides that, and `VALUE_LABELS` in `section-catalogue.ts` decides what
 * the merchant sees it called.
 */
export const ASPECT_RATIOS = {
  "4:1": "4 / 1",
  "3:1": "3 / 1",
  "21:9": "21 / 9",
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "3:4": "3 / 4",
  "9:16": "9 / 16",
} as const satisfies Record<string, string>;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

/**
 * The same shapes as a PERCENTAGE of width — `height / width`, the value the
 * pre-`aspect-ratio` padding trick takes. Derived from the map above rather
 * than typed out again, so the two cannot drift when a shape is added.
 *
 * It exists because `aspect-ratio` FIXES a box, and one caller needs a box that
 * can still grow: the full-width hero lays its type over the photograph, so a
 * wide shape on a narrow screen leaves less room than the words need, and a
 * fixed box under `overflow: hidden` cuts them off — measured, on the real
 * stylesheet: Cinema 21:9 on a phone sliced the badge's ascenders.
 *
 * ⚠ **No `min-height` rescues it.** `0`, `auto`, `fit-content`, `min-content`
 * and `max-content` were all measured in Chrome against the live hero and every
 * one lost to the ratio — the box stayed at the ratio's height and the copy
 * overflowed above it. A zero-width spacer carrying this percentage as
 * `padding-top` ADDS to the layout instead of fixing the box, so the hero ends
 * up as tall as the shape or as tall as its words, whichever is more.
 *
 * Every other caller wants the fixed box and keeps `aspect-ratio`: their
 * picture is a slot with nothing to overflow.
 */
export const ASPECT_RATIO_PADDING = Object.fromEntries(
  Object.entries(ASPECT_RATIOS).map(([key, value]) => {
    const [w, h] = value.split("/").map((part) => Number(part.trim()));
    return [key, `${((h / w) * 100).toFixed(4)}%`];
  }),
) as Record<AspectRatio, string>;
