// coding-standard: maintained
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
  CustomCourier,
  CustomCourierRemoved,
  FraudScore,
  OrderStats,
  StorefrontOrderList,
} from "@/types/api";
export type { AdminStorefrontOrder, CourierPrice, OrderStats };

/** The list-page filters — courier/fulfillment/payment narrow the status-tab counts too. */
export interface AdminOrderListParams {
  status?: string;
  search?: string;
  courier?: string;
  fulfillmentType?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

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
export type CustomCourierEntry = CustomCourier;

/**
 * Manual-dispatch payload. Every tracking field is optional — plenty of local couriers
 * hand over nothing but a phone call, and the order must still be shippable.
 */
export interface ManualConsignmentPayload {
  customCourierId: string;
  trackingCode?: string;
  consignmentId?: string;
  /** Overrides the partner's `defaultCharge` as the order's courier cost. */
  shippingCost?: number;
  note?: string;
}

/** Create/update payload for a merchant-defined courier — no credentials, no mode. */
export interface CustomCourierPayload {
  name?: string;
  phone?: string;
  trackingUrlTemplate?: string;
  defaultCharge?: number;
  active?: boolean;
}

const base = "/ecommerce/orders";

export const storefrontOrdersApi = {
  list: (
    params: AdminOrderListParams,
  ): Promise<ApiResponse<AdminOrderListResult>> => {
    const qs = new URLSearchParams();
    if (params.status) qs.append("status", params.status);
    if (params.search) qs.append("search", params.search);
    if (params.courier) qs.append("courier", params.courier);
    if (params.fulfillmentType)
      qs.append("fulfillmentType", params.fulfillmentType);
    if (params.paymentStatus) qs.append("paymentStatus", params.paymentStatus);
    if (params.page) qs.append("page", String(params.page));
    if (params.limit) qs.append("limit", String(params.limit));
    const s = qs.toString();
    return apiClient.get(`${base}${s ? `?${s}` : ""}`);
  },
  // The COD-cash-cycle snapshot behind the stat cards (whole-org, ignores list filters).
  stats: (): Promise<ApiResponse<OrderStats>> =>
    apiClient.get(`${base}/stats`),
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
  // Cancel/reject a pre-commit order (no Sale yet). `refundAdvance` returns a
  // recorded COD delivery-charge advance to the shopper (books the reversing
  // expense); `accountId` overrides the account it's refunded from.
  cancel: (
    id: string,
    body?: { reject?: boolean; refundAdvance?: boolean; accountId?: string },
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/cancel`, body ?? {}),
  // Record a COD delivery-charge advance collected before shipping. The server
  // caps `amount` at the order's `shippingCharged`; the door/COD collection then
  // shrinks by it. Delivery orders only, once, before dispatch.
  recordAdvance: (
    id: string,
    amount: number,
    accountId?: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/advance`, { amount, accountId }),
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
  // Reverse a committed delivery order (RTO / post-delivery) with a full Sales Return.
  // `refund` routes the cash remainder of a *paid* order (account or store credit).
  returnOrder: (
    id: string,
    body: {
      returnCharge?: number;
      collectedAmount?: number;
      accountId?: string;
      refund?: { mode: "account" | "credit"; accountId?: string };
    },
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/return`, body),
  createConsignment: (
    id: string,
    provider: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/consignment`, { provider }),
  /** Dispatch to a merchant-defined courier — every tracking field is optional. */
  manualConsignment: (
    id: string,
    body: ManualConsignmentPayload,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/manual-consignment`, body),
  /** The merchant's own delivery-status update — manual couriers only. */
  setCourierStatus: (
    id: string,
    body: { normalizedStatus: string; note?: string },
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`${base}/${id}/courier-status`, body),
  refreshTracking: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/refresh-tracking`, {}),
  courierPrice: (
    id: string,
    provider: string,
  ): Promise<ApiResponse<CourierPrice>> =>
    apiClient.get(
      `${base}/${id}/courier-price?provider=${encodeURIComponent(provider)}`,
    ),
  /** Dispatch many orders to one carrier — exactly one of provider / customCourierId. */
  bulkConsignment: (
    orderIds: string[],
    carrier: { provider?: string; customCourierId?: string },
  ): Promise<ApiResponse<CourierBulkResult>> =>
    apiClient.post(`${base}/bulk-consignment`, { orderIds, ...carrier }),
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

  // Merchant-defined couriers (manual dispatch). There is no `list` here on
  // purpose: `couriersApi.list` already returns `customCouriers`, so the settings
  // page, the dispatch picker and the orders filter all read them from that one
  // request rather than each firing a second.
  createCustom: (
    body: CustomCourierPayload,
  ): Promise<ApiResponse<CustomCourierEntry>> =>
    apiClient.post(`${couriersBase}/custom`, body),
  updateCustom: (
    id: string,
    body: CustomCourierPayload,
  ): Promise<ApiResponse<CustomCourierEntry>> =>
    apiClient.put(`${couriersBase}/custom/${id}`, body),
  removeCustom: (id: string): Promise<ApiResponse<CustomCourierRemoved>> =>
    apiClient.delete(`${couriersBase}/custom/${id}`),
};
