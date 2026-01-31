import type { ApiResponse, PaginatedResponse, CreateCategoryDto, UpdateCategoryDto } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

interface CategoryFilters extends BaseFilters {
  parent_id?: string;
}

export function createCategoriesApi(apiClient: any) {
  return {
    getAll: (filters: CategoryFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/categories${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/categories/${id}`),

    create: (data: CreateCategoryDto): Promise<ApiResponse<any>> =>
      apiClient.post("/categories", data),

    update: (id: string, data: UpdateCategoryDto): Promise<ApiResponse<any>> =>
      apiClient.put(`/categories/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/categories/${id}`),
  };
}
