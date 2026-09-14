// coding-standard: maintained
import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore, getStorePage } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { StoreContentPage } from "@/components/storefront/content-page-view";

// Host-resolved (dynamic render); the page body is cached via the fetch-level
// `revalidate` in lib/storefront-server.ts.
//
// Shoppers normally never reach this route: `proxy.ts` rewrites a public
// `/pages/<slug>` GET onto the cached `app/(storefront)/sites` route. What still
// lands here is owner preview (it must read the preview token off the request)
// and a `/shop/pages/…` request on a host that names no store.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const { slug } = await getStoreContext();
  const page = slug ? await getStorePage(slug, pageSlug) : null;
  return storePageMetadata({
    // Merchant SEO overrides win; else the page heading. The heading can run to
    // 160 characters, which is why the override exists as its own field.
    title: page?.seo?.title || page?.title || "Page",
    description: page?.seo?.description || undefined,
    path: `/pages/${pageSlug}`,
  });
}

/**
 * Fetches the CMS page server-side and seeds the client view. The body is the
 * entire content of this route, so without the seed the SSR HTML is a single
 * "Loading…" line — and a policy or About page is exactly the kind of content a
 * crawler should be able to read without executing JavaScript.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const { slug } = await getStoreContext();
  const [page, store] = await Promise.all([
    slug ? getStorePage(slug, pageSlug) : null,
    slug ? getStore(slug) : null,
  ]);

  // Real 404 — see the product page for why the store payload is no longer used
  // as a liveness probe here.
  if (!store || !page) notFound();

  return <StoreContentPage initialPage={page} />;
}
