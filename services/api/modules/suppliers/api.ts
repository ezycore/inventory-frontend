import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse, SupplierLedger, SupplierStatement } from "@/types";
import type { ApiSupplier, SupplierListItem } from "@/types/api";
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
  ): Promise<ApiResponse<PaginatedResponse<SupplierListItem>>> =>
    apiClient.get(`/suppliers${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiSupplier>> =>
    apiClient.get(`/suppliers/${id}`),

  create: (data: any): Promise<ApiResponse<ApiSupplier>> =>
    apiClient.post("/suppliers", data),

  update: (id: string, data: any): Promise<ApiResponse<ApiSupplier>> =>
    apiClient.put(`/suppliers/${id}`, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/suppliers/${id}`),

  // Get supplier ledger (transaction history)
  getLedger: (
    supplierId: string,
    filters: SupplierLedgerFilters = {},
  ): Promise<ApiResponse<SupplierLedger>> =>
    apiClient.get(
      `/suppliers/${supplierId}/ledger${buildQueryParams(filters)}`,
    ),

  // Get account-wide supplier statement (non-paginated) for printing
  getStatement: (
    supplierId: string,
    filters: { startDate?: string; endDate?: string } = {},
  ): Promise<ApiResponse<SupplierStatement>> =>
    apiClient.get(
      `/suppliers/${supplierId}/statement${buildQueryParams(filters)}`,
    ),
};
