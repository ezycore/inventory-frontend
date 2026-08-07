import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import { buildQueryParams } from "../../utils";

export interface LocationStockSummary {
  locationId: string;
  locationName: string;
  locationType: "store" | "warehouse";
  status: "active" | "inactive";
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
}

export interface LocationStockItem {
  inventoryId: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantAttributes: Record<string, string> | null;
  quantity: number;
  quantityAlert: number;
  costPrice: number;
  stockValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  status: string;
  categoryName: string | null;
  /** The child level. Null for a product filed directly under a top-level category. */
  subcategoryName: string | null;
  brandName: string | null;
}

export interface LocationStockDetailReport {
  location: {
    _id: string;
    name: string;
    locationType: string;
    address: string;
    status: string;
  };
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    inStockCount: number;
    uniqueProducts: number;
  };
  items: LocationStockItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CrossLocationComparison {
  locations: Array<{
    _id: string;
    name: string;
    locationType: string;
  }>;
  products: Array<{
    productId: string;
    variantId: string | null;
    productName: string;
    variantAttributes: Record<string, string> | null;
    totalQuantity: number;
    totalValue: number;
    locations: Array<{
      locationId: string;
      quantity: number;
      costPrice: number;
      isLowStock: boolean;
    }>;
  }>;
}

export interface LocationStockFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const locationStockReportApi = {
  /** Get stock summary for all accessible locations */
  getSummary: (): Promise<ApiResponse<LocationStockSummary[]>> =>
    apiClient.get("/locations/stock-report/summary"),

  /** Get detailed stock report for a specific location */
  getLocationDetail: (
    locationId: string,
    filters: LocationStockFilters = {},
  ): Promise<ApiResponse<LocationStockDetailReport>> =>
    apiClient.get(
      `/locations/stock-report/${locationId}${buildQueryParams(filters)}`,
    ),

  /** Get cross-location stock comparison */
  getCrossLocationComparison: (): Promise<
    ApiResponse<CrossLocationComparison>
  > => apiClient.get("/locations/stock-report/comparison"),
};
