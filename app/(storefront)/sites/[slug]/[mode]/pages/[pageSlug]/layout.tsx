// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import { loadSitePage, type SitePageParams } from "@/lib/storefront-site-page";
import { PageFrame } from "@/components/storefront-builder/page-frame";

/**
 * The frame around one cached store page — builder page or content page. The
 * chrome is the page's own setting (`page.chrome`); a content page gets the full
 * shop chrome, which is what `/pages/<slug>` has always had.
 *
 * **No `not-found.tsx` beside this, on purpose.** A cached render that calls
 * `notFound()` gets Next's bare error document (404 status, no shop): Next 16.1
 * never renders a nested not-found boundary on this path — tried with a client
 * and a server one. `proxy.ts` sends only pages that exist here
 * (`lib/storefront-page-lookup.ts`); the `notFound()` calls in this route are the
 * backstop for a page deleted inside that lookup's cache window.
 *
 * Reads nothing but params — that is what keeps the route cacheable.
 */
export default async function SitePageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<SitePageParams>;
}) {
  const site = await loadSitePage(await params);
  if (!site?.store) notFound();

  return (
    <PageFrame
      chrome={site.builder?.page?.chrome ?? "full"}
      reads={publicStorefront}
      slug={site.slug}
      base={site.base}
      store={site.store}
    >
      {children}
    </PageFrame>
  );
}
