// coding-standard: maintained
import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { StorefrontReads } from "@/lib/storefront-server";
import { storeHref } from "@/lib/storefront-links";
import type { SitePage } from "@/lib/storefront-site-page";
import { BuilderPageBody } from "@/components/storefront-builder/builder-page-body";

/**
 * What `/pages/<slug>` draws — for the cached route and its owner-preview twin,
 * which pass different `reads` (see `loadStorePage`).
 *
 * The page, or its rename redirect; an address the store does not serve is the
 * shop's 404.
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

  if (!builder?.page) notFound();
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
