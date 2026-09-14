// coding-standard: maintained
import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import { buildStorePageMetadata } from "@/lib/storefront-metadata";
import { storeHref } from "@/lib/storefront-links";
import { loadSitePage, type SitePageParams } from "@/lib/storefront-site-page";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
} from "@/components/storefront-builder/page-sections";
import { LazyStoreContentPage } from "@/components/storefront/content-page-lazy";

/**
 * `/pages/<slug>` for shoppers, HTML-cached per store and per page.
 *
 * `proxy.ts` rewrites a public GET here (`lib/storefront-sites.ts`); owner
 * preview stays on `shop/pages/[pageSlug]`, which may read the request. Nothing
 * below may call `headers()`/`cookies()` or the request-aware fetchers — one
 * such read turns the whole route dynamic, silently, with a green build.
 *
 * Builder pages and content pages share the URL namespace (the backend's
 * `isPageSlugTaken` keeps a slug unique across both), so a builder page is tried
 * first, then its rename redirect, then the content page.
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
  const site = await loadSitePage(await params);
  if (!site?.store) return {};
  const target = { origin: site.origin, base: site.base };

  const page = site.builder?.page;
  if (page) {
    const index = !page.seo.noindex;
    return buildStorePageMetadata(site.store, target, {
      title: page.seo.title || page.title,
      description: page.seo.description || undefined,
      // A noindex page emits no canonical, and still lets crawlers follow its
      // links: a campaign page is not worth indexing, the products on it are.
      path: index ? site.path : undefined,
      index,
      follow: true,
    });
  }

  const content = await publicStorefront.getStorePage(site.slug, site.pageSlug);
  return buildStorePageMetadata(site.store, target, {
    title: content?.seo?.title || content?.title || "Page",
    description: content?.seo?.description || undefined,
    path: site.path,
  });
}

export default async function SitePage({
  params,
}: {
  params: Promise<SitePageParams>;
}) {
  const site = await loadSitePage(await params);
  if (!site?.store) notFound();

  const { builder } = site;
  if (builder?.redirect) {
    const target = storeHref(site.base, builder.redirect.path);
    if (builder.redirect.permanent) permanentRedirect(target);
    redirect(target);
  }

  if (builder?.page) {
    const sections = prepareSections(builder.page.sections);
    const data = await publicStorefront.getSectionData(site.slug, sectionDataRequests(sections));
    return (
      <PageSections
        sections={sections}
        context={{ base: site.base, currency: site.store.currency }}
        data={data}
      />
    );
  }

  const content = await publicStorefront.getStorePage(site.slug, site.pageSlug);
  if (!content) notFound();
  return <LazyStoreContentPage initialPage={content} />;
}
