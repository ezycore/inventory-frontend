// coding-standard: maintained
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontWishlistsApi } from "./api";

/**
 * Wishlist reads. Pure queries with no invalidation, for the carts module's
 * reason: shoppers write wishlists on the storefront, never the admin, so these
 * refresh on the global staleTime.
 */
export const useWishlistStats = (days?: number) =>
  useQuery({
    queryKey: queryKeys.storefrontWishlists.stats(days),
    queryFn: () => storefrontWishlistsApi.stats(days),
    select: (r) => r.data,
  });

export const useShopperWishlist = (shopperId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.storefrontWishlists.shopper(shopperId ?? ""),
    queryFn: () => storefrontWishlistsApi.forShopper(shopperId!),
    enabled: !!shopperId,
    select: (r) => r.data,
  });
