import { apiClient } from "@/lib/api-client";
import type {
  AddPaymentDto,
  ApiResponse,
  CreateSalesOrderDto,
  PaginatedResponse,
  Payment,
  Sale,
  SaleFilters,
  SalesOrderStatus,
  SalesSummary,
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
};
