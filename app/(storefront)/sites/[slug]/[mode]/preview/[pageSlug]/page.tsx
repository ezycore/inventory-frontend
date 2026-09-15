// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requestStorefront } from "@/lib/storefront-server";
import {
  loadStorePage,
  storePageMetadataFor,
  type SitePageParams,
} from "@/lib/storefront-site-page";
import { loadBuilderPageData } from "@/components/storefront-builder/builder-page-data";
import { PageDraftPreview } from "@/components/storefront-builder/page-draft-preview";
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
 * A builder page draws through `PageDraftPreview`, which the editor's frame
 * redraws as the merchant edits, before anything is saved. Every store-wide list
 * is loaded up front for it: a section added in the editor may need a list the
 * saved page did not. A content page, or a renamed page's redirect, takes the
 * cached route's path.
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

  const { instances, data, context } = await loadBuilderPageData(requestStorefront, {
    slug: site.slug,
    base: site.base,
    store: site.store,
    page,
    allLists: true,
  });
  return <PageDraftPreview slug={site.slug} instances={instances} data={data} context={context} />;
}
