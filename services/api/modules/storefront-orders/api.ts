// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  AdminStorefrontOrder,
  CourierList,
  CourierLocation,
  CourierPackage,
  CourierPrice,
  OrderReturnPreview,
  CourierRemoved,
  CourierStore,
  CourierTest,
  CourierUpsert,
  CourierWebhook,
  CustomCourier,
  CustomCourierRemoved,
  FraudScore,
  OrderListPeriod,
  OrderQuote,
  OrderStats,
  OrderableProduct,
  StorefrontOrderList,
} from "@/types/api";
export type {
  AdminStorefrontOrder,
  CourierPrice,
  OrderReturnPreview,
  OrderListPeriod,
  OrderQuote,
  OrderStats,
  OrderableProduct,
};

/** The list-page filters — courier/fulfillment/payment narrow the status-tab counts too. */
export interface AdminOrderListParams {
  /**
   * A real status, or the `closed` tab — the server folds that one into
   * returned/cancelled/rejected. No order ever holds the value.
   */
  status?: string;
  search?: string;
  courier?: string;
  fulfillmentType?: string;
  paymentStatus?: string;
  /** Where the order came from — see `AdminOrderChannel`. */
  channel?: string;
  /**
   * Resolved server-side against the ORG's timezone, so a Dhaka merchant's day
   * does not roll over at a UTC boundary. Omit all three for no date filter —
   * an order queue defaults to everything, unlike a report.
   *
   * Typed off the generated spec (`OrderListPeriod`), not `string`: the server
   * 400s an unknown preset, and a rename on the backend must surface as a
   * compile error here rather than as an empty list with no message.
   */
  period?: OrderListPeriod;
  /** `yyyy-MM-dd`. Required by the server when `period` is `custom`. */
  startDate?: string;
  /** `yyyy-MM-dd`. Required by the server when `period` is `custom`. */
  endDate?: string;
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

/** Body of `POST /api/ecommerce/orders`. */
export interface CreateAdminOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingAddress: {
    name: string;
    phone: string;
    address?: string;
    district?: string;
    area?: string;
    /** Derived from the district, and sent with the SAVE as well as the quote. */
    zone?: "inside" | "outside";
    notes?: string;
  };
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod: "cod" | "bank" | "manual";
  channel: AdminOrderChannel;
  notes?: string;
  couponCode?: string;
  /** Off-coupon discount agreed in the conversation — see `ManualDiscountInput`. */
  discount?: ManualDiscountInput;
  /** Merchant-negotiated delivery charge. `0` is meaningful — "free, we agreed". */
  shippingCharged?: number;
  /** Skip the separate Confirm click; a chat order is already agreed. */
  confirmImmediately?: boolean;
  /**
   * Keep this order out of Meta's ad reporting (backend docs/plan/meta-pixel-capi.md D19).
   *
   * Accepted at CREATION, not only on the order page: `confirmImmediately` creates and confirms
   * in one request, so for that path there is no moment afterwards to exclude the order before
   * it has already been queued to Meta.
   */
  excludeFromMeta?: boolean;
}

/**
 * An ad-hoc discount the merchant agreed in chat.
 *
 * **Send the type and value, never a resolved amount.** A percentage is applied to
 * the *server's* subtotal — which is the storefront-priced one, not the POS-priced
 * one this app can sum locally. Resolving it here would put the gap back.
 */
export interface ManualDiscountInput {
  type: "fixed" | "percentage";
  value: number;
}

/**
 * Body of `POST /api/ecommerce/orders/quote` — the create dialog's live summary.
 *
 * A subset of the create payload holding only what moves a number: no `channel`,
 * no `paymentMethod`, and an address reduced to the `zone` (which prices delivery)
 * and the `phone` (which the per-buyer coupon limit counts against).
 */
export interface QuoteAdminOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingAddress?: { phone?: string; zone?: "inside" | "outside" };
  fulfillmentType?: "delivery" | "pickup";
  couponCode?: string;
  discount?: ManualDiscountInput;
  shippingCharged?: number;
  /**
   * Present ⇒ this quote prices an EDIT of that order rather than a new one.
   *
   * **Send it on every quote in edit mode.** Both effects are server-derived and
   * both are wrong without it: the order stops being counted against its own
   * coupon limits (otherwise a `perShopperLimit: 1` code is rejected the moment
   * the form opens and the discount vanishes), and lines already on the order keep
   * the price the buyer agreed instead of being re-quoted at today's catalogue.
   */
  orderId?: string;
  /** Ignored without `orderId`. Drops the price hold — see `EditAdminOrderInput`. */
  reprice?: boolean;
}

/**
 * Body of `PATCH /api/ecommerce/orders/:id`.
 *
 * `CreateAdminOrderInput` minus `channel` and `confirmImmediately`. `channel`
 * records where the order came from and must not be rewritten — a `website` order
 * was placed by the shopper, and overwriting that corrupts the channel report.
 * Confirming is its own endpoint, so an edit never moves the order's status.
 */
export interface EditAdminOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingAddress: {
    name: string;
    phone: string;
    address?: string;
    district?: string;
    area?: string;
    /** Derived from the district, and sent with the SAVE as well as the quote. */
    zone?: "inside" | "outside";
    notes?: string;
  };
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod?: "cod" | "bank" | "manual";
  notes?: string;
  couponCode?: string;
  discount?: ManualDiscountInput;
  shippingCharged?: number;
  /**
   * Re-price every line at today's price instead of holding the prices already
   * agreed. Off by default: editing one line must not silently reprice the others
   * against a total the buyer already accepted.
   */
  reprice?: boolean;
}

/** Where an order came from. Reporting only — never drives money or fulfilment. */
export type AdminOrderChannel =
  | "messenger"
  | "whatsapp"
  | "instagram"
  | "comment"
  | "phone"
  | "manual"
  | "website";

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
    if (params.channel) qs.append("channel", params.channel);
    if (params.period) qs.append("period", params.period);
    if (params.startDate) qs.append("startDate", params.startDate);
    if (params.endDate) qs.append("endDate", params.endDate);
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
  /**
   * Record an order taken OFF the website — Messenger, WhatsApp, a post comment,
   * a phone call. `channel` is required: capturing where the order came from is
   * the whole reason this endpoint exists, and defaulting it would file every
   * chat order as `website` and make the channel report a lie.
   */
  create: (body: CreateAdminOrderInput): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(base, body),
  /**
   * What the order above would cost, priced by the code that will charge it.
   *
   * **Never sum the lines locally instead.** The product picker is the POS
   * catalogue (`product.price`); the order path charges
   * `storefront.onlinePrice ?? price` repriced by any live campaign, so a local
   * sum quotes the buyer a total the order then silently disagrees with.
   */
  quote: (body: QuoteAdminOrderInput): Promise<ApiResponse<OrderQuote>> =>
    apiClient.post(`${base}/quote`, body),
  /**
   * Permanently delete a closed order. Requires `storefront.orders.delete`, which
   * is admin-only — `storefront.orders.manage` is not enough.
   *
   * The server refuses anything carrying a Sale, money or a courier handover, each
   * with its own error code, so surface the message rather than a generic failure.
   * Answers with the order number alone: the order is gone.
   */
  remove: (id: string): Promise<ApiResponse<{ orderNumber: string }>> =>
    apiClient.delete(`${base}/${id}`),
  /**
   * The create dialog's product picker — **not** the POS `sellableProducts` list.
   * These rows carry the storefront price with any live campaign applied, and
   * only include products a chat order may actually contain.
   */
  orderableProducts: (): Promise<ApiResponse<OrderableProduct[]>> =>
    apiClient.get(`${base}/products`),
  confirm: (id: string): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/confirm`, {}),
  /**
   * Move an order along its pipeline. `note` is optional going forward and
   * REQUIRED going backward — the server rejects a reversal without one, because
   * on a backward step the reason is the whole value of the history entry.
   */
  updateStatus: (
    id: string,
    status: string,
    note?: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`${base}/${id}/status`, { status, note }),
  /**
   * Correct an order that already exists — same form as `create`, against an
   * order rather than a blank. Allowed until the parcel reaches the courier.
   */
  edit: (
    id: string,
    body: EditAdminOrderInput,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`${base}/${id}`, body),
  // Cancel/reject a pre-commit order (no Sale yet). `refundPrepayment` returns a
  // recorded prepayment to the shopper (books a reversing expense per leg);
  // `accountId` overrides the account it's refunded from.
  cancel: (
    id: string,
    body?: {
      reject?: boolean;
      /** Required by the server when `reject` is true, refused when it is not. */
      reason?: string;
      refundPrepayment?: boolean;
      accountId?: string;
    },
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/cancel`, body ?? {}),
  // Record money collected before shipping — a delivery-charge advance, or a bank
  // transfer for the whole order. The server caps `amount` at the order's
  // `totalAmount` and splits it into its shipping and goods legs; the door/COD
  // collection shrinks by it. Delivery orders only, once, before dispatch.
  recordPrepayment: (
    id: string,
    amount: number,
    accountId?: string,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/prepayment`, { amount, accountId }),
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
  /**
   * What the courier actually handed over.
   *
   * Separate from `markPaid`, which can only settle the amount the system
   * already believed. Anything short of the order total has to be explained by
   * a return, a discount, or an amount left owing — the server refuses the
   * request unless the parts reconcile.
   */
  recordCollection: (
    id: string,
    body: {
      collected: number;
      returnLines?: { productId: string; variantId?: string | null; quantity: number }[];
      discount?: { amount: number; note: string };
      stillOwed?: number;
      accountId?: string;
      refund?: { mode: "account" | "credit"; accountId?: string };
      idempotencyKey?: string;
    },
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.post(`${base}/${id}/collection`, body),
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
  /**
   * What returning this order would move — the server's own arithmetic.
   *
   * Read rather than re-derived: the dialog used to compute the refund from the
   * ORDER and guess at whether a refund destination was needed from
   * `paymentStatus`, while the server computed it from the SALE. On a COD order
   * with an advance they disagreed and the return became impossible.
   */
  returnPreview: (id: string): Promise<ApiResponse<OrderReturnPreview>> =>
    apiClient.get(`${base}/${id}/return-preview`),
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
  test: (
    provider: string,
    body: { credentials?: Record<string, string>; mode?: string } = {},
  ): Promise<ApiResponse<CourierTest>> =>
    apiClient.post(`${couriersBase}/${provider}/test`, body),
  // Remote-field discovery. POST, not GET: the body carries the credentials the
  // merchant has typed but not saved yet (patched over the stored blob server
  // side), so the store/package picker fills before anything is committed — and
  // a wrong credential fails here instead of being persisted. Omit `body` to run
  // against the stored configuration.
  stores: (
    provider: string,
    body: { credentials?: Record<string, string>; mode?: string } = {},
  ): Promise<ApiResponse<CourierStore[]>> =>
    apiClient.post(`${couriersBase}/${provider}/stores`, body),
  packages: (
    provider: string,
    body: { credentials?: Record<string, string>; mode?: string } = {},
  ): Promise<ApiResponse<CourierPackage[]>> =>
    apiClient.post(`${couriersBase}/${provider}/packages`, body),
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
