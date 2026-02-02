import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export const customersApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/sales/customers${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/sales/customers/${id}`),

  create: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/sales/customers", data),

  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/sales/customers/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/sales/customers/${id}`),
};
