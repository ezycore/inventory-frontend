import type { ApiResponse, PaginatedResponse, CreateStockMovementDto, StockMovementType } from "@/types";
import { buildQueryParams } from "./utils";

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

export function createStockApi(apiClient: any) {
  return {
    getMovements: (filters: StockMovementFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/stock/movements${buildQueryParams(filters)}`),

    getMovementsByVariant: (variantId: string): Promise<ApiResponse<PaginatedResponse<any>>> =>
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
      apiClient.get(`/stock/overview${productId ? `?productId=${productId}` : ""}`),

    getLowStock: (limit?: number): Promise<ApiResponse<any[]>> =>
      apiClient.get(`/stock/low-stock${limit ? `?limit=${limit}` : ""}`),
  };
}

export function createStockMovementsApi(apiClient: any) {
  return {
    getAll: (filters: StockMovementFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/stock-movements${buildQueryParams(filters)}`),

    getInventoryHistory: (
      productId: string,
      locationId: string,
      variantId?: string
    ): Promise<ApiResponse<PaginatedResponse<any>>> => {
      const url = variantId
        ? `/stock-movements/inventory/${productId}/${locationId}?variantId=${variantId}`
        : `/stock-movements/inventory/${productId}/${locationId}`;
      return apiClient.get(url);
    },
  };
}

// Legacy API for backward compatibility
export function createLegacyInventoryApi(apiClient: any, productsApi: any, stockApi: any) {
  return {
    getItems: (filters: Record<string, any> = {}) => productsApi.getAll(filters),
    getItem: (id: string) => productsApi.getById(id),
    searchItems: (query: string) => productsApi.getAll({ search: query }),
    getLowStockItems: () => stockApi.getLowStock(),
    createItem: (data: any) => productsApi.create(data),
    updateItem: (id: string, data: any) => productsApi.update(id, data),
    deleteItem: (id: string) => productsApi.delete(id),
    updateQuantity: (id: string, quantity: number, reason?: string) =>
      stockApi.createMovement({
        variantId: id,
        type: quantity > 0 ? ("in" as StockMovementType) : ("out" as StockMovementType),
        quantity: Math.abs(quantity),
        reason: (reason as any) || "adjustment",
      }),
  };
}
