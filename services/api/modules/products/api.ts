import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, CreateProductDto, UpdateProductDto, ProductFilters } from "@/types";
import { buildQueryParams } from "../../utils";

export const productsApi = {

  getStats: (): Promise<ApiResponse<{ stats: { name: string; value: number }[] }>> =>
    apiClient.get("/products/stats"),

  getAll: (filters: ProductFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/products${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/products/${id}`),

  getBySlug: (slug: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/products/slug/${slug}`),

  search: (query: string): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/products/search?q=${encodeURIComponent(query)}`),

  create: (data: CreateProductDto): Promise<ApiResponse<any>> =>
    apiClient.post("/products", data),

  update: (id: string, data: UpdateProductDto): Promise<ApiResponse<any>> =>
    apiClient.put(`/products/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/products/${id}`),

  getVariants: (productId: string): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/products/${productId}/variants`),
};
