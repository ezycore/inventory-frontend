import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateStockMovementDto,
  PaginatedResponse,
} from "@/types";
import type { ApiStockMovement } from "@/types/api";
import { buildQueryParams } from "../../utils";

// ── Period type (shared with dashboard/reports) ──
export type StockMovementPeriod =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "last6Months"
  | "lastYear"
  | "custom";

interface StockMovementFilters {
  variantId?: string;
  productId?: string;
  locationId?: string;
  type?: string;
  reason?: string;
  movementType?: string;
  period?: StockMovementPeriod;
  startDate?: string;  // YYYY-MM-DD (only for period="custom")
  endDate?: string;    // YYYY-MM-DD (only for period="custom")
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const stockApi = {
  getMovements: (
    filters: StockMovementFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<ApiStockMovement>>> =>
    apiClient.get(`/stock/movements${buildQueryParams(filters)}`),

  getMovementsByVariant: (
    variantId: string,
  ): Promise<ApiResponse<PaginatedResponse<ApiStockMovement>>> =>
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
  ): Promise<ApiResponse<PaginatedResponse<ApiStockMovement>>> =>
    apiClient.get(`/inventory-movements${buildQueryParams(filters)}`),

  getStats: (
    filters: StockMovementFilters = {},
  ): Promise<ApiResponse<any>> =>
    apiClient.get(`/inventory-movements/stats${buildQueryParams(filters)}`),

  getInventoryHistory: (
    productId: string,
    locationId: string,
    variantId?: string,
  ): Promise<ApiResponse<PaginatedResponse<ApiStockMovement>>> => {
    const url = variantId
      ? `/inventory-movements/inventory/${productId}/${locationId}?variantId=${variantId}`
      : `/inventory-movements/inventory/${productId}/${locationId}`;
    return apiClient.get(url);
  },
};
