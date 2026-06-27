import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

// ── Period type ──
export type DashboardPeriod =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "last6Months"
  | "lastYear"
  | "custom";

// ── Overview query params ──
export interface DashboardOverviewParams {
  period: DashboardPeriod;
  weekStartDay?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

// ── Overview response ──
export interface DashboardOverview {
  period: {
    key: DashboardPeriod;
    startDate: string;
    endDate: string;
    chartGrouping: "hourly" | "daily" | "weekly" | "monthly";
  };
  sales: {
    total: number;
    paid: number;
    due: number;
    count: number;
    previousTotal: number;
    previousCount: number;
  };
  purchases: {
    total: number;
    paid: number;
    due: number;
    count: number;
    previousTotal: number;
    previousCount: number;
  };
  chartData: Array<{ label: string; sales: number; purchases: number }>;
  topSoldItems: Array<{
    productName: string;
    variantName: string | null;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
  }>;
  lowStock: {
    count: number;
    outOfStockCount: number;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      sku: string;
      currentStock: number;
      alertThreshold: number;
    }>;
  };
  inventory: {
    totalValue: number;
    totalItems: number;
  };
  grossProfit: number;
  totalCOGS: number;
}

// ── Stats response (basic counts) - used by Products & Inventory pages ──
export interface DashboardStats {
  products: {
    total: number;
    active: number;
    inactive: number;
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
  stock?: {
    totalItems: number;
    totalValue: number; // valued at cost (purchase) price
    totalRetailValue: number; // quantity × product/variant price
  };
}

export const dashboardApi = {
  getStats: (): Promise<ApiResponse<DashboardStats>> =>
    apiClient.get("/dashboard/stats"),

  getOverview: (params?: DashboardOverviewParams): Promise<ApiResponse<DashboardOverview>> => {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set("period", params.period);
    if (params?.weekStartDay !== undefined) searchParams.set("weekStartDay", String(params.weekStartDay));
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    const qs = searchParams.toString();
    return apiClient.get(`/dashboard/overview${qs ? `?${qs}` : ""}`);
  },
};

