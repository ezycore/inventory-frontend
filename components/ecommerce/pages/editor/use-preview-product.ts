"use client";
// coding-standard: maintained

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useStorefrontPreviewToken } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { storefrontApi } from "@/lib/storefront-client";
import { setStorefrontPreviewToken } from "@/lib/storefront-preview";

/** Enough of the catalogue to find a product with options, a long description and a sold-out one. */
const PREVIEW_PRODUCT_LIMIT = 24;

/**
 * The store's products, for previewing the product page — one page every
 * product shares, so the editor draws it around a real one, and the merchant
 * picks which (`PreviewProductPicker`). `q` narrows the list by name.
 *
 * Read through the public catalogue with the owner-preview token, the way the
 * Customize preview reads it (`browser-preview.tsx`): only a product the shop
 * actually sells has a product page to preview, and a shop that is not published
 * yet still has its products listed. Empty when the catalogue is.
 */
export function usePreviewProducts(slug: string | undefined, enabled: boolean, q = "") {
  const { data: preview } = useStorefrontPreviewToken(enabled);
  const token = preview?.token ?? null;
  return useQuery({
    queryKey: queryKeys.storefrontPages.previewProducts(slug ?? "", q),
    queryFn: async () => {
      setStorefrontPreviewToken(token);
      const { items } = await storefrontApi.listProducts(slug as string, {
        limit: PREVIEW_PRODUCT_LIMIT,
        q: q || undefined,
      });
      return items;
    },
    enabled: enabled && Boolean(slug) && Boolean(token),
    staleTime: 5 * 60 * 1000,
    // Typing a search keeps the last list on screen instead of blanking it per keystroke.
    placeholderData: keepPreviousData,
  });
}
