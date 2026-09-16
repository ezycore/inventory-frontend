// coding-standard: maintained
import type { StorefrontPage } from "@/services/api";

/**
 * Where a system page lives on the shop, for the ones the editor can preview.
 * Mirrors the backend's `SYSTEM_PATHS` (`storefront-page-public.service.ts`),
 * which answers these addresses with the page. The product page has no fixed
 * address — see `previewAddress`.
 */
const SYSTEM_PAGE_PATHS: Readonly<Record<string, string>> = {
  home: "/",
  collection: "/products",
  search: "/search",
  cart: "/cart",
  checkout: "/checkout",
  account: "/account",
};

/**
 * The store address the editor previews this page at, or `null` when it has none
 * to show yet.
 *
 * Every product shares the one `product` page, so its preview needs a real
 * product to draw around — `productSlug`, the store's first. Without one there is
 * nothing to preview, not a broken address.
 */
export function previewAddress(
  page: Pick<StorefrontPage, "kind" | "systemKey" | "slug">,
  productSlug?: string | null,
): string | null {
  if (page.kind !== "system") return page.slug ? `/pages/${page.slug}` : null;
  if (page.systemKey === "product") return productSlug ? `/products/${productSlug}` : null;
  return page.systemKey ? (SYSTEM_PAGE_PATHS[page.systemKey] ?? null) : null;
}

/**
 * Does the frame have to ask for the builder page (`builder=1`)? A `/pages/…`
 * address is always one, and the proxy routes its preview on its own. At `/` and
 * at a system route the same address also draws the Customize preview, which
 * sends `preview=1` alone — so the page editor has to say which it is.
 */
export const needsBuilderParam = (address: string): boolean => !address.startsWith("/pages/");
