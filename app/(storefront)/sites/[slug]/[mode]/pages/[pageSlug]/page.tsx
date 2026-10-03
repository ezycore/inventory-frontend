// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import {
  loadSitePage,
  storePageMetadataFor,
  type SitePageParams,
} from "@/lib/storefront-site-page";
import { StorePageBody } from "@/components/storefront-builder/store-page-body";

/**
 * `/pages/<slug>` for shoppers, HTML-cached per store and per page.
 *
 * `proxy.ts` rewrites a public GET here (`lib/storefront-sites.ts`); owner
 * preview goes to the `preview/[pageSlug]` route beside this one, which may read
 * the request. Nothing below may call `headers()`/`cookies()` or the
 * request-aware fetchers — one such read turns the whole route dynamic,
 * silently, with a green build.
 *
 * Freshness: the `store:{slug}` tag on every fetch is flushed by an admin save
 * (`POST /api/storefront/revalidate`), which also drops this page's cached HTML;
 * `revalidate` is only the backstop.
 */
export const revalidate = 300;
export const dynamicParams = true;

/** None at build time — every store page is rendered on first request, then cached. */
export function generateStaticParams(): SitePageParams[] {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SitePageParams>;
}): Promise<Metadata> {
  return storePageMetadataFor(await loadSitePage(await params));
}

export default async function SitePage({
  params,
}: {
  params: Promise<SitePageParams>;
}) {
  const site = await loadSitePage(await params);
  if (!site?.store) notFound();
  return <StorePageBody reads={publicStorefront} site={site} />;
}
