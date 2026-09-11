import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  BulkOperationResult,
  CatalogList,
  CatalogVariant,
  StorefrontCollection,
} from "@/types/api";
export type { StorefrontCollection, CatalogVariant };

// Response shapes generated from the backend catalog DTOs (`ecommerce.dto.ts`).
// `CatalogProduct` is the list row (carries `availableQuantity`); the sub-shapes derive from it.
export type CatalogListResult = CatalogList;
export type CatalogProduct = CatalogList["items"][number];
export type CatalogProductStorefront = NonNullable<CatalogProduct["storefront"]>;
export type CatalogImage = NonNullable<CatalogProduct["images"]>[number];
export type OutOfStockBehavior = NonNullable<
  CatalogProductStorefront["outOfStockBehavior"]
>;

/** One per-variant pricing override the editor sends (null clears the field). */
export interface VariantPricingEntry {
  variantId: string;
  onlinePrice: number | null;
  compareAtPrice: number | null;
}

export interface CatalogListParams {
  search?: string;
  listed?: "all" | "listed" | "unlisted";
  featured?: boolean;
  page?: number;
  limit?: number;
}

/** Per-product storefront fields a catalog editor can write (JSON path). The
 *  full editor drawer sends FormData (with flat seoTitle/seoDescription keys)
 *  so it can also upload/reorder images. */
export interface UpdateStorefrontListingDto {
  isListed?: boolean;
  onlinePrice?: number;
  compareAtPrice?: number;
  featured?: boolean;
  slug?: string;
  onlineTitle?: string;
  outOfStockBehavior?: OutOfStockBehavior;
  weightKg?: number;
}

export interface BulkStorefrontDto {
  ids: string[];
  patch: {
    isListed?: boolean;
    featured?: boolean;
    /** `"inherit"` clears the per-product override so the products follow the
     *  store-wide `defaultOutOfStockBehavior` again. Request-only — it is never
     *  a stored value. */
    outOfStockBehavior?: OutOfStockBehavior | "inherit";
  };
}

export type BulkStorefrontResult = BulkOperationResult;

const base = "/ecommerce/catalog";
const collectionsBase = "/ecommerce/catalog/collections";

export const storefrontCatalogApi = {
  list: (params: CatalogListParams = {}): Promise<ApiResponse<CatalogListResult>> => {
    const qs = new URLSearchParams();
    if (params.search) qs.append("search", params.search);
    if (params.listed && params.listed !== "all") qs.append("listed", params.listed);
    if (params.featured) qs.append("featured", "true");
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    const s = qs.toString();
    return apiClient.get(`${base}${s ? `?${s}` : ""}`);
  },
  // Accepts a plain DTO (inline toggles) or FormData (edit dialog with image
  // uploads). apiClient.patch sends FormData as multipart automatically.
  update: (
    id: string,
    dto: UpdateStorefrontListingDto | FormData,
  ): Promise<ApiResponse<CatalogProduct>> => apiClient.patch(`${base}/${id}`, dto),
  // Variants of a variable product with their per-variant storefront pricing
  // overlay — read by the editor so it can show/edit each option's online price.
  listVariants: (id: string): Promise<ApiResponse<CatalogVariant[]>> =>
    apiClient.get(`${base}/${id}/variants`),
  bulkUpdate: (
    dto: BulkStorefrontDto,
  ): Promise<ApiResponse<BulkStorefrontResult>> =>
    apiClient.patch(`${base}/bulk`, dto),
  listCollections: (): Promise<ApiResponse<StorefrontCollection[]>> =>
    apiClient.get(collectionsBase),
  updateCollection: (
    id: string,
    dto: {
      isListed?: boolean;
      displayName?: string;
      // Flat, mapped to `storefront.seo.*` server-side — same convention as the
      // product editor. An empty string clears the override.
      seoTitle?: string;
      seoDescription?: string;
    },
  ): Promise<ApiResponse<StorefrontCollection>> =>
    apiClient.patch(`${collectionsBase}/${id}`, dto),
  reorderCollections: (
    ids: string[],
  ): Promise<ApiResponse<StorefrontCollection[]>> =>
    apiClient.patch(`${collectionsBase}/reorder`, { ids }),
};
