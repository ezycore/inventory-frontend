// coding-standard: maintained
import type { Dict } from "@/lib/storefront-i18n";

/** Breadcrumb tail owned by the shared shell rather than an individual page. */
export function shellCrumbLabel(pathname: string, t: Dict, base = "/shop"): string {
  // Match the route's first segment after the store base, never a substring:
  // a category path such as `/shop/cushion/cartoon` contains "/cart" and was
  // labelled as the cart page.
  const rest = base && pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname;
  const [section, detail] = rest.split("?")[0].split("/").filter(Boolean);
  // The product detail page renders its richer taxonomy-aware trail itself.
  // Returning a generic label here would create a second breadcrumb landmark.
  if (section === "products") return detail ? "" : t.navShop;
  if (section === "search") return t.navSearch;
  if (section === "cart") return t.navCart;
  if (section === "checkout") return t.navCheckout;
  if (section === "account") return t.navAccount;
  return "";
}
