// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import { buildQueryParams } from "../../utils";
import type { ApiResponse } from "@/types";
import type {
  MetaEventList,
  MetaEventRow,
  MetaSettings,
  MetaTestResult,
  Operations,
  AdminStorefrontOrder,
} from "@/types/api";

/**
 * Meta Pixel & Conversions API settings (backend `docs/plan/meta-pixel-capi.md`).
 *
 * Lives under `/organization/storefront/meta` because it is store configuration, not its own
 * resource — the same place the rest of the storefront settings are read and written.
 */

/**
 * The PATCH body, taken from the generated spec rather than hand-written.
 *
 * That matters for one field: `purchaseTrigger` is a three-value enum whose members are the
 * whole feature's contract, and a hand union here would keep compiling after the backend
 * changed it.
 */
export type UpdateMetaSettingsBody = NonNullable<
  Operations["patch_api_organization_storefront_meta"]["requestBody"]
>["content"]["application/json"];

export const metaApi = {
  get: (): Promise<ApiResponse<MetaSettings>> =>
    apiClient.get("/organization/storefront/meta"),

  update: (body: UpdateMetaSettingsBody): Promise<ApiResponse<MetaSettings>> =>
    apiClient.patch("/organization/storefront/meta", body),

  /** Sends a real `TestEvent` to Meta and stamps `verifiedAt` on success. */
  test: (): Promise<ApiResponse<MetaTestResult>> =>
    apiClient.post("/organization/storefront/meta/test", {}),

  /**
   * Forget the stored access token.
   *
   * Its own call because a blank `accessToken` on the PATCH means "leave it alone" — the form
   * cannot read the token back, so it submits empty whenever the merchant edited anything else
   * on the card. Clearing has to be an explicit act.
   */
  clearToken: (): Promise<ApiResponse<MetaSettings>> =>
    apiClient.delete("/organization/storefront/meta/token"),

  /**
   * What we told Meta, and why anything was skipped.
   *
   * Lives under `/ecommerce`, not `/organization`: the settings are workspace configuration, this
   * is operational data about orders.
   */
  listEvents: (params: {
    page?: number;
    limit?: number;
    status?: string;
    orderId?: string;
  }): Promise<ApiResponse<MetaEventList>> =>
    apiClient.get(`/ecommerce/meta/events${buildQueryParams(params)}`),

  /** Requeue a dead-lettered event. Only a `failed` row — a sent one can never be resent. */
  retryEvent: (id: string): Promise<ApiResponse<MetaEventRow>> =>
    apiClient.post(`/ecommerce/meta/events/${id}/retry`, {}),

  /** Keep one order out of Meta. Refused once the order has already been reported. */
  setOrderExcluded: (
    orderId: string,
    excluded: boolean,
  ): Promise<ApiResponse<AdminStorefrontOrder>> =>
    apiClient.patch(`/ecommerce/meta/orders/${orderId}/exclude`, { excluded }),
};
