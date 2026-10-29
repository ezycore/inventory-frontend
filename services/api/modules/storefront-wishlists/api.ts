// coding-standard: maintained
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ShopperWishlistItem, WishlistStats } from "@/types/api";
import { buildQueryParams } from "../../utils";

/**
 * Shoppers' wishlists, as the merchant sees them (backend `docs/plan/wishlist.md`,
 * Phase 3). Read-only: a wishlist is the shopper's, so there is no mutation here.
 */
const base = "/ecommerce/wishlists";

export const storefrontWishlistsApi = {
  /** Totals, the most-wished products and the wished-but-sold-out ones. */
  stats: (days?: number): Promise<ApiResponse<WishlistStats>> =>
    apiClient.get(`${base}/stats${buildQueryParams({ days })}`),
  /** One signed-in customer's saved items, newest first. */
  forShopper: (shopperId: string): Promise<ApiResponse<ShopperWishlistItem[]>> =>
    apiClient.get(`${base}/shoppers/${shopperId}`),
};
