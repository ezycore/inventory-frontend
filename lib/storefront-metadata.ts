import type { Metadata } from "next";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore } from "@/lib/storefront-server";

/**
 * Build per-page storefront metadata so every sub-page has a real `<title>`
 * ("Cart · Rashid's Mart") instead of the app's default, plus a host-correct
 * canonical and the right robots directive. Transactional pages (cart, checkout,
 * account) pass `index: false` so they aren't indexed.
 */
export async function storePageMetadata(opts: {
  title: string;
  description?: string;
  /** Public sub-path for the canonical URL, e.g. "/products". */
  path?: string;
  index?: boolean;
  image?: string;
}): Promise<Metadata> {
  const { slug, base, origin } = await getStoreContext();
  const store = slug ? await getStore(slug) : null;
  const storeName = store?.name || "Store";
  const fullTitle = `${opts.title} · ${storeName}`;
  const canonical =
    opts.path && origin ? `${origin}${base}${opts.path}` : undefined;

  return {
    title: fullTitle,
    description: opts.description,
    alternates: canonical ? { canonical } : undefined,
    robots: opts.index === false ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description: opts.description,
      type: "website",
      url: canonical,
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
  };
}
