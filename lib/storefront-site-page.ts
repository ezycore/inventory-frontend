// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import { publicStorefront } from "@/lib/storefront-server";
import {
  isPageSlug,
  isSiteMode,
  siteBaseFor,
  siteOrigin,
} from "@/lib/storefront-sites";
import type { StorefrontPublicPage } from "@/types/api";

/** The params of `app/(storefront)/sites/[slug]/[mode]/pages/[pageSlug]`. */
export interface SitePageParams {
  slug: string;
  mode: string;
  pageSlug: string;
}

export interface SitePage {
  slug: string;
  pageSlug: string;
  /** Public link base: `/shop` on a tenant subdomain, `""` on a custom domain. */
  base: "/shop" | "";
  /** Derived, never read off the request — see `siteOrigin`. */
  origin: string;
  /** The store-relative path, `/pages/<slug>`. */
  path: string;
  /** `null` when the host named a store the public API will not serve. */
  store: StorefrontStore | null;
  /** The builder page or its rename redirect; `null` when the path is not a builder page. */
  builder: StorefrontPublicPage | null;
}

/**
 * Everything the cached page route resolves before it decides what to draw,
 * shared by its layout, page and metadata. Each of those calls this separately;
 * Next memoises identical `fetch`es within one render, so the backend is asked
 * once per render, not three times.
 *
 * `null` for params no public URL maps to — an unknown mode, or a page slug
 * outside the backend's grammar (see `isPageSlug`).
 *
 * Only public reads (`publicStorefront`): this route must never read the request.
 */
export async function loadSitePage(params: SitePageParams): Promise<SitePage | null> {
  const { slug, mode, pageSlug } = params;
  if (!isSiteMode(mode) || !isPageSlug(pageSlug)) return null;

  const path = `/pages/${pageSlug}`;
  const store = await publicStorefront.getStore(slug);
  const builder = store ? await publicStorefront.getStorefrontPage(slug, path) : null;
  return {
    slug,
    pageSlug,
    base: siteBaseFor(mode),
    origin: siteOrigin(slug, mode),
    path,
    store,
    builder,
  };
}
