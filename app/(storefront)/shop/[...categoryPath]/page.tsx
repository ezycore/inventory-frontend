import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import {
  getStore,
  getStoreCategoryByPath,
  getStoreProducts,
} from "@/lib/storefront-server";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { storeHref } from "@/lib/storefront-links";
import { breadcrumbJsonLd } from "@/lib/storefront-jsonld";
import { collectionCrumbs } from "@/lib/storefront-breadcrumb";
import { JsonLd } from "@/components/storefront/json-ld";
import { storePageMetadata } from "@/lib/storefront-metadata";
import {
  catalogPage,
  catalogSearchParams,
  categoryPathQueryParams,
  isIndexableCatalogUrl,
} from "@/lib/storefront-catalog-params";
import { SystemPage } from "@/components/storefront-builder/system-page";
import { CollectionPageView } from "@/components/storefront/collection/collection-page";
import { CollectionDataProvider } from "@/components/storefront/collection/collection-data";

/**
 * Collection pages at real paths: `/phones` and `/phones/accessories`.
 *
 * A **catch-all**, so it sits below every static segment in Next's routing
 * precedence — `/cart`, `/checkout`, `/products`, `/search`, `/account`,
 * `/orders`, `/pages`, `/t` all still win. That is why the backend refuses a
 * category whose slug would collide with one of them
 * (`RESERVED_STOREFRONT_SLUGS`): such a category would not break the route, it
 * would simply be unreachable, silently.
 *
 * The grid itself is the same component `/products` renders — see the note on
 * `CollectionInner`. Only the source of the collection differs.
 */
export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PathParams = Promise<{ categoryPath: string[] }>;

/** Two levels, never more. `phones/accessories/cables` is not a page. */
const MAX_DEPTH = 2;

const joinPath = (segments: string[]) =>
  segments.map((s) => decodeURIComponent(s)).join("/");

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PathParams;
  searchParams: SearchParams;
}) {
  const { categoryPath } = await params;
  if (!categoryPath?.length || categoryPath.length > MAX_DEPTH) return {};

  const { slug } = await getStoreContext();
  const path = joinPath(categoryPath);
  const collection = slug ? await getStoreCategoryByPath(slug, path) : null;
  if (!collection) return {};

  // The bare collection URL is the canonical landing page. Any filter on top —
  // price, stock, sort, tags — is the same set re-sliced, and page 2+ is that
  // same page deeper in, so those are `noindex, follow` and get no canonical at
  // all (see `storePageMetadata`).
  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  const indexable =
    isIndexableCatalogUrl(sp, catalogPage(raw.page)) && !sp.brandId;

  return storePageMetadata({
    // Merchant SEO overrides win; else the collection's display name and its
    // description — same precedence as the product page.
    title: collection.seo?.title || collection.name,
    description: collection.seo?.description || collection.description || undefined,
    path: indexable ? `/${collection.slugPath}` : undefined,
    index: indexable,
    follow: true,
    image: collection.image?.url,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: PathParams;
  searchParams: SearchParams;
}) {
  const { categoryPath } = await params;
  if (!categoryPath?.length || categoryPath.length > MAX_DEPTH) notFound();

  const { slug, base, origin } = await getStoreContext();
  if (!slug) notFound();

  const path = joinPath(categoryPath);
  const collection = await getStoreCategoryByPath(slug, path);
  // Unknown path, or one whose parent is hidden. A 404 rather than an empty
  // grid: a mistyped collection URL must not look like a store with no stock.
  if (!collection) notFound();

  const raw = await searchParams;
  const sp = catalogSearchParams(raw);
  // Seeds the client's query cache with the page `?page=` asked for, so the grid
  // is real HTML rather than a skeleton — including on a Back into page 3. The
  // params object IS the cache key, so it is built by the same helper `view.tsx`
  // calls — see `lib/storefront-catalog-params.ts`.
  const page = catalogPage(raw.page);
  const [products, store] = await Promise.all([
    getStoreProducts(
      slug,
      categoryPathQueryParams(collection.slugPath ?? path, sp, page),
    ),
    getStore(slug),
  ]);

  // The breadcrumb mirrors the trail the page renders, and must use the SAME
  // absolute origin as `<link rel="canonical">` — the store's own domain when it
  // has one, not whichever host served this request.
  const target = canonicalTarget(store, { origin, base });
  const abs = (p: string) =>
    target.origin ? `${target.origin}${storeHref(target.base, p)}` : "";
  // A sub-category's parent is a real page, so it earns a crumb —
  // `collectionCrumbs` handles that, and the view renders the SAME array as
  // visible markup, so the two cannot drift.
  const crumbs = [
    { name: store?.name ?? "", path: "" },
    ...collectionCrumbs(collection),
  ];
  const trail =
    store && target.origin
      ? crumbs.map((c) => ({ name: c.name, url: abs(c.path) }))
      : null;

  const data = {
    initialProducts: products ?? undefined,
    initialPage: page,
    collection,
    crumbs,
  };
  return (
    <>
      {trail ? <JsonLd data={breadcrumbJsonLd(trail)} /> : null}
      {/* The same collection system page as `/products`: one page for every
          collection, so a section a merchant adds appears on all of them. */}
      <CollectionDataProvider value={data}>
        <SystemPage path="/products">
          <CollectionPageView {...data} />
        </SystemPage>
      </CollectionDataProvider>
    </>
  );
}
