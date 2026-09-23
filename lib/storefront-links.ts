// coding-standard: maintained
import { ANCHOR_PATTERN } from "@/lib/storefront-builder/style-specs";

/**
 * Build a storefront link relative to the active store's public base path.
 *
 * Option A routing serves the same storefront tree from different bases depending
 * on the host: `/shop` on a tenant subdomain (`{slug}.ezycore.com/shop/…`) and
 * the root (`""`) on a custom domain. The internal route is always `/shop`, but
 * links must reflect the *public* base, which `proxy.ts` resolves per request and
 * exposes via the `x-ezy-store-base` header (see `lib/storefront-host.ts`).
 *
 *   storeHref("/shop")              → "/shop"
 *   storeHref("/shop", "/products") → "/shop/products"
 *   storeHref("", "/products")      → "/products"   (custom domain at root)
 *   storeHref("")                   → "/"
 */
export function storeHref(base: string, path = ""): string {
  if (!path || path === "/") return base || "/";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** Normalize an owner-entered link into a route relative to the active store. */
export function normalizeStoreLink(
  input?: string,
  fallback = "/products",
): string {
  const raw = input?.trim();
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith("//")) return fallback;

  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path === "/shop") return "/";
  if (path.startsWith("/shop/") || path.startsWith("/shop?") || path.startsWith("/shop#")) {
    path = path.slice(5) || "/";
  }
  return path;
}

/** Resolve the normalized link for a tenant base or a root custom domain. */
export function storeLinkHref(
  base: string,
  input?: string,
  fallback = "/products",
): string {
  const target = normalizeStoreLink(input, fallback);
  return /^https?:\/\//i.test(target) ? target : storeHref(base, target);
}

/**
 * Link to a campaign's landing page — `/campaigns/<slug>`.
 *
 * **The fallback is the point.** A campaign written before the landing page
 * existed has no slug until the backfill runs, and a product-scoped campaign had
 * no public URL at all before it: the promo strip and the deal cards used to
 * send every such shopper to `/products`, the whole catalogue, with nothing
 * saying which twenty things were actually on sale. Those links come here now,
 * and only a genuinely slugless campaign still falls back.
 */
export function campaignHref(
  base: string,
  campaign?: { slug?: string | null } | null,
): string {
  const slug = campaign?.slug?.trim();
  return slug
    ? storeHref(base, `/campaigns/${encodeURIComponent(slug)}`)
    : storeHref(base, "/products");
}

/**
 * Link to a collection page.
 *
 * A collection's canonical URL is its PATH — `/phones`, `/phones/accessories` —
 * so every category tile, nav row and footer link goes through here rather than
 * hand-building a `?categoryId=` facet. The query form still resolves for anyone
 * holding an old link, but it is no longer indexed and must not be emitted.
 *
 * A category with no `slugPath` (a legacy row predating the field) cannot route,
 * so it falls back to the unfiltered listing instead of producing a dead link.
 */
export function collectionHref(
  base: string,
  category: { slugPath?: string } | null | undefined,
): string {
  const path = category?.slugPath;
  if (!path) return storeHref(base, "/products");
  return storeHref(base, `/${path.split("/").map(encodeURIComponent).join("/")}`);
}

/** A phone or mail link, which the device opens as typed. */
const CONTACT_LINK = /^(tel:|mailto:)/i;

/**
 * A jump to another section of the same page, by the name the merchant gave it
 * on the Style tab. Kept exactly as typed: prefixing it with the store base
 * would turn "scroll down to the order form" into a page load of the catalogue,
 * which is what `storeLinkHref`'s fallback did to it before 2026-09-21.
 *
 * The pattern is the style box's own `ANCHOR_PATTERN`, so this accepts exactly
 * what a merchant can name a section.
 */
const ANCHOR_LINK = new RegExp(ANCHOR_PATTERN.replace("^", "^#"));

/**
 * A link a merchant typed into a hero slide or a builder section: like
 * `storeLinkHref`, except that a `tel:` or `mailto:` link is kept as typed.
 * `storeLinkHref` refuses every non-http scheme, which turned "call us" into a
 * link to the catalogue.
 */
export function merchantLinkHref(
  base: string,
  input?: string,
  fallback = "/products",
): string {
  const raw = input?.trim();
  if (raw && (CONTACT_LINK.test(raw) || ANCHOR_LINK.test(raw))) return raw;
  return storeLinkHref(base, input, fallback);
}
