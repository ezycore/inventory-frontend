// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requestStorefront } from "@/lib/storefront-server";
import { loadStorePage, type SitePageParams } from "@/lib/storefront-site-page";
import { PageFrame } from "@/components/storefront-builder/page-frame";
import { StorefrontPreviewBanner } from "@/components/storefront/preview-banner";

/**
 * Owner preview of `/pages/<slug>`: the cached route's frame, drawn from the draft.
 *
 * `proxy.ts` rewrites a page request that carries a preview token here
 * (`sitesPreviewPath`). Not onto the cached route, which never previews, and not
 * onto `shop/pages/[pageSlug]`, whose layout always draws the full shop shell —
 * a landing page set to a logo bar would preview with a header and footer it
 * will never have.
 *
 * Reads the request (the token, through `requestStorefront`), so it renders per
 * request and is never cached. The direct-request block on `/sites` covers this
 * path as well.
 */
export default async function PreviewPageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<SitePageParams>;
}) {
  const site = await loadStorePage(requestStorefront, await params);
  if (!site?.store) notFound();

  return (
    <>
      <StorefrontPreviewBanner />
      <PageFrame
        chrome={site.builder?.page?.chrome ?? "full"}
        reads={requestStorefront}
        slug={site.slug}
        base={site.base}
        store={site.store}
      >
        {children}
      </PageFrame>
    </>
  );
}
