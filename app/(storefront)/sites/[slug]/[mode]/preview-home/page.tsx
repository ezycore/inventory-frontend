// coding-standard: maintained
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requestStorefront } from "@/lib/storefront-server";
import {
  loadStoreHome,
  storeHomeMetadataFor,
  type SiteHomeParams,
} from "@/lib/storefront-site-page";
import { BuilderPagePreview } from "@/components/storefront-builder/builder-page-preview";

/** Owner preview of a landing page used as the homepage — see the layout beside this. Never indexed. */
export async function generateMetadata({
  params,
}: {
  params: Promise<SiteHomeParams>;
}): Promise<Metadata> {
  const site = await loadStoreHome(requestStorefront, await params);
  return storeHomeMetadataFor(site, { preview: true });
}

export default async function PreviewHomePage({
  params,
}: {
  params: Promise<SiteHomeParams>;
}) {
  const site = await loadStoreHome(requestStorefront, await params);
  const page = site?.builder?.page;
  if (!site?.store || !page) notFound();
  return (
    <BuilderPagePreview
      reads={requestStorefront}
      slug={site.slug}
      base={site.base}
      store={site.store}
      page={page}
    />
  );
}
