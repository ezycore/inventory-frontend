import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

interface InventoryFilters extends BaseFilters {
  productId?: string;
  locationId?: string;
  variantId?: string;
}

interface ShortlistFilters extends BaseFilters {
  locationId: string;
  productId?: string;
  low_stock_only?: string;
}

export const inventoryApi = {
  getAll: (filters: InventoryFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory${buildQueryParams(filters)}`),

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

  bulkAdjustStock: (adjustments: any[]): Promise<ApiResponse<any>> =>
    apiClient.post("/inventory/bulk-adjust", { adjustments }),

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
};
