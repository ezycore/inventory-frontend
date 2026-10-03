// coding-standard: maintained
import type { Metadata } from "next";
import type { StorefrontStore } from "@/lib/storefront-client";
import { buildStoreHomeMetadata, buildStorePageMetadata } from "@/lib/storefront-metadata";
import { publicStorefront, type StorefrontReads } from "@/lib/storefront-server";
import {
  isPageSlug,
  isSiteMode,
  siteBaseFor,
  siteOrigin,
  type SiteMode,
} from "@/lib/storefront-sites";
import type { StorefrontPublicPage } from "@/types/api";

/**
 * The params of the home routes under `app/(storefront)/sites/[slug]/[mode]`: the
 * cached `home` and the owner-preview `preview-home`.
 */
export interface SiteHomeParams {
  slug: string;
  mode: string;
}

/** The params of the page routes beside them: the cached `pages/[pageSlug]` and the owner-preview `preview/[pageSlug]`. */
export interface SitePageParams extends SiteHomeParams {
  pageSlug: string;
}

export interface SitePage {
  slug: string;
  /** The page's own slug; at `/`, the homepage's — `""` when the store has none. */
  pageSlug: string;
  /** Public link base: `/shop` on a tenant subdomain, `""` on a custom domain. */
  base: "/shop" | "";
  /** Derived, never read off the request — see `siteOrigin`. */
  origin: string;
  /** The store-relative path: `/pages/<slug>`, or `/` for the homepage. */
  path: string;
  /** `null` when the host named a store the API will not serve. */
  store: StorefrontStore | null;
  /** The builder page or its rename redirect; `null` when the path is not a builder page. */
  builder: StorefrontPublicPage | null;
}

async function loadSite(
  reads: StorefrontReads,
  slug: string,
  mode: SiteMode,
  path: string,
  pageSlug?: string,
): Promise<SitePage> {
  const store = await reads.getStore(slug);
  const builder = store ? await reads.getStorefrontPage(slug, path) : null;
  return {
    slug,
    pageSlug: pageSlug ?? builder?.page?.slug ?? "",
    base: siteBaseFor(mode),
    origin: siteOrigin(slug, mode),
    path,
    store,
    builder,
  };
}

/**
 * Everything a store page route resolves before it decides what to draw, shared
 * by its layout, page and metadata. Each of those calls this separately; Next
 * memoises identical `fetch`es within one render, so the backend is asked once
 * per render, not three times.
 *
 * `null` for params no public URL maps to — an unknown mode, or a page slug
 * outside the backend's grammar (see `isPageSlug`).
 *
 * `reads` decides whose page this is: `publicStorefront` for the cached route,
 * which must never read the request, and `requestStorefront` for owner preview,
 * where the token turns a builder page into its draft and makes an unpublished
 * page reachable.
 */
export async function loadStorePage(
  reads: StorefrontReads,
  params: SitePageParams,
): Promise<SitePage | null> {
  const { slug, mode, pageSlug } = params;
  if (!isSiteMode(mode) || !isPageSlug(pageSlug)) return null;
  return loadSite(reads, slug, mode, `/pages/${pageSlug}`, pageSlug);
}

/**
 * The store's `/` when a landing page is the homepage — the home routes' loader,
 * on the same terms as `loadStorePage`. `builder` is `null` when the store has no
 * landing homepage (the backend answers `/` with a 404 then).
 */
export async function loadStoreHome(
  reads: StorefrontReads,
  { slug, mode }: SiteHomeParams,
): Promise<SitePage | null> {
  if (!isSiteMode(mode)) return null;
  return loadSite(reads, slug, mode, "/");
}

/** The cached page route's loader — public reads only. */
export const loadSitePage = (params: SitePageParams) => loadStorePage(publicStorefront, params);

/** The cached home route's loader — public reads only. */
export const loadSiteHome = (params: SiteHomeParams) => loadStoreHome(publicStorefront, params);

/**
 * Metadata for a loaded store page.
 *
 * A preview is never indexed and names no canonical: it is one owner's view of a
 * draft, and the page it would point a crawler at may not be live.
 */
export async function storePageMetadataFor(
  site: SitePage | null,
  { preview = false }: { preview?: boolean } = {},
): Promise<Metadata> {
  if (!site?.store) return {};
  const target = { origin: site.origin, base: site.base };

  const page = site.builder?.page;
  if (!page) return {};
  // The homepage is indexed at `/` (`storeHomeMetadataFor`). Its own address
  // stays out of the index, so search engines do not hold the same page twice.
  const isHome = site.store.homePageId === page._id;
  const index = !preview && !isHome && !page.seo.noindex;
  return buildStorePageMetadata(site.store, target, {
    title: page.seo.title || page.title,
    description: page.seo.description || undefined,
    // A noindex page emits no canonical, and still lets crawlers follow its
    // links: a campaign page is not worth indexing, the products on it are.
    path: index ? site.path : undefined,
    index,
    follow: true,
  });
}

/**
 * Metadata for the store's `/` drawn by a landing page: the homepage's own —
 * the store's search title and description, indexed, canonical at `/` — whatever
 * the page's "hide from search engines" says about its campaign address. Never
 * indexed under owner preview.
 */
export function storeHomeMetadataFor(
  site: SitePage | null,
  { preview = false }: { preview?: boolean } = {},
): Metadata {
  if (!site?.store) return {};
  return buildStoreHomeMetadata(site.store, { origin: site.origin, base: site.base }, { preview });
}
