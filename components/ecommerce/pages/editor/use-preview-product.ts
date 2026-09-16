"use client";
// coding-standard: maintained

import { useQuery } from "@tanstack/react-query";
import { useStorefrontPreviewToken } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontApi } from "@/lib/storefront-client";
import { setStorefrontPreviewToken } from "@/lib/storefront-preview";

/**
 * The slug of the store's first product, for previewing the product page — one
 * page every product shares, so the editor draws it around a real one.
 *
 * Read through the public catalogue with the owner-preview token, the way the
 * Customize preview reads it (`browser-preview.tsx`), so a shop that is not
 * published yet still has a product to show. `null` when the catalogue is empty.
 */
export function usePreviewProductSlug(slug: string | undefined, enabled: boolean) {
  const { data: preview } = useStorefrontPreviewToken(enabled);
  const token = preview?.token ?? null;
  return useQuery({
    queryKey: queryKeys.storefrontPages.previewProduct(slug ?? ""),
    queryFn: async () => {
      setStorefrontPreviewToken(token);
      const { items } = await storefrontApi.listProducts(slug as string, { limit: 1 });
      return items[0]?.slug ?? null;
    },
    enabled: enabled && Boolean(slug) && Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
