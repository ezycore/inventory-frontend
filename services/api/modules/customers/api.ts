import { apiClient } from "@/lib/api-client";
import type { ApiResponse, CustomerLedger, CustomerStatement, CustomersSummary, PaginatedResponse } from "@/types";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface CustomerLedgerFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

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

  // Get aggregated summary for all customers (totals)
  getSummary: (): Promise<ApiResponse<CustomersSummary>> =>
    apiClient.get("/sales/customers/summary"),

  // Get customer ledger (transaction history)
  getLedger: (customerId: string, filters: CustomerLedgerFilters = {}): Promise<ApiResponse<CustomerLedger>> =>
    apiClient.get(`/sales/customers/${customerId}/ledger${buildQueryParams(filters)}`),

  // Get account-wide customer statement (non-paginated) for printing
  getStatement: (
    customerId: string,
    filters: { startDate?: string; endDate?: string } = {},
  ): Promise<ApiResponse<CustomerStatement>> =>
    apiClient.get(`/sales/customers/${customerId}/statement${buildQueryParams(filters)}`),
};
