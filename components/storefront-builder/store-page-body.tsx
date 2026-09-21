// coding-standard: maintained
import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { StorefrontReads } from "@/lib/storefront-server";
import { storeHref } from "@/lib/storefront-links";
import type { SitePage } from "@/lib/storefront-site-page";
import { BuilderPageBody } from "@/components/storefront-builder/builder-page-body";
import { LazyStoreContentPage } from "@/components/storefront/content-page-lazy";

/**
 * What `/pages/<slug>` draws — for the cached route and its owner-preview twin,
 * which pass different `reads` (see `loadStorePage`).
 *
 * Builder pages and content pages share the URL namespace (the backend's
 * `isPageSlugTaken` keeps a slug unique across both), so a builder page is tried
 * first, then its rename redirect, then the content page.
 */
export async function StorePageBody({
  reads,
  site,
}: {
  reads: StorefrontReads;
  site: SitePage;
}) {
  const { builder, store } = site;
  if (!store) notFound();

  if (builder?.redirect) {
    const target = storeHref(site.base, builder.redirect.path);
    if (builder.redirect.permanent) permanentRedirect(target);
    redirect(target);
  }

  if (builder?.page) {
    return (
      <BuilderPageBody
        reads={reads}
        slug={site.slug}
        base={site.base}
        store={store}
        page={builder.page}
      />
    );
  }

  const content = await reads.getStorePage(site.slug, site.pageSlug);
  if (!content) notFound();
  return <LazyStoreContentPage initialPage={content} />;
}
