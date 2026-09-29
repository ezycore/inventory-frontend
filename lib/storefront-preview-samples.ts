// coding-standard: maintained

import type { CatalogCategory } from "@/lib/storefront-client";
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
 * ⚠ **Fills gaps, never replaces.** It returns the merchant's own categories
 * untouched the moment they have any.
 *
 * It padded products, offers, tags and promises too, for the classic home's
 * sections; those went with that home (2026-09-29).
 *
 * Every sample name begins with "Sample" on purpose, and that is doing real
 * work: it is what lets the content otherwise be realistic. A merchant judging a
 * layout needs a row that looks like a shop, but must never come away believing
 * the shop has stock, offers or promises it does not have.
 */

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
