import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

export const dashboardApi = {
  getStats: (): Promise<
    ApiResponse<{
      products: {
        total: number;
        active: number;
        inactive: number;
        archived: number;
      };
      variants: {
        total: number;
        active: number;
        lowStock: number;
        outOfStock: number;
      };
      categories: {
        total: number;
        active: number;
      };
      brands: {
        total: number;
        active: number;
      };
      stock: {
        totalValue: number;
        totalItems: number;
        lowStockAlerts: number;
      };
    }>
  > => apiClient.get("/dashboard/stats"),
};
