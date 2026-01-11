import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

interface InventoryFilters extends BaseFilters {
  productId?: string;
  location_id?: string;
  variant_id?: string;
}

interface ShortlistFilters extends BaseFilters {
  location_id: string;
  productId?: string;
  low_stock_only?: string;
}

export function createInventoryApi(apiClient: any) {
  return {
    getAll: (filters: InventoryFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/stock${buildQueryParams(filters)}`),

    getShortlist: (filters: ShortlistFilters): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/stock/shortlist${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/stock/${id}`),

    create: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock", data),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      apiClient.put(`/stock/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/stock/${id}`),

    // Stock operations
    receiveStock: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/receive", data),

    bulkReceiveStock: (receipts: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-receive", { receipts }),

    bulkAdjustStock: (adjustments: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-adjust", { adjustments }),

    sellStock: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/sell", data),

    bulkSellStock: (sales: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-sell", { sales }),

    // Returns
    returnSale: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/return-sale", data),

    bulkReturnSale: (returns: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-return-sale", { returns }),

    returnPurchase: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/return-purchase", data),

    bulkReturnPurchase: (returns: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-return-purchase", { returns }),

    // Stock Transfer
    transferStock: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/transfer", data),

    bulkTransferStock: (transfers: any[]): Promise<ApiResponse<any>> =>
      apiClient.post("/stock/bulk-transfer", { transfers }),
  };
}
