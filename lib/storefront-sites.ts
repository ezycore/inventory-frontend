// coding-standard: maintained
/**
 * The cached storefront route — `app/(storefront)/sites/[slug]/[mode]/…`.
 *
 * Shop routes under `/shop` read the request (host headers, the owner-preview
 * token), so every one of them renders per request. The `/sites` tree reads
 * nothing but its params, which is what lets Next cache its HTML per store and
 * per path (ISR, proven in plan Spike A). `proxy.ts` rewrites a public URL onto
 * it; this module is the one place that knows how the two spellings map.
 *
 *   {slug}.ezycore.com/shop/pages/about  →  /sites/{slug}/shop/pages/about
 *   mystore.com/pages/about              →  /sites/{slug}/root/pages/about
 *
 * **There is no host segment**, although the host is what varies. The proxy's
 * matcher skips every path that contains a dot, so a direct request for
 * `/sites/mystore.com/…` would never reach the proxy's block on `/sites` — and
 * would serve the store on the platform host. The mode segment carries the one
 * fact the host contributed (is the store at `/shop` or at the root?) and the
 * canonical origin is derived instead (`siteOrigin`).
 */

export const SITES_PREFIX = "/sites";

export const SITE_MODES = ["shop", "root"] as const;
export type SiteMode = (typeof SITE_MODES)[number];

export const isSiteMode = (value: string): value is SiteMode =>
  (SITE_MODES as readonly string[]).includes(value);

/** `shop` on a tenant subdomain (`/shop`), `root` on a custom domain (`""`). */
export const siteModeFor = (base: string): SiteMode => (base === "" ? "root" : "shop");

export const siteBaseFor = (mode: SiteMode): "/shop" | "" => (mode === "root" ? "" : "/shop");

/**
 * A page slug as the backend's `normalizePageSlug` writes it. The cached route
 * refuses anything else outright: the backend would normalise `about.x` to
 * `aboutx` and serve that page, and a path with a dot never passes through the
 * proxy's block on `/sites` — so the check has to live on the route too.
 */
export const isPageSlug = (value: string): boolean => /^[a-z0-9-]+$/.test(value);

/**
 * Store sub-paths served from the cache today. Only `/pages/<slug>` for now; a
 * legacy slug outside the grammar simply stays on the request-reading route.
 */
const CACHED_SUB_PATH = /^\/pages\/([^/]+)$/;

/** True for the internal prefix itself — never a public URL. */
export const isSitesPath = (pathname: string): boolean =>
  pathname === SITES_PREFIX || pathname.startsWith(`${SITES_PREFIX}/`);

/**
 * The page slug of a public store request the cached route could serve, or
 * `null`. `pathname` is what the browser asked for; the store's `base` is
 * stripped first, so a tenant URL outside `/shop` (the admin app) never matches.
 *
 * "Could", not "will": the proxy also checks that the page exists
 * (`lib/storefront-page-lookup.ts`) before rewriting.
 */
export function cachedPageSlug(
  store: { slug: string; base: string },
  pathname: string,
): string | null {
  let sub = pathname;
  if (store.base) {
    if (!pathname.startsWith(`${store.base}/`)) return null;
    sub = pathname.slice(store.base.length);
  }
  const match = CACHED_SUB_PATH.exec(sub);
  return match && isPageSlug(match[1]) ? match[1] : null;
}

/** The internal cached path of one store page. */
export const sitesPagePath = (store: { slug: string; base: string }, pageSlug: string): string =>
  `${SITES_PREFIX}/${encodeURIComponent(store.slug)}/${siteModeFor(store.base)}/pages/${pageSlug}`;

/** The segment the owner-preview page route sits under, beside the cached `pages`. */
const PREVIEW_SEGMENT = "preview";

/**
 * The internal path of one store page under owner preview — a request-reading
 * route that draws the draft in the page's own chrome. Under `/sites`, so the
 * proxy's block on direct `/sites` requests covers it too.
 */
export const sitesPreviewPath = (store: { slug: string; base: string }, pageSlug: string): string =>
  `${SITES_PREFIX}/${encodeURIComponent(store.slug)}/${siteModeFor(store.base)}/${PREVIEW_SEGMENT}/${pageSlug}`;

/**
 * The public pathname for a pathname read inside the app.
 *
 * `usePathname()` disagrees with itself on a rewritten, cached page: the server
 * renders with the rewritten URL (`/sites/{slug}/shop/pages/about`) while the
 * browser reports the address bar (`/shop/pages/about`). Anything the storefront
 * derives from the pathname — the active tab, the breadcrumb, whether a strip
 * shows — would then differ between the two renders and fail hydration. Mapping
 * the internal spelling back makes both sides agree; every other pathname is
 * returned untouched. The owner-preview route's `preview` segment maps back to
 * `pages`, which is what the browser asked for.
 */
export function publicPathname(pathname: string): string {
  if (!pathname.startsWith(`${SITES_PREFIX}/`)) return pathname;
  const [, , slug, mode, ...rest] = pathname.split("/");
  if (!slug || !mode || !isSiteMode(mode)) return pathname;
  if (rest[0] === PREVIEW_SEGMENT) rest[0] = "pages";
  const tail = rest.length ? `/${rest.join("/")}` : "";
  return `${siteBaseFor(mode)}${tail}` || "/";
}

/**
 * The origin a cached page's absolute URLs are built on, without reading the
 * request.
 *
 * A tenant subdomain is `{slug}.{root}`. A custom domain returns `""`: its origin
 * is the store's `canonicalHost`, which `canonicalTarget` already prefers over
 * this value, and a root-mode store without one has no URL this route could
 * honestly claim. An empty root (a build without tenant routing) is `""` too —
 * the same "say nothing rather than something false" rule `sitemap.ts` follows.
 */
export function siteOrigin(
  slug: string,
  mode: SiteMode,
  root: string | undefined = process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN,
): string {
  if (mode === "root" || !root) return "";
  // Local dev sets the root to `localhost:3000`, which has no certificate.
  const scheme = root.startsWith("localhost") ? "http" : "https";
  return `${scheme}://${slug}.${root}`;
}
