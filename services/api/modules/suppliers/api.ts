import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, SupplierLedger } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface SupplierLedgerFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const suppliersApi = {
  getAll: (
    filters: BaseFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<any>>> =>
    apiClient.get(`/purchases/suppliers${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/purchases/suppliers/${id}`),

  create: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post("/purchases/suppliers", data),

  update: (id: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/purchases/suppliers/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/purchases/suppliers/${id}`),

  // Get supplier ledger (transaction history)
  getLedger: (
    supplierId: string,
    filters: SupplierLedgerFilters = {},
  ): Promise<ApiResponse<SupplierLedger>> =>
    apiClient.get(
      `/purchases/suppliers/${supplierId}/ledger${buildQueryParams(filters)}`,
    ),
};
