import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, CreateUnitDto, UpdateUnitDto } from "@/types";
import type { ApiUnit } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export const unitsApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiUnit>>> =>
    apiClient.get(`/units${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiUnit>> =>
    apiClient.get(`/units/${id}`),

  create: (data: CreateUnitDto): Promise<ApiResponse<ApiUnit>> =>
    apiClient.post("/units", data),

  update: (id: string, data: UpdateUnitDto): Promise<ApiResponse<ApiUnit>> =>
    apiClient.put(`/units/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/units/${id}`),
};
