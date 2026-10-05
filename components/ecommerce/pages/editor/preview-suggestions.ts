// coding-standard: maintained
import type { CatalogProduct } from "@/lib/storefront-client";
import { isLongDescription } from "@/components/storefront/product-description-view";

/** Why a product is worth previewing the product page around. */
export type PreviewReason = "Has options" | "Long description" | "Sold out";

const TESTS: ReadonlyArray<[PreviewReason, (product: CatalogProduct) => boolean]> = [
  ["Has options", (product) => product.hasVariants === true],
  ["Long description", (product) => isLongDescription(product.description)],
  // An untracked product reports `Number.MAX_SAFE_INTEGER`, so it never reads as sold out.
  ["Sold out", (product) => product.availableQuantity <= 0 && product.outOfStockBehavior !== "backorder"],
];

/**
 * The products that put the shared product page through its paces: the first
 * with options, the first with a long description and the first sold out, never
 * one product twice.
 *
 * Each draws a part of the page the others leave out — the option chips, the
 * description's own block below the photos, the sold-out buttons — and the
 * store's first product, which the preview opens on, often has none of them.
 */
export function previewSuggestions(
  products: CatalogProduct[],
): { product: CatalogProduct; reason: PreviewReason }[] {
  const used = new Set<string>();
  const suggestions: { product: CatalogProduct; reason: PreviewReason }[] = [];
  for (const [reason, test] of TESTS) {
    const product = products.find((candidate) => !used.has(candidate._id) && test(candidate));
    if (!product) continue;
    used.add(product._id);
    suggestions.push({ product, reason });
  }
  return suggestions;
}
