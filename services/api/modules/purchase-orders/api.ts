import { apiClient } from "@/lib/api-client";
import type {
  AddPurchasePaymentDto,
  ApiResponse,
  CreatePurchaseOrderDto,
  CreatePurchaseOrdersDto,
  CreatePurchaseReturnDto,
  FinalizePurchaseOrderDto,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrdersSummary,
  PurchaseReturn,
  PurchaseReturnFilters,
  PurchaseReturnsSummary,
  PurchaseTransactionsResponse,
  ReceivePurchaseOrderDto,
  SupplierPendingDuesResponse,
  UpdatePurchaseOrderDraftDto,
  UpdatePurchaseOrderDto,
} from "@/types";
import { buildQueryParams } from "../../utils";

/**
 * Purchase Orders API
 * Base path: /purchases/orders
 */
export const purchaseOrdersApi = {
  /**
   * Get all purchase orders with filters
   */
  getAll: (
    filters: PurchaseOrderFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<PurchaseOrder>>> =>
    apiClient.get(`/purchases/orders${buildQueryParams(filters)}`),

  /**
   * Get purchase order by ID
   */
  getById: (id: string): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.get(`/purchases/orders/${id}`),

  /**
   * Create a new purchase order
   */
  create: (data: CreatePurchaseOrdersDto): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post("/purchases/orders", data),

  /**
   * Update an existing purchase order
   */
  update: (
    id: string,
    data: UpdatePurchaseOrderDto
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.patch(`/purchases/orders/${id}`, data),

  /**
   * Receive items for a purchase order
   */
  receive: (
    id: string,
    data: ReceivePurchaseOrderDto
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post(`/purchases/orders/${id}/receive`, data),

  /**
   * Cancel a purchase order
   */
  cancel: (id: string): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post(`/purchases/orders/${id}/cancel`, {}),

  /**
   * Hard-delete a draft purchase order. Non-draft orders must use cancel().
   */
  deleteDraft: (
    id: string,
  ): Promise<ApiResponse<{ deleted: true; orderNumber: string }>> =>
    apiClient.delete(`/purchases/orders/${id}`),

  /**
   * Update a draft purchase order (no side effects). Backend rejects non-drafts.
   */
  updateDraft: (
    id: string,
    data: UpdatePurchaseOrderDraftDto,
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.patch(`/purchases/orders/${id}`, data),

  /**
   * Finalize a draft purchase order — runs full side-effect pipeline.
   */
  finalizeDraft: (
    id: string,
    data: FinalizePurchaseOrderDto,
  ): Promise<ApiResponse<{ order: PurchaseOrder }>> =>
    apiClient.post(`/purchases/orders/${id}/finalize`, data),

  /**
   * Get purchase orders summary statistics
   */
  getSummary: (): Promise<ApiResponse<PurchaseOrdersSummary>> =>
    apiClient.get("/purchases/orders/summary"),

  /**
   * Add payment to a purchase order
   */
  addPayment: (
    id: string,
    data: AddPurchasePaymentDto
  ): Promise<ApiResponse<PurchaseOrder>> =>
    apiClient.post(`/purchases/orders/${id}/payment`, data),

  /**
   * Get payments for a purchase order
   */
  getPayments: (id: string): Promise<ApiResponse<unknown[]>> =>
    apiClient.get(`/purchases/orders/${id}/payments`),

  /**
   * Get merged transactions timeline for a purchase order:
   * payments + cash refunds + own return credits + cross-PO inbound credits.
   */
  getTransactions: (
    id: string,
  ): Promise<ApiResponse<PurchaseTransactionsResponse>> =>
    apiClient.get(`/purchases/orders/${id}/transactions`),
};

/**
 * Purchase Returns API
 * Nested under /purchases/orders/returns
 */
export const purchaseReturnsApi = {
  /**
   * Get all purchase returns with filters
   */
  getAll: (
    filters: PurchaseReturnFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<PurchaseReturn>>> =>
    apiClient.get(`/purchases/orders/returns${buildQueryParams(filters)}`),

  /**
   * Get purchase return by ID
   */
  getById: (id: string): Promise<ApiResponse<PurchaseReturn>> =>
    apiClient.get(`/purchases/orders/returns/${id}`),

  /**
   * Get returns for a specific purchase order
   */
  getByPurchaseOrderId: (
    purchaseOrderId: string
  ): Promise<ApiResponse<PurchaseReturn[]>> =>
    apiClient.get(`/purchases/orders/${purchaseOrderId}/returns`),

  /**
   * Create a new purchase return
   */
  create: (data: CreatePurchaseReturnDto): Promise<ApiResponse<PurchaseReturn>> =>
    apiClient.post("/purchases/orders/returns", data),

  /**
   * Get supplier pending dues for refund allocation
   */
  getSupplierPendingDues: (
    supplierId: string,
    excludePurchaseOrderId?: string
  ): Promise<ApiResponse<SupplierPendingDuesResponse>> => {
    const queryString = excludePurchaseOrderId
      ? `?excludePurchaseOrderId=${excludePurchaseOrderId}`
      : "";
    return apiClient.get(
      `/purchases/orders/returns/supplier/${supplierId}/pending-dues${queryString}`
    );
  },

  /**
   * Get purchase returns summary statistics
   */
  getSummary: (): Promise<ApiResponse<PurchaseReturnsSummary>> =>
    apiClient.get("/purchases/orders/returns/summary"),
};
