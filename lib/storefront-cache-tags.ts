// coding-standard: maintained
/**
 * Cache tags on the public storefront's server fetches (`lib/storefront-server.ts`)
 * and the ones an admin save flushes (`app/api/storefront/revalidate/route.ts`).
 *
 * Every fetch carries `store:{slug}` plus the scope of the data it returns:
 *
 *  - `site`    — the store payload: settings, theme, navigation, pixel;
 *  - `catalog` — products, categories and collections, tags, campaigns, section data;
 *  - `content` — content pages and Storefront Builder pages.
 *
 * A save flushes only its own scope, so a product edit no longer expires the
 * cached store payload, or a landing page that shows no products (plan P3). Next
 * drops a cached page whenever any fetch it was built from is flushed, so a page
 * follows its data without needing a tag of its own.
 *
 * A flush that names no scope expires `store:{slug}` — the whole store. That is
 * what a settings save wants, and what a client from before scopes still sends.
 */

export const STOREFRONT_CACHE_SCOPES = ["site", "catalog", "content"] as const;
export type StorefrontCacheScope = (typeof STOREFRONT_CACHE_SCOPES)[number];

const isScope = (value: unknown): value is StorefrontCacheScope =>
  typeof value === "string" && (STOREFRONT_CACHE_SCOPES as readonly string[]).includes(value);

/** The tags one fetch carries. */
export const storefrontCacheTags = (
  slug: string,
  scopes: readonly StorefrontCacheScope[],
): string[] => [`store:${slug}`, ...scopes.map((scope) => `${scope}:${slug}`)];

/**
 * The tags a flush expires: the requested scopes, or the whole store when none
 * is named. Anything malformed also flushes the whole store — flushing too much
 * costs one cold render, flushing too little leaves a merchant's save invisible.
 */
export function tagsToFlush(slug: string, requested: unknown): string[] {
  if (!Array.isArray(requested) || requested.length === 0 || !requested.every(isScope)) {
    return [`store:${slug}`];
  }
  return [...new Set(requested)].map((scope) => `${scope}:${slug}`);
}
