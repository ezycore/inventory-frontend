// coding-standard: maintained
import type { ProductFeed, ProductFeedItem } from "@/types/api";

/**
 * The product feed as Google product RSS 2.0 (backend `docs/plan/product-feed.md`) — the one
 * format Facebook/Instagram catalogs, Google Merchant Center, TikTok and Pinterest all read.
 *
 * Pure: the route resolves the store and its canonical origin, this only writes the document.
 * Links are built here because only the request knows whether the store is served at the root
 * (custom domain) or under `/shop` — the same split as `app/sitemap.ts`.
 */

/** Characters XML 1.0 does not allow at all, even escaped — a pasted description can carry them. */
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export const escapeXml = (value: string): string =>
  value
    .replace(INVALID_XML, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const tag = (name: string, value: string | undefined): string =>
  value ? `<${name}>${escapeXml(value)}</${name}>` : "";

/** "450.00 BDT" — the price form every reader accepts. */
const money = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

/**
 * "in stock" / "out of stock", spaced: Meta documents the spaced form and Google accepts both.
 */
const AVAILABILITY: Record<ProductFeedItem["availability"], string> = {
  in_stock: "in stock",
  out_of_stock: "out of stock",
};

const itemXml = (
  item: ProductFeedItem,
  feed: ProductFeed,
  productUrl: (slug: string) => string,
): string => {
  const [main, ...more] = item.images;
  return [
    "<item>",
    tag("g:id", item.id),
    tag("g:item_group_id", item.groupId),
    tag("g:title", item.title),
    tag("g:description", item.description),
    tag("g:link", productUrl(item.slug)),
    tag("g:image_link", main),
    ...more.map((url) => tag("g:additional_image_link", url)),
    tag("g:availability", AVAILABILITY[item.availability]),
    tag("g:price", money(item.price, feed.currency)),
    item.salePrice != null ? tag("g:sale_price", money(item.salePrice, feed.currency)) : "",
    tag("g:condition", "new"),
    // Meta requires a brand (or a barcode); a shop's own goods are its own brand.
    tag("g:brand", item.brand || feed.storeName),
    tag("g:product_type", item.category),
    // Merchants here rarely have GTINs; without this Google flags every item as missing one.
    tag("g:identifier_exists", "no"),
    "</item>",
  ].join("");
};

export function productFeedXml(
  feed: ProductFeed,
  opts: { homeUrl: string; productUrl: (slug: string) => string },
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    tag("title", feed.storeName),
    tag("link", opts.homeUrl),
    tag("description", `Products from ${feed.storeName}`),
    ...feed.items.map((item) => itemXml(item, feed, opts.productUrl)),
    "</channel>",
    "</rss>",
  ].join("\n");
}
