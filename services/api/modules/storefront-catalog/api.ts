import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export type OutOfStockBehavior = "hide" | "show" | "backorder";

export interface CatalogProductStorefront {
  isListed?: boolean;
  onlinePrice?: number;
  compareAtPrice?: number;
  featured?: boolean;
  slug?: string;
  onlineTitle?: string;
  onlineDescription?: string;
  seo?: { title?: string; description?: string };
  outOfStockBehavior?: OutOfStockBehavior;
}

export interface CatalogImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  publicId?: string;
}

export interface CatalogProduct {
  _id: string;
  name: string;
  base_sku?: string;
  price?: number;
  status: string;
  productType: string;
  images?: CatalogImage[];
  storefront?: CatalogProductStorefront;
  /** Stock at the storefront fulfillment location (0 if none configured). */
  availableQuantity?: number;
}

export interface CatalogListResult {
  items: CatalogProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
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
  onlineDescription?: string;
  outOfStockBehavior?: OutOfStockBehavior;
}

export interface BulkStorefrontDto {
  ids: string[];
  patch: { isListed?: boolean; featured?: boolean };
}

export interface BulkStorefrontResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: { id: string; error: string }[];
}

/** A category surfaced (or not) as a storefront collection. */
export interface StorefrontCollection {
  _id: string;
  name: string;
  slug?: string;
  status: string;
  storefront?: { isListed?: boolean; order?: number; displayName?: string };
}

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
  bulkUpdate: (
    dto: BulkStorefrontDto,
  ): Promise<ApiResponse<BulkStorefrontResult>> =>
    apiClient.patch(`${base}/bulk`, dto),
  listCollections: (): Promise<ApiResponse<StorefrontCollection[]>> =>
    apiClient.get(collectionsBase),
  updateCollection: (
    id: string,
    dto: { isListed?: boolean; displayName?: string },
  ): Promise<ApiResponse<StorefrontCollection>> =>
    apiClient.patch(`${collectionsBase}/${id}`, dto),
  reorderCollections: (
    ids: string[],
  ): Promise<ApiResponse<StorefrontCollection[]>> =>
    apiClient.patch(`${collectionsBase}/reorder`, { ids }),
};
