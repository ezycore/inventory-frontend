import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CustomerLedger,
  CustomerOutstanding,
  CustomerReceipt,
  CustomerStatement,
  CustomersSummary,
  PaginatedResponse,
  ReceiveCustomerPaymentDto,
} from "@/types";
import type { ApiCustomer, CustomerListItem } from "@/types/api";
import { buildQueryParams, type BaseFilters } from "../../utils";

export interface CustomerLedgerFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const customersApi = {
  getAll: (filters: BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<CustomerListItem>>> =>
    apiClient.get(`/sales/customers${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<ApiCustomer>> =>
    apiClient.get(`/sales/customers/${id}`),

  create: (data: any): Promise<ApiResponse<ApiCustomer>> =>
    apiClient.post("/sales/customers", data),

  update: (id: string, data: any): Promise<ApiResponse<ApiCustomer>> =>
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

  // Open invoices, oldest first — the allocation preview for a receipt
  getOutstanding: (customerId: string): Promise<ApiResponse<CustomerOutstanding>> =>
    apiClient.get(`/sales/customers/${customerId}/outstanding`),

  // Settle one or more outstanding invoices with a single payment
  receivePayment: (
    customerId: string,
    data: ReceiveCustomerPaymentDto,
  ): Promise<ApiResponse<CustomerReceipt>> =>
    apiClient.post(`/sales/customers/${customerId}/payments`, data),

  // Email an outstanding-dues statement to the customer (their email on file,
  // or an override address)
  emailStatement: (
    customerId: string,
    data: { email?: string } = {},
  ): Promise<ApiResponse<{ to: string; totalDue: number; invoices: number }>> =>
    apiClient.post(`/sales/customers/${customerId}/email-statement`, data),
};
