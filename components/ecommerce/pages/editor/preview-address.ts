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
  page: Pick<StorefrontPage, "kind" | "systemKey" | "slug"> & {
    campaignSlug?: string | null;
  },
  productSlug?: string | null,
): string | null {
  // A campaign page is the one kind with no `slug` of its own — it is served at
  // its CAMPAIGN's address. Reading `page.slug` for it therefore found nothing
  // and the editor showed "Store address unavailable." on every campaign page.
  if (page.kind === "campaign") {
    return page.campaignSlug ? `/campaigns/${page.campaignSlug}` : null;
  }
  if (page.kind !== "system") return page.slug ? `/pages/${page.slug}` : null;
  if (page.systemKey === "product") return productSlug ? `/products/${productSlug}` : null;
  return page.systemKey ? (SYSTEM_PAGE_PATHS[page.systemKey] ?? null) : null;
}

/**
 * Does the frame have to ask for the builder page (`builder=1`)? A `/pages/…`
 * address is always one, and the proxy routes its preview on its own. At `/`, at
 * a system route and at a campaign's address the same address ALSO draws a
 * non-builder page — the Customize preview, or the campaign's default banner and
 * grid — so the page editor has to say which it is.
 */
export const needsBuilderParam = (address: string): boolean => !address.startsWith("/pages/");
