import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  AdminStorefrontOrder,
  CourierList,
  CourierLocation,
  CourierPackage,
  CourierPrice,
  CourierRemoved,
  CourierStore,
  CourierTest,
  CourierUpsert,
  CourierWebhook,
  FraudScore,
  StorefrontOrderList,
} from "@/types/api";
export type { AdminStorefrontOrder, CourierPrice };

/** The multi-status envelope a bulk dispatch answers with (200 all-ok / 207 partial). */
export interface CourierBulkResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results?: { id: string; orderNumber?: string; consignmentId?: string; trackingCode?: string }[];
  errors?: { id: string; error?: string; code?: string }[];
}

// Response shapes generated from the backend storefront-order + courier DTOs (`ecommerce.dto.ts`).
// Order sub-shapes are derived from the parent so they cannot drift from it.
export type AdminOrderItem = AdminStorefrontOrder["items"][number];
export type AdminOrderAddress = AdminStorefrontOrder["shippingAddress"];
export type OrderCourier = NonNullable<AdminStorefrontOrder["courier"]>;
export type AdminOrderListResult = StorefrontOrderList;
export type OrderFraudScore = FraudScore;
export type CourierConfigEntry = CourierUpsert;
export type CourierListResult = CourierList;
export type CourierCredField = CourierList["providers"][string][number];

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
  courierPrice: (
    id: string,
    provider: string,
  ): Promise<ApiResponse<CourierPrice>> =>
    apiClient.get(
      `${base}/${id}/courier-price?provider=${encodeURIComponent(provider)}`,
    ),
  bulkConsignment: (
    orderIds: string[],
    provider: string,
  ): Promise<ApiResponse<CourierBulkResult>> =>
    apiClient.post(`${base}/bulk-consignment`, { orderIds, provider }),
  // Map an order's canonical address to a provider's own location codes before dispatch.
  resolveLocation: (
    id: string,
    provider: string,
    location: Record<string, string | number>,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/resolve-location`, { provider, location }),
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
  remove: (provider: string): Promise<ApiResponse<CourierRemoved>> =>
    apiClient.delete(`${couriersBase}/${provider}`),
  test: (provider: string): Promise<ApiResponse<CourierTest>> =>
    apiClient.post(`${couriersBase}/${provider}/test`, {}),
  stores: (provider: string): Promise<ApiResponse<CourierStore[]>> =>
    apiClient.get(`${couriersBase}/${provider}/stores`),
  packages: (provider: string): Promise<ApiResponse<CourierPackage[]>> =>
    apiClient.get(`${couriersBase}/${provider}/packages`),
  locations: (
    provider: string,
    level: string,
    parent?: string | number,
  ): Promise<ApiResponse<CourierLocation[]>> =>
    apiClient.get(
      `${couriersBase}/${provider}/locations?level=${encodeURIComponent(level)}${
        parent !== undefined && parent !== ""
          ? `&parent=${encodeURIComponent(String(parent))}`
          : ""
      }`,
    ),
  webhook: (): Promise<ApiResponse<CourierWebhook>> =>
    apiClient.get(`${couriersBase}/webhook`),
  regenerateWebhook: (): Promise<ApiResponse<CourierWebhook>> =>
    apiClient.post(`${couriersBase}/webhook/regenerate`, {}),
};
