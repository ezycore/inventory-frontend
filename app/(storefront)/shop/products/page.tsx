import { getStoreContext } from "@/lib/storefront-host";
import { getStore, getStoreProducts } from "@/lib/storefront-server";
import { defaultSortOf } from "@/lib/storefront-filters";
import { storePageMetadata } from "@/lib/storefront-metadata";
import {
  catalogCanonicalQuery,
  catalogPage,
  catalogQueryParams,
  catalogSearchParams,
  isIndexableCatalogUrl,
} from "@/lib/storefront-catalog-params";
import { SystemPage } from "@/components/storefront-builder/system-page";
import { CollectionDataProvider } from "@/components/storefront/collection/collection-data";

// Host-resolved (dynamic render); the product list is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  // Filter/sort combinations are the same catalogue re-sliced, and page 2+ is the
  // same landing page deeper in; only a plain first page or a single brand facet
  // earns an index slot. Non-indexable URLs get no canonical at all (see
  // `storePageMetadata`) — just `noindex, follow`.
  const indexable = isIndexableCatalogUrl(sp, catalogPage(raw.page));
  return storePageMetadata({
    title: "All products",
    path: indexable ? `/products${catalogCanonicalQuery(sp)}` : undefined,
    index: indexable,
    follow: true,
  });
}

/**
 * Fetches the first page of results server-side and seeds the client view's query
 * cache, so the grid is real HTML instead of a skeleton. Params are built by the
 * shared `catalogQueryParams` because the params object *is* the cache key — see
 * `lib/storefront-catalog-params.ts`.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  // The cursor lives in the URL, so the server seeds the page the shopper is
  // actually asking for — a `?page=3` reload (or a Back into one) must render
  // page 3 as HTML, not page 1 followed by a client-side correction.
  const page = catalogPage(raw.page);
  const { slug } = await getStoreContext();
  // The merchant's default sort decides page 1's order, so the seed needs it —
  // the store read is the one the layout already made (cached).
  const store = slug ? await getStore(slug) : null;
  const products = slug
    ? await getStoreProducts(
        slug,
        catalogQueryParams({ ...sp, defaultSort: defaultSortOf(store) }, page),
      )
    : null;
  // The route owns the fetch (it owns the URL, the cache key and the seeded
  // page); the provider hands it to the core section when this page is on the
  // builder, and to the view directly when it is not.
  const data = { initialProducts: products ?? undefined, initialPage: page };
  return (
    <CollectionDataProvider value={data}>
      <SystemPage path="/products" />
    </CollectionDataProvider>
  );
}
