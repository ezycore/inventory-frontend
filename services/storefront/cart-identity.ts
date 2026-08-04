// coding-standard: maintained

/**
 * The per-store cart handle used by the server-side cart mirror
 * (backend `docs/plan/abandoned-cart.md`).
 *
 * **Its own `localStorage` key, deliberately.** The obvious home is a field on
 * `use-cart-store`, but that store is persisted, so adding a field changes the
 * shape of `easystock-cart` — which eight components read. Keeping the handle
 * beside it leaves that store byte-identical and means none of those read sites
 * is touched by this feature.
 *
 * **Scoped per store slug**, exactly as the cart itself is (`setStore` resets the
 * cart when the slug changes). That is what makes this a *cart handle* rather
 * than a cross-tenant visitor id: two stores on the platform get two unrelated
 * values, so it cannot be used to follow a shopper between merchants.
 */

const KEY_PREFIX = "easystock-cart-id";

const keyFor = (slug: string) => `${KEY_PREFIX}:${slug}`;

/** `crypto.randomUUID` where available; a plain random string otherwise. The
 *  value only has to be unique per store, never unguessable. */
function generate(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * The handle for this store, creating and persisting one on first use. Returns
 * `null` on the server and whenever `localStorage` is unavailable (Safari private
 * mode, storage disabled) — callers skip syncing rather than mint a throwaway id
 * per page load, which would inflate the merchant's cart count with duplicates of
 * one shopper.
 */
export function cartAnonymousId(slug: string): string | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const key = keyFor(slug);
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = generate();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return null;
  }
}
