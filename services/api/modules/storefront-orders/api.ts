import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

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
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const base = "/ecommerce/orders";

export const storefrontOrdersApi = {
  list: (params: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminOrderListResult>> => {
    const qs = new URLSearchParams();
    if (params.status) qs.append("status", params.status);
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    const s = qs.toString();
    return apiClient.get(`${base}${s ? `?${s}` : ""}`);
  },
  get: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.get(`${base}/${id}`),
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
