// coding-standard: maintained
import type { CatalogProduct, StorefrontStore } from "@/lib/storefront-client";
import { fullImageUrl } from "@/lib/storefront-image";
import { richDocToPlainText } from "@/lib/storefront-rich-doc";

/**
 * schema.org structured data for the storefront.
 *
 * This is what turns a plain blue link into a result carrying a price, a stock
 * state and a breadcrumb trail. Everything here is derived from data the store
 * payload already carries — no new endpoint, no merchant input.
 *
 * Pure builders (tested in `storefront-jsonld.test.ts`); `<JsonLd>`
 * (`components/storefront/json-ld.tsx`) does the rendering.
 *
 * **Never emit a field you cannot substantiate.** Structured data that disagrees
 * with the visible page is a manual-action risk, so a null price emits no offer
 * at all rather than a zero, and fields the payload lacks (sku, mpn, brand,
 * ratings) are simply absent — inventing them would be worse than omitting them.
 */

/** JSON-LD is an open vocabulary; nodes are heterogeneous by nature. */
export type JsonLdNode = Record<string, unknown>;

const DEFAULT_CURRENCY = "BDT";

/** Drop undefined/null/empty entries so no key is emitted without a real value. */
function compact(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(([, v]) => {
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }),
  );
}

/** schema.org availability for the storefront's three stock behaviours. */
function availabilityOf(product: CatalogProduct): string {
  const inStock = (product.availableQuantity ?? 0) > 0;
  if (inStock) return "https://schema.org/InStock";
  // "backorder" keeps the buy button live past zero — that is BackOrder, not OutOfStock.
  return product.outOfStockBehavior === "backorder"
    ? "https://schema.org/BackOrder"
    : "https://schema.org/OutOfStock";
}

/** Absolute, de-duplicated image URLs — schema.org requires crawlable URLs. */
function imageUrls(product: CatalogProduct): string[] {
  const urls = product.images
    .map((i) => fullImageUrl(i))
    .filter((u): u is string => !!u && /^https?:\/\//.test(u));
  return [...new Set(urls)];
}

/**
 * `Product` + its offer. A variable product prices per variant, so it emits an
 * `AggregateOffer` spanning the cheapest and dearest option; a single product
 * emits one `Offer`. A product whose price is null emits neither — an offer
 * without a price is invalid, and a zero would be a lie.
 */
export function productJsonLd(opts: {
  product: CatalogProduct;
  store: StorefrontStore;
  /** Absolute canonical URL of the product page. */
  url: string;
}): JsonLdNode {
  const { product, store, url } = opts;
  const currency = store.currency || DEFAULT_CURRENCY;
  const availability = availabilityOf(product);

  // Variable products carry their prices per variant and leave `product.price`
  // null, so the variants are the authoritative source when present — reading
  // `product.price` first would emit no offer at all for a one-variant product.
  const variantPrices = (product.variants ?? [])
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number");
  const prices = variantPrices.length
    ? variantPrices
    : typeof product.price === "number"
      ? [product.price]
      : [];

  let offers: JsonLdNode | undefined;
  if (prices.length > 1) {
    offers = compact({
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability,
      url,
    });
  } else if (prices.length === 1) {
    offers = compact({
      "@type": "Offer",
      priceCurrency: currency,
      price: prices[0],
      availability,
      url,
    });
  }

  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    // Flattened first: `description` is rich-doc JSON since the consolidation,
    // and `.slice()` on the raw string used to emit `{"type":"doc","content":[{"ty`
    // to Google. `richDocToPlainText` returns legacy plain-text values unchanged.
    description: richDocToPlainText(product.description).slice(0, 500) || undefined,
    image: imageUrls(product),
    url,
    offers,
  });
}

/**
 * The store as an `Organization`. `sameAs` is how a search engine ties the shop
 * to its social profiles, and the contact block is what a local-business result
 * is built from — so both are emitted whenever the merchant has filled them in.
 */
export function storeJsonLd(opts: {
  store: StorefrontStore;
  /** Absolute URL of the store home page. */
  url: string;
}): JsonLdNode {
  const { store, url } = opts;
  const logo = store.logo?.url || store.logo?.mediumUrl;
  const sameAs = [
    store.social?.facebook,
    store.social?.instagram,
    store.social?.whatsapp,
  ].filter((u): u is string => !!u && /^https?:\/\//.test(u));

  const address = store.contact?.address?.trim();

  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url,
    logo,
    image: store.banner?.url || logo,
    description: store.seo?.description,
    email: store.contact?.email,
    telephone: store.contact?.phone,
    address: address
      ? { "@type": "PostalAddress", streetAddress: address }
      : undefined,
    sameAs,
  });
}

/**
 * `BreadcrumbList` from the trail the page actually shows. Order matters — the
 * `position` values must ascend from the site root, or the trail is rejected.
 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
