import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { AdminStorefrontOrder } from "../storefront-orders/api";

export interface EcommerceDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingCount: number;
  liveProducts: number;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  image?: string;
  availableQuantity: number;
}

export interface EcommerceDashboard {
  published: boolean;
  displayName: string;
  currency?: string;
  fulfillmentLocationSet: boolean;
  stats: EcommerceDashboardStats;
  recentOrders: AdminStorefrontOrder[];
  lowStockProducts: LowStockProduct[];
}

const base = "/ecommerce/dashboard";

export const storefrontDashboardApi = {
  get: (): Promise<ApiResponse<EcommerceDashboard>> => apiClient.get(base),
};
