// coding-standard: maintained
import type { ReactNode } from "react";
import type { ProductSource } from "@/lib/storefront-builder/section-data";
import type { StoreWord } from "@/lib/storefront-builder/store-words";
import { collectionHref } from "@/lib/storefront-links";
import { findSectionCategory } from "@/lib/storefront-sections";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionContext } from "@/components/storefront-builder/section-view";

/** The settings a product row names itself and its link from. */
export interface ProductRowWording {
  source: ProductSource;
  categoryId?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  storeHeading?: "featured" | "newArrivals" | "selected" | "collection";
  viewAll?: boolean;
}

const word = (id: StoreWord) => <Island name="store-word" props={{ word: id }} />;

/**
 * A product row's heading and link: the merchant's heading, else — when the row keeps the store's wording — "Featured products",
 * "New arrivals" or "Selected for you" in the shopper's language, or its
 * collection's name. "View all" goes to `ctaHref`, else the row's collection,
 * else the catalogue. Without `viewAll` a link needs both a label and a
 * destination, as on any builder section.
 *
 * `fallback` is the row's own word when a collection row's collection is gone.
 * Links are store paths without the base: `SectionLink` adds it.
 */
export function productRowHeading(
  settings: ProductRowWording,
  context: SectionContext,
  fallback: StoreWord,
): { heading?: ReactNode; subheading?: string; linkLabel?: ReactNode; linkHref?: string } {
  const category =
    settings.source === "category"
      ? findSectionCategory(context.categories ?? [], settings.categoryId)?.category
      : undefined;

  let heading: ReactNode = settings.heading;
  if (!heading && settings.storeHeading) {
    heading =
      settings.storeHeading === "collection" ? (category?.name ?? word(fallback)) : word(settings.storeHeading);
  }

  if (!settings.viewAll) {
    return { heading, subheading: settings.subheading, linkLabel: settings.ctaLabel, linkHref: settings.ctaHref };
  }
  return {
    heading,
    subheading: settings.subheading,
    linkLabel: settings.ctaLabel?.trim() || word("viewAll"),
    linkHref: settings.ctaHref?.trim() || (category ? collectionHref("", category) : "/products"),
  };
}

/** A product row reads the category tree only to name itself after, or link to, its collection. */
export const productRowNeedsCategories = (settings: ProductRowWording): boolean =>
  settings.source === "category" && (settings.storeHeading === "collection" || !!settings.viewAll);
