import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateDiscountDto,
  PaginatedResponse,
  UpdateDiscountDto,
} from "@/types";
import type { ApiDiscount } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface DiscountFilters extends BaseFilters {
  type?: "percentage" | "fixed";
  applicableTo?: "sales" | "purchase" | "both";
}

export const discountsApi = {
  getAll: (
    filters: DiscountFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiDiscount>>> =>
    apiClient.get(`/discounts${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiDiscount>> =>
    apiClient.get(`/discounts/${id}`),

  getStats: (): Promise<ApiResponse<any>> =>
    apiClient.get("/discounts/stats"),

  getSalesDiscounts: (
    filters: BaseFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiDiscount>>> =>
    apiClient.get(`/discounts/sales${buildQueryParams(filters)}`),

  getPurchaseDiscounts: (
    filters: BaseFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ApiDiscount>>> =>
    apiClient.get(`/discounts/purchase${buildQueryParams(filters)}`),

  create: (data: CreateDiscountDto): Promise<ApiResponse<ApiDiscount>> =>
    apiClient.post("/discounts", data),

  update: (
    id: string,
    data: UpdateDiscountDto
  ): Promise<ApiResponse<ApiDiscount>> =>
    apiClient.put(`/discounts/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/discounts/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<{ deleted: number }>> =>
    apiClient.post("/discounts/bulk-delete", { ids }),
};
