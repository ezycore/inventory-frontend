// coding-standard: maintained

import type {
  CatalogCategory,
  CatalogProduct,
  StoreCampaign,
  StoreTag,
  StorefrontStore,
} from "@/lib/storefront-client";
import type { ThemeSample } from "@/lib/storefront-theme-samples";

/**
 * Sample content for the theme PREVIEW, and nowhere else.
 *
 * A merchant early enough to be choosing a look is a merchant with a thin
 * catalogue, so the themes that differ most on paper rendered near-identically
 * in practice — a half-empty grid cannot show that a five-column compact layout
 * is not a three-column airy one, and the sections that carry the biggest
 * structural differences hide themselves entirely on no data.
 *
 * WHICH content comes from the theme being previewed (`ThemeSample`), so
 * Meridian Care previews as a pharmacy rather than as whatever the merchant
 * happens to stock. See `storefront-theme-samples.ts` for why that is data on a
 * bundle and not a branch on `themeId`.
 *
 * ⚠ **The THEME PICKER only — not the Customize editor, and never a shopper.**
 * The gate is `sample === null`, checked at the top of every function here, and
 * it has to be: `active` is not the same question. That flag is set by
 * `?preview=1`, which is what the Customize editor's iframe uses too — and
 * Customize previews the merchant's real shop, where an invented product is not
 * a helpful placeholder but a claim about their stock. It is also a bare URL
 * parameter, so gating on it alone put sample products on a live storefront for
 * anyone who typed it. Only the Themes page sends `samples`; everywhere else it
 * is null and every function below is a no-op.
 *
 * That is why `sample` is a required parameter rather than one defaulting to
 * `NEUTRAL_SAMPLE`. A default made "I have no samples" and "pad with the generic
 * set" the same call, which is exactly how the two surfaces got confused.
 *
 * ⚠ **Fills gaps, never replaces.** Each function returns the merchant's own
 * data untouched the moment they have any, and padding is appended AFTER their
 * products so nothing real is displaced or reordered. A preview that overwrote a
 * live discount with a fake one would be worse than a blank strip.
 *
 * Every sample name begins with "Sample" on purpose, and that is doing real
 * work: it is what lets the content otherwise be realistic. A merchant judging a
 * layout needs a row that looks like a shop, but must never come away believing
 * the shop has stock, offers or promises it does not have.
 */

/** Below this a grid cannot show its own shape — five-column themes especially. */
export const PREVIEW_MIN_PRODUCTS = 8;

/**
 * `products` padded to `min` with the previewed theme's sample stock.
 *
 * Pads from EMPTY as well as from thin. That is deliberate and it is the case
 * that matters most: a merchant who has added no products yet is precisely the
 * one comparing themes, and leaving the grids blank for them was the whole
 * complaint. A section hiding itself on no data is right for a shopper and
 * useless for someone judging a layout.
 */
export function padForPreview(
  products: CatalogProduct[],
  sample: ThemeSample | null,
  min = PREVIEW_MIN_PRODUCTS,
): CatalogProduct[] {
  if (!sample || products.length >= min) return products;

  const stock = sample.products;
  // Clone a real product where there is one, so the filler carries whatever
  // shape this shop's payload really has (currency handling, flags) rather than
  // a guess. With an empty catalogue there is nothing to clone, hence the
  // spelled-out fallback below.
  const model = products[0];

  const filler = stock.slice(0, min - products.length).map((item, i) => ({
    ...(model ?? EMPTY_MODEL),
    _id: `preview-sample-${i}`,
    slug: `preview-sample-${i}`,
    name: item.name,
    price: item.price,
    basePrice: item.price,
    // A sample must never carry a real discount badge — `compareAtPrice` is what
    // draws the strike-through, and inheriting the cloned product's would price
    // the placeholder against a campaign it is not in.
    compareAtPrice: null,
    images: [{ url: item.image }],
    // Cloned units and variants describe the real product, not this one.
    unitLabel: undefined,
    hasVariants: false,
    availableQuantity: 25,
  })) as unknown as CatalogProduct[];

  return [...products, ...filler];
}

/** The structural fields a card reads, for a shop with nothing to clone from. */
const EMPTY_MODEL = {
  description: "",
  featured: false,
  productType: "simple",
  tags: [],
} as const;

/**
 * Sample DEPARTMENTS — the most load-bearing of the set.
 *
 * A theme's biggest structural differences hang off the taxonomy: `RailShell`
 * renders nothing without categories, and so do `category-tiles`,
 * `category-chips` and `category-links`. Without this a merchant compared four
 * themes with their most distinguishing feature switched off, and Meridian Care
 * lost the department rail that is the entire reason to choose it.
 */
export function padCategoriesForPreview(
  categories: CatalogCategory[],
  sample: ThemeSample | null,
): CatalogCategory[] {
  if (!sample || categories.length) return categories;
  return sample.categories.map((name, i) => ({
    _id: `preview-cat-${i}`,
    name,
    slug: `preview-cat-${i}`,
    slugPath: `preview-cat-${i}`,
    children: [],
  })) as unknown as CatalogCategory[];
}

/** Sample facets for theme-only sections such as Little Steps' age chips. */
export function padTagsForPreview(
  tags: StoreTag[],
  sample: ThemeSample | null,
): StoreTag[] {
  if (!sample || tags.length || !sample.tags?.length) return tags;
  return sample.tags.map((name, i) => ({
    _id: `preview-tag-${i}`,
    name,
    slug: `preview-tag-${i}`,
    productCount: 1,
  }));
}

/**
 * A sample running campaign, so `deal-strip` has something to draw.
 *
 * Its wording comes from the theme like everything else here — this was the last
 * sample left generic, and being the loudest band on the page it was also the
 * most obviously wrong one: the same "Sample campaign, 10% off" appeared in a
 * pharmacy, a grocery and a boutique alike.
 */
export function padCampaignsForPreview(
  campaigns: StoreCampaign[],
  sample: ThemeSample | null,
): StoreCampaign[] {
  if (!sample || campaigns.length) return campaigns;
  const { name, type, value } = sample.campaign;
  return [
    {
      _id: "preview-campaign",
      name,
      scope: "storewide",
      type,
      value,
      // Computed, never stored: `DealStrip` prints an end date when one is
      // present, and a date baked into a bundle would preview an offer that
      // expired months ago.
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as unknown as StoreCampaign[];
}

/**
 * Sample promises, so `trust-band` has something to draw.
 *
 * The band reads `store.trustBadges` and hides itself when they are unset, which
 * silently removes a whole section from two of the four themes.
 */
export function padStoreForPreview(
  store: StorefrontStore,
  sample: ThemeSample | null,
): StorefrontStore {
  const badges = (store.trustBadges ?? []).filter((b) => b.text?.trim());
  if (!sample || badges.length) return store;
  return {
    ...store,
    trustBadges: sample.promises.map((text) => ({ text })),
  } as StorefrontStore;
}
