import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, Unit, CreateUnitDto, UpdateUnitDto } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export const unitsApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<Unit>>> =>
    apiClient.get(`/units${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<Unit>> =>
    apiClient.get(`/units/${id}`),

  create: (data: CreateUnitDto): Promise<ApiResponse<Unit>> =>
    apiClient.post("/units", data),

  update: (id: string, data: UpdateUnitDto): Promise<ApiResponse<Unit>> =>
    apiClient.put(`/units/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/units/${id}`),
};
