// coding-standard: maintained
import { lookupStoreByHost } from "@/lib/storefront-domain-lookup";

/**
 * Host → store resolution, shared by every entry point that has to answer "is this
 * host a storefront, and where does it live?".
 *
 * Extracted from `proxy.ts` because the proxy is **not** the only caller: its
 * matcher skips any path containing a dot, so `/robots.txt` and `/sitemap.xml`
 * never pass through it and never receive the `x-ezy-store-*` headers. Those
 * routes must resolve the host themselves — with exactly the same rules, or a
 * store's robots/sitemap would describe a different store than its pages do.
 *
 * Pure module: no `next/headers`, no request object, so it is safe to import from
 * the proxy (edge runtime) and from server routes alike.
 */

/** The tenant root (e.g. "ezycore.com"); empty in local dev, where `*.localhost`
 *  stands in for it. Baked at BUILD time — must be a Docker build-arg (deploy.yml). */
const STOREFRONT_ROOT = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN;

/** Custom domains → store slug, e.g. `{"mystore.com":"rmc41"}`. Manual
 *  override/fallback — self-serve domains resolve dynamically instead. */
const CUSTOM_DOMAIN_MAP: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_MAP || "{}");
  } catch {
    return {};
  }
})();

// Subdomains on the tenant root that are NOT stores (central app, www).
const RESERVED_SUBDOMAINS = new Set(["www", "app"]);

export type ResolvedStore = {
  slug: string;
  /** Public link base: `/shop` on a tenant subdomain, `""` on a custom domain. */
  base: "/shop" | "";
};

/** Map a request host to its store using build-time config only, or null. */
export function resolveStoreFromHost(host: string): ResolvedStore | null {
  // Custom domain: the whole host is the store, served at its root.
  if (CUSTOM_DOMAIN_MAP[host]) {
    return { slug: CUSTOM_DOMAIN_MAP[host], base: "" };
  }
  // Local dev: `{slug}.localhost` behaves like a tenant subdomain.
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return { slug: sub, base: "/shop" };
  }
  // Production tenant subdomain: `{slug}.ezycore.com`.
  if (
    STOREFRONT_ROOT &&
    host !== STOREFRONT_ROOT &&
    host.endsWith(`.${STOREFRONT_ROOT}`)
  ) {
    const sub = host.slice(0, host.length - STOREFRONT_ROOT.length - 1);
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return { slug: sub, base: "/shop" };
  }
  return null;
}

/**
 * Hosts worth a dynamic custom-domain lookup: anything `resolveStoreFromHost`
 * couldn't place that isn't localhost, the tenant root itself, or one of its
 * subdomains (reserved subdomains like `app`/`www` must stay admin, and a store
 * subdomain never needs the API). Everything else may be a merchant domain from
 * Settings → Domains.
 */
export function isCustomDomainCandidate(host: string): boolean {
  return (
    host.includes(".") &&
    !host.endsWith(".localhost") &&
    (!STOREFRONT_ROOT ||
      (host !== STOREFRONT_ROOT && !host.endsWith(`.${STOREFRONT_ROOT}`)))
  );
}

/**
 * Full resolution: build-time config first, then the backend's Settings → Domains
 * registry (cached ~60s, never throws). Null means the host is not a storefront —
 * the central app, an admin host, or an unknown domain.
 */
export async function resolveStoreForHost(
  host: string,
): Promise<ResolvedStore | null> {
  const store = resolveStoreFromHost(host);
  if (store) return store;
  if (!isCustomDomainCandidate(host)) return null;
  const slug = await lookupStoreByHost(host);
  return slug ? { slug, base: "" } : null;
}

/** Strip the port: `rmc41.localhost:3000` → `rmc41.localhost`. */
export const hostnameOf = (hostHeader: string): string =>
  hostHeader.split(":")[0];

/**
 * Whether this build can tell a tenant subdomain from a merchant custom domain.
 *
 * `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is baked at BUILD time. Without it a host
 * like `rmc41.ezycore.com` falls past the subdomain branch, gets treated as a
 * custom-domain candidate, and resolves with `base: ""` — i.e. "the store is at
 * the root" when it is really at `/shop`. Pages still render (the proxy rewrites),
 * which is why this misconfiguration is easy to miss.
 *
 * It is not easy to miss for crawlers, though: a sitemap built on that wrong base
 * is a list of 404s, and robots.txt would guard `/cart` while the real path is
 * `/shop/cart`. `robots.ts` and `sitemap.ts` therefore check this and emit their
 * **neutral** answer instead of a confident wrong one — say nothing rather than
 * lie. `.localhost` dev hosts are unaffected: they match before this ever matters.
 *
 * Watch `deploy.yml`, which bakes an empty value on every branch except `main`.
 */
export const isTenantRoutingConfigured = (): boolean => !!STOREFRONT_ROOT;

/** True for `{sub}.localhost` dev hosts, which resolve without the root domain. */
export const isLocalDevHost = (host: string): boolean =>
  host.endsWith(".localhost");
