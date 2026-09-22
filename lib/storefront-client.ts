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

import type { MobileChromeOverrides } from "@/lib/storefront-mobile";
import type { ProductsDataRequest, SectionData } from "@/lib/storefront-builder/section-data";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface StorefrontImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
}

/**
 * The favicon carries one variant the other images do not: a 96x96 **PNG**.
 *
 * Everything else we store is webp, which every browser reads and Google Search
 * does not — its supported icon formats are BMP, GIF, ICO, PNG, JPEG, PPM and
 * TIFF. A store whose icon is webp-only therefore renders correctly in the tab
 * and shows nothing beside a search result. Optional because favicons uploaded
 * before the PNG existed have not been backfilled yet.
 */
export interface StorefrontFavicon extends StorefrontImage {
  pngUrl?: string;
}

/**
 * The single rule for which favicon variant to render, everywhere.
 *
 * PNG first — it is the only variant Google can read, and it is the one sized
 * and letterboxed for icon use (the 200px thumbnail is a `cover` crop meant for
 * a card). The webp variants stay as the fallback for rows the backfill has not
 * reached, since a webp tab icon still beats no tab icon. `undefined` means the
 * merchant uploaded nothing: render no `<link>` and let `/favicon.ico` answer.
 */
export const faviconHref = (
  favicon?: StorefrontFavicon | null,
): string | undefined =>
  favicon?.pngUrl || favicon?.thumbnailUrl || favicon?.url || undefined;

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
  /**
   * Which screens this instance appears on. **Both unset ⇒ everywhere**, which
   * is what every section did before this existed.
   *
   * Rendered as a CSS class (`stripVisibilityClass`), never `matchMedia`: the
   * page is server-rendered and the server cannot know the viewport, so a JS
   * check paints the wrong state and corrects it after hydration.
   */
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}

/**
 * Per-instance config for one homepage section, joined on `key`.
 *
 * A SIBLING of `theme` on the payload, never inside it — a ready-made theme
 * replaces `theme` wholesale, and the collection a merchant chose for their
 * front page is content, not look. See `lib/storefront-sections.ts`.
 */
/** The promo photo's shape, as the merchant picks it. */
export type StoreCardRatio = "16:9" | "4:3" | "1:1" | "3:4";

/** Which side of a split promo card the picture sits on. */
export type StoreCardSide = "left" | "right" | "alternate";

/** How a promo-card row arranges its cards: a grid, or a scrolling track. */
export type StoreCardFlow = "wrap" | "scroll";

/** The promo-card settings a phone may answer differently. */
export interface StoreSectionMobileConfig {
  cardFlow?: StoreCardFlow;
  cardPerRow?: number;
  cardShape?: "stacked" | "split";
  cardSide?: StoreCardSide;
  cardSplit?: number;
  cardHideText?: boolean;
  /** The picture's height in px on a phone — see `cardHeight` on the parent. */
  cardHeight?: number;
}

/**
 * One promo card's own copy, picture and button — overrides layered OVER the
 * collection it points at, never written back to it.
 *
 * Every field is optional and every one falls back to the collection: no title
 * ⇒ its display name, no description ⇒ its description, no image ⇒ its picture,
 * no button label ⇒ the shop's localized "Shop now", no link ⇒ the collection
 * page. So a card the merchant has not touched is exactly the card that existed
 * before this feature.
 */
export interface StoreSectionCard {
  /** Which card this belongs to — joins on `categoryIds`. */
  categoryId: string;
  title?: string;
  description?: string;
  /** Uploaded through the same storefront image endpoint as a hero slide. */
  image?: StorefrontImage | null;
  buttonLabel?: string;
  /**
   * Where the card goes. A store path (`/products?tags=winter`) or a full URL,
   * same rules as a hero slide's link. Unset ⇒ the collection's own page.
   */
  buttonHref?: string;
}

export interface StoreSectionConfig {
  key: string;
  /** `manual` = the merchant picked `productIds` by hand, in that order. */
  source?: "featured" | "newest" | "category" | "manual";
  categoryId?: string;
  /**
   * The collections a promo-card row features, in the merchant's order. Read
   * only by `category-banners`; unset ⇒ the shop's first two collections.
   *
   * Deliberately not `categoryId` above, which names the ONE collection a
   * product row draws its products FROM. Merging them would make "which
   * collection do I sell from" and "which collections do I advertise" one
   * field, so changing either would silently change the other.
   */
  categoryIds?: string[];
  /**
   * How a promo card composes its picture against its copy. Read only by
   * `category-banners`; unset ⇒ `stacked`. See `resolveCardShape`.
   */
  cardShape?: "stacked" | "split";
  /**
   * Which side of a `split` card the picture sits on. `alternate` is the zebra
   * — photo-left, photo-right, photo-left down the block. Read only by
   * `category-banners`; unset ⇒ `left`.
   *
   * ⚠ Replaced a boolean named `cardAlternate` that only ever offered the
   * zebra. The plain swap is what merchants ask for, and a switch labelled
   * "alternate" that cannot do it reads as a broken control rather than a
   * different one.
   */
  cardSide?: StoreCardSide;
  /**
   * The picture column's share of a `split` card, as a percentage — the words
   * take the rest. Unset ⇒ the stylesheet's own answer, which differs by
   * breakpoint. See `resolveCardSplit`.
   */
  cardSplit?: number;
  /**
   * Drop the words and give the picture the whole card. Unset ⇒ the card shows
   * its name, description and button.
   *
   * The name does not disappear with them — it becomes the card's accessible
   * name, because a picture-only link that announces nothing is not one a
   * shopper using a screen reader can follow.
   */
  cardHideText?: boolean;
  /**
   * What a PHONE does differently — shape, side, picture width, words on or
   * off. Every field optional and every one inheriting the desktop answer
   * above, so a row nobody has opened the Mobile tab on renders on a phone
   * exactly as it did before this existed.
   *
   * ⚠ **Composition only, by design.** The picture's aspect ratio and the
   * row's full-width setting are deliberately shared: a square photograph is
   * square on a phone, and splitting a setting across two tabs for no reason is
   * two places a merchant has to look. What does not travel is how the card is
   * built — 65% of a desktop card is a generous picture, 65% of a 390px phone
   * leaves the words in a gutter.
   */
  mobile?: StoreSectionMobileConfig;
  /**
   * The promo photo's shape. Unset ⇒ the composition's own default (16:9
   * stacked, 4:3 split), which is what every row drew before the choice
   * existed.
   */
  cardRatio?: StoreCardRatio;
  /**
   * The picture's height in pixels, overriding `cardRatio`.
   *
   * ⚠ A ratio ties the picture's height to the card's WIDTH, and the width comes
   * from how many collections the merchant picked — so a thin strip across the
   * page was not expressible. Shared across screens: 20px is 20px on a phone.
   */
  cardHeight?: number;
  /**
   * Grid or a scrolling track. Unset ⇒ `wrap`. Per screen: a desktop row that
   * divides four cards comfortably is a phone row of four ~90px slivers.
   */
  cardFlow?: StoreCardFlow;
  /** How many cards fill the row, or are visible in a track. 1–4, per screen. */
  cardPerRow?: number;
  /** The card's corner radius in px. Unset ⇒ the shop's Design → Corners. */
  cardRadius?: number;
  /**
   * Paging arrows on a scrolling row. Unset ⇒ shown.
   *
   * ⚠ Only ever drawn on pointer devices — a phone swipes the track natively
   * and two 36px buttons would cover the cards it can show. So this switch
   * turns them OFF, rather than on where they would never appear.
   */
  cardArrows?: boolean;
  /**
   * Let the row span the window instead of the page's content column. Read only
   * by `category-banners`; unset ⇒ contained, like every other section.
   */
  fullWidth?: boolean;
  /**
   * Per-card presentation OVERRIDES, keyed by the collection each card points
   * at.
   *
   * ⚠ **These belong to the card, not to the collection.** A merchant writing
   * "Winter cushions, half price" here is writing an advertisement for this
   * block; the collection keeps its own name and its own description, and every
   * other place it appears — its page, the tile row, the header menu — is
   * untouched. That separation is the whole point of the field: the first
   * version of this let the panel edit `category.description`, which quietly
   * rewrote the collection page from the home-page editor.
   *
   * An entry with every field blank is dropped rather than stored, so "has
   * overrides" stays distinguishable from "opened the box and typed nothing".
   */
  cards?: StoreSectionCard[];
  title?: string;
  /** Ignored by a `manual` row — the picked list is the row's length. */
  limit?: number;
  /**
   * A hand-picked row's products, in the merchant's order. `$in` returns no
   * order, so the storefront re-sorts the response against this list.
   */
  productIds?: string[];
  /** "View all" wording override. Blank ⇒ the localized default. */
  ctaLabel?: string;
  /** "View all" destination override. Blank ⇒ the derived one. */
  ctaHref?: string;
  /** Show the row's button. Unset ⇒ true, as every row did before. */
  showCta?: boolean;
  /**
   * Tags this row renders, in the merchant's order. Read only by `tag-chips`.
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
  /**
   * How a collection is DRAWN. `card` (default) is the picture tile every shop
   * has always had; `plain` is names only, centred between hairlines.
   *
   * This was a separate section — `category-links` — until 2026-09-06. It drew
   * the same collections, in the same order, to the same links; the only
   * difference was the treatment, and the chips row already owned every other
   * decision about itself through this object. A merchant asking for a quieter
   * row should not have to swap components and lose their layout, columns and
   * label settings to get one.
   *
   * `plain` has no pictures, so `layout`, `columns` and `showLabels` do not
   * apply to it — the panel says so rather than leaving dead controls on.
   */
  style?: "card" | "plain";
  /** `strip` = the scrolling chip row (default); `grid` = equal columns. */
  layout?: "strip" | "grid";
  /** Columns per row in `grid` (2–6). Ignored by `strip`. */
  columns?: number;
  /**
   * Columns per row in `grid` **on a phone** (2–4). Unset ⇒ 2, which is what
   * every phone drew before this existed.
   *
   * Its own number rather than something derived from `columns`: a desktop row
   * divides a 1200px page and a phone row divides ~360px, so a merchant with
   * fourteen departments wants four across on a phone while a merchant with two
   * wants them big. It also caps lower — six 48px tracks on a phone are below
   * the touch target the tile has to be.
   *
   * ⚠ Read by the `category-tiles` section too. Both category grids on the home
   * page take their layout from this object.
   */
  mobileColumns?: number;
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
  /** Optional phone artwork; unset falls back to `image`. */
  mobileImage?: StorefrontImage | null;
  /** Crop anchor for narrow boxes; unset = centre. See `storefront-focal.ts`. */
  focal?: StoreFocalPoint;
  /** Phone crop anchor; unset falls back to `focal`. */
  mobileFocal?: StoreFocalPoint;
  /** How this slide's photo fills the hero; unset = show the whole photo. */
  imageFit?: string;
  badge?: string;
  /** Optional; an image can be the complete slide. */
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
  hideTextOnMobile?: boolean;
  /**
   * A second button, on a card or open slide. Builder-only — the home page's
   * own carousel has never offered one — and per slide since 2026-09-20
   * (decision D3): it used to be read from the first slide alone, because only
   * the first slide was ever drawn as a card.
   */
  secondaryLabel?: string;
  secondaryLink?: string;
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
  /** Optional phone artwork; desktop continues to use the store banner. */
  mobileImage?: StorefrontImage | null;
  /** Crop anchor for the banner; unset = centre. See `storefront-focal.ts`. */
  focal?: StoreFocalPoint;
  /** Phone crop anchor; unset falls back to `focal`. */
  mobileFocal?: StoreFocalPoint;
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
  /**
   * Does this merchant count stock? Mirrors `storeInfoDto.tracked`.
   *
   * Optional on the client so a cached payload from before the field reads as
   * `undefined` — every consumer must test `!== false`, the same convention the
   * server's `isStockTracked` applies.
   */
  tracked?: boolean;
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
  /**
   * The landing page the merchant uses as the homepage, or null for the
   * Customize home. Mirrors `storeInfoDto.homePageId`. What `/` draws is decided
   * by the proxy (`storeHomePageExists`); this only tells that page's own
   * address it is not the one to index.
   */
  homePageId?: string | null;
  logo?: StorefrontImage | null;
  /**
   * Tab icon, already resolved server-side (backend `getStoreInfo`) so nothing
   * here chains. Org-level and deliberately NOT derived from `logo`: a store
   * whose owner never set one shows the platform default rather than a wordmark
   * cover-cropped to a square. Null ⇒ render no `<link rel="icon">` at all and
   * let the browser's implicit /favicon.ico request answer.
   */
  favicon?: StorefrontFavicon | null;
  banner?: StorefrontImage | null;
  /**
   * Phone artwork for the header, when the desktop mark does not survive the
   * trip down to 390px.
   *
   * A separate FILE rather than a crop of `logo`, because the two are usually
   * different drawings: a wide wordmark reads at 200px on a desktop bar and
   * becomes an illegible smear in a 36px-tall mobile slot, where the merchant
   * wants their icon alone. Unset ⇒ the header falls back to `logo` (and that
   * to the organization's), so this is an override nobody has to set.
   */
  mobileLogo?: StorefrontImage | null;
  /**
   * Share-card image, already resolved server-side through
   * socialImage → banner → logo. Chained there, like `favicon` is not, because
   * every fallback is a real image the merchant owns — there is no platform
   * default worth showing, and re-deriving the chain in each `generateMetadata`
   * is how the three of them drift apart.
   */
  socialImage?: StorefrontImage | null;
  contact?: { email?: string; phone?: string; address?: string };
  /**
   * IANA zone the org operates in (e.g. `Asia/Dhaka`), so the storefront can
   * evaluate "is the merchant open right now" against the SHOP's clock rather
   * than the visitor's — see `useContactHours`. Optional only for a payload
   * from a backend that predates the field; treated as "unknown" there, same
   * as no `hours` block at all.
   */
  timezone?: string;
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
    /**
     * The merchant's edits to their mobile chrome, laid over the template named
     * by `templates.mobile`. **Only the fields that differ**, so a shop that
     * took a template and left it alone stores nothing — see `mobileOverrides`.
     * Loose on purpose: `resolveMobileChrome` is the only thing that may read it
     * raw, exactly like `design`.
     */
    mobile?: MobileChromeOverrides;
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
      width?: string;
      navHover?: string;
      navChildHover?: string;
      buttonShape?: string;
      buttonStyle?: string;
      buttonSize?: string;
      headingWeight?: string;
      headingCase?: string;
    };
    /**
     * Where the OPEN hero's copy sits. Unset ⇒ left, which every hero was
     * before this existed. Read through `resolveHeroAlign` so an unknown
     * stored value cannot reach the DOM — the same rule `design` follows.
     */
    heroAlign?: string;
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
  /** Enabled method ids, in the order the checkout renders them. */
  allowedPaymentMethods: string[];
  /**
   * Merchant wording for every method they defined. No `cod` entry — the
   * storefront translates that one from its own dictionary.
   */
  paymentMethods?: {
    id: string;
    title: string;
    subtitle?: string;
    /** A shipped icon name; unset or unknown renders the default card mark. */
    icon?: string;
  }[];
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
   * disabled pixel ships no id at all.
   *
   * `purchase` is the merchant's opt-in for a browser-side `Purchase` on the thank-you screen,
   * alongside the server one. It is **off unless the merchant switched it on** — the backend
   * resolves it with `=== true` rather than the `!== false` the other four use, so a store that
   * predates the field reads as false rather than inheriting an ON default.
   */
  meta?: {
    pixelId: string;
    events: {
      pageView: boolean;
      viewContent: boolean;
      addToCart: boolean;
      initiateCheckout: boolean;
      purchase: boolean;
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
    /**
     * How the delivery address is captured. `flat` shows ONE address box; the
     * zone that prices the order is then inferred from the text and the shopper
     * is asked outright when the address places nothing. Unset reads as
     * `detailed` — the district select every store had before.
     */
    addressMode?: "detailed" | "flat";
    /** The "Delivery notes" box under the address. Unset reads as ON. */
    showOrderNotes?: boolean;
    /**
     * Where the guest sign-in notice shows. Both unset read as ON. Resolved into
     * a CSS class (`stripVisibilityClass`), never `matchMedia` — checkout is
     * server-rendered and a JS check would paint the wrong state first.
     */
    guestNotice?: { showOnDesktop?: boolean; showOnMobile?: boolean };
    /** Merchant-defined notices + inputs, in render order within each slot. */
    customFields?: CheckoutFieldConfig[];
    /** "Pause online orders": buy buttons show `pausedMessage`; the order API refuses. */
    ordersPaused?: boolean;
    pausedMessage?: string;
    /** Offer "Order on chat instead" through the store's WhatsApp contact. */
    pausedWhatsApp?: boolean;
  };
  /**
   * Which optional shopper pages this store serves — the §6 page controls,
   * resolved by the backend into three plain booleans (the account switch is
   * stored apart from the other two, and nothing here should know that).
   *
   * Optional on the type for the same reason every other block is: a cached
   * store payload fetched before this shipped carries none. Read it through
   * `storePages()`, never field by field — absent must mean ON.
   */
  pages?: { search: boolean; cartPage: boolean; accounts: boolean };
  /** Social sign-in providers with credentials configured on the backend. */
  oauthProviders?: ("google" | "facebook")[];
}

/**
 * One merchant-defined checkout entry — a notice the shopper reads, or an input
 * they fill. Answers are stored on the order as inert labelled data; nothing here
 * can move a total (the only shipping override is admin-side). See the backend's
 * `docs/plan/checkout-address-and-custom-fields.md`.
 */
export interface CheckoutFieldConfig {
  key: string;
  kind: "notice" | "input";
  /** For a notice this IS the text; for an input it is the field label. */
  label: string;
  helpText?: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
  /**
   * Which checkout anchor it renders at. An anchor rather than a position: the
   * four checkout layouts span different numbers of screens, so only a named
   * place means the same thing in all of them. Unset reads as `after-address`,
   * the one position a custom field had before slots existed — so a store that
   * never touches the setting keeps the checkout it has.
   */
  slot?: CheckoutFieldSlot;
  /** Notices only. A preset, never a merchant-typed colour. Unset → `plain`. */
  tone?: CheckoutNoticeTone;
  /** Notices only. Unset → `sm`, the size every notice rendered at before. */
  size?: CheckoutNoticeSize;
  /** When it is shown at all. Unset = always. See `isCheckoutFieldVisible`. */
  showWhen?: { paymentMethods?: string[] };
}

/** The checkout anchors a merchant may place one of their own fields against. */
export type CheckoutFieldSlot =
  | "after-contact"
  | "after-address"
  | "before-payment"
  | "after-payment"
  | "before-submit";

/**
 * A notice's visual weight. Each resolves to storefront CSS custom properties
 * (see `lib/checkout-notice-style`), so a notice survives the dark toggle and
 * every palette, and `accent` follows the merchant's second colour.
 */
export type CheckoutNoticeTone = "plain" | "info" | "warn" | "success" | "accent";

/** A notice's text size. */
export type CheckoutNoticeSize = "sm" | "md" | "lg";

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
  /** Which mobile chrome — see `lib/storefront-mobile.ts`. */
  mobile?: string;
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
  /**
   * The phone chrome — which bar sits at the top and which tabs (if any) at the
   * bottom. A **loose string**, unlike every other key here, and deliberately:
   * the options live in `lib/storefront-mobile.ts` as data, so pinning a union
   * here would mean editing this file to add one, which is exactly the coupling
   * that registry exists to remove. `resolveMobileChrome` narrows it.
   */
  mobile: string;
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

/** Responsive visibility for enabled payment-method badges in the footer. */
export interface StoreFooterPaymentMethods {
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
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
  /** Scroll the message right-to-left instead of centring it on one line. */
  marquee?: boolean;
  /** Scroll pace when `marquee` is on. Absent ⇒ `normal`. */
  marqueeSpeed?: "slow" | "normal" | "fast";
  /** Background image behind the bar (with the overlay below painted on top). */
  bgImage?: StorefrontImage | null;
  /** Overlay colour painted over the image for text readability. */
  overlay?: string;
  /** Overlay strength, 0–100. */
  overlayOpacity?: number;
  /** cover = photo backdrop (center-cropped); tile = repeating pattern. */
  bgFit?: "cover" | "tile";
  /** Render above the storefront's 680px breakpoint. Default true. */
  showOnDesktop?: boolean;
  /** Render at 680px and below. Default true. */
  showOnMobile?: boolean;
}

/** Which pages a site-wide strip appears on. */
export type StoreStripScope = "all" | "home";

/** Spacing preset — resolved to pixels by `resolveCampaignStrip`. */
export type StoreStripSpace = "sm" | "md" | "lg";

/**
 * Presentation of the live-campaign strip (Customize → Campaign strip).
 *
 * **Presentation only.** The campaign's own start/end window decides whether
 * there is a campaign to show; every field here decides how it looks and where
 * it appears. Nothing in this block can surface an expired campaign.
 */
export interface StoreCampaignStrip {
  enabled?: boolean;
  showOn?: StoreStripScope;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  bgColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  paddingY?: StoreStripSpace;
  paddingX?: StoreStripSpace;
  dismissible?: boolean;
}

/** Merchant-controlled information strip above the storefront header. */
export interface StoreUtilityBar {
  enabled?: boolean;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  showPhone?: boolean;
  showTrackOrder?: boolean;
  showLanguage?: boolean;
  showTheme?: boolean;
  trackOrderLabel?: string;
}

export interface StoreNav {
  header?: StoreMenuItem[];
  footer?: StoreFooterGroup[];
  /** Where enabled checkout methods are advertised in the footer. */
  footerPaymentMethods?: StoreFooterPaymentMethods;
  /** Owner controls for the auto content-pages footer column. */
  footerContentPages?: StoreFooterContentPages;
  announcement?: StoreAnnouncement;
  campaignStrip?: StoreCampaignStrip;
  utilityBar?: StoreUtilityBar;
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

/**
 * One of the store's own pages, as the storefront links to it.
 *
 * Every published page is listed, not only the footer's: the checkout resolves
 * its terms page against this list, and the trust strip looks here for a returns
 * policy. `footer` says which ones the footer column shows — a merchant who
 * keeps their terms out of the footer still has terms.
 */
export interface ContentPageLink {
  _id: string;
  slug: string;
  title: string;
  sortOrder?: number;
  /** Unset reads as listed — every page stored before the flag existed. */
  footer?: boolean;
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
  /**
   * The campaign's own landing page (`/campaigns/<slug>`).
   *
   * Null on a campaign written before that page existed — `campaignHref` falls
   * back to the full listing for those rather than linking to a 404.
   */
  slug?: string | null;
  name: string;
  banner?: StorefrontImage | null;
  type: string;
  value: number;
  scope: string;
  /** Target ids (category/product scope) — used to build the strip's link. */
  targets?: string[];
  endsAt?: string;
}

/**
 * `GET …/campaigns/{campaignSlug}` — the landing page's header.
 *
 * `live` is the server's answer, not a date comparison the page makes: whether a
 * sale is on is decided against the server's clock, which is also what prices the
 * catalogue. A page that worked it out from `startsAt` could promise a discount
 * the pricer is not applying.
 */
export interface StoreCampaignDetail {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  banner?: StorefrontImage | null;
  type: string;
  value: number;
  scope: string;
  startsAt: string;
  endsAt: string;
  live: boolean;
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
  /**
   * The variant sold, when the line is one. Undeclared here until the browser `Purchase` needed
   * it — the server has always sent it (`shopperOrderItem`), and a missing declaration meant a
   * variant line silently reported its bare `productId` as the Meta content id while the CAPI
   * half reported `productId:variantId`. Two ids for one sellable thing is a broken catalogue
   * match, not a cosmetic difference.
   */
  variantId?: string;
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
  /** Merchant wording frozen at order time; unset for translated `cod`/`bank`. */
  paymentMethodTitle?: string;
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
    history?: { status: string; label?: string; group?: string; at?: string }[];
  };
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
}

export interface PlaceOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  /** Delivery (default) or in-store pickup. Pickup drops the delivery address. */
  fulfillmentType?: "delivery" | "pickup";
  shippingAddress: ShippingAddress;
  /** A method id from `store.allowedPaymentMethods`. */
  paymentMethod: string;
  notes?: string;
  couponCode?: string;
  /** Shopper accepted the store's terms (required when `checkout.termsRequired`). */
  termsAccepted?: boolean;
  /**
   * Answers to the merchant's own checkout fields, keyed by field `key`. Stored
   * on the order as inert labelled data; never an input to any total.
   */
  customFieldAnswers?: Record<string, string>;
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
  /**
   * The landing page and ad tags this visit came through (`lib/storefront-attribution.ts`).
   * Optional for the same reason as `meta`; the server keeps the page only when it is this
   * store's landing page, and stores it for the merchant alone.
   */
  source?: {
    pageId?: string;
    utm?: Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
  };
}

/**
 * The buyer's read-only view of one order, from a tracking link. Deliberately
 * narrower than `StorefrontOrder`: no merchant cost, no ledger refs, no phone.
 */
export interface TrackedOrder {
  orderNumber: string;
  status: string;
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod: string;
  /** Merchant wording frozen at order time; unset for translated `cod`/`bank`. */
  paymentMethodTitle?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  placedAt?: string;
  items: { productName: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  shippingCharged: number;
  totalAmount: number;
  /** The advance already paid — one number; the merchant's leg split never ships. */
  prepaidAmount: number;
  /** Still owed: `totalAmount - prepaidAmount`, 0 once settled or refunded. */
  amountDue: number;
  shipTo: { name: string; area?: string; district?: string };
  courier?: {
    name?: string;
    trackingCode?: string;
    trackingUrl?: string;
    normalizedStatus?: string;
    history: { status: string; label?: string; group?: string; at?: string }[];
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
  getCampaign: (slug: string, campaignSlug: string) =>
    sfFetch<StoreCampaignDetail>(slug, `/campaigns/${encodeURIComponent(campaignSlug)}`),
  listPages: (slug: string) =>
    sfFetch<ContentPageLink[]>(slug, "/pages"),
  getPage: (slug: string, pageSlug: string) =>
    sfFetch<ContentPageView>(slug, `/pages/${pageSlug}`),
  /**
   * Builder section products, from the browser — the editor preview re-querying
   * a section whose products changed before the page was saved. At most
   * `MAX_SECTION_DATA_REQUESTS` per call; the server read batches a whole page
   * instead (`getSectionData` in `lib/storefront-server.ts`).
   */
  sectionData: (slug: string, requests: readonly ProductsDataRequest[]) =>
    sfFetch<{ results: Record<string, SectionData> }>(
      slug,
      `/section-data${buildQuery({ r: JSON.stringify(requests) })}`,
    ),

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
