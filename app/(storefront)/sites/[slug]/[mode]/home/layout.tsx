// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import { loadSiteHome, type SiteHomeParams } from "@/lib/storefront-site-page";
import { PageFrame } from "@/components/storefront-builder/page-frame";

/**
 * The frame around the store's homepage — its `home` builder page, or a landing
 * page used as the homepage — in the page's own chrome.
 *
 * `proxy.ts` sends a store's `/` here when the backend names a home page for it
 * (`storeHomePageExists`), and while that lookup fails. The `notFound()` calls
 * in this route are the backstop for either answer going stale, and draw
 * Next's bare 404 for the reason `pages/[pageSlug]/layout.tsx` gives.
 *
 * Reads nothing but params — that is what keeps the route cacheable.
 */
export default async function SiteHomeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<SiteHomeParams>;
}) {
  const site = await loadSiteHome(await params);
  const page = site?.builder?.page;
  if (!site?.store || !page) notFound();

  return (
    <PageFrame
      chrome={page.chrome}
      reads={publicStorefront}
      slug={site.slug}
      base={site.base}
      store={site.store}
    >
      {children}
    </PageFrame>
  );
}
