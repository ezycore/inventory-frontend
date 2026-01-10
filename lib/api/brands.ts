import type { ApiResponse, PaginatedResponse, UpdateBrandDto } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

export function createBrandsApi(apiClient: any) {
  return {
    getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/brands${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/brands/${id}`),

    getBySlug: (slug: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/brands/slug/${slug}`),

    create: (data: FormData): Promise<ApiResponse<any>> =>
      apiClient.post("/brands", data),

    update: (id: string, data: UpdateBrandDto | FormData): Promise<ApiResponse<any>> =>
      apiClient.put(`/brands/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/brands/${id}`),

    bulkDelete: (ids: string[]): Promise<ApiResponse<void>> =>
      apiClient.post("/brands/bulk-delete", { ids }),
  };
}
