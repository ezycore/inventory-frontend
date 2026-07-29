import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore, getStorePage } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

// Host-resolved (dynamic render); the page body is cached via the fetch-level
// `revalidate` in lib/storefront-server.ts.
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
    title: page?.title || "Page",
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

  // Real 404, gated on the store payload proving the API is up — see the same
  // guard on the product page for why a bare `!page` check would be unsafe.
  if (store && !page) notFound();

  return <View initialPage={page ?? undefined} />;
}
