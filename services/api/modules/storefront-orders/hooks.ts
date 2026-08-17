// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationSuccess } from "../query-helpers";
import type {
  CreateAdminOrderInput,
  EditAdminOrderInput,
  QuoteAdminOrderInput,
} from "./api";
import {
  couriersApi,
  storefrontOrdersApi,
  type AdminOrderListParams,
  type CustomCourierPayload,
  type ManualConsignmentPayload,
} from "./api";

export const useStorefrontOrders = (params: AdminOrderListParams) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.list(params),
    queryFn: () => storefrontOrdersApi.list(params),
    select: (r) => r.data,
    placeholderData: (prev) => prev,
  });

/** The stat-card snapshot — under the orders root, so any order mutation refreshes it. */
export const useOrderStats = () =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.stats(),
    queryFn: () => storefrontOrdersApi.stats(),
    select: (r) => r.data,
  });

export const useStorefrontOrder = (id: string) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.detail(id),
    queryFn: () => storefrontOrdersApi.get(id),
    enabled: !!id,
    select: (r) => r.data,
  });

/**
 * On-demand delivery-risk lookup (runs when the merchant clicks the button,
 * not on mount) — modeled as a mutation so the result is fetched lazily.
 */
export const useOrderFraudScore = () =>
  useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.fraudScore(id),
    onError: handleMutationError,
  });

/**
 * The create dialog's product picker.
 *
 * Deliberately **not** the POS `sellableProducts` options list: these rows carry
 * the storefront price with any live campaign applied, and exclude products a
 * chat order cannot contain. Fetched only while the dialog is open — it is a
 * whole-catalogue payload, and the orders list has no use for it.
 */
export const useOrderableProducts = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.products(),
    queryFn: () => storefrontOrdersApi.orderableProducts(),
    enabled,
    select: (r) => r.data ?? [],
    // A campaign starting or ending changes every price here, and the merchant
    // is about to read one out to a buyer.
    staleTime: 0,
  });

/**
 * Live price for the order being typed into the create dialog.
 *
 * **A query, not a mutation, and that is the point** — it is a pure read that
 * every keystroke re-asks, so it wants caching and dedupe. `placeholderData`
 * keeps the previous total on screen while the next one loads, because a summary
 * that blanks on every character is one the merchant stops trusting.
 *
 * Disabled until there is at least one line: an empty cart has no price, and
 * asking for one would just be a guaranteed round-trip on dialog open.
 */
export const useOrderQuote = (draft: QuoteAdminOrderInput | null) =>
  useQuery({
    queryKey: queryKeys.storefrontOrders.quote(
      (draft ?? {}) as unknown as Record<string, unknown>,
    ),
    queryFn: () => storefrontOrdersApi.quote(draft as QuoteAdminOrderInput),
    enabled: !!draft?.items.length,
    select: (r) => r.data,
    placeholderData: (prev) => prev,
    // Coupons and campaigns can change under a long-open dialog, and the number
    // here is quoted to a buyer — so this one does not ride the 1-minute default.
    staleTime: 0,
  });

/**
 * Create a merchant-taken order.
 *
 * Dirties `order.changed` rather than `order.confirmed` even when
 * `confirmImmediately` is set: the confirm is best-effort server-side (a stock
 * shortfall leaves the order pending rather than losing it), so the client
 * cannot assume stock moved. `order.changed` already covers the order list, the
 * stats and the storefront dashboard, which is what actually changed either way.
 */
export const useCreateStorefrontOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminOrderInput) => storefrontOrdersApi.create(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order created");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

/**
 * Correct an existing order.
 *
 * `order.edited`, not `order.changed`: editing the lines of a confirmed order
 * adjusts its stock hold, so the inventory screens move with it. See the event.
 */
export const useEditStorefrontOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: EditAdminOrderInput }) =>
      storefrontOrdersApi.edit(v.id, v.body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order updated");
      invalidate(qc, "order.edited");
    },
    onError: handleMutationError,
  });
};

export const useConfirmOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.confirm(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order confirmed");
      invalidate(qc, "order.confirmed");
    },
    onError: handleMutationError,
  });
};

/**
 * Move an order along its pipeline, forward or backward.
 *
 * **This endpoint is no longer stock-neutral, so the event is chosen per outcome.**
 * Two transitions move inventory and one of them is new:
 *
 * - Reversing to `pending` releases the order's hold — `reservedQuantity` drops and
 *   every sellable-stock screen is stale until `order.reversed` flushes it. This is
 *   the case that shipped broken: a reversed order freed its stock while inventory
 *   and products still showed it held.
 * - Moving forward INTO the commit step (`shipped` / `ready_for_pickup`) books the
 *   Sale and consumes the hold, which is `order.dispatched`'s whole meaning.
 *
 * Read off the RETURNED order rather than the requested status: the server owns
 * what the transition actually did, and duplicating its rules here is how the two
 * drift. Anything else is a label change and stays `order.changed`.
 */
export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: string; note?: string }) =>
      storefrontOrdersApi.updateStatus(v.id, v.status, v.note),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Status updated");
      const order = res.data;
      if (order?.saleId) invalidate(qc, "order.dispatched");
      else if (order?.status === "pending") invalidate(qc, "order.reversed");
      else invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      reject?: boolean;
      refundPrepayment?: boolean;
      accountId?: string;
    }) =>
      storefrontOrdersApi.cancel(v.id, {
        reject: v.reject,
        refundPrepayment: v.refundPrepayment,
        accountId: v.accountId,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order cancelled");
      invalidate(qc, "order.returned");
    },
    onError: handleMutationError,
  });
};

/** Record money collected before shipping (advance, or a full bank transfer). */
export const useRecordPrepayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; amount: number; accountId?: string }) =>
      storefrontOrdersApi.recordPrepayment(v.id, v.amount, v.accountId),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Prepayment recorded");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useUpdateCourierCost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; shippingCost: number }) =>
      storefrontOrdersApi.updateCourierCost(v.id, v.shippingCost),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier cost updated");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useMarkOrderPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; accountId?: string }) =>
      storefrontOrdersApi.markPaid(v.id, v.accountId),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Payment recorded");
      invalidate(qc, "order.settled");
    },
    onError: handleMutationError,
  });
};

export const useReturnOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      returnCharge?: number;
      collectedAmount?: number;
      accountId?: string;
      refund?: { mode: "account" | "credit"; accountId?: string };
    }) =>
      storefrontOrdersApi.returnOrder(v.id, {
        returnCharge: v.returnCharge,
        collectedAmount: v.collectedAmount,
        accountId: v.accountId,
        refund: v.refund,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order returned");
      invalidate(qc, "order.returned");
    },
    onError: handleMutationError,
  });
};

// Both dispatch paths are commit-first — they book the Sale and consume the stock
// reservation — so they emit `order.dispatched`, not the narrower `order.changed`.
export const useCreateConsignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; provider: string }) =>
      storefrontOrdersApi.createConsignment(v.id, v.provider),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Consignment created");
      invalidate(qc, "order.dispatched");
    },
    onError: handleMutationError,
  });
};

export const useManualConsignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string } & ManualConsignmentPayload) => {
      const { id, ...body } = v;
      return storefrontOrdersApi.manualConsignment(id, body);
    },
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Order dispatched");
      invalidate(qc, "order.dispatched");
    },
    onError: handleMutationError,
  });
};

/**
 * A merchant-set delivery status (manual couriers only). `delivered` auto-advances
 * the order status server-side — same path the poll takes — but moves no money, so
 * `order.changed` is the right event: the COD is still collected via Mark paid.
 */
export const useSetCourierStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; normalizedStatus: string; note?: string }) =>
      storefrontOrdersApi.setCourierStatus(v.id, {
        normalizedStatus: v.normalizedStatus,
        note: v.note,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Delivery status updated");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

export const useRefreshTracking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storefrontOrdersApi.refreshTracking(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Tracking refreshed");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

// Map an order's canonical address to a provider's location codes before dispatch.
export const useResolveLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      provider: string;
      location: Record<string, string | number>;
    }) => storefrontOrdersApi.resolveLocation(v.id, v.provider, v.location),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Delivery location resolved");
      invalidate(qc, "order.changed");
    },
    onError: handleMutationError,
  });
};

// A pre-dispatch delivery-price quote (no cache change — read-only).
export const useCourierPrice = () =>
  useMutation({
    mutationFn: (v: { id: string; provider: string }) =>
      storefrontOrdersApi.courierPrice(v.id, v.provider),
    onError: handleMutationError,
  });

// Bulk dispatch: one call for many orders. Toast is left to the caller (it
// summarizes the multi-status result), but the orders list is refreshed here.
export const useBulkConsignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      orderIds: string[];
      provider?: string;
      customCourierId?: string;
    }) =>
      storefrontOrdersApi.bulkConsignment(v.orderIds, {
        provider: v.provider,
        customCourierId: v.customCourierId,
      }),
    // Commit-first, same as the single-order paths — every dispatched order books
    // a Sale and consumes its reservation.
    onSuccess: () => invalidate(qc, "order.dispatched"),
    onError: handleMutationError,
  });
};

// --- Courier config ---
export const useCouriers = () =>
  useQuery({
    queryKey: queryKeys.couriers.list(),
    queryFn: () => couriersApi.list(),
    select: (r) => r.data,
  });

export const useUpsertCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      provider: string;
      credentials?: Record<string, string>;
      mode?: string;
      enabled?: boolean;
    }) =>
      couriersApi.upsert(v.provider, {
        credentials: v.credentials,
        mode: v.mode,
        enabled: v.enabled,
      }),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier saved");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};

/**
 * Validate a provider's credentials. Pass `credentials`/`mode` to test what the
 * settings form currently holds rather than what is stored — the only pre-save
 * check Steadfast has, since it exposes no list to load.
 */
export const useTestCourier = () =>
  useMutation({
    mutationFn: ({ provider, ...body }: CourierDiscoveryVars) =>
      couriersApi.test(provider, body),
    onSuccess: (res) => handleMutationSuccess(res.message || "Connection ok"),
    onError: handleMutationError,
  });

/**
 * Button-triggered discovery of a provider's remote credential field (Pathao
 * pickup stores, eCourier packages). `credentials`/`mode` carry what the settings
 * form currently holds, so the picker works on a first-time connect — before
 * anything has been saved — and unsaved credentials get validated by the call.
 */
interface CourierDiscoveryVars {
  provider: string;
  credentials?: Record<string, string>;
  mode?: string;
}

export const useCourierStores = () =>
  useMutation({
    mutationFn: ({ provider, ...body }: CourierDiscoveryVars) =>
      couriersApi.stores(provider, body),
    onError: handleMutationError,
  });

export const useCourierPackages = () =>
  useMutation({
    mutationFn: ({ provider, ...body }: CourierDiscoveryVars) =>
      couriersApi.packages(provider, body),
    onError: handleMutationError,
  });

// The store's delivery-status webhook token + per-provider URLs (ensured on read).
export const useCourierWebhook = () =>
  useQuery({
    queryKey: queryKeys.couriers.webhook(),
    queryFn: () => couriersApi.webhook(),
  });

export const useRegenerateWebhookToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => couriersApi.regenerateWebhook(),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Webhook URL regenerated");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.webhook() });
    },
    onError: handleMutationError,
  });
};

export const useDeleteCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => couriersApi.remove(provider),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier removed");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};

// --- Custom (manual) couriers ---
// No read hook: `useCouriers` already carries `customCouriers`. All three
// mutations flush the whole couriers root, which is what that list hangs off.

export const useCreateCustomCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomCourierPayload) => couriersApi.createCustom(body),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier added");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};

export const useUpdateCustomCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string } & CustomCourierPayload) => {
      const { id, ...body } = v;
      return couriersApi.updateCustom(id, body);
    },
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier updated");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};

export const useDeleteCustomCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couriersApi.removeCustom(id),
    onSuccess: (res) => {
      handleMutationSuccess(res.message || "Courier removed");
      qc.invalidateQueries({ queryKey: queryKeys.couriers.all() });
    },
    onError: handleMutationError,
  });
};
