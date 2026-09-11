// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, CreateProductDto, UpdateProductDto, ProductFilters } from "@/types";
import type { ProductDetail, ProductListItem, ApiVariant, ApiImage } from "@/types/api";
import { buildQueryParams } from "../../utils";
import { createImportApi } from "../import-api";

export const productsApi = {

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
