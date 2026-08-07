// coding-standard: maintained

/**
 * Where a page sits in the category tree, as a list of crumbs.
 *
 * Pure and shared, because the same trail is rendered **twice** on every page
 * that has one — once as `BreadcrumbList` JSON-LD and once as visible markup —
 * and structured data that disagrees with the visible page is a manual-action
 * risk (see the SEO section of the storefront skill). One builder, two
 * renderers, no chance of drift.
 *
 * Crumbs carry a STORE-RELATIVE path. The absolute-vs-relative decision belongs
 * to the caller: JSON-LD needs `canonicalTarget`-resolved absolute URLs, the
 * visible trail needs `storeHref`.
 */
import type { CatalogCategory, CatalogCategoryDetail } from "@/lib/storefront-client";

export interface Crumb {
  name: string;
  /** Store-relative, e.g. `/phones` or `/phones/accessories`. */
  path: string;
}

/**
 * The category portion of a product's trail — 0, 1 or 2 crumbs.
 *
 * `categoryId` names the TOP-LEVEL category even when the product also carries a
 * `subcategoryId`, so the two are read independently rather than one from the
 * other. A level is skipped when it cannot be linked: the id may point at a
 * category that is inactive or unlisted (and so absent from the public tree), or
 * at one with no `slugPath` (a row predating the feature, healed by
 * `scripts/backfill-slugs.ts`). Skipping beats emitting a crumb to a 404.
 */
export function categoryCrumbs(
  categories: CatalogCategory[],
  categoryId?: string,
  subcategoryId?: string | null,
): Crumb[] {
  if (!categoryId) return [];
  const parent = categories.find((c) => c._id === categoryId);
  if (!parent?.slugPath) return [];

  const crumbs: Crumb[] = [{ name: parent.name, path: `/${parent.slugPath}` }];

  // A child is only ever on its own parent — the tree is exactly two levels, so
  // there is no deeper branch to search.
  const child = subcategoryId
    ? parent.children?.find((c) => c._id === subcategoryId)
    : undefined;
  if (child?.slugPath) crumbs.push({ name: child.name, path: `/${child.slugPath}` });

  return crumbs;
}

/**
 * The trail for a collection page. Its own `parent` is already resolved by
 * `GET …/categories/resolve`, so this needs no tree — and cannot disagree with
 * the page's `<h1>`, which comes from the same payload.
 */
export function collectionCrumbs(collection: CatalogCategoryDetail): Crumb[] {
  const crumbs: Crumb[] = [];
  if (collection.parent?.slugPath) {
    crumbs.push({
      name: collection.parent.name,
      path: `/${collection.parent.slugPath}`,
    });
  }
  if (collection.slugPath) {
    crumbs.push({ name: collection.name, path: `/${collection.slugPath}` });
  }
  return crumbs;
}

/**
 * A product's full trail, home crumb included.
 *
 * `allProductsLabel` is the fallback when the product has no linkable category:
 * the trail keeps a middle rung pointing at `/products` rather than collapsing
 * to `Store › Product`, so the shopper always has one link upward. The caller
 * supplies the label because the two renderers source it differently — the
 * server-rendered JSON-LD has no access to the client i18n dictionary.
 */
export function productCrumbs({
  storeName,
  productName,
  productSlug,
  categories,
  categoryId,
  subcategoryId,
  allProductsLabel,
}: {
  storeName: string;
  productName: string;
  productSlug: string;
  categories: CatalogCategory[];
  categoryId?: string;
  subcategoryId?: string | null;
  allProductsLabel: string;
}): Crumb[] {
  const cats = categoryCrumbs(categories, categoryId, subcategoryId);
  return [
    { name: storeName, path: "" },
    ...(cats.length > 0 ? cats : [{ name: allProductsLabel, path: "/products" }]),
    { name: productName, path: `/products/${productSlug}` },
  ];
}
