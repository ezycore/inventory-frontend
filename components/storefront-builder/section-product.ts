// coding-standard: maintained
import type { SectionData } from "@/lib/storefront-builder/section-data";
import type { SectionContext } from "@/components/storefront-builder/section-view";

/**
 * The product a one-product section draws: the one it named, else the page's own
 * (`context.product`, set on the product page, where that setting is supplied by
 * the page — `fromPage` in the section specs).
 */
export const sectionProduct = (data: SectionData | undefined, context: SectionContext) =>
  data?.items[0] ?? context.product;
