// coding-standard: maintained

/**
 * Does a picked image match the shape its field asks for?
 *
 * Every image field in the product already tells the merchant a recommended
 * size — *"Square 1600 × 1600 px works best"*, *"1600 × 640 px (2.5:1) works
 * best"*. Until now that was the whole story: the hint sat there, an off-shape
 * upload was accepted in silence, and the merchant discovered the crop later by
 * looking at their own shop.
 *
 * **We warn instead of cropping, deliberately.** A merchant's photograph is
 * stored exactly as they sent it (`uploadImage` resizes down a ladder but never
 * changes the aspect), because the shop is theirs and a silent crop is us
 * deciding what their product looks like. The trade is that a wrong-shaped
 * upload has to be visible at the moment it happens, while re-picking costs one
 * click — which is what this is for.
 *
 * Advisory, never blocking. Some photographs genuinely cannot be reshot, and a
 * shop with a slightly-letterboxed picture is better than a shop with none.
 */

export interface ImageSize {
  w: number;
  h: number;
}

/**
 * How far off a ratio may be before it is worth mentioning: **10%**.
 *
 * Chosen so the warning stays worth reading. A 1600×1500 upload against a square
 * field is 6.7% out and loses a barely-visible sliver — warn about that and the
 * message becomes noise people learn to ignore, which costs more than it saves.
 * The mismatches that actually spoil a grid are far past this line: a portrait
 * phone photo in a square field is 50% out, and a 3:2 landscape in a 2.5:1 hero
 * is 40%.
 */
const TOLERANCE = 0.1;

/**
 * Read a picked file's real pixel dimensions, in the browser.
 *
 * `null` for anything we cannot measure — a vector logo, a corrupt file, a type
 * the browser will not decode. **Unmeasurable must never warn**: an SVG has no
 * natural pixel shape to be wrong about, and favicons are explicitly allowed to
 * be SVG.
 */
export function readImageSize(file: File): Promise<ImageSize | null> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    // The object URL is revoked on BOTH paths — a decode failure that leaked it
    // would hold the whole file in memory for the life of the tab, and picking
    // a few large photos is exactly when that matters.
    const done = (size: ImageSize | null) => {
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onload = () =>
      done(
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? { w: img.naturalWidth, h: img.naturalHeight }
          : null,
      );
    img.onerror = () => done(null);
    img.src = url;
  });
}

/**
 * A ratio in the words the hints already use — `square`, `4:3`, `2.5:1` — so the
 * warning and the hint above it describe the same thing the same way.
 *
 * Falls back to a decimal for a shape with no tidy whole-number form, which is
 * most real photographs once they have been cropped by hand.
 */
export function describeRatio({ w, h }: ImageSize): string {
  const r = w / h;
  if (Math.abs(r - 1) < 0.01) return "square";

  const NAMED: Array<[number, string]> = [
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [16 / 9, "16:9"],
    [9 / 16, "9:16"],
    [2.5, "2.5:1"],
    [2, "2:1"],
  ];
  for (const [value, label] of NAMED) {
    if (Math.abs(r - value) < 0.02) return label;
  }
  return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`;
}

/**
 * The sentence to show, or `null` when the shape is close enough to leave alone.
 *
 * Names three things, because a warning that omits any of them makes the
 * merchant go and look something up: what they actually picked, what the field
 * wants, and what will visibly happen if they keep it.
 */
export function ratioWarning(
  actual: ImageSize,
  recommended: ImageSize,
): string | null {
  const want = recommended.w / recommended.h;
  const got = actual.w / actual.h;
  if (!Number.isFinite(want) || !Number.isFinite(got) || got <= 0) return null;

  // Relative to the TARGET, so "how far from what we asked for" reads the same
  // whether the upload is too tall or too wide.
  if (Math.abs(got - want) / want <= TOLERANCE) return null;

  const outcome =
    got > want
      ? "the sides will be cropped off"
      : "the top and bottom will be cropped off";

  return (
    `This image is ${actual.w} × ${actual.h} (${describeRatio(actual)}). ` +
    `This spot is built for ${recommended.w} × ${recommended.h} ` +
    `(${describeRatio(recommended)}), so ${outcome} where it is shown. ` +
    `It will still upload.`
  );
}

/** Read a file and describe its shape problem in one step. */
export async function checkImageRatio(
  file: File,
  recommended: ImageSize,
): Promise<string | null> {
  const size = await readImageSize(file);
  return size ? ratioWarning(size, recommended) : null;
}

/**
 * The recommended size behind each image field, as the field's own hint states
 * it. **One place, so the hint text and the warning can never disagree** — they
 * did once already, when the hero slide panel asked for 2.5:1 while the seed
 * shipped 1.5:1 photographs and nothing anywhere noticed.
 */
export const RECOMMENDED = {
  product: { w: 1600, h: 1600 },
  category: { w: 600, h: 600 },
  brand: { w: 600, h: 600 },
  heroSlide: { w: 1600, h: 640 },
  heroBanner: { w: 1200, h: 900 },
  storeLogo: { w: 600, h: 200 },
  announcementBg: { w: 1600, h: 200 },
  appLogo: { w: 512, h: 512 },
  socialShare: { w: 1200, h: 630 },
} as const satisfies Record<string, ImageSize>;
