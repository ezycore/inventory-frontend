// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, CreateProductDto, UpdateProductDto, ProductFilters } from "@/types";
import type {
  ProductDetail,
  ProductListItem,
  ApiVariant,
  ApiImage,
  ProductBulkUpdateResult,
  ProductCostResult,
  ProductMatchList,
  ProductTaxonomySheet,
} from "@/types/api";
import { buildQueryParams } from "../../utils";
import { createImportApi } from "../import-api";

/**
 * Which products a bulk edit touches: explicit ids, or every product matching
 * the list filter (the table's "select all N matching").
 */
export type ProductBulkTarget =
  | { ids: string[] }
  | { filter: ProductBulkFilter };

/** The product list's filters, in the strict shape `/products/bulk-update` accepts. */
export interface ProductBulkFilter {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  status?: string;
  tags?: string[];
}

export type ProductBulkAction =
  | { op: "addTags"; tagIds: string[] }
  | { op: "removeTags"; tagIds: string[] }
  | { op: "setCategory"; categoryId: string | null; subcategoryId?: string | null };

const taxonomySheetForm = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return body;
};

export const productsApi = {
  /** Add/remove tags or move the category of many products at once. */
  bulkUpdate: (body: {
    target: ProductBulkTarget;
    action: ProductBulkAction;
  }): Promise<ApiResponse<ProductBulkUpdateResult>> =>
    apiClient.post("/products/bulk-update", body),

  /**
   * Set the cost price for sales made from now on — every location's row of the
   * product (or the one variant) gets it. Past sales keep the cost they were sold
   * at. Refused with `COST_OWNED_BY_PURCHASES` when purchases maintain the cost.
   */
  setCost: (
    id: string,
    body: { variantId?: string | null; costPrice: number },
  ): Promise<ApiResponse<ProductCostResult>> =>
    apiClient.put(`/products/${id}/cost`, body),

  /** Resolve a pasted list of product names / barcodes to products. */
  matchList: (lines: string[]): Promise<ApiResponse<ProductMatchList>> =>
    apiClient.post("/products/match-list", { lines }),

  /** Download Name / Barcode / Category / Subcategory / Tags for the filtered products. */
  exportTaxonomy: (filters: Record<string, unknown> = {}): Promise<void> =>
    apiClient.download(`/products/taxonomy/export${buildQueryParams(filters)}`, {
      filename: "product-tags-categories.csv",
    }),

  /** Dry run of the tags-and-categories sheet — the per-product diff, no writes. */
  taxonomyPreview: (file: File): Promise<ProductTaxonomySheet> =>
    apiClient
      .post<ApiResponse<ProductTaxonomySheet>>(
        "/products/taxonomy/import?mode=preview",
        taxonomySheetForm(file),
      )
      .then((res) => res.data),

  taxonomyCommit: (file: File): Promise<ProductTaxonomySheet> =>
    apiClient
      .post<ApiResponse<ProductTaxonomySheet>>(
        "/products/taxonomy/import?mode=commit",
        taxonomySheetForm(file),
      )
      .then((res) => res.data),

  /**
   * Upload one image for embedding in a product's rich-text description.
   *
   * Fires as soon as the merchant picks a file — the editor needs a URL to
   * render, which on the create form is before the product exists at all. An
   * abandoned edit therefore leaves an orphan in R2; that is the accepted trade
   * (see the backend service), and the object still sits under the org prefix
   * so the tenant purge reaches it.
   */
  uploadDescriptionImage: (file: File): Promise<ApiResponse<ApiImage>> => {
    const body = new FormData();
    body.append("image", file);
    return apiClient.post("/products/description-image", body);
  },

  // CSV export of all products matching the given list filters. Uses the same
  // `buildQueryParams` as `getAll` so the export honours the active filters.
  exportCsv: (filters: Record<string, unknown> = {}): Promise<void> =>
    apiClient.download(`/products/export${buildQueryParams(filters)}`, {
      filename: "products.csv",
    }),

  // CSV import — download template, dry-run preview (no writes), then commit.
  downloadImportTemplate: (): Promise<void> =>
    apiClient.download("/products/import/template", {
      filename: "products-import-template.csv",
    }),

  ...createImportApi("/products"),

  getStats: (): Promise<ApiResponse<{ stats: { name: string; value: number }[] }>> =>
    apiClient.get("/products/stats"),

  getAll: (filters: ProductFilters = {}): Promise<ApiResponse<PaginatedResponse<ProductListItem>>> =>
    apiClient.get(`/products${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ProductDetail>> =>
    apiClient.get(`/products/${id}`),

  getBySlug: (slug: string): Promise<ApiResponse<ProductDetail>> =>
    apiClient.get(`/products/slug/${slug}`),

  search: (query: string): Promise<ApiResponse<PaginatedResponse<ProductListItem>>> =>
    apiClient.get(`/products/search?q=${encodeURIComponent(query)}`),

  create: (data: CreateProductDto): Promise<ApiResponse<ProductDetail>> =>
    apiClient.post("/products", data),

  update: (id: string, data: UpdateProductDto): Promise<ApiResponse<ProductDetail>> =>
    apiClient.put(`/products/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/products/${id}`),

  getVariants: (productId: string): Promise<ApiResponse<PaginatedResponse<ApiVariant>>> =>
    apiClient.get(`/products/${productId}/variants`),
};
