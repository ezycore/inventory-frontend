// coding-standard: maintained
import type { CatalogProduct } from "@/lib/storefront-client";

/**
 * Which of the product page's products a section shows on — a section's
 * `visibility.products`. Absent means every product. The backend refuses it on
 * any page but the product page, and on the product section itself.
 */
export interface ProductTargets {
  /** Shown on products in any of these categories, top-level or sub-category. */
  categories?: readonly string[];
  /** …or carrying any of these tags. */
  tags?: readonly string[];
}

/** The most categories, or tags, a section may name — the backend's `MAX_PRODUCT_TARGETS`. */
export const MAX_PRODUCT_TARGETS = 20;

/**
 * Whether a section limited to `targets` shows on `product`.
 *
 * A product stores its top-level category in `categoryId` and its sub-category
 * in `subcategoryId`, so naming a top-level category reaches every product
 * under it, and naming a sub-category reaches only its own — the rule the
 * collection pages already follow. With no product to ask (a page that is not
 * the product page), nothing is narrowed.
 */
export function showsOnProduct(
  targets: ProductTargets | undefined,
  product: Pick<CatalogProduct, "categoryId" | "subcategoryId" | "tags"> | undefined,
): boolean {
  if (!targets || !product) return true;
  const { categories = [], tags = [] } = targets;
  if (categories.length === 0 && tags.length === 0) return true;
  if (categories.some((id) => id === product.categoryId || id === product.subcategoryId)) return true;
  return (product.tags ?? []).some((tag) => tags.includes(tag._id));
}
