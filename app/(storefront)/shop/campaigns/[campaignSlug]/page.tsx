import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStoreCampaign, getStoreProducts } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import {
  campaignQueryParams,
  catalogPage,
  catalogSearchParams,
  isIndexableCatalogUrl,
} from "@/lib/storefront-catalog-params";
import { SystemPage } from "@/components/storefront-builder/system-page";
import { CollectionPageView } from "@/components/storefront/collection/collection-page";
import { CollectionDataProvider } from "@/components/storefront/collection/collection-data";

/**
 * A campaign's own page — the shareable address a sale did not have.
 *
 * Campaigns could be scoped to the whole store, a category, a sub-category, a
 * tag or a hand-picked product list, and only the first four had anything a
 * merchant could link to (a collection path, a tag facet). A product-scoped
 * campaign — twenty items chosen out of eight categories, the common shape of a
 * real promotion — had no URL at all, so the promo strip and the deal cards sent
 * shoppers to `/products` and left them to find the discounts themselves. This
 * route is that URL, for every scope.
 *
 * The grid is the same `CollectionPageView` the catalogue and collection pages
 * render; only the scope differs (`?campaign=<slug>`, AND-ed onto the facets
 * server-side). So filters, sorting, pagination mode and layout can never drift
 * between a sale page and the rest of the shop.
 *
 * A static segment, so it wins over the `[...categoryPath]` catch-all — and
 * `campaigns` is in the backend's `RESERVED_STOREFRONT_SLUGS`, which is what
 * stops a merchant creating a category that would land here and be unreachable.
 */
export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PathParams = Promise<{ campaignSlug: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PathParams;
  searchParams: SearchParams;
}) {
  const { campaignSlug } = await params;
  const { slug } = await getStoreContext();
  const campaign = slug ? await getStoreCampaign(slug, campaignSlug) : null;
  if (!campaign) return {};

  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  // Same rule as every other catalogue view: the bare page is the landing page,
  // a filtered or paged slice of it is the same set re-cut. Two more cases are
  // left out, and the sitemap omits both for the same reasons:
  //
  //  - a campaign that has NOT OPENED yet — its prices are the everyday ones, so
  //    indexing it would put a "25% off" title on a full-price page;
  //  - a STOREWIDE campaign — it lists the entire catalogue, so its page is
  //    `/products` with a banner on top, and two indexable URLs over one product
  //    set compete with each other. The page still works and is still what the
  //    merchant shares; it just does not enter the index.
  const indexable =
    campaign.live &&
    campaign.scope !== "storewide" &&
    isIndexableCatalogUrl(sp, catalogPage(raw.page));

  return storePageMetadata({
    title: campaign.name,
    description: campaign.subtitle || undefined,
    path: indexable ? `/campaigns/${encodeURIComponent(campaign.slug)}` : undefined,
    index: indexable,
    follow: true,
    image: campaign.banner?.url,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: PathParams;
  searchParams: SearchParams;
}) {
  const { campaignSlug } = await params;
  const { slug } = await getStoreContext();
  if (!slug) notFound();

  // Unknown slug, a sale that has ended, or one the merchant switched off. A 404
  // rather than an empty grid or the full catalogue: a promo link that outlived
  // its campaign has to say so, not quietly show everyday prices under a banner
  // promising a discount.
  const campaign = await getStoreCampaign(slug, campaignSlug);
  if (!campaign) notFound();

  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  // Seeds the client's cache with the page `?page=` asked for, through the same
  // builder the view calls — the params object IS the cache key.
  const page = catalogPage(raw.page);
  const products = await getStoreProducts(
    slug,
    campaignQueryParams(campaign.slug, sp, page),
  );

  const data = {
    initialProducts: products ?? undefined,
    initialPage: page,
    campaign,
  };
  return (
    <CollectionDataProvider value={data}>
      {/* The campaign's OWN builder page when the merchant made one — its core
          section draws exactly the view below, so opting in changes nothing
          until they edit it. Most campaigns have no page, and `SystemPage` then
          renders these children, which is the normal answer rather than an
          error. Deliberately NOT the collection system page: a sale page is not
          a collection, and a merchant's collection sections (a size guide, a
          delivery promise) do not belong on every campaign by default. */}
      <SystemPage path={`/campaigns/${campaign.slug}`}>
        <CollectionPageView {...data} />
      </SystemPage>
    </CollectionDataProvider>
  );
}
