// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StorefrontStore,
} from "@/lib/storefront-client";

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

/**
 * Sample DEPARTMENTS, and this is the one that matters most.
 *
 * A theme's biggest structural differences hang off the taxonomy: the `rail`
 * shell renders nothing without categories (`RailShell` returns null), and so do
 * `category-tiles`, `category-chips` and `category-links`. A merchant who has
 * not built their catalogue yet therefore compares four themes with their most
 * distinguishing feature switched off — Meridian Care loses the department rail
 * that is the entire reason to choose it.
 *
 * Neutral names on purpose: this is shown to a grocer and a pharmacist alike, so
 * "Department one" would be useless and "Medicines" would be a lie. These read
 * as the shape of a taxonomy without claiming to be anyone's.
 */
const SAMPLE_CATEGORIES = [
  "New arrivals",
  "Best sellers",
  "Offers",
  "Everyday",
  "Gifts",
  "Clearance",
];

export function padCategoriesForPreview(
  categories: CatalogCategory[],
): CatalogCategory[] {
  if (categories.length) return categories;
  return SAMPLE_CATEGORIES.map((name, i) => ({
    _id: `preview-cat-${i}`,
    name,
    slug: `preview-cat-${i}`,
    slugPath: `preview-cat-${i}`,
    children: [],
  })) as unknown as CatalogCategory[];
}

/**
 * A sample running campaign, so `deal-strip` has something to draw.
 *
 * Only when the merchant has none. A real campaign is never replaced — a
 * preview that overwrote a live discount with a fake one would be worse than a
 * blank strip.
 */
export function padCampaignsForPreview(
  campaigns: StoreCampaign[],
): StoreCampaign[] {
  if (campaigns.length) return campaigns;
  return [
    {
      _id: "preview-campaign",
      name: "Sample campaign",
      scope: "storewide",
      type: "percentage",
      value: 10,
    },
  ] as unknown as StoreCampaign[];
}

/**
 * Sample promises, so `trust-band` has something to draw.
 *
 * `trust-row` needs no help — it falls back to the storefront dictionary — but
 * the band reads `store.trustBadges` and hides itself when they are unset, which
 * silently removes a whole section from two of the four themes.
 */
export function padStoreForPreview(store: StorefrontStore): StorefrontStore {
  const badges = (store.trustBadges ?? []).filter((b) => b.text?.trim());
  if (badges.length) return store;
  return {
    ...store,
    trustBadges: [
      { text: "Sample promise — delivery", icon: "truck" },
      { text: "Sample promise — genuine", icon: "shield" },
      { text: "Sample promise — support", icon: "tag" },
    ],
  } as StorefrontStore;
}
