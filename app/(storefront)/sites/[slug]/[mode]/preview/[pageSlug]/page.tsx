// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requestStorefront } from "@/lib/storefront-server";
import {
  loadStorePage,
  storePageMetadataFor,
  type SitePageParams,
} from "@/lib/storefront-site-page";
import { BuilderPagePreview } from "@/components/storefront-builder/builder-page-preview";
import { StorePageBody } from "@/components/storefront-builder/store-page-body";

/** Owner preview of one store page — see the layout beside this. Never indexed. */
export async function generateMetadata({
  params,
}: {
  params: Promise<SitePageParams>;
}): Promise<Metadata> {
  const site = await loadStorePage(requestStorefront, await params);
  return storePageMetadataFor(requestStorefront, site, { preview: true });
}

/**
 * A builder page draws through `BuilderPagePreview`, which the editor's frame
 * redraws as the merchant edits. A content page, or a renamed page's redirect,
 * takes the cached route's path.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<SitePageParams>;
}) {
  const site = await loadStorePage(requestStorefront, await params);
  if (!site?.store) notFound();

  const page = site.builder?.page;
  if (!page) return <StorePageBody reads={requestStorefront} site={site} />;
  return <BuilderPagePreview reads={requestStorefront} site={site} store={site.store} page={page} />;
}
