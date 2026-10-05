// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ProductOrderRow, ProductOrderSummary, ProductOrderView } from "@/types/api";

export type { ProductOrderRow, ProductOrderSummary, ProductOrderView };

/**
 * Which storefront listing an arrangement belongs to — All products, one
 * category (either level) or one tag (inventory-backend
 * `docs/plan/storefront-product-order.md`).
 */
export type ProductOrderTarget =
  | { scope: "all" }
  | { scope: "category" | "tag"; id: string };

const base = "/ecommerce/product-orders";

/** `all` has its own literal path; a category or tag is `/<scope>/<id>`. */
export const productOrderPath = (target: ProductOrderTarget) =>
  target.scope === "all" ? `${base}/all` : `${base}/${target.scope}/${target.id}`;

export const productOrdersApi = {
  /** Which listings carry a saved order — the badges on Collections and Tags. */
  summary: (): Promise<ApiResponse<ProductOrderSummary>> => apiClient.get(base),
  get: (target: ProductOrderTarget): Promise<ApiResponse<ProductOrderView>> =>
    apiClient.get(productOrderPath(target)),
  /** Replaces the order. The answer is what was stored — out-of-scope ids are dropped. */
  save: (
    target: ProductOrderTarget,
    productIds: string[],
  ): Promise<ApiResponse<ProductOrderView>> =>
    apiClient.put(productOrderPath(target), { productIds }),
  /** Back to the store's default order. */
  reset: (target: ProductOrderTarget): Promise<ApiResponse<ProductOrderView>> =>
    apiClient.delete(productOrderPath(target)),
};
