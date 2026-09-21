// coding-standard: maintained
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { publicStorefront } from "@/lib/storefront-server";
import { loadSiteHome, type SiteHomeParams } from "@/lib/storefront-site-page";
import { PageFrame } from "@/components/storefront-builder/page-frame";

/**
 * The frame around a landing page used as the store's homepage — the page's own
 * chrome, exactly as at its `/pages/<slug>` address.
 *
 * `proxy.ts` sends a store's `/` here only when the backend names a live landing
 * page for it (`storeHomePageExists`). The `notFound()` calls in this route are
 * the backstop for a choice cleared inside that lookup's cache window, and draw
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
