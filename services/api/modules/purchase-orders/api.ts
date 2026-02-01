import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  CreatePurchaseOrderDto,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseOrderStatus,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from "@/types";
import { buildQueryParams } from "../../utils";

export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus | string;
  supplierId?: string;
  locationId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const purchaseOrdersApi = {
  getAll: (
    filters: PurchaseOrderFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<PurchaseOrder>>> =>
    apiClient.get(`/purchase-orders${buildQueryParams(filters)}`),

  getById: (id: string): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.get(`/purchase-orders/${id}`),

  create: (data: CreatePurchaseOrderDto): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post("/purchase-orders", data),

  update: (
    id: string,
    data: UpdatePurchaseOrderDto
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.put(`/purchase-orders/${id}`, data),

  updateStatus: (
    id: string,
    status: string
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.patch(`/purchase-orders/${id}/status`, { status }),

  receive: (
    id: string,
    data: ReceivePurchaseOrderDto
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post(`/purchase-orders/${id}/receive`, data),

  cancel: (id: string): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post(`/purchase-orders/${id}/cancel`, {}),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/purchase-orders/${id}`),
};
