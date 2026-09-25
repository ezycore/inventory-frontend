// coding-standard: maintained
/**
 * The storefront footer's data shapes — one declaration for the admin editor
 * (`@/types` re-exports these) and the shopper side (`lib/storefront-client.ts`
 * aliases them), because a field added to one copy and not the other is how a
 * setting saves and never renders.
 *
 * Mirrors the backend's `StorefrontNav` footer fields
 * (`inventory-backend/src/types/storefront-settings.types.ts`). Plan:
 * `docs/plan/storefront-footer-builder.md`.
 */

/** An uploaded picture, as the storefront image endpoint returns it. */
export interface FooterImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  publicId?: string;
}

/** Where a footer link points. Unset is a legacy `{ label, url }` row. */
export type FooterLinkType = "url" | "page" | "category";

/**
 * One footer link.
 *
 * `url` is the pre-2026-09-25 shape and is still read: a row saved before
 * links were typed has only `label` + `url`, and is a `url` link. New rows
 * carry `type` + `value`, the header menu's own vocabulary.
 */
export interface StorefrontFooterLink {
  label: string;
  type?: FooterLinkType;
  /** Category path, page slug, or the typed URL — per `type`. */
  value?: string;
  /** Legacy — the only target a row saved before `type` existed has. */
  url?: string;
  /** Open in a new tab. Honoured for absolute links only. */
  newTab?: boolean;
}

export interface StorefrontFooterGroup {
  title: string;
  links: StorefrontFooterLink[];
}

/**
 * Owner controls for the auto content-pages footer column (published pages
 * flagged "Show in footer"). Absent ⇒ shown with the built-in "Information"
 * heading, so existing stores are unaffected.
 */
export interface StorefrontFooterContentPages {
  /** `false` hides the column entirely; absent/`true` ⇒ shown. */
  show?: boolean;
  /** Heading override; blank ⇒ the built-in localized "Information" label. */
  title?: string;
}

/** Responsive visibility for the enabled payment-method badges in the footer. */
export interface StorefrontFooterPaymentMethods {
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}

/** A value with an optional phone override — the builder's `{ base, mobile? }`. */
export interface FooterResponsive<T> {
  base?: T;
  mobile?: T;
}

export const FOOTER_GROUNDS = ["card", "surface", "brand", "dark", "custom"] as const;
export type FooterGround = (typeof FOOTER_GROUNDS)[number];

export const FOOTER_TONES = ["auto", "light", "dark"] as const;
export type FooterTone = (typeof FOOTER_TONES)[number];

export const FOOTER_SPACINGS = ["compact", "regular", "roomy"] as const;
export type FooterSpacing = (typeof FOOTER_SPACINGS)[number];

export const FOOTER_BOTTOM_ALIGNS = ["spread", "center"] as const;
export type FooterBottomAlign = (typeof FOOTER_BOTTOM_ALIGNS)[number];

export const FOOTER_PHONE_GROUPS = ["open", "first", "closed"] as const;
/** How link groups start on a phone. Desktop always shows them. */
export type FooterPhoneGroups = (typeof FOOTER_PHONE_GROUPS)[number];

/**
 * The footer's frame — colours, spacing, pictures and the credit line.
 *
 * Lives on `nav`, NOT `theme`: applying a ready-made theme replaces `theme`
 * wholesale (backend `storefront-settings.service.ts`), and a merchant's
 * uploaded footer logo must not vanish because they tried a new look.
 *
 * Every field optional, and every unset field draws the footer exactly as it
 * was before this existed.
 */
export interface StorefrontFooterStyle {
  /** Unset ⇒ `card`, the pre-existing ground. */
  ground?: FooterGround;
  /** Hex colour for `ground: "custom"`. */
  color?: string;
  /** Text colour. `auto` picks from the ground. */
  tone?: FooterTone;
  /** Unset ⇒ `regular`, the pre-existing padding. */
  spacing?: FooterResponsive<FooterSpacing>;
  /** Centre the blocks (block layout only). Unset ⇒ start. */
  align?: "start" | "center";
  /** Unset ⇒ shown. */
  topBorder?: boolean;
  /** Unset ⇒ `open`, the pre-existing behaviour. */
  phoneGroups?: FooterPhoneGroups;
  /** The © line's arrangement. Unset ⇒ the layout's own. */
  bottomAlign?: FooterResponsive<FooterBottomAlign>;
  /** The "Powered by EzyCore" credit. Unset ⇒ shown. */
  showPoweredBy?: boolean;
  /** A footer-only logo (e.g. a light mark on a dark footer). Unset ⇒ the store logo. */
  logo?: FooterImage | null;
  /** Logo height in px, 18–60. */
  logoHeight?: number;
  bgImage?: FooterImage | null;
  /** Crop anchor, percent of the image's own box. */
  bgFocal?: { x: number; y: number };
  /** Readability overlay over `bgImage`, 0–90 percent. */
  overlay?: number;
}

export const FOOTER_BLOCK_TYPES = [
  "brand",
  "links",
  "pages",
  "contact",
  "newsletter",
  "promises",
  "text",
  "image",
  "logos",
  "social",
] as const;
export type FooterBlockType = (typeof FOOTER_BLOCK_TYPES)[number];

export const FOOTER_BLOCK_WIDTHS = ["auto", "narrow", "wide", "full"] as const;
/** Desktop track: content-sized, ~280px, flexible, or a whole row. Phones stack. */
export type FooterBlockWidth = (typeof FOOTER_BLOCK_WIDTHS)[number];

export interface FooterLogo {
  image: FooterImage;
  alt: string;
  url?: string;
}

/**
 * One block of a composed footer. One flat shape rather than a union per type:
 * the editor switches a block's fields by `type`, and the backend validates the
 * same flat object (`footerBlockSchema`).
 */
export interface StorefrontFooterBlock {
  /** Stable key for the editor and React — never shown. */
  id: string;
  type: FooterBlockType;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  width?: FooterBlockWidth;
  /** Heading — a links group's title, or an optional one on text/logos/social/pages. */
  title?: string;
  /** `links`. */
  links?: StorefrontFooterLink[];
  /** `brand`: show the about text. Unset ⇒ shown. */
  showAbout?: boolean;
  /** `brand`: show the call line. Unset ⇒ shown. */
  showPhone?: boolean;
  /** `brand`: show social icons. Unset ⇒ shown. */
  showSocial?: boolean;
  /** `text`: rich-doc JSON. */
  body?: string;
  /** `image`. */
  image?: FooterImage | null;
  alt?: string;
  url?: string;
  /** `image`: max width in px, 60–600. */
  maxWidth?: number;
  /** `logos`. */
  logos?: FooterLogo[];
  /** `logos`: logo height in px, 20–64. */
  logoHeight?: number;
}

export const FOOTER_BLOCKS_MAX = 12;
export const FOOTER_LOGOS_MAX = 12;
export const FOOTER_TEXT_MAX_BYTES = 8000;
