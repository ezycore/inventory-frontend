// coding-standard: maintained
import type { Metadata } from "next";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";
import { canonicalTarget } from "@/lib/storefront-canonical";

/**
 * Build per-page storefront metadata so every sub-page has a real `<title>`
 * ("Cart · Rashid's Mart") instead of the app's default, plus a host-correct
 * canonical and the right robots directive. Transactional pages (cart, checkout,
 * account) pass `index: false` so they aren't indexed.
 */
export async function storePageMetadata(opts: {
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
}): Promise<Metadata> {
  const { slug, base, origin } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  const storeName = store?.name || "Store";
  const fullTitle = `${opts.title} · ${storeName}`;
  // Canonical against the store's own domain when it has one — NOT the host that
  // served this request, or the same page canonicalizes to itself on two hosts.
  const target = canonicalTarget(store, { origin, base });
  const canonical =
    opts.path && target.origin
      ? `${target.origin}${target.base}${opts.path}`
      : undefined;

  return {
    title: fullTitle,
    description: opts.description,
    alternates: canonical ? { canonical } : undefined,
    robots:
      opts.index === false
        ? { index: false, follow: opts.follow === true }
        : undefined,
    openGraph: {
      title: fullTitle,
      description: opts.description,
      type: "website",
      url: canonical,
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
  };
}
