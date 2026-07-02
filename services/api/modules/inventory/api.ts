// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ImportResult } from "@/types/DataTable";
import { buildQueryParams, type BaseFilters } from "../../utils";
import type { ProductAnalytics, InventoryAnalytics } from "./analytics.types";

interface InventoryFilters extends BaseFilters {
  productId?: string;
  locationId?: string;
  variantId?: string;
}

interface ShortlistFilters extends BaseFilters {
  locationId?: string;
  productId?: string;
  low_stock_only?: string;
}

export const inventoryApi = {
  getAll: (filters: InventoryFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory${buildQueryParams(filters)}`),

  // Opening-stock CSV import — template, dry-run preview, then commit.
  downloadImportTemplate: (): Promise<void> =>
    apiClient.download("/inventory/import/template", {
      filename: "opening-stock-import-template.csv",
    }),

  importPreview: (file: File): Promise<ImportResult> => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<ApiResponse<ImportResult>>("/inventory/import?mode=preview", form)
      .then((res) => res.data);
  },

  importCommit: (file: File): Promise<ImportResult> => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<ApiResponse<ImportResult>>("/inventory/import?mode=commit", form)
      .then((res) => res.data);
  },

  getShortlist: (filters: ShortlistFilters): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory/shortlist${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/inventory/${id}`),

  create: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory", data),

  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/inventory/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/inventory/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<void>> =>
    apiClient.post("/inventory/bulk-delete", { ids }),

  // Stock operations
  receiveStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/receive", data),

  bulkReceiveStock: (receipts: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-receive", { receipts }),

  bulkAdjustStock: (adjustments: any[], reason?: string): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-adjust", { adjustments, reason }),

  sellStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/sell", data),

  bulkSellStock: (sales: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-sell", { sales }),

  // Returns
  returnSale: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/return-sale", data),

  bulkReturnSale: (returns: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-return-sale", { returns }),

  returnPurchase: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/return-purchase", data),

  bulkReturnPurchase: (returns: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-return-purchase", { returns }),

  // Stock Transfer
  transferStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/transfer", data),

  bulkTransferStock: (transfers: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-transfer", { transfers }),

  // Expiry tracking (FEFO) — requires the expiryTracking feature
  getExpiringBatches: (
    filters: { days?: number; page?: number; limit?: number } = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory/expiry/expiring${buildQueryParams(filters)}`),

  getExpiredBatches: (
    filters: { page?: number; limit?: number } = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory/expiry/expired${buildQueryParams(filters)}`),

  getProductBatches: (
    productId: string,
    filters: { variantId?: string } = {},
  ): Promise<ApiResponse<any>> =>
    apiClient.get(
      `/inventory/${productId}/batches${buildQueryParams(filters)}`,
    ),

  // Analytics (read-only) — powers the product- and inventory-detail pages.
  getProductAnalytics: (
    productId: string,
    variantId?: string,
  ): Promise<ApiResponse<ProductAnalytics>> =>
    apiClient.get(
      `/inventory/analytics/product/${productId}${variantId ? `?variantId=${variantId}` : ""}`,
    ),

  getInventoryAnalytics: (
    inventoryId: string,
  ): Promise<ApiResponse<InventoryAnalytics>> =>
    apiClient.get(`/inventory/analytics/item/${inventoryId}`),
};
