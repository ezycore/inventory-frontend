import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { AbandonedCartListItem, AbandonedCartStats } from "@/types/api";
import { buildQueryParams } from "../../utils";

/**
 * Abandoned carts — the merchant's view of the server-side cart mirror
 * (backend `docs/plan/abandoned-cart.md`, Phase 2). Read-only: there is no
 * mutation here by design, because a cart belongs to the shopper.
 */
export type AbandonedCart = AbandonedCartListItem;
export type CartFunnelStats = AbandonedCartStats;

/**
 * Which slice of carts to list. `abandoned` (the default) is derived, not stored:
 * still `active` and untouched for longer than the backend's threshold — which the
 * stats response reports as `abandonedAfterMinutes` so the UI never hardcodes it.
 */
export type CartListStatus = "abandoned" | "live" | "converted" | "all";

export interface AbandonedCartsParams {
  page?: number;
  limit?: number;
  status?: CartListStatus;
  /** Matches the SHOPPER only — an anonymous cart has nothing to match on. */
  search?: string;
}

/** The `GET /ecommerce/carts` envelope (rows + the fixed pagination wrapper). */
export interface AbandonedCartsResult {
  items: AbandonedCart[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const base = "/ecommerce/carts";

export const storefrontCartsApi = {
  list: (
    params: AbandonedCartsParams = {},
  ): Promise<ApiResponse<AbandonedCartsResult>> =>
    apiClient.get(`${base}${buildQueryParams(params)}`),
  /** Funnel + headline numbers over a rolling window (default 30 days). */
  stats: (days?: number): Promise<ApiResponse<CartFunnelStats>> =>
    apiClient.get(`${base}/stats${buildQueryParams({ days })}`),
};
