// coding-standard: maintained
import type { Dict } from "@/lib/storefront-i18n";

/** Breadcrumb tail owned by the shared shell rather than an individual page. */
export function shellCrumbLabel(pathname: string, t: Dict): string {
  // The product detail page renders its richer taxonomy-aware trail itself.
  // Returning a generic label here would create a second breadcrumb landmark.
  if (/\/products\/[^/]+\/?$/.test(pathname)) return "";
  if (/\/products(\?|$)/.test(pathname) || /\/products$/.test(pathname)) return t.navShop;
  if (pathname.includes("/search")) return t.navSearch;
  if (pathname.includes("/cart")) return t.navCart;
  if (pathname.includes("/checkout")) return t.navCheckout;
  if (pathname.includes("/account")) return t.navAccount;
  return "";
}
