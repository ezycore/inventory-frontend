// coding-standard: maintained
import type { Metadata } from "next";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { canonicalTarget } from "@/lib/storefront-canonical";
import type { StorefrontStore } from "@/lib/storefront-client";

export interface StorePageMetadataOptions {
  title: string;
  description?: string;
  /**
   * Public sub-path for the canonical URL, e.g. "/products". Omit it to emit **no**
   * canonical — which is what a `noindex` page wants: pointing a non-indexed URL at
   * a different one sends the crawler two contradictory instructions.
   */
  path?: string;
  index?: boolean;
  /**
   * Whether to follow links when `index` is false. Defaults to false, which suits a
   * dead end (cart, checkout, account). Filtered collection URLs pass `true` — the
   * URL is not worth storing, but the products it links to are still worth reaching.
   */
  follow?: boolean;
  image?: string;
}

/**
 * Build per-page storefront metadata so every sub-page has a real `<title>`
 * ("Cart · Rashid's Mart") instead of the app's default, plus a host-correct
 * canonical and the right robots directive. Transactional pages (cart, checkout,
 * account) pass `index: false` so they aren't indexed.
 *
 * It also owns the **share card**. In this market Facebook is the primary
 * discovery channel, so a page whose link renders as a bare grey box in a post
 * loses traffic that has nothing to do with ranking — `openGraph` and `twitter`
 * are built here for every page rather than left to the two that remembered.
 *
 * Pure: the store and the serving origin/base are passed in, so a route that
 * must stay cacheable (and so cannot read the request) builds the same metadata
 * as one that can. `storePageMetadata` below is the request-reading wrapper.
 */
export function buildStorePageMetadata(
  store: StorefrontStore | null,
  request: { origin: string; base: string },
  opts: StorePageMetadataOptions,
): Metadata {
  const storeName = store?.name || "Store";
  const fullTitle = `${opts.title} · ${storeName}`;
  // Canonical against the store's own domain when it has one — NOT the host that
  // served this request, or the same page canonicalizes to itself on two hosts.
  const target = canonicalTarget(store, request);
  const canonical =
    opts.path && target.origin
      ? `${target.origin}${target.base}${opts.path}`
      : undefined;

  // Relative URLs anywhere in this object resolve against it. Per-request rather
  // than a module constant, because the right base is the store's canonical host
  // and only this function knows it.
  const metadataBase = target.origin ? new URL(target.origin) : undefined;

  // No dimensions: the backend stores three variants but not their sizes, and
  // `og:image:width` without a height helps nobody. Guessing from the 1600px cap
  // would be a claim about an aspect ratio nothing here knows.
  const images = opts.image ? [{ url: opts.image }] : undefined;

  return {
    title: fullTitle,
    description: opts.description,
    metadataBase,
    alternates: canonical ? { canonical } : undefined,
    robots:
      opts.index === false
        ? { index: false, follow: opts.follow === true }
        : undefined,
    openGraph: {
      title: fullTitle,
      description: opts.description,
      // Always `website`.
      //
      // `og:type: "product"` was tried and removed: Next's `OpenGraph` union does
      // not carry it, and on its own it buys nothing — the value of that type is
      // the `product:price:amount` / `product:availability` companions, which the
      // storefront does not emit. Price and stock reach search engines through
      // JSON-LD `Product` + `Offer` (`lib/storefront-jsonld.ts`), which is the
      // channel that is actually read. A cast to smuggle the string past the type
      // would add a lie to the type system for no crawler benefit.
      type: "website",
      siteName: storeName,
      // The indexable storefront is English — the BN toggle is client-side on the
      // same URL, so there is no second locale to declare. Revisit with §S4.6.
      locale: "en_US",
      url: canonical,
      images,
    },
    twitter: {
      // A large image is the whole point of a share card; without one the
      // summary layout is the honest choice rather than a card with a blank slot.
      card: images ? "summary_large_image" : "summary",
      title: fullTitle,
      description: opts.description,
      images,
    },
  };
}

/** `buildStorePageMetadata` for the current request's store — makes the route dynamic. */
export async function storePageMetadata(opts: StorePageMetadataOptions): Promise<Metadata> {
  const { slug, base, origin } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  return buildStorePageMetadata(store, { origin, base }, opts);
}
