import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

interface LocationFilters extends BaseFilters {
  locationType?: string;
}

export function createLocationsApi(apiClient: any) {
  return {
    getAll: (filters: LocationFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/locations${buildQueryParams(filters)}`),

    create: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/locations", data),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      apiClient.put(`/locations/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/locations/${id}`),
  };
}
