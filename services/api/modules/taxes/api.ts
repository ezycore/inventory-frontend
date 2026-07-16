import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, CreateTaxDto, UpdateTaxDto } from "@/types";
import type { ApiTax } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export const taxesApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiTax>>> =>
    apiClient.get(`/taxes${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiTax>> =>
    apiClient.get(`/taxes/${id}`),

  create: (data: CreateTaxDto): Promise<ApiResponse<ApiTax>> =>
    apiClient.post("/taxes", data),

  update: (id: string, data: UpdateTaxDto): Promise<ApiResponse<ApiTax>> =>
    apiClient.put(`/taxes/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/taxes/${id}`),
};
