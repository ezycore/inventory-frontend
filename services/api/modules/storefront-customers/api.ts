import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ShopperDetail, ShopperListItem } from "@/types/api";

// Response shapes generated from the backend shopper DTOs (`ecommerce.dto.ts`). The
// storefront "customers" surface is the Shopper (storefront login), not the accounting Customer.
export type OnlineCustomer = ShopperListItem;
export type OnlineCustomerDetail = ShopperDetail;
export type OnlineCustomerOrder = ShopperDetail["orders"][number];

const base = "/ecommerce/customers";

export const storefrontCustomersApi = {
  list: (): Promise<ApiResponse<OnlineCustomer[]>> => apiClient.get(base),
  get: (id: string): Promise<ApiResponse<OnlineCustomerDetail>> =>
    apiClient.get(`${base}/${id}`),
};
