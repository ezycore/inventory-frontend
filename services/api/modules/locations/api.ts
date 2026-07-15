import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ApiLocation } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

interface LocationFilters extends BaseFilters {
  locationType?: string;
}

export const locationsApi = {
  getAll: (
    filters: LocationFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<ApiLocation>>> =>
    //used in CreatePurchaseOrderPage (will removed later) & locations page table getAllData
    apiClient.get(`/locations${buildQueryParams(filters)}`),

  getStats: (): Promise<ApiResponse<any>> =>
    apiClient.get("/locations/stats"),

  create: (data: any): Promise<ApiResponse<ApiLocation>> =>
    //used in locations page
    apiClient.post("/locations", data),

  update: (id: string, data: any): Promise<ApiResponse<ApiLocation>> =>
    //used in locations page
    apiClient.put(`/locations/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    //used in locations page
    apiClient.delete(`/locations/${id}`),
};
