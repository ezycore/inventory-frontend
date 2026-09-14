// coding-standard: maintained
import type { CatalogProduct } from "@/lib/storefront-client";

/**
 * Section data: what a page's sections ask the catalogue for, in ONE batched
 * backend call (`GET /api/storefront/:slug/section-data?r=<json>`), instead of
 * one HTTP request per section each re-resolving the store (plan §5.4).
 *
 * Requests are keyed by section instance id; the backend deduplicates identical
 * queries itself, so two grids asking the same thing still cost one query.
 */

/** Mirrors the backend's `MAX_SECTION_DATA_REQUESTS`. */
export const MAX_SECTION_DATA_REQUESTS = 12;
/** Mirrors the backend's cap on the raw `r` string (`storefront-page.validator.ts`). */
export const MAX_SECTION_DATA_PARAM_LENGTH = 4000;

export type ProductSource = "featured" | "newest" | "category" | "tag" | "manual";

/** One entry of `r` — the backend's `sectionDataRequest` schema. */
export interface ProductsDataRequest {
  key: string;
  type: "products";
  source: ProductSource;
  categoryId?: string;
  tagIds?: string[];
  productIds?: string[];
  limit: number;
  inStock?: boolean;
}

/** What one section receives back. */
export interface SectionData {
  items: CatalogProduct[];
}

/**
 * A store-wide list a section reads from the page context instead of querying
 * for itself: the category tree (collections) and the tag facet (shop by tag).
 * The page fetches each one once, and only when a section on it needs it.
 */
export type StoreListNeed = "categories" | "tags";

/** The settings every product section shares: where its products come from, and how many. */
export interface ProductSourceSettings {
  source: ProductSource;
  categoryId?: string;
  tagIds?: string[];
  productIds?: string[];
  limit: number;
}

/**
 * The catalogue query a product section makes — or `null` when its source has
 * nothing to point at (a collection section with no collection), in which case
 * the section is not rendered at all.
 *
 * Catalogue-wide sources ask for in-stock products only, like the homepage rows
 * (`app/(storefront)/shop/page.tsx`): a card nobody can buy is dead space on a
 * page built to sell. A hand-picked section keeps every pick, because the
 * merchant chose those products by name.
 */
export function productSectionRequest(
  key: string,
  settings: ProductSourceSettings,
): ProductsDataRequest | null {
  const request: ProductsDataRequest = {
    key,
    type: "products",
    source: settings.source,
    limit: settings.limit,
  };
  switch (settings.source) {
    case "category":
      if (!settings.categoryId) return null;
      request.categoryId = settings.categoryId;
      break;
    case "tag":
      if (!settings.tagIds?.length) return null;
      request.tagIds = settings.tagIds;
      break;
    case "manual":
      if (!settings.productIds?.length) return null;
      request.productIds = settings.productIds;
      break;
  }
  if (settings.source !== "manual") request.inStock = true;
  return request;
}

/**
 * Split requests into calls the backend accepts: at most
 * `MAX_SECTION_DATA_REQUESTS` each, and an encoded `r` within
 * `MAX_SECTION_DATA_PARAM_LENGTH`. A page of hand-picked grids overflows the
 * character cap long before the count cap (24 ids ≈ 650 characters each).
 */
export function chunkSectionDataRequests(
  requests: readonly ProductsDataRequest[],
): ProductsDataRequest[][] {
  const chunks: ProductsDataRequest[][] = [];
  let current: ProductsDataRequest[] = [];
  for (const request of requests) {
    const candidate = [...current, request];
    const tooMany = candidate.length > MAX_SECTION_DATA_REQUESTS;
    const tooLong = JSON.stringify(candidate).length > MAX_SECTION_DATA_PARAM_LENGTH;
    if (current.length > 0 && (tooMany || tooLong)) {
      chunks.push(current);
      current = [request];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}
