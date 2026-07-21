import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, UpdateCategoryDto } from "@/types";
import type { CategoryApplyTaxResult } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

interface CategoryFilters extends BaseFilters {
  parent_id?: string;
}

export const categoriesApi = {
  getAll: (filters: CategoryFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/categories${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/categories/${id}`),

  getStats: (): Promise<ApiResponse<any>> =>
    apiClient.get("/categories/stats"),

  create: (data: FormData): Promise<ApiResponse<any>> =>
    apiClient.post("/categories", data),

  update: (
    id: string,
    data: UpdateCategoryDto | FormData,
  ): Promise<ApiResponse<any>> => apiClient.put(`/categories/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/categories/${id}`),

  /**
   * Re-point every product in this category at the category's default VAT rate.
   * Used after a rate is superseded — the new `Tax` row exists, but each product
   * still stores the retired one.
   */
  applyDefaultTax: (id: string): Promise<ApiResponse<CategoryApplyTaxResult>> =>
    apiClient.post(`/categories/${id}/apply-default-tax`, {}),
};
