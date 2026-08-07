import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { ApiTag } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

/**
 * Tags carry no image, so — unlike brands and categories — create/update take
 * plain JSON rather than FormData.
 */
export type TagWriteDto = Partial<
  Pick<ApiTag, "name" | "description" | "color" | "status">
>;

export const tagsApi = {
  getAll: (
    filters: BaseFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/tags${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/tags/${id}`),

  getBySlug: (slug: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/tags/slug/${slug}`),

  create: (data: TagWriteDto): Promise<ApiResponse<any>> =>
    apiClient.post("/tags", data),

  update: (id: string, data: TagWriteDto): Promise<ApiResponse<any>> =>
    apiClient.put(`/tags/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/tags/${id}`),

  bulkDelete: (ids: string[]): Promise<ApiResponse<void>> =>
    apiClient.post("/tags/bulk-delete", { ids }),

  getStats: (): Promise<ApiResponse<any>> => apiClient.get(`/tags/stats`),
};
