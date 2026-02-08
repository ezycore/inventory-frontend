import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateStockMovementDto,
  PaginatedResponse,
} from "@/types";
import { buildQueryParams } from "../../utils";

interface StockMovementFilters {
  variantId?: string;
  productId?: string;
  locationId?: string;
  type?: string;
  reason?: string;
  movementType?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const stockApi = {
  getMovements: (
    filters: StockMovementFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/stock/movements${buildQueryParams(filters)}`),

  getMovementsByVariant: (
    variantId: string,
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/stock/movements?variantId=${variantId}`),

  getStockLevels: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get("/stock/levels"),

  createMovement: (data: CreateStockMovementDto): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/movements", data),

  adjustStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/adjust", data),

  transferStock: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/stock/transfer", data),

  getOverview: (productId?: string): Promise<ApiResponse<any>> =>
    apiClient.get(
      `/stock/overview${productId ? `?productId=${productId}` : ""}`,
    ),

  getLowStock: (limit?: number): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/stock/low-stock${limit ? `?limit=${limit}` : ""}`),
};

export const stockMovementsApi = {
  getAll: (
    filters: StockMovementFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/inventory-movements${buildQueryParams(filters)}`),

  getInventoryHistory: (
    productId: string,
    locationId: string,
    variantId?: string,
  ): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const url = variantId
      ? `/inventory-movements/inventory/${productId}/${locationId}?variantId=${variantId}`
      : `/inventory-movements/inventory/${productId}/${locationId}`;
    return apiClient.get(url);
  },
};
