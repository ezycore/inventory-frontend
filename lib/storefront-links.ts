/**
 * Build a storefront link relative to the active store's public base path.
 *
 * Option A routing serves the same storefront tree from different bases depending
 * on the host: `/shop` on a tenant subdomain (`{slug}.ezycore.com/shop/…`) and
 * the root (`""`) on a custom domain. The internal route is always `/shop`, but
 * links must reflect the *public* base, which `proxy.ts` resolves per request and
 * exposes via the `x-ezy-store-base` header (see `lib/storefront-host.ts`).
 *
 *   storeHref("/shop")              → "/shop"
 *   storeHref("/shop", "/products") → "/shop/products"
 *   storeHref("", "/products")      → "/products"   (custom domain at root)
 *   storeHref("")                   → "/"
 */
export function storeHref(base: string, path = ""): string {
  if (!path || path === "/") return base || "/";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
