import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

export function createTaxesApi(apiClient: any) {
  return {
    getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/taxes${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/taxes/${id}`),

    create: (data: any): Promise<ApiResponse<any>> =>
      apiClient.post("/taxes", data),

    update: (id: string, data: any): Promise<ApiResponse<any>> =>
      apiClient.put(`/taxes/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/taxes/${id}`),
  };
}
