// coding-standard: maintained
import type {
  CatalogCategory,
  ContentPageLink,
  StoreFooterContentPages,
  StoreFooterGroup,
  StoreFooterPaymentMethods,
  StoreFooterStyle,
  StorefrontStore,
} from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { footerLinkTarget, isFooterLinkComplete } from "@/lib/storefront-footer/links";
import type { useStorefrontUI } from "@/services/storefront/ui-context";

export type FooterT = ReturnType<typeof useStorefrontUI>["t"];

/** A resolved footer link (merchant link or an internal CMS page). */
export interface FooterLinkItem {
  key: string;
  label: string;
  href: string;
  /** Rendered as a plain `<a>` rather than a client-side `<Link>`. */
  external: boolean;
  newTab?: boolean;
}

/** One titled footer column (a merchant group or the content-pages block). */
export interface FooterColumn {
  key: string;
  title: string;
  links: FooterLinkItem[];
}

/**
 * One of the merchant's store promises, ready to draw. `icon` is as stored —
 * unset, a glyph, or `NO_ICON` — and resolved by `promiseIcon` with the
 * block's icon style, the same way the promises band resolves it.
 */
export interface FooterPromise {
  icon?: string;
  label: string;
}

/**
 * Shared props built once in `StoreFooter` and passed to each layout.
 *
 * Everything a layout renders arrives here, and **every string in it is either
 * the merchant's or a localized default** — there is no copy baked into a
 * layout body. That is the rule the 2026-08-11 rebuild exists to hold: a footer
 * that prints something the owner cannot change is a footer they will ask us to
 * change for them.
 */
export interface FooterProps {
  base: string;
  /** Needed by the sign-up form — it posts to this store's public endpoint. */
  slug: string;
  store?: StorefrontStore;
  t: FooterT;
  name: string;
  logo?: string;
  /** Logo height in px when the merchant set a footer logo; unset ⇒ the layout's. */
  logoHeight?: number;
  phone: string;
  /** Resolves `category` links to their collection path. */
  categories: CatalogCategory[];
  footerGroups: StoreFooterGroup[];
  /** Where enabled checkout methods should be advertised in the bottom bar. */
  footerPaymentMethods?: StoreFooterPaymentMethods;
  footerContentPages?: StoreFooterContentPages;
  /** The frame — colours, spacing, pictures, credit line. */
  footerStyle?: StoreFooterStyle;
  infoPages: ContentPageLink[];
  /** The merchant's store promises, blanks already dropped. */
  promises: FooterPromise[];
  /**
   * The brand paragraph, **already resolved** — `copy.footerText` if the
   * merchant wrote one, the localized default otherwise. Resolved in
   * `StoreFooter` rather than here because the live Customize draft has to win
   * over the saved value, and only that component sees the draft.
   */
  blurb: string;
  /** `copy.footerNote` — the bottom bar's right side. Blank ⇒ currency only. */
  note?: string;
  /** `copy.footerContactHeading` — Contact-first heading. Blank ⇒ localized. */
  contactHeading?: string;
  /** `copy.footerNewsletter` — sign-up copy. Blank fields ⇒ localized. */
  newsletter?: { heading?: string; blurb?: string; buttonLabel?: string };
}

/** Resolve one group's links, dropping any that have nowhere to go. */
export function groupLinks(
  group: StoreFooterGroup,
  base: string,
  categories: CatalogCategory[],
  keyPrefix: string,
): FooterLinkItem[] {
  return group.links.flatMap((link, li) => {
    if (!isFooterLinkComplete(link)) return [];
    const target = footerLinkTarget(base, link, categories);
    return target
      ? [{ key: `${keyPrefix}:${li}:${link.label}`, label: link.label, ...target }]
      : [];
  });
}

/** Each merchant footer group becomes its own column. */
export function groupColumns(
  groups: StoreFooterGroup[],
  base: string,
  categories: CatalogCategory[],
): FooterColumn[] {
  return groups.map((g, i) => ({
    key: `g${i}:${g.title}`,
    title: g.title,
    links: groupLinks(g, base, categories, String(i)),
  }));
}

/**
 * The auto content-pages column ("Information"), or `null` when the merchant
 * hid it or no pages are flagged for the footer. Heading override falls back to
 * the built-in localized label.
 */
export function contentPagesColumn(
  infoPages: ContentPageLink[],
  cfg: StoreFooterContentPages | undefined,
  base: string,
  fallbackTitle: string,
): FooterColumn | null {
  if (cfg?.show === false || infoPages.length === 0) return null;
  return {
    key: "info",
    title: cfg?.title?.trim() || fallbackTitle,
    links: infoPages.map((pg) => ({
      key: pg._id,
      label: pg.title,
      href: storeHref(base, `/pages/${pg.slug}`),
      external: false,
    })),
  };
}

/** Merchant groups followed by the content-pages column (when shown). */
export function footerColumns(props: FooterProps): FooterColumn[] {
  const info = contentPagesColumn(
    props.infoPages,
    props.footerContentPages,
    props.base,
    props.t.information,
  );
  const groups = groupColumns(props.footerGroups, props.base, props.categories);
  return info ? [...groups, info] : groups;
}
