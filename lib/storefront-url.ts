// coding-standard: maintained
/**
 * Public URL of a store's homepage (Option A — see `proxy.ts`). On the tenant
 * root the store lives at `{scheme}://{slug}.{root}/shop`; in local dev (no root
 * configured) we use the `{slug}.localhost` subdomain so `proxy.ts` can resolve
 * the slug from the host exactly as it does in production.
 *
 * The scheme mirrors the admin's own (`window.location.protocol`): prod serves
 * over https, local dev over http — localhost has no TLS listener, so hardcoding
 * https produced an unreachable "View store" link (https://…localhost:3000).
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

export const storefrontUrl = (slug: string): string => {
  if (typeof window !== "undefined") {
    const { protocol, host } = window.location; // e.g. "http:", "localhost:3000"
    // Prefer the configured tenant root; otherwise (local dev) derive it from
    // the current host, stripping a leading `{slug}.` so we don't double-prefix
    // when the admin is itself open on the tenant subdomain.
    const root =
      STOREFRONT_ROOT ||
      (host.startsWith(`${slug}.`) ? host.slice(slug.length + 1) : host);
    return `${protocol}//${slug}.${root}/shop`;
  }
  // SSR (no window): fall back to the configured root over https, else the
  // relative store path. Real callers only render post-hydration, so this is
  // just a safe default.
  return STOREFRONT_ROOT ? `https://${slug}.${STOREFRONT_ROOT}/shop` : `/shop`;
};
