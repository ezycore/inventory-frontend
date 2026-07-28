import { getStoreContext } from "@/lib/storefront-host";
import { getStoreProducts } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import {
  catalogCanonicalQuery,
  catalogQueryParams,
  catalogSearchParams,
  isIndexableCatalogUrl,
} from "@/lib/storefront-catalog-params";
import View from "./view";

// Host-resolved (dynamic render); the product list is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = catalogSearchParams(await searchParams);
  // Filter/sort combinations are the same catalogue re-sliced; only a plain listing
  // or a single category/brand facet earns an index slot. Non-indexable URLs get no
  // canonical at all (see `storePageMetadata`) — just `noindex, follow`.
  const indexable = isIndexableCatalogUrl(sp);
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
  const sp = catalogSearchParams(await searchParams);
  const { slug } = await getStoreContext();
  const products = slug
    ? await getStoreProducts(slug, catalogQueryParams(sp))
    : null;
  return <View initialProducts={products ?? undefined} />;
}
