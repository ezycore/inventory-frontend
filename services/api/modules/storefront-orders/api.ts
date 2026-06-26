import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface AdminOrderItem {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AdminOrderAddress {
  name: string;
  phone: string;
  address: string;
  city?: string;
  area?: string;
}

export interface OrderCourier {
  provider?: string;
  consignmentId?: string;
  trackingCode?: string;
  status?: string;
}

export interface AdminStorefrontOrder {
  _id: string;
  orderNumber: string;
  items: AdminOrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCharged: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: AdminOrderAddress;
  notes?: string;
  saleId?: string;
  courier?: OrderCourier;
  createdAt: string;
  statusHistory?: { status: string; at: string; by?: string }[];
}

export interface CourierCredField {
  key: string;
  label: string;
  secret?: boolean;
}
export interface CourierConfigEntry {
  provider: string;
  mode: string;
  enabled: boolean;
  configured: boolean;
}
export interface CourierListResult {
  couriers: CourierConfigEntry[];
  providers: Record<string, CourierCredField[]>;
}

export interface AdminOrderListResult {
  items: AdminStorefrontOrder[];
  /** Per-status counts for the list tabs (keys include "all" + each status). */
  counts?: Record<string, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Delivery-risk result for an order's customer phone. `available:false` means
 * there was no usable phone / history; `risk` is still returned for UI banding.
 */
export interface OrderFraudScore {
  available: boolean;
  source: string;
  phone: string;
  totalParcels: number;
  deliveredParcels: number;
  cancelledParcels: number;
  successRatio: number;
  risk: "low" | "medium" | "high";
}

const base = "/ecommerce/orders";

export const storefrontOrdersApi = {
  list: (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminOrderListResult>> => {
    const qs = new URLSearchParams();
    if (params.status) qs.append("status", params.status);
    if (params.search) qs.append("search", params.search);
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    const s = qs.toString();
    return apiClient.get(`${base}${s ? `?${s}` : ""}`);
  },
  // Adapter for DataTable's self-contained mode: list() already paginates and
  // filters by status server-side; this flattens its { items, pagination }
  // payload into the PaginatedResponse shape DataTable expects.
  getAll: async (
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<ApiResponse<PaginatedResponse<AdminStorefrontOrder>>> => {
    const res = await storefrontOrdersApi.list({
      status: params.status,
      page: params.page,
      limit: params.limit,
    });
    const items = res.data?.items ?? [];
    const pg = res.data?.pagination ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: items.length,
      totalPages: 1,
    };
    return {
      success: res.success,
      message: res.message,
      data: {
        items,
        total: pg.total,
        page: pg.page,
        limit: pg.limit,
        totalPages: pg.totalPages,
        hasNext: pg.page < pg.totalPages,
        hasPrev: pg.page > 1,
      },
    };
  },
  get: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.get(`${base}/${id}`),
  fraudScore: (id: string): Promise<ApiResponse<OrderFraudScore>> =>
    apiClient.get(`${base}/${id}/fraud-check`),
  confirm: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/confirm`, {}),
  updateStatus: (
    id: string,
    status: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`${base}/${id}/status`, { status }),
  cancel: (
    id: string,
    reject?: boolean,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/cancel`, { reject }),
  updateCourierCost: (
    id: string,
    shippingCost: number,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`${base}/${id}/courier-cost`, { shippingCost }),
  markPaid: (
    id: string,
    accountId?: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/payment`, { accountId }),
  createConsignment: (
    id: string,
    provider: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/consignment`, { provider }),
  refreshTracking: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/refresh-tracking`, {}),
};

const couriersBase = "/ecommerce/couriers";

export const couriersApi = {
  list: (): Promise<ApiResponse<CourierListResult>> =>
    apiClient.get(couriersBase),
  upsert: (
    provider: string,
    body: { credentials?: Record<string, string>; mode?: string; enabled?: boolean },
  ): Promise<ApiResponse<CourierConfigEntry>> =>
    apiClient.put(`${couriersBase}/${provider}`, body),
  remove: (provider: string): Promise<ApiResponse<{ provider: string }>> =>
    apiClient.delete(`${couriersBase}/${provider}`),
};
