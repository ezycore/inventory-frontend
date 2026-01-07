import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

export function createUnitsApi(apiClient: any) {
  return {
    getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/units${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/units/${id}`),

    create: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/units", data),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      apiClient.put(`/units/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/units/${id}`),
  };
}
