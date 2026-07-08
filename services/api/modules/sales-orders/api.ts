import { apiClient } from "@/lib/api-client";
import type {
  AddPaymentDto,
  ApiResponse,
  CreateSalesOrderDto,
  FinalizeSaleDto,
  PaginatedResponse,
  Payment,
  Sale,
  SaleFilters,
  SalesOrderStatus,
  SalesSummary,
  SaleTransactionsResponse,
  UpdateSaleDraftDto,
} from "@/types";
import { buildQueryParams } from "../../utils";

export interface SalesOrderFilters {
  page?: number;
  limit?: number;
  status?: SalesOrderStatus | string;
  customerId?: string;
  locationId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/**
 * Sales API - for working with Sale records (sales history)
 * Uses the same endpoints but with proper Sale types
 */
export const salesApi = {
  /**
   * Get all sales with pagination and filters
   */
  getAll: (
    filters: SaleFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<Sale>>> =>
    apiClient.get(`/sales${buildQueryParams(filters)}`),

  /**
   * Get a single sale by ID with payments
   */
  getById: (id: string): Promise<ApiResponse<Sale & { payments?: Payment[] }>> =>
    apiClient.get(`/sales/${id}`),

  /**
   * Get all payments for a sale
   */
  getPayments: (saleId: string): Promise<ApiResponse<Payment[]>> =>
    apiClient.get(`/sales/${saleId}/payments`),

  /**
   * Get merged transactions timeline for a sale:
   * payments + cash refunds + own return credits + cross-invoice inbound credits.
   */
  getTransactions: (saleId: string): Promise<ApiResponse<SaleTransactionsResponse>> =>
    apiClient.get(`/sales/${saleId}/transactions`),

  /**
   * Add payment to a sale
   */
  addPayment: (
    saleId: string,
    data: AddPaymentDto,
  ): Promise<ApiResponse<{ payment: Payment; sale: Sale }>> =>
    apiClient.post(`/sales/${saleId}/payment`, data),

  /**
   * Get sales summary statistics (for sales history page)
   */
  getSummary: (): Promise<ApiResponse<SalesSummary>> =>
    apiClient.get("/sales/summary"),

  //create sales order
  createSalesOrder: (data: CreateSalesOrderDto): Promise<ApiResponse<{ sale: Sale }>> =>
    apiClient.post(`/sales`, data),

  /**
   * Update a draft sale (only allowed while status === "draft").
   * No inventory / payment / due side effects fire.
   */
  updateDraftSale: (
    id: string,
    data: UpdateSaleDraftDto,
  ): Promise<ApiResponse<Sale>> => apiClient.patch(`/sales/${id}`, data),

  /**
   * Finalize a draft sale: promotes it to a real sale and runs the full
   * pipeline (inventory deduct, payment, credit, customer due).
   */
  finalizeDraftSale: (
    id: string,
    data: FinalizeSaleDto = {},
  ): Promise<ApiResponse<{ sale: Sale; payment?: Payment }>> =>
    apiClient.post(`/sales/${id}/finalize`, data),

  /**
   * Hard-delete a draft sale. Finalized sales must use the returns/cancel flow.
   */
  deleteDraftSale: (
    id: string,
  ): Promise<ApiResponse<{ deleted: true; invoiceNumber: string }>> =>
    apiClient.delete(`/sales/${id}`),

  /**
   * Email the receipt to the customer — their email on file, or an override
   * address. Not allowed for draft/cancelled sales.
   */
  emailReceipt: (
    saleId: string,
    data: { email?: string } = {},
  ): Promise<ApiResponse<{ to: string; invoiceNumber: string }>> =>
    apiClient.post(`/sales/${saleId}/email-receipt`, data),
};
