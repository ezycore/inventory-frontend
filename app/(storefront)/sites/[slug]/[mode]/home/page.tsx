// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import {
  loadSiteHome,
  storeHomeMetadataFor,
  type SiteHomeParams,
} from "@/lib/storefront-site-page";
import { StoreHomeJsonLd } from "@/components/storefront/store-home-json-ld";
import { StorePageBody } from "@/components/storefront-builder/store-page-body";

/**
 * The store's `/` when the merchant uses a landing page as the homepage,
 * HTML-cached per store. The page draws as it does at `/pages/<slug>`; the
 * metadata is the homepage's own (`storeHomeMetadataFor`).
 *
 * Like the cached page route, nothing below may call `headers()`/`cookies()` or
 * the request-aware fetchers. Freshness: an admin save flushes the `site` and
 * `content` tags its fetches carry; `revalidate` is only the backstop.
 */
export const revalidate = 300;
export const dynamicParams = true;

/** None at build time — rendered on first request, then cached. */
export function generateStaticParams(): SiteHomeParams[] {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SiteHomeParams>;
}): Promise<Metadata> {
  return storeHomeMetadataFor(await loadSiteHome(await params));
}

export default async function SiteHomePage({
  params,
}: {
  params: Promise<SiteHomeParams>;
}) {
  const site = await loadSiteHome(await params);
  if (!site?.store || !site.builder?.page) notFound();
  return (
    <>
      <StoreHomeJsonLd store={site.store} origin={site.origin} base={site.base} />
      <StorePageBody reads={publicStorefront} site={site} />
    </>
  );
}
