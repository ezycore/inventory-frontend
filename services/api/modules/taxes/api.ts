import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, Tax, CreateTaxDto, UpdateTaxDto } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export const taxesApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<Tax>>> =>
    apiClient.get(`/taxes${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<Tax>> =>
    apiClient.get(`/taxes/${id}`),

  create: (data: CreateTaxDto): Promise<ApiResponse<Tax>> =>
    apiClient.post("/taxes", data),

  update: (id: string, data: UpdateTaxDto): Promise<ApiResponse<Tax>> =>
    apiClient.put(`/taxes/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/taxes/${id}`),
};
