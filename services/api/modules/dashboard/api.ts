import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
// Response shapes are generated from the backend DTOs (`report.dto.ts` → OpenAPI). Re-exported
// here so existing consumers keep importing `DashboardOverview` / `DashboardStats` from this module.
import type { DashboardOverview, DashboardStats } from "@/types/api";
export type { DashboardOverview, DashboardStats };

// ── Period type — the FE-side vocabulary the period filter/query is built from. The wire
// `period.key` is a plain `string`; this narrows it for the filter UI and query params. ──
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

