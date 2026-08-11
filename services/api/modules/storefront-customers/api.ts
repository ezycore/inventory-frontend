import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  ShopperDetail,
  ShopperListItem,
  ShopperOrder,
  StorefrontSubscriberListItem,
} from "@/types/api";
import { buildQueryParams } from "../../utils";

// Response shapes generated from the backend shopper DTOs (`ecommerce.dto.ts`). The
// storefront "customers" surface is the Shopper (storefront login), not the accounting Customer.
export type OnlineCustomer = ShopperListItem;
export type OnlineCustomerDetail = ShopperDetail;
export type OnlineCustomerOrder = ShopperOrder;
/** A footer sign-up — someone who asked to hear from the shop, with no account. */
export type StorefrontSubscriber = StorefrontSubscriberListItem;

export interface OnlineCustomerOrdersParams {
  page?: number;
  limit?: number;
}

export interface OnlineCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * The `GET /ecommerce/customers` envelope: contract-checked `ShopperListItem`
 * rows plus the fixed `sendPaginatedResponse` pagination wrapper.
 */
export interface OnlineCustomersResult {
  items: OnlineCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * The `GET /ecommerce/customers/:id/orders` envelope. Rows are the generated
 * `ShopperOrder` (contract-checked); the `pagination` wrapper is the fixed
 * `sendPaginatedResponse` shape and is not itself a named backend DTO.
 */
export interface OnlineCustomerOrdersResult {
  items: OnlineCustomerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** The `GET /ecommerce/customers/subscribers` envelope. */
export interface StorefrontSubscribersResult {
  items: StorefrontSubscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const base = "/ecommerce/customers";

export const storefrontCustomersApi = {
  list: (
    params: OnlineCustomersParams = {},
  ): Promise<ApiResponse<OnlineCustomersResult>> =>
    apiClient.get(`${base}${buildQueryParams(params)}`),
  get: (id: string): Promise<ApiResponse<OnlineCustomerDetail>> =>
    apiClient.get(`${base}/${id}`),
  // Paginated order history for one shopper (10/page by default). Stats on the
  // detail response are computed over ALL orders, independent of this slice.
  orders: (
    id: string,
    params: OnlineCustomerOrdersParams = {},
  ): Promise<ApiResponse<OnlineCustomerOrdersResult>> =>
    apiClient.get(`${base}/${id}/orders${buildQueryParams(params)}`),
  // Footer sign-ups. Written only by shoppers on the storefront, so this is a
  // read with no matching mutation anywhere in the admin app.
  subscribers: (
    params: OnlineCustomersParams = {},
  ): Promise<ApiResponse<StorefrontSubscribersResult>> =>
    apiClient.get(`${base}/subscribers${buildQueryParams(params)}`),
};
