// coding-standard: maintained
/**
 * Storefront client — a light fetch wrapper for the PUBLIC storefront API
 * (`/api/storefront/{slug}`). Separate from `lib/api-client.ts`: it carries the
 * SHOPPER token (not the staff token) and never sends `X-Active-Location`.
 */

import {
  previewApiHeaders,
  storefrontPreviewToken,
} from "@/lib/storefront-preview";
import type { CourierNormalizedStatus } from "@/lib/courier-status";
import type { StoreFocalPoint } from "@/lib/storefront-focal";
import type { ContactButtonPage, ContactChannelKind } from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface StorefrontImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
}

/**
 * One homepage section instance on the public payload.
 *
 * A bare section id until 2026-08-15. It carries identity now because a flat id
 * list cannot hold two instances of one section with different content — two
 * product rows drawing from different collections is the case — and because
 * per-section config joins on `key`.
 */
export interface StoreHomeSection {
  key: string;
  type: string;
}

/**
 * Per-instance config for one homepage section, joined on `key`.
 *
 * A SIBLING of `theme` on the payload, never inside it — a ready-made theme
 * replaces `theme` wholesale, and the collection a merchant chose for their
 * front page is content, not look. See `lib/storefront-sections.ts`.
 */
export interface StoreSectionConfig {
  key: string;
  source?: "featured" | "newest" | "category";
  categoryId?: string;
  title?: string;
  limit?: number;
  /**
   * Tags this row renders, in the merchant's order. Read only by `age-chips`.
   *
   * Ids, never names: the section shipped matching an English list against tag
   * NAMES, so renaming `0-3M` or translating it to Bangla silently dropped the
   * chip. Unset ⇒ that name-matching fallback still applies.
   */
  tagIds?: string[];
}

/**
 * Owner overrides for how the uploaded logo is drawn (Customize → Brand).
 *
 * A transparent wordmark is one ink colour and the storefront has two
 * backgrounds, so black type vanishes on the dark theme and white type on the
 * light one — nothing in the file says which you have, so the owner names a
 * backdrop instead of the storefront guessing. Every field absent ⇒ unchanged:
 * no backdrop, the placement's own height, no padding, square corners.
 */
export interface StoreLogoStyle {
  background?: string;
  height?: number;
  padding?: number;
  radius?: number;
}

/** Owner layout for homepage category rows (Customize → Home page). */
export interface StoreHomeCollections {
  /** `strip` = the scrolling chip row (default); `grid` = equal columns. */
  layout?: "strip" | "grid";
  /** Columns per row in `grid` (2–6). Ignored by `strip`. */
  columns?: number;
  align?: "left" | "center" | "right";
  /**
   * `false` draws the row as pictures only. Honored ONLY when every listed
   * category has an image — a nameless letter tile is not a wayfinding target,
   * so the storefront keeps the names rather than shipping one. Unset ⇒ shown.
   */
  showLabels?: boolean;
}

/** One home-page hero slide (owner-managed carousel). */
export interface StoreHeroSlide {
  image?: StorefrontImage | null;
  /** Crop anchor for narrow boxes; unset = centre. See `storefront-focal.ts`. */
  focal?: StoreFocalPoint;
  /** How this slide's photo fills the hero; unset = show the whole photo. */
  imageFit?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
}

/**
 * Owner overrides for the static banner hero's copy (Classic / Hero Split).
 * Unset fields fall back to the built-in localized copy; button links default
 * to /products. Links are store paths or full URLs (same rules as slide links).
 */
export interface StoreHeroBanner {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryLink?: string;
  secondaryLabel?: string;
  secondaryLink?: string;
  /** How the banner photo fills its frame; unset = show the whole photo. */
  imageFit?: string;
  /** Crop anchor for the banner; unset = centre. See `storefront-focal.ts`. */
  focal?: StoreFocalPoint;
}

/** One channel on the public payload — `value` is resolved, `enabled` is gone. */
export interface StoreContactChannel {
  kind: ContactChannelKind;
  value: string;
  label?: string;
}

/** The launcher as the public store payload carries it (see `contactButton`). */
export interface StoreContactButton {
  label?: string;
  greeting?: string;
  position: "right" | "left";
  showOn?: ContactButtonPage[];
  channels: StoreContactChannel[];
  hours?: {
    enabled: boolean;
    days?: number[];
    from?: string;
    to?: string;
    offlineNote?: string;
  };
  nudge?: { enabled: boolean; delaySeconds?: number; text?: string };
}

export interface StorefrontStore {
  name: string;
  slug: string;
  currency?: string;
  /**
   * The store's active custom domain when it has one — the single host every
   * public URL should be canonical against, so a shop live on both its own
   * domain and `{slug}.ezycore.com/shop` is not indexed twice. Null ⇒ use the
   * serving host. Always go through `canonicalTarget` (lib/storefront-canonical.ts).
   */
  canonicalHost?: string | null;
  logo?: StorefrontImage | null;
  /**
   * Tab icon, already resolved server-side (backend `getStoreInfo`) so nothing
   * here chains. Org-level and deliberately NOT derived from `logo`: a store
   * whose owner never set one shows the platform default rather than a wordmark
   * cover-cropped to a square. Null ⇒ render no `<link rel="icon">` at all and
   * let the browser's implicit /favicon.ico request answer.
   */
  favicon?: StorefrontImage | null;
  banner?: StorefrontImage | null;
  /**
   * Share-card image, already resolved server-side through
   * socialImage → banner → logo. Chained there, like `favicon` is not, because
   * every fallback is a real image the merchant owns — there is no platform
   * default worth showing, and re-deriving the chain in each `generateMetadata`
   * is how the three of them drift apart.
   */
  socialImage?: StorefrontImage | null;
  contact?: { email?: string; phone?: string; address?: string };
  social?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    profiles?: { platform: string; url: string }[];
  };
  /**
   * Floating chat launcher. **Presence is enabled** — the backend omits the
   * whole block when the merchant has it off or no channel resolves to a usable
   * number, so there is no `enabled` flag to check and an unpublished number
   * never reaches this payload. `channels[].value` is already resolved (a blank
   * override has fallen back to `social.whatsapp` server-side).
   */
  contactButton?: StoreContactButton;
  seo?: { title?: string; description?: string };
  theme?: {
    preset?: string;
    brandColor?: string;
    accentColor?: string;
    /**
     * The homepage's sections, in render order. `{ key, type }` rather than a
     * bare id: `key` is the instance identity a repeated section is told apart
     * by, and what per-section config joins on.
     */
    homepageSections?: StoreHomeSection[];
    /** How the uploaded logo is drawn — see `StoreLogoStyle`. */
    logo?: StoreLogoStyle;
    /** Layout of the homepage collections row — see `StoreHomeCollections`. */
    homeCollections?: StoreHomeCollections;
    /**
     * Type family, surface palette, spatial rhythm and corner radius — see
     * `resolveDesign` in `lib/storefront-theme.ts`, which is the only thing that
     * should read these raw (unknown ids must not reach the DOM). Unset ⇒ the
     * storefront's built-in look.
     */
    design?: {
      font?: string;
      surface?: string;
      scale?: string;
      density?: string;
      radius?: string;
    };
  };
  /**
   * Words the merchant wrote — a SIBLING of `theme`, not part of it.
   *
   * A ready-made theme stamps `theme`/`templates` wholesale, so a merchant's own
   * sentences cannot live in there or applying one would erase them. Every field
   * has a localized fallback in the storefront dictionary, so unset means "use
   * the built-in wording" — never "render an empty line".
   */
  /** Per-section homepage config, joined to `theme.homepageSections[].key`. */
  sectionConfig?: StoreSectionConfig[];
  copy?: {
    footerText?: string;
    footerNote?: string;
    footerContactHeading?: string;
    footerNewsletter?: StoreFooterNewsletter;
  };
  /** Org letterhead (Settings → Receipt & Print) — order invoices print with the
   * same letterhead as every other document. */
  printable?: {
    name?: string;
    address?: string;
    logo?: StorefrontImage | null;
    receiptSettings?: import("@/types/receipt").ReceiptSettings | null;
  } | null;
  allowedPaymentMethods: ("cod" | "bank")[];
  shippingRule: {
    mode: "flat" | "free_over_threshold" | "none";
    flatFee?: number;
    freeThreshold?: number;
  };
  /** Dhaka inside/outside zone rates (override shippingRule when present). */
  shippingZones?: { inside?: number; outside?: number; freeThreshold?: number };
  /** Merchant-authored delivery windows shown instead of a platform promise. */
  deliveryEstimates?: { insideDhaka?: string; outsideDhaka?: string };
  /** In-store pickup option + the collection location (when enabled). */
  pickup?: {
    enabled: boolean;
    instructions?: string;
    location?: { name: string; address?: string } | null;
  };
  /**
   * Meta Pixel config (backend `docs/plan/meta-pixel-capi.md`).
   *
   * **Presence is enabled**, exactly like `contactButton`: the backend omits the whole block when
   * the merchant has the pixel off or has not entered an id, so there is no flag to check and a
   * disabled pixel ships no id at all. `Purchase` is deliberately absent from `events` — it is
   * never sent from the browser, and there is no switch that could turn it on.
   */
  meta?: {
    pixelId: string;
    events: {
      pageView: boolean;
      viewContent: boolean;
      addToCart: boolean;
      initiateCheckout: boolean;
    };
  };
  /** Admin-selected page templates (raw ids from the admin Templates tab). */
  templates?: StoreTemplatesRaw;
  /** Owner-editable footer trust badges (Rich footer); undefined → built-in copy. */
  trustBadges?: { text: string; icon?: string }[];
  /** Home hero carousel slides; unset/empty → the static built-in hero. */
  heroSlides?: StoreHeroSlide[];
  /** Static banner-hero copy overrides; unset fields → built-in copy. */
  heroBanner?: StoreHeroBanner;
  /** Header menu / footer groups / announcement bar (admin Navigation tab). */
  nav?: StoreNav;
  /** Checkout behaviour (order prefix, min order, required fields, terms). */
  checkout?: {
    orderPrefix?: string;
    minOrderValue?: number;
    termsRequired?: boolean;
    /** Which address fields the shopper must fill (name/phone/address/area). */
    requiredFields?: string[];
    /** Slug of the CMS content page the terms checkbox links to. */
    termsPageSlug?: string;
  };
  /** Instructions shown to shoppers who pick bank/manual transfer. */
  bankInstructions?: string;
  /** Social sign-in providers with credentials configured on the backend. */
  oauthProviders?: ("google" | "facebook")[];
}

/** Raw per-page template ids as stored by the admin (free strings). */
export interface StoreTemplatesRaw {
  home?: string;
  collection?: string;
  product?: string;
  checkout?: string;
  footer?: string;
  header?: string;
  productCard?: string;
  cardActions?: string;
  hero?: string;
  headerMenu?: string;
  pagination?: string;
  imageFit?: string;
  imageRatio?: string;
  categoryTiles?: string;
  accountLayout?: string;
  contentLayout?: string;
  cartLayout?: string;
  shell?: string;
}

/** What the storefront header's top links are built from. */
export type HeaderMenuSource = "collections" | "custom";

/** Normalized storefront page-layout variants (resolved from the raw admin ids). */
export interface StoreTemplates {
  home: "classic" | "hero-split" | "minimal";
  collection: "grid3" | "grid4" | "sidebar";
  product: "left" | "top" | "sticky";
  /**
   * The WHOLE checkout layout — four separate page components, not variations
   * within one. See app/(storefront)/shop/checkout/view.tsx.
   */
  checkout: "single" | "multi" | "guided" | "editorial";
  /**
   * `contact` leads with the merchant's phone/WhatsApp and `newsletter` with a
   * sign-up form, so both **degrade** rather than render an empty block: with no
   * published number, or no sign-up copy at all, they fall back to the plain
   * anchored body that `columns` renders. See `StoreFooter`.
   */
  footer: "columns" | "simple" | "rich" | "contact" | "newsletter";
  header: "classic" | "minimal" | "centered" | "search-first" | "clinical" | "boutique";
  productCard: "standard" | "compact" | "bold" | "editorial";
  /**
   * Which actions the product card offers, and in what form. Independent of
   * `productCard`, which controls density only — a compact card can still want
   * two buttons, a bold card can still want one.
   *
   * `reveal` hides the CTA until hover and is therefore **desktop-only**; touch
   * has no hover, so it falls back to `addBuy` below 680px.
   */
  cardActions: "add" | "addBuy" | "icons" | "buyFirst" | "reveal" | "iconOnly";
  /** Home hero source: carousel (when slides exist) vs the static banner hero. */
  hero: "slides" | "banner";
  /**
   * How product listings advance past page 1: numbered Prev/Next, auto-load on
   * scroll (then a button), or a button only. Collection page + search results.
   */
  pagination: "pages" | "infinite" | "loadMore";
  /** How a photo fills a box it doesn't match: full photo w/ blurred fill, or cropped. */
  imageFit: "fit" | "crop";
  imageRatio: "square" | "portrait" | "landscape" | "tall";
  /**
   * How the homepage `category-tiles` section presents a department: a photo on
   * a tinted card with the name underneath, a taller photo with the name over it
   * behind a scrim, or a lettered disc with no photograph at all.
   *
   * A presentation, not a theme — a grocery shop's departments and a fashion
   * shop's occasions are the same section, and which mode reads better depends
   * on whether the merchant's category images are product shots, scenes, or not
   * worth showing.
   */
  categoryTiles: "tile" | "overlay" | "disc" | "circle";
  /**
   * Which WHOLE LAYOUT the signed-in account area renders in. Unlike every other
   * key here this selects a page-level component rather than a variation within
   * one — see components/storefront/account/account-area.tsx.
   */
  accountLayout: "sidebar" | "tabs" | "panel" | "editorial";
  /**
   * The frame around a titled body — the CMS content pages and the order-tracking
   * page. Four whole frames; see components/storefront/content-frame.tsx.
   */
  contentLayout: "centered" | "banner" | "panel" | "editorial";
  /** The whole cart page — four layouts; see components/storefront/cart/. */
  cartLayout: "panel" | "compact" | "cards" | "editorial";
  /**
   * The page SKELETON, applied to every page. The only axis that changes what
   * KIND of site a shop is rather than what it contains — see store-shell.tsx.
   */
  shell: "stacked" | "rail";
}

/** A header menu link target (category slug, page slug, or URL). */
export interface StoreMenuItem {
  label: string;
  /** "collections" expands to the listed collections at that position (top level only). */
  type: "category" | "page" | "url" | "collections";
  value: string;
  children?: StoreMenuItem[];
}

export interface StoreFooterGroup {
  title: string;
  links: { label: string; url: string }[];
}

/** Owner controls for the auto content-pages footer column. */
export interface StoreFooterContentPages {
  /** `false` hides the column; absent/`true` ⇒ shown. */
  show?: boolean;
  /** Heading override; blank ⇒ the built-in localized "Information" label. */
  title?: string;
}

/**
 * Sign-up copy for the Stay-in-touch footer (`theme.footerNewsletter`).
 * Each field falls back to a localized default, so unset means "use the
 * built-in wording", never "render nothing".
 */
export interface StoreFooterNewsletter {
  heading?: string;
  blurb?: string;
  buttonLabel?: string;
}

/** The single-line bar above the storefront header (admin Navigation tab). */
export interface StoreAnnouncement {
  enabled?: boolean;
  /** Use the effective shipping threshold instead of free-form message text. */
  useShippingRule?: boolean;
  text?: string;
  link?: string;
  bgColor?: string;
  /** Explicit text colour; blank ⇒ auto-derived from bgColor for readability. */
  textColor?: string;
  /** Leading emoji/glyph shown before the text. */
  icon?: string;
  /** When set (with a link), renders an explicit CTA button instead of a bare link. */
  ctaLabel?: string;
  /** Shopper can dismiss the bar (persisted per-device until the message changes). */
  dismissible?: boolean;
  size?: "sm" | "md" | "lg";
  /** Background image behind the bar (with the overlay below painted on top). */
  bgImage?: StorefrontImage | null;
  /** Overlay colour painted over the image for text readability. */
  overlay?: string;
  /** Overlay strength, 0–100. */
  overlayOpacity?: number;
  /** cover = photo backdrop (center-cropped); tile = repeating pattern. */
  bgFit?: "cover" | "tile";
}

export interface StoreNav {
  header?: StoreMenuItem[];
  footer?: StoreFooterGroup[];
  /** Owner controls for the auto content-pages footer column. */
  footerContentPages?: StoreFooterContentPages;
  announcement?: StoreAnnouncement;
}

/**
 * A merchant label carried by a product (`CatalogProduct.tags`). Narrower than
 * `StoreTag`, the facet row: no `productCount`, because a chip says what this
 * product IS, not how many others share the label. The backend emits only
 * ACTIVE tags, so a chip always links to a facet value the store still serves.
 */
export interface ProductTag {
  _id: string;
  name: string;
  /** The facet value (`/products?tags=eid-sale`). */
  slug?: string;
  color?: string | null;
}

export interface CatalogProduct {
  _id: string;
  name: string;
  slug: string;
  /** For variable products this is the cheapest variant ("From ৳X"). */
  price: number | null;
  /** Original price when an active campaign has discounted this product. */
  compareAtPrice?: number | null;
  basePrice: number | null;
  images: StorefrontImage[];
  description: string;
  featured: boolean;
  categoryId?: string;
  /**
   * The child collection, when the merchant set one. `categoryId` stays on the
   * TOP-LEVEL category, so both are needed to place a product in the tree — see
   * `categoryCrumbs` in `lib/storefront-breadcrumb.ts`.
   */
  subcategoryId?: string | null;
  /** Merchant labels, in the order they were attached. Optional so a fixture or
   *  a preview payload can omit it; the API always sends an array. */
  tags?: ProductTag[];
  productType: string;
  hasVariants?: boolean;
  availableQuantity: number;
  /**
   * How the product is sold — "kg", "pcs". **Absent when the merchant set no
   * sale unit**, which is why every consumer must treat it as optional rather
   * than printing an empty line: a shop that never configured units would grow a
   * blank row under every product name.
   */
  unitLabel?: string;
  /** "show"/"hide" cap at stock; "backorder" stays buyable past zero. */
  outOfStockBehavior?: "hide" | "show" | "backorder";
  /** Merchant SEO overrides for the product page (absent when unset). */
  seo?: { title?: string; description?: string };
  /** Present only on the product-detail payload of variable products. */
  variants?: CatalogVariant[];
}

/** One purchasable option of a variable product (e.g. Size "1L"). */
export interface CatalogVariant {
  _id: string;
  label: string;
  attributes: Record<string, string>;
  price: number | null;
  compareAtPrice?: number | null;
  images: StorefrontImage[];
  availableQuantity: number;
}

/** A footer link to a published CMS page. */
export interface ContentPageLink {
  _id: string;
  slug: string;
  title: string;
  sortOrder?: number;
}

/** A published CMS page rendered at /shop/pages/{pageSlug}. */
export interface ContentPageView {
  _id: string;
  slug: string;
  title: string;
  body: string;
  /** Merchant SEO overrides; absent until one is set. `title` above is the page
   *  heading and may run to 160 characters, so the search title is its own field. */
  seo?: { title?: string; description?: string };
  updatedAt?: string;
}

export interface StoreCampaign {
  _id: string;
  name: string;
  banner?: StorefrontImage | null;
  type: string;
  value: number;
  scope: string;
  /** Target ids (category/product scope) — used to build the strip's link. */
  targets?: string[];
  endsAt?: string;
}

export interface CatalogCategory {
  _id: string;
  name: string;
  /** Leaf segment only. Link with `slugPath`, which carries the full path. */
  slug: string;
  /** Public path: "phones" (top level) or "phones/accessories" (child). */
  slugPath?: string;
  /** Collection thumbnail (single image); absent when the merchant set none. */
  image?: StorefrontImage | null;
  /**
   * The merchant one-line "what is in here", printed under the name on the
   * homepage category tiles. Absent when they wrote none — the tile then draws
   * no line at all rather than reserving its height.
   */
  description?: string;
  /**
   * Sub-categories. Present on top-level nodes only — the tree is exactly two
   * levels deep, and a hidden parent takes its children with it, so anything
   * listed here is reachable at its own `slugPath`.
   */
  children?: CatalogCategory[];
}

/** `GET …/categories/resolve?path=` — one collection, plus its breadcrumb parent. */
export interface CatalogCategoryDetail extends CatalogCategory {
  description?: string | null;
  /** Merchant SEO overrides for this landing page; null when never set. */
  seo?: { title?: string; description?: string } | null;
  isSubcategory: boolean;
  parent?: { _id: string; name: string; slugPath?: string } | null;
}

/**
 * One public tag (`GET …/tags`) — curated like brands: active tags carrying at
 * least one listed product, so a facet row can never come back empty.
 */
export interface StoreTag {
  _id: string;
  name: string;
  slug: string;
  color?: string | null;
  productCount: number;
}

/**
 * One public brand (`GET …/brands`) — auto-curated server-side: active,
 * non-default brands with ≥1 listed product. `productCount` feeds the facet
 * rows and brand tiles.
 */
export interface StoreBrand {
  _id: string;
  name: string;
  slug?: string;
  image?: StorefrontImage | null;
  productCount: number;
}

export interface ProductListResult {
  items: CatalogProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Account MARKETING consent (Notifications section). Transactional order
 * updates are not here — the store configures those per event per channel.
 */
export interface ShopperPrefs {
  promoEmail: boolean;
  priceDrop: boolean;
  newsletter: boolean;
}

/** Saved delivery address (account address book). Courier-neutral by design. */
export interface ShopperAddress {
  id?: string;
  label: string;
  line: string;
  phone?: string;
  isDefault: boolean;
  /** Canonical BD district (see `lib/bd-geo.ts`). */
  district?: string;
  /** Area/upazila/thana — free text. */
  area?: string;
}

export interface ShopperProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  /** Birthday as a plain YYYY-MM-DD string. */
  dob?: string;
  prefs?: ShopperPrefs;
  addresses?: ShopperAddress[];
  emailVerified: boolean;
  customerId?: string;
  createdAt?: string;
}

export interface ShopperAuthResult {
  token: string;
  shopper: ShopperProfile;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  /**
   * Product thumbnail, resolved live from the catalogue by the backend rather
   * than snapshotted onto the line — so it follows the merchant replacing the
   * photo instead of pointing at a deleted one. Present on the order **detail**
   * response only, and absent for a delisted or image-less product.
   */
  image?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  /** Street line — omitted for pickup orders (name + phone only). */
  address?: string;
  /** Canonical BD district (courier-neutral). */
  district?: string;
  /** Area/upazila/thana — free text. */
  area?: string;
  zone?: "inside" | "outside";
  notes?: string;
}

export interface StorefrontOrder {
  _id: string;
  orderNumber: string;
  /**
   * The buyer's tracking link, returned **only on placement**. A guest's single
   * chance to keep it — no SMS carries the link and they have no account to find
   * it in later, so the confirmation screen must surface it.
   */
  trackUrl?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCharged: number;
  totalAmount: number;
  status: string;
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  courier?: {
    /** `"manual"` = a courier the merchant drives by hand (no tracking API). */
    integration?: "api" | "manual";
    provider?: string;
    /**
     * Carrier display name, snapshotted at dispatch. The only carrier identity a
     * shopper sees — a merchant's own courier ("RedX") reads exactly like an
     * integrated one. `customCourierId` is stripped server-side and never arrives.
     */
    name?: string;
    /** Public tracking page for this parcel, when the carrier has one. */
    trackingUrl?: string;
    trackingCode?: string;
    consignmentId?: string;
    /** Raw provider status (admin-only). Shopper UI renders `normalizedStatus`. */
    status?: string;
    normalizedStatus?: CourierNormalizedStatus;
    /**
     * The parcel's progress feed. For a manual courier these are the merchant's
     * own updates — the only delivery detail the shopper gets. The staff `by` is
     * stripped server-side.
     */
    history?: { status: string; note?: string; at?: string }[];
  };
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
}

export interface PlaceOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  /** Delivery (default) or in-store pickup. Pickup drops the delivery address. */
  fulfillmentType?: "delivery" | "pickup";
  shippingAddress: ShippingAddress;
  paymentMethod: "cod" | "bank";
  notes?: string;
  couponCode?: string;
  /** Shopper accepted the store's terms (required when `checkout.termsRequired`). */
  termsAccepted?: boolean;
  /**
   * The browser's cart handle, so a GUEST order can close its mirrored cart —
   * the server's shopper-keyed path has no shopper to key on. Optional because
   * `cartAnonymousId()` returns null where localStorage is unavailable, and an
   * order must never depend on an analytics record.
   */
  anonymousId?: string;
  /**
   * Meta attribution the browser observed at checkout (backend `docs/plan/meta-pixel-capi.md`).
   *
   * Only what the browser alone can supply. The shopper's IP and user agent are read by the
   * server from the request itself — a client able to name its own IP could attribute a
   * stranger's session — so they have no place in this shape.
   *
   * Optional, like `anonymousId` above and for the same reason: a shopper with cookies blocked
   * or an ad blocker installed still checks out, and an order must never depend on tracking.
   */
  meta?: { fbp?: string; fbc?: string; eventSourceUrl?: string };
}

/**
 * The buyer's read-only view of one order, from a tracking link. Deliberately
 * narrower than `StorefrontOrder`: no merchant cost, no ledger refs, no phone.
 */
export interface TrackedOrder {
  orderNumber: string;
  status: string;
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod: "cod" | "bank" | "manual";
  paymentStatus: "pending" | "paid" | "refunded";
  placedAt?: string;
  items: { productName: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  shippingCharged: number;
  totalAmount: number;
  shipTo: { name: string; area?: string; district?: string };
  courier?: {
    name?: string;
    trackingCode?: string;
    trackingUrl?: string;
    normalizedStatus?: string;
    history: { status: string; note?: string; at?: string }[];
  };
  statusHistory: { status: string; at?: string }[];
}

export interface CouponPreview {
  code: string;
  discountAmount: number;
}

/** One line of the server-side cart mirror. Prices are the SERVER's. */
export interface CartMirrorItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * The server's copy of the shopper's cart (see the backend
 * `docs/plan/abandoned-cart.md`). Deliberately narrow — no `organizationId`,
 * `anonymousId` or `shopperId`; those are merchant-side join keys.
 *
 * The client does NOT render from this. The browser cart stays authoritative for
 * display; this is the mirror the merchant sees, echoed back only so the sync can
 * be verified.
 */
export interface CartMirror {
  _id: string;
  items: CartMirrorItem[];
  subtotal: number;
  currency?: string;
  status: "active" | "converted";
  lastActivityAt: string;
  checkoutStartedAt?: string;
  signedInAt?: string;
}

/** What the client sends up — ids and quantities only; never prices. */
export interface CartMirrorInput {
  anonymousId: string;
  items: { productId: string; variantId?: string; quantity: number }[];
}

/**
 * One line of a cart restored from a recovery link. Richer than `CartMirrorItem`
 * because the browser cart is rebuilt from it — hence `slug`, `image`, `maxQty`.
 *
 * `maxQty` follows `lib/storefront-cart-qty.ts`: `0` means **sold out**, and a
 * NEGATIVE value means no local cap (backorder). They were the same value until
 * a restored sold-out line came back uncapped and could be raised to any
 * quantity checkout then refused.
 */
export interface RestoredCartItem {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantLabel?: string;
  image?: string;
  quantity: number;
  price: number;
  maxQty: number;
}

/**
 * The cart behind a recovery link, re-priced against the live catalogue.
 * `removedCount` is how many lines are no longer purchasable — the shopper is
 * told, never handed a quietly shorter cart.
 */
export interface RestoredCart {
  items: RestoredCartItem[];
  subtotal: number;
  currency?: string;
  removedCount: number;
}

/**
 * The shopper's cart after signing in — with any cart they left on **another
 * device** already folded in. `mergedCount > 0` means items arrived from
 * elsewhere.
 *
 * The client MUST adopt these items: the merge happens server-side, so if the
 * local cart were kept the next debounced sync would push it straight over the
 * merge and undo it.
 */
export interface ClaimedCart {
  items: RestoredCartItem[];
  subtotal: number;
  currency?: string;
  mergedCount: number;
}

interface FetchOpts {
  method?: string;
  body?: unknown;
  token?: string | null;
  /**
   * Let the request outlive the page. Only the cart mirror's unload flush uses
   * it: a shopper who adds an item and closes the tab inside the debounce window
   * is exactly the abandoner worth recording, and a normal fetch is cancelled
   * with the document.
   */
  keepalive?: boolean;
}

/**
 * A failed storefront request, carrying the HTTP status alongside the message.
 *
 * It exists because "the request failed" and "the thing you asked for is not
 * there" are different answers and a bare `Error` cannot tell them apart — the
 * order-tracking page rendered *every* failure, including a 429 and a dropped
 * connection, as "this tracking link is no longer valid" and told the buyer to
 * ask the merchant for a new one. Extends `Error`, so the many call sites doing
 * `(e as Error).message` keep working unchanged.
 */
export class StorefrontApiError extends Error {
  constructor(
    message: string,
    /** HTTP status. Branch on this — it is present whatever the body looks like. */
    readonly status: number,
    /**
     * The machine code from the API envelope, when it sent one. Not every
     * failure has it: `express-rate-limit` replies with its own body shape
     * rather than going through the backend's error handler, so treat a missing
     * code as normal and prefer `status`.
     */
    readonly code?: string,
  ) {
    super(message);
    this.name = "StorefrontApiError";
  }
}

async function sfFetch<T>(
  slug: string,
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/storefront/${slug}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      // Owner preview, and orthogonal to the shopper token above: one says which
      // shopper is asking, this says the asker may see a shop that is not
      // published. Read here rather than threaded through ~40 call sites — see
      // `lib/storefront-preview.ts`.
      ...previewApiHeaders(storefrontPreviewToken()),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
    keepalive: opts.keepalive,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A rejected shopper token means the session is dead (expired/revoked) —
    // drop it so the UI stops rendering a signed-in account it can't back up.
    // Guard on the token still being current so a late 401 can't kill a fresh
    // re-login, and never react to unauthenticated 401s (e.g. wrong password).
    if (res.status === 401 && opts.token) {
      const { useShopperStore } = await import("@/services/stores/use-shopper-store");
      const store = useShopperStore.getState();
      if (store.token === opts.token) {
        // Hand-rolled `useShopperLogout`, because this is a module-scope fetch
        // helper and cannot call a hook. Both halves are here — the token drop
        // on this line and the cache eviction immediately below — so the rule's
        // actual invariant holds even though its call-shape check cannot see it.
        // eslint-disable-next-line query-cache/no-raw-shopper-logout -- see above
        store.logout();
        // Evict too, not just forget the token: an expired session's orders would
        // otherwise still be served from cache to whoever signs in next on this
        // device. Same reason `useShopperLogout` exists — see services/storefront/hooks.ts.
        if (typeof window !== "undefined" && store.slug) {
          const [{ getQueryClient }, { clearShopperCache }] = await Promise.all([
            import("@/lib/react-query"),
            import("@/services/storefront/hooks"),
          ]);
          clearShopperCache(getQueryClient(), store.slug);
        }
      }
    }
    // The backend's errorHandler puts the human message in `error` and the
    // machine code in `code`. Rate limiters answer from express-rate-limit
    // instead, whose body is shaped differently — hence the `message` fallback.
    throw new StorefrontApiError(
      json?.error || json?.message || `Request failed (${res.status})`,
      res.status,
      json?.code,
    );
  }
  return json.data as T;
}

/**
 * Full-page navigation target that starts the social sign-in flow. The API
 * handles the whole provider round-trip and bounces back to /account/oauth.
 */
export function oauthStartUrl(
  slug: string,
  provider: "google" | "facebook",
  next?: string,
): string {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return `${API_BASE}/storefront/${slug}/auth/oauth/${provider}/start${q}`;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const storefrontApi = {
  getStore: (slug: string) => sfFetch<StorefrontStore>(slug, ""),
  listProducts: (
    slug: string,
    params: Record<string, string | number | undefined> = {},
  ) => sfFetch<ProductListResult>(slug, `/products${buildQuery(params)}`),
  getProduct: (slug: string, productSlug: string) =>
    sfFetch<CatalogProduct>(slug, `/products/${productSlug}`),
  listCategories: (slug: string) =>
    sfFetch<CatalogCategory[]>(slug, "/categories"),
  listBrands: (
    slug: string,
    params: Record<string, string | number | undefined> = {},
  ) => sfFetch<StoreBrand[]>(slug, `/brands${buildQuery(params)}`),
  listTags: (
    slug: string,
    params: Record<string, string | number | undefined> = {},
  ) => sfFetch<StoreTag[]>(slug, `/tags${buildQuery(params)}`),
  listCampaigns: (slug: string) =>
    sfFetch<StoreCampaign[]>(slug, "/campaigns"),
  listPages: (slug: string) =>
    sfFetch<ContentPageLink[]>(slug, "/pages"),
  getPage: (slug: string, pageSlug: string) =>
    sfFetch<ContentPageView>(slug, `/pages/${pageSlug}`),

  register: (
    slug: string,
    body: { name: string; email: string; password: string; phone?: string },
  ) => sfFetch<ShopperAuthResult>(slug, "/auth/register", { method: "POST", body }),
  login: (slug: string, body: { email: string; password: string }) =>
    sfFetch<ShopperAuthResult>(slug, "/auth/login", { method: "POST", body }),
  me: (slug: string, token: string) =>
    sfFetch<ShopperProfile>(slug, "/auth/me", { token }),
  // Account: profile (email/phone are locked server-side), prefs, addresses.
  updateProfile: (
    slug: string,
    token: string,
    body: { name?: string; gender?: "male" | "female" | "other"; dob?: string },
  ) => sfFetch<ShopperProfile>(slug, "/auth/me", { method: "PATCH", body, token }),
  changePassword: (
    slug: string,
    token: string,
    body: { currentPassword: string; newPassword: string },
  ) =>
    sfFetch<{ message: string }>(slug, "/auth/me/password", {
      method: "PUT",
      body,
      token,
    }),
  updatePrefs: (slug: string, token: string, body: Partial<ShopperPrefs>) =>
    sfFetch<ShopperProfile>(slug, "/auth/me/prefs", {
      method: "PUT",
      body,
      token,
    }),
  addAddress: (
    slug: string,
    token: string,
    body: {
      label: string;
      line: string;
      phone?: string;
      isDefault?: boolean;
      district?: string;
      area?: string;
    },
  ) =>
    sfFetch<ShopperProfile>(slug, "/auth/me/addresses", {
      method: "POST",
      body,
      token,
    }),

  /**
   * Public order tracking. **No token** — the link itself is the credential, and
   * the response is a narrow allowlist that cannot act on the order.
   */
  trackOrder: (slug: string, trackToken: string) =>
    sfFetch<TrackedOrder>(slug, `/t/${encodeURIComponent(trackToken)}`),

  /** Recovery for a lost link. The phone is required, not optional convenience. */
  lookupOrder: (slug: string, orderNumber: string, phone: string) =>
    sfFetch<TrackedOrder>(
      slug,
      `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`,
    ),
  updateAddress: (
    slug: string,
    token: string,
    addressId: string,
    body: Partial<{
      label: string;
      line: string;
      phone: string;
      isDefault: boolean;
      district: string;
      area: string;
    }>,
  ) =>
    sfFetch<ShopperProfile>(slug, `/auth/me/addresses/${addressId}`, {
      method: "PATCH",
      body,
      token,
    }),
  deleteAddress: (slug: string, token: string, addressId: string) =>
    sfFetch<ShopperProfile>(slug, `/auth/me/addresses/${addressId}`, {
      method: "DELETE",
      token,
    }),
  verifyEmail: (slug: string, token: string) =>
    sfFetch<{ emailVerified: boolean }>(slug, "/auth/verify-email", {
      method: "POST",
      body: { token },
    }),
  /** Re-send the verification link to the signed-in shopper (session token). */
  resendVerification: (slug: string, token: string) =>
    sfFetch<{ emailVerified: boolean }>(slug, "/auth/resend-verification", {
      method: "POST",
      token,
    }),
  forgotPassword: (slug: string, email: string) =>
    sfFetch<{ message: string }>(slug, "/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),
  resetPassword: (slug: string, token: string, password: string) =>
    sfFetch<{ message: string }>(slug, "/auth/reset-password", {
      method: "POST",
      body: { token, password },
    }),

  // `token` is optional: no token is a GUEST order, which the server accepts.
  // A present-but-invalid token still 401s — absence and invalidity are different
  // things and must not resolve the same way.
  placeOrder: (slug: string, token: string | undefined, body: PlaceOrderInput) =>
    sfFetch<StorefrontOrder>(slug, "/orders", { method: "POST", body, token }),
  listOrders: (slug: string, token: string) =>
    sfFetch<StorefrontOrder[]>(slug, "/orders", { token }),
  getOrder: (slug: string, token: string, orderNumber: string) =>
    sfFetch<StorefrontOrder>(slug, `/orders/${orderNumber}`, { token }),
  // Shopper self-cancel while the order is still pending.
  cancelOrder: (slug: string, token: string, orderNumber: string) =>
    sfFetch<StorefrontOrder>(slug, `/orders/${orderNumber}/cancel`, {
      method: "POST",
      token,
    }),
  // Guest-tolerant like `placeOrder`. `phone` carries the per-buyer coupon limit
  // when there is no account to count against, so the quoted discount matches the
  // one placement will charge.
  validateCoupon: (
    slug: string,
    token: string | undefined,
    body: {
      code: string;
      items: { productId: string; quantity: number }[];
      phone?: string;
    },
  ) =>
    sfFetch<CouponPreview>(slug, "/coupon/validate", {
      method: "POST",
      body,
      token,
    }),

  // ---- cart mirror (analytics; never blocks the shopper) --------------------
  // All three are fire-and-forget from the caller's point of view — see
  // `components/storefront/cart-sync.tsx`, the only consumer.
  syncCart: (slug: string, body: CartMirrorInput, keepalive?: boolean) =>
    sfFetch<CartMirror>(slug, "/cart", { method: "PUT", body, keepalive }),
  /**
   * Attach the signed-in shopper to their cart and fold in any cart they left on
   * another device. Idempotent. Returns the resulting cart — the caller adopts it.
   */
  claimCart: (slug: string, token: string, anonymousId: string) =>
    sfFetch<ClaimedCart>(slug, "/cart/claim", {
      method: "POST",
      body: { anonymousId },
      token,
    }),
  /** Funnel step: the shopper reached /checkout with something in the cart. */
  markCheckoutStarted: (slug: string, anonymousId: string) =>
    sfFetch<{ ok: boolean }>(slug, "/cart/checkout-started", {
      method: "POST",
      body: { anonymousId },
    }),
  /**
   * Record a GUEST's checkout details on their mirrored cart, one field at a
   * time as they leave each input. Without it a guest who fills the form and
   * then leaves is an abandoned cart the merchant cannot name — the number was
   * typed, just never sent anywhere.
   *
   * Fire-and-forget like the rest of the mirror: never awaited on a money path.
   */
  captureCartContact: (
    slug: string,
    body: { anonymousId: string; name?: string; phone?: string; email?: string },
  ) => sfFetch<{ ok: boolean }>(slug, "/cart/contact", { method: "POST", body }),
  /** Exchange a recovery-email token for the cart behind it. */
  restoreCart: (slug: string, token: string) =>
    sfFetch<RestoredCart>(slug, `/cart/restore/${token}`),

  /**
   * Footer sign-up. **Not** part of the cart mirror above and not
   * fire-and-forget: the shopper pressed a button and is owed an answer, so
   * this one's rejection is caught by the form and shown.
   *
   * The response says `ok` whether the address was new or already on the list —
   * the server will not tell an anonymous caller which, so neither can the UI.
   */
  subscribe: (slug: string, email: string) =>
    sfFetch<{ ok: boolean }>(slug, "/subscribe", {
      method: "POST",
      body: { email },
    }),
};
