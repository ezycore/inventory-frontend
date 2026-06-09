/**
 * Sales Returns API Module
 * Handles all sales return related API calls
 */

import { apiClient } from "@/lib/api-client";
import { buildQueryParams } from "../../utils";
import type { ApiResponse } from "@/types";

export interface CustomerPendingDueRow {
  _id: string;
  saleId: { _id: string; invoiceNumber: string; totalAmount: number; createdAt: string } | string;
  currentAmount: number;
  originalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface CustomerPendingDuesResponse {
  dues: CustomerPendingDueRow[];
  totalDue: number;
  count: number;
  creditBalance: number;
}

/**
 * Sales Return filters
 */
export interface SalesReturnFilters {
  page?: number;
  limit?: number;
  saleId?: string;
  customerId?: string;
  status?: "pending" | "completed" | "cancelled";
  reason?: "damaged" | "defective" | "wrong_item" | "customer_changed_mind" | "expired" | "other";
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Return item structure
 */
export interface ReturnItem {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount?: number;
  refundAmount?: number;
}

/**
 * Due adjustment for other sales
 */
export interface DueAdjustment {
  dueId: string;
  saleId: string;
  amount: number;
}

/**
 * Account refund structure
 */
export interface AccountRefund {
  accountId: string;
  amount: number;
  paymentMethod?: "cash" | "card" | "bank" | "mfs" | "other";
}

/**
 * Refund allocation options
 */
export interface RefundAllocation {
  adjustSaleDue?: number;
  adjustOtherDues?: DueAdjustment[];
  accountRefund?: AccountRefund;
  /** Convert refund into customer store credit. */
  customerCredit?: { amount: number };
}

/**
 * Create sales return DTO
 */
export interface CreateSalesReturnDto {
  saleId: string;
  items: ReturnItem[];
  reason: "damaged" | "defective" | "wrong_item" | "customer_changed_mind" | "expired" | "other";
  notes?: string;
  deductionAmount?: number;
  refundAllocation?: RefundAllocation;
}

/**
 * Customer pending due from a sale
 */
export interface CustomerPendingDue {
  id: string;
  saleId: string;
  invoiceNumber: string;
  dueAmount: number;
  totalAmount: number;
  saleDate: string;
}

/**
 * Sales Returns API instance
 */
export const salesReturnsApi = {
  /**
   * Get all sales returns with filters
   */
  getAll: (filters?: SalesReturnFilters) => {
    const queryString = buildQueryParams(filters || {});
    return apiClient.get(`/sales/returns${queryString}`);
  },

  /**
   * Get sales return by ID
   */
  getById: (id: string) => {
    return apiClient.get(`/sales/returns/${id}`);
  },

  /**
   * Get returns for a specific sale
   */
  getBySaleId: (saleId: string) => {
    return apiClient.get(`/sales/${saleId}/returns`);
  },

  /**
   * Create a new sales return
   */
  create: (data: CreateSalesReturnDto) => {
    return apiClient.post("/sales/returns", data);
  },

  /**
   * Get customer pending dues for refund allocation
   * Used when allocating refund amount to other pending dues
   */
  getCustomerPendingDues: (
    customerId: string,
    excludeSaleId?: string,
  ): Promise<ApiResponse<CustomerPendingDuesResponse>> => {
    const queryString = excludeSaleId ? `?excludeSaleId=${excludeSaleId}` : "";
    return apiClient.get<ApiResponse<CustomerPendingDuesResponse>>(
      `/sales/returns/customer/${customerId}/pending-dues${queryString}`,
    );
  },

  /**
   * Get sales returns summary statistics
   */
  getSummary: () => {
    return apiClient.get("/sales/returns/summary");
  },
};
