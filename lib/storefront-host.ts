import { headers } from "next/headers";

/**
 * The active store for the current request, as resolved by `proxy.ts` from the
 * host (tenant subdomain or custom-domain map) and forwarded via request headers.
 *
 *   - `slug`   — store slug (empty when the host maps to no store).
 *   - `base`   — public link base: `/shop` on tenant hosts, `""` on custom domains.
 *   - `origin` — absolute origin (`https://host`) for canonical / og URLs.
 *
 * Reading headers opts the storefront pages into dynamic rendering (the slug is
 * per-host, not a build-time param); data freshness still comes from the
 * fetch-level `revalidate` cache in `lib/storefront-server.ts`.
 *
 * Server-only — `next/headers` throws if imported into a Client Component.
 */
export async function getStoreContext(): Promise<{
  slug: string;
  base: string;
  origin: string;
}> {
  const h = await headers();
  return {
    slug: h.get("x-ezy-store-slug") ?? "",
    base: h.get("x-ezy-store-base") ?? "/shop",
    origin: h.get("x-ezy-store-origin") ?? "",
  };
}
