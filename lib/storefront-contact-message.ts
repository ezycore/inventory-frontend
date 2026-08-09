// coding-standard: maintained
import type { ContactButtonPage } from "@/types";

/**
 * Which storefront page the shopper is on, for the launcher's `showOn` whitelist
 * and its per-page label.
 *
 * `null` means "a page the launcher never shows on" — the auth interstitials and
 * the printable invoice. That is deliberately a THIRD state rather than folding
 * into `account`: those routes are single-purpose and a floating action over
 * them is noise, so a merchant should not be able to switch them back on.
 *
 * Order matters. `/shop/account/orders/…` matches both the account and the order
 * prefix; the more specific suppressions are tested first.
 */
export function pageOf(pathname: string, base: string): ContactButtonPage | null {
  // The public base is "/shop" on a tenant subdomain and "" at the root of a
  // custom domain (see storeHref). Normalise a trailing slash away first: with
  // base "/" a naive slice eats the path's OWN leading slash, and every prefix
  // test below then silently misses — a product page reads as a collection.
  const prefix = base.replace(/\/+$/, "");
  const path =
    prefix && pathname.startsWith(prefix)
      ? pathname.slice(prefix.length) || "/"
      : pathname;

  // Never — a printed invoice with a floating green circle on it, and the
  // single-purpose auth screens.
  if (/\/invoice\/?$/.test(path)) return null;
  if (/^\/account\/(verify-email|reset-password|oauth)\b/.test(path)) return null;

  if (path === "/" || path === "") return "home";
  if (path.startsWith("/cart")) return "cart";
  if (path.startsWith("/checkout")) return "checkout";
  // `/orders`, `/orders/track` and the tokenised `/t/<token>` tracking page.
  if (path.startsWith("/orders") || path.startsWith("/t/")) return "order";
  if (path.startsWith("/account")) return "account";
  if (path.startsWith("/products/")) return "product";
  // Bare `/products` and `/search` are browsing surfaces, not a product page.
  if (path.startsWith("/products") || path.startsWith("/search")) return "collection";
  if (path.startsWith("/pages/")) return "page";
  // Anything left is `/[...categoryPath]` — a collection.
  return "collection";
}

/**
 * Is the launcher allowed on this page?
 *
 * An ABSENT or EMPTY `showOn` means "everywhere", not "nowhere". That asymmetry
 * is on purpose: a merchant who has never opened the page list has no list, and
 * defaulting an unset whitelist to nothing would ship a launcher that is on but
 * invisible, which reads as a broken feature rather than a configured one.
 */
export function isPageAllowed(
  showOn: ContactButtonPage[] | undefined,
  page: ContactButtonPage | null,
): boolean {
  if (!page) return false;
  if (!showOn || showOn.length === 0) return true;
  return showOn.includes(page);
}

/**
 * Fill the merchant's greeting template.
 *
 * `{store}` and `{context}` are the only placeholders, and an unresolved
 * `{context}` is REMOVED rather than left as literal braces — a shopper who
 * opens WhatsApp to a message reading "Hi Rashu Store! {context}" is looking at
 * a bug the merchant will be blamed for. The surrounding whitespace collapses
 * with it, so "Hi {store}! {context}" degrades cleanly to "Hi Rashu Store!".
 */
export function buildContactMessage(
  greeting: string | undefined,
  storeName: string,
  context?: string,
): string {
  const template = greeting?.trim() || "Hi {store}!{context}";
  return template
    .replace(/\{store\}/g, storeName)
    .replace(/\s*\{context\}/g, context ? ` ${context}` : "")
    .replace(/\s+/g, " ")
    .trim();
}
