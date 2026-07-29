import { notFound } from "next/navigation";
import { getStoreContext } from "@/lib/storefront-host";
import { getStore, getStoreProduct } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/storefront-jsonld";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { JsonLd } from "@/components/storefront/json-ld";
import { storeHref } from "@/lib/storefront-links";
import View from "./view";

// Host-resolved (dynamic render); the product itself is cached via the
// fetch-level `revalidate` in lib/storefront-server.ts.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const { slug } = await getStoreContext();
  const product = slug ? await getStoreProduct(slug, productSlug) : null;
  return storePageMetadata({
    // Merchant SEO overrides win; else the (online) title / description.
    title: product?.seo?.title || product?.name || "Product",
    description:
      product?.seo?.description ||
      product?.description?.slice(0, 200) ||
      undefined,
    path: `/products/${productSlug}`,
    image: product?.images?.[0]?.url || product?.images?.[0]?.mediumUrl,
  });
}

/**
 * Fetches the product on the server and hands it to the client view as query
 * `initialData`, so the name, price, description and images are in the SSR HTML.
 * The view is a client component (cart, variant selection, wishlist) and used to
 * render only a spinner until hydration — correct `<head>`, empty `<body>`, which
 * is worthless to any crawler that does not execute JavaScript.
 *
 * This is the same fetch `generateMetadata` already made, so it is served from
 * the request-level fetch cache rather than costing a second round trip.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const { slug, base, origin } = await getStoreContext();
  const [product, store] = await Promise.all([
    slug ? getStoreProduct(slug, productSlug) : null,
    slug ? getStore(slug) : null,
  ]);

  // Real 404, not a 200 saying "not found" — but only when the store payload came
  // back, which proves the API is reachable. `getStoreServer` helpers return null
  // for *any* failure, so without that guard a backend blip would tell crawlers a
  // live product is permanently gone. Store present + product null = genuinely gone.
  if (store && !product) notFound();

  // Product + Offer is what puts a price and a stock state in the search result;
  // the breadcrumb mirrors the trail the page renders. Both must use the SAME
  // absolute URL as `<link rel="canonical">` — the store's own domain when it has
  // one, not the host that served this request.
  const target = canonicalTarget(store, { origin, base });
  const abs = (path: string) =>
    target.origin ? `${target.origin}${storeHref(target.base, path)}` : "";
  const url = abs(`/products/${productSlug}`);
  const jsonLd =
    product && store && url
      ? [
          productJsonLd({ product, store, url }),
          breadcrumbJsonLd([
            { name: store.name, url: abs("") },
            { name: "Products", url: abs("/products") },
            { name: product.name, url },
          ]),
        ]
      : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <View initialProduct={product ?? undefined} />
    </>
  );
}
