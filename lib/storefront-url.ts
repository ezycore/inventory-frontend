/**
 * Public URL of a store's homepage (Option A — see `proxy.ts`). On the tenant
 * root the store lives at `https://{slug}.{root}/shop`; in local dev (no root
 * configured) we use the `{slug}.localhost` subdomain so `proxy.ts` can resolve
 * the slug from the host exactly as it does in production.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

export const storefrontUrl = (slug: string): string => {
  if (STOREFRONT_ROOT) return `https://${slug}.${STOREFRONT_ROOT}/shop`;
  if (typeof window !== "undefined") {
    const { protocol, host } = window.location; // e.g. "localhost:3000"
    // The admin may itself be open on the tenant subdomain (`{slug}.localhost`);
    // strip a leading `{slug}.` so we don't double-prefix it.
    const bare = host.startsWith(`${slug}.`) ? host.slice(slug.length + 1) : host;
    return `${protocol}//${slug}.${bare}/shop`;
  }
  return `/shop`;
};
