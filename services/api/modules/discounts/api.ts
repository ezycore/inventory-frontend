import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateDiscountDto,
  Discount,
  PaginatedResponse,
  UpdateDiscountDto,
} from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface DiscountFilters extends BaseFilters {
  type?: "percentage" | "fixed";
  applicableTo?: "sales" | "purchase" | "both";
}

export const discountsApi = {
  getAll: (
    filters: DiscountFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Discount>>> =>
    apiClient.get(`/discounts${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<Discount>> =>
    apiClient.get(`/discounts/${id}`),

  getSalesDiscounts: (
    filters: BaseFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Discount>>> =>
    apiClient.get(`/discounts/sales${buildQueryParams(filters)}`),

  getPurchaseDiscounts: (
    filters: BaseFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Discount>>> =>
    apiClient.get(`/discounts/purchase${buildQueryParams(filters)}`),

  create: (data: CreateDiscountDto): Promise<ApiResponse<Discount>> =>
    apiClient.post("/discounts", data),

  update: (
    id: string,
    data: UpdateDiscountDto
  ): Promise<ApiResponse<Discount>> =>
    apiClient.put(`/discounts/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/discounts/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiClient.post("/discounts/bulk-delete", { ids }),
};
