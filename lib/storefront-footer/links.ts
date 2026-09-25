// coding-standard: maintained
import type { CatalogCategory } from "@/lib/storefront-client";
import { collectionHref, storeHref, storeLinkHref } from "@/lib/storefront-links";
import { findCategory } from "@/lib/storefront-menu";
import type { StorefrontFooterLink } from "./types";

/** A footer link resolved to somewhere a shopper can go. */
export interface FooterLinkTarget {
  href: string;
  /** Leaves the storefront (or the page) — rendered as a plain `<a>`, not `<Link>`. */
  external: boolean;
  newTab: boolean;
}

const ABSOLUTE = /^https?:\/\//i;
/** `tel:`/`mailto:` open on the device as typed. */
const DEVICE_LINK = /^(tel:|mailto:)/i;
/**
 * A bare domain as people type one — `facebook.com/shop`, `wa.me/880…`. Stored
 * as-is it is a RELATIVE href, which sent shoppers to a 404 on the merchant's
 * own shop; `social-links.tsx` fixed the same bug for the social icons.
 */
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(?=$|[/?#:])/i;

/** The target a link row stores, whichever shape it was saved in. */
export function footerLinkValue(link: StorefrontFooterLink): string {
  return (link.value ?? link.url ?? "").trim();
}

/** A link row's type — a legacy `{ label, url }` row is a `url` link. */
export function footerLinkType(link: StorefrontFooterLink): NonNullable<StorefrontFooterLink["type"]> {
  return link.type ?? "url";
}

/** Is this link row complete enough to publish? Blank rows are dropped, never drawn as `#`. */
export function isFooterLinkComplete(link: StorefrontFooterLink): boolean {
  return !!link.label?.trim() && !!footerLinkValue(link);
}

/** Resolve a typed URL. `null` for a scheme the storefront will not link to. */
function urlTarget(base: string, raw: string, newTab: boolean): FooterLinkTarget | null {
  if (ABSOLUTE.test(raw)) return { href: raw, external: true, newTab };
  if (raw.startsWith("//")) return { href: `https:${raw}`, external: true, newTab };
  if (DEVICE_LINK.test(raw)) return { href: raw, external: true, newTab: false };
  if (raw.startsWith("#")) return { href: raw, external: true, newTab: false };
  if (!raw.startsWith("/") && BARE_DOMAIN.test(raw)) {
    return { href: `https://${raw}`, external: true, newTab };
  }
  // Any other scheme (`javascript:`, `data:`…) is refused rather than linked.
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) return null;
  return { href: storeLinkHref(base, raw), external: false, newTab: false };
}

/**
 * Where one footer link goes, or `null` when it has nowhere to go.
 *
 * Internal targets go through the store base, so a path works on a subdomain,
 * a custom domain and the `/shop/<slug>` preview alike. A category that no
 * longer exists lands on the full listing, the header menu's rule.
 */
export function footerLinkTarget(
  base: string,
  link: StorefrontFooterLink,
  categories: CatalogCategory[],
): FooterLinkTarget | null {
  const value = footerLinkValue(link);
  if (!value) return null;
  const newTab = !!link.newTab;
  switch (footerLinkType(link)) {
    case "page":
      return { href: storeHref(base, `/pages/${encodeURIComponent(value)}`), external: false, newTab: false };
    case "category": {
      const category = findCategory(categories, value);
      return {
        href: category ? collectionHref(base, category) : storeHref(base, "/products"),
        external: false,
        newTab: false,
      };
    }
    default:
      return urlTarget(base, value, newTab);
  }
}
