// coding-standard: maintained

import type { CatalogProduct } from "@/lib/storefront-client";

/**
 * Filler products for the theme PREVIEW, and nowhere else.
 *
 * A merchant with three products sees three cards in every theme, and every
 * theme looks the same — which is exactly when the choice matters most, since a
 * shop early enough to be picking a look is a shop with a thin catalogue. The
 * layouts genuinely differ (a five-column compact grid is not a three-column
 * airy one) but a half-empty row cannot show it.
 *
 * ⚠ **Preview only.** This must never reach a shopper. `StoreHome` gates it on
 * the preview store's `active` flag, which is set only under `?preview=1`, and
 * the padding is appended after the merchant's own products so nothing real is
 * displaced or reordered.
 *
 * The names say "Sample" on purpose. A convincing fake is worse than an obvious
 * one: a merchant judging a layout needs to see the shape of a full row, but
 * must never think the shop has stock it does not have.
 */

/** Below this a grid cannot show its own shape — five-column themes especially. */
export const PREVIEW_MIN_PRODUCTS = 8;

const SAMPLE_NAMES = [
  "Sample product",
  "Sample product two",
  "Sample product three",
  "Sample product four",
  "Sample product five",
  "Sample product six",
  "Sample product seven",
  "Sample product eight",
];

/**
 * `products` padded to `min` with obvious placeholders.
 *
 * Returns the input untouched when it is already long enough, and when it is
 * EMPTY — a shop with no listed products at all has a real emptiness worth
 * seeing, and a section that hides itself on no data is behaving correctly. The
 * gap this fills is "enough to render, too few to judge".
 */
export function padForPreview(
  products: CatalogProduct[],
  min = PREVIEW_MIN_PRODUCTS,
): CatalogProduct[] {
  if (!products.length || products.length >= min) return products;

  const model = products[0];
  const filler = SAMPLE_NAMES.slice(0, min - products.length).map((name, i) => ({
    ...model,
    // A stable, obviously-synthetic id: React needs a key, and the storefront
    // must never route to one of these.
    _id: `preview-sample-${i}`,
    name,
    slug: `preview-sample-${i}`,
    // No photograph — the placeholder frame is the honest rendering, and
    // borrowing the real product's image would make the fake look real.
    images: [],
    unitLabel: undefined,
  })) as CatalogProduct[];

  return [...products, ...filler];
}
