// coding-standard: maintained
import type { CatalogCategory } from "@/lib/storefront-client";
import { findSectionCategory } from "@/lib/storefront-sections";

/**
 * A section's references, resolved against the store-wide lists on the page.
 *
 * A reference to something the store no longer has — a tag deleted, a
 * collection hidden, after it was picked — is dropped, never drawn as a dead
 * link. The backend checks ownership on save, not what happens afterwards.
 */

/** The picked items in the merchant's order, skipping ids the list no longer holds. */
export function pickByIds<T extends { _id: string }>(
  items: readonly T[],
  ids: readonly string[],
): T[] {
  const byId = new Map(items.map((item) => [item._id, item]));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

/** Campaigns an offer strip can show — a campaign with no name has nothing to print. */
export const offerCampaigns = <T extends { name?: string }>(campaigns: readonly T[]): T[] =>
  campaigns.filter((campaign) => campaign.name);

/**
 * A collections section's categories: the picked ones, top-level or
 * sub-collection, in pick order — or every top-level collection when none are
 * picked, which is what the homepage row has always listed.
 */
export function sectionCategories(
  categories: CatalogCategory[],
  ids: readonly string[] | undefined,
): CatalogCategory[] {
  if (!ids?.length) return categories;
  return ids.flatMap((id) => {
    const found = findSectionCategory(categories, id);
    return found ? [found.category] : [];
  });
}
