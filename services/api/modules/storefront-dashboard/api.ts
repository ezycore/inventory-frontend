import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { StorefrontDashboard } from "@/types/api";

// Response shape is generated from the backend `sectionDashboardDto` (ecommerce.dto.ts → OpenAPI).
// Kept under the existing names, with sub-types derived so they cannot drift from the parent.
export type EcommerceDashboard = StorefrontDashboard;
export type EcommerceDashboardStats = StorefrontDashboard["stats"];
// `LowStockProduct` is gone with P5: low stock is a dashboard block now
// (`stock.alerts`), so the store overview neither computes nor returns it.

const base = "/ecommerce/dashboard";

export const storefrontDashboardApi = {
  get: (): Promise<ApiResponse<StorefrontDashboard>> => apiClient.get(base),
};
