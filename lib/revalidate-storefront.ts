// coding-standard: maintained
/**
 * Client half of the storefront cache flush — see
 * `app/api/storefront/revalidate/route.ts` for why it exists.
 *
 * The admin's TanStack cache and the public storefront's cache are two different
 * caches in two different places: `invalidateQueries` refreshes what the merchant
 * is looking at, and does nothing at all for the SSR'd shop every shopper sees.
 * An admin write that changes public data therefore has to flush both.
 *
 * Best-effort by design. The save has already succeeded by the time this runs, the
 * cache still expires on its own timer, and a failed flush must never surface as a
 * failed save — so every error path is silent and nothing awaits the result.
 */

const ENDPOINT = "/api/storefront/revalidate";

/**
 * Expire the public storefront's server-rendered pages for the signed-in
 * merchant's own store. Fire-and-forget; the route derives the slug from the
 * session, so there is nothing to pass.
 */
export const revalidateStorefront = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    // Dynamic import for the same reason `lib/api-client.ts` does it: this module
    // is pulled in by `services/api/invalidation.ts`, which the auth store's own
    // dependents import — a static edge here risks a cycle for no benefit.
    const { useAuthStore } = await import("@/services/stores/use-auth-store");
    const token = useAuthStore.getState().token;
    if (!token) return;

    await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // The merchant often navigates away right after saving; without this the
      // request is cancelled on unload and the flush is silently lost.
      keepalive: true,
    });
  } catch {
    // Intentionally silent — see the module note above.
  }
};
