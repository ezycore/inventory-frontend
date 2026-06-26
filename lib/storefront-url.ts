/**
 * Public URL of the live storefront. Mirrors `proxy.ts`: when a storefront root
 * domain is configured the store is reached at `{slug}.{root}`, otherwise it is
 * path-based at `{origin}/s/{slug}`.
 */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

export const storefrontUrl = (slug: string): string => {
  if (STOREFRONT_ROOT) return `https://${slug}.${STOREFRONT_ROOT}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/s/${slug}`;
};
