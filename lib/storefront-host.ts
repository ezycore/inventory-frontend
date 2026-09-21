// coding-standard: maintained
import { headers } from "next/headers";
import { PREVIEW_BUILDER_HEADER, PREVIEW_REQUEST_HEADER } from "@/lib/storefront-preview";

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

/**
 * The owner-preview token on this request, or `null` — see
 * `lib/storefront-preview.ts` for the whole route it travels.
 *
 * Separate from `getStoreContext` because its consumer is different: the store
 * context is read once per render by a layout, while this is read per *fetch*,
 * by `lib/storefront-server.ts`, on behalf of callers that never think about
 * preview at all.
 *
 * The `try` is doing real work. `headers()` throws outside a request scope, and
 * these fetchers are also called from `sitemap.ts` / `robots.ts` during static
 * generation — where there is no request, no preview, and no reason to fail.
 */
export async function getStorePreviewToken(): Promise<string | null> {
  try {
    return (await headers()).get(PREVIEW_REQUEST_HEADER);
  } catch {
    return null;
  }
}

/**
 * Is this request the page editor's preview frame (`?builder=1` under owner
 * preview)? Then a system route draws its builder page's draft live, redrawn as
 * the merchant edits, rather than as last saved. `proxy.ts` sets the header only
 * beside a preview token, and both are checked so neither alone can switch it on.
 */
export async function isBuilderPreviewFrame(): Promise<boolean> {
  try {
    const h = await headers();
    return h.get(PREVIEW_BUILDER_HEADER) === "1" && Boolean(h.get(PREVIEW_REQUEST_HEADER));
  } catch {
    return false;
  }
}
