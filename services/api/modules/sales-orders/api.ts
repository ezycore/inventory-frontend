import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreateSalesOrderDto,
  FulfillSalesOrderDto,
  PaginatedResponse,
  SalesOrder,
  SalesOrderStatus,
  UpdateSalesOrderDto,
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

export const salesOrdersApi = {
  getAll: (
    filters: SalesOrderFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<SalesOrder>>> =>
    apiClient.get(`/sales${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<SalesOrder>> =>
    apiClient.get(`/sales/${id}`),

  create: (data: CreateSalesOrderDto): Promise<ApiResponse<SalesOrder>> =>
    apiClient.post("/sales", data),

  update: (
    id: string,
    data: UpdateSalesOrderDto,
  ): Promise<ApiResponse<SalesOrder>> =>
    apiClient.put(`/sales-orders/${id}`, data),

  updateStatus: (
    id: string,
    status: string,
  ): Promise<ApiResponse<SalesOrder>> =>
    apiClient.patch(`/sales-orders/${id}/status`, { status }),

  fulfill: (
    id: string,
    data?: FulfillSalesOrderDto,
  ): Promise<ApiResponse<SalesOrder>> =>
    apiClient.post(`/sales-orders/${id}/fulfill`, data || {}),

  cancel: (id: string): Promise<ApiResponse<SalesOrder>> =>
    apiClient.post(`/sales-orders/${id}/cancel`, {}),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/sales-orders/${id}`),

  getCustomerDiscount: (
    customerId: string,
  ): Promise<ApiResponse<{ discount: number }>> =>
    apiClient.get(`/sales-orders/customer/${customerId}/discount`),
};
