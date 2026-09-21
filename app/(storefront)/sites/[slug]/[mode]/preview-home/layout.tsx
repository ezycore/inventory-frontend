// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requestStorefront } from "@/lib/storefront-server";
import { loadStoreHome, type SiteHomeParams } from "@/lib/storefront-site-page";
import { PageFrame } from "@/components/storefront-builder/page-frame";
import { StorefrontPreviewBanner } from "@/components/storefront/preview-banner";

/**
 * Owner preview of the store's `/` when a landing page is the homepage: the
 * cached home route's frame, drawn from the page's draft.
 *
 * `proxy.ts` rewrites here when the request carries a preview token and the
 * backend, asked with that token, names a homepage. Reads the request (through
 * `requestStorefront`), so it renders per request and is never cached; the
 * direct-request block on `/sites` covers this path as well.
 */
export default async function PreviewHomeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<SiteHomeParams>;
}) {
  const site = await loadStoreHome(requestStorefront, await params);
  const page = site?.builder?.page;
  if (!site?.store || !page) notFound();

  return (
    <>
      <StorefrontPreviewBanner />
      <PageFrame
        chrome={page.chrome}
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
