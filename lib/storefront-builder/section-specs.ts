// coding-standard: maintained
import type { SectionDefinition } from "./field-specs";

/**
 * Bumped when the manifest's overall shape changes — not when a section is
 * added or a section's own `v` moves.
 */
export const SECTION_MANIFEST_VERSION = 1;

/**
 * Every section type the Storefront Builder renders, and the exact shape of its
 * settings. **The frontend owns this vocabulary**
 * (`inventory-backend/docs/plan/storefront-builder.md` §5.3); the backend only
 * refuses what it does not describe.
 *
 * Rules, each one enforced by something that fails loudly:
 *  - **Plain data, `import type` only.** `scripts/gen-section-manifest.mjs`
 *    loads this file with Node's type stripping, which cannot follow a runtime
 *    import or an `@/` alias.
 *  - **After any edit run `pnpm gen:section-manifest`** and commit the
 *    regenerated backend file in the backend repo. `pnpm verify` runs
 *    `verify:section-manifest`, which fails while the two disagree.
 *  - **Bump a section's `v` when a stored instance would stop validating** —
 *    a removed setting, a narrowed range, a new required field. The backend
 *    refuses any other version, so an unbumped breaking change turns every
 *    saved page carrying that section into a failed save.
 */
/**
 * A product section's own card photo frame and fit. Both optional: unset follows
 * the store's Customize → Product cards choice (`templates.imageRatio` /
 * `imageFit`, same ids), set applies to that section's cards alone. Added to
 * existing sections without a `v` bump — an optional setting leaves every
 * saved instance valid.
 */
const CARD_PHOTO = {
  cardImageRatio: { type: "enum", values: ["square", "portrait", "landscape", "tall"], optional: true },
  cardImageFit: { type: "enum", values: ["fit", "crop"], optional: true },
} as const;

/** An icon a row or card may carry — names from `components/storefront/sf-icons.tsx`. */
/**
 * A product row's link to where its products live, and the heading it takes
 * when the merchant typed none — the classic home page's rows, moved as they
 * were (plan §17, Phase 5 step 5). `storeHeading` names the row in the
 * shopper's language (`featured`, `newArrivals`, `selected`) or after its
 * collection; `viewAll` draws the link, worded "View all" unless `ctaLabel` is
 * set, to `ctaHref` or else the row's collection or the catalogue. Both unset on
 * a new section, which shows only the merchant's words.
 */
const STORE_ROW = {
  storeHeading: { type: "enum", values: ["featured", "newArrivals", "selected", "collection"], optional: true },
  viewAll: { type: "boolean", optional: true },
} as const;

const ICON = {
  type: "enum",
  values: [
    "truck", "shield", "tag", "check", "coins", "box", "clock", "phone",
    "star", "heart", "lock", "card", "bolt", "mapPin", "receipt", "home",
  ],
  optional: true,
} as const;

export const SECTION_SPECS = {
  hero: {
    v: 1,
    pages: "all",
    settings: {
      layout: { type: "enum", values: ["card", "open", "full-bleed"] },
      /** Where the type sits, on every layout — card, open and full-bleed alike. */
      align: { type: "enum", values: ["left", "center"], optional: true },
      /*
       * The hero's box, and the phone's own where it is set. Unset keeps the
       * shape each layout has always drawn: 16:9 then 4:3 past the breakpoint on
       * a card, 4:3 open, and on full-bleed a `min-height` floor rather than a
       * shape at all — which is why setting this takes that floor away.
       *
       * A SECTION setting, not a per-slide one: the rotating hero stacks every
       * slide in one grid cell, so per-slide shapes would only make the box as
       * tall as the tallest slide.
       */
      frame: {
        type: "enum",
        values: ["21:9", "16:9", "4:3", "1:1", "4:5", "9:16"],
        responsive: true,
        optional: true,
      },
      /*
       * Where the picture and the copy sit relative to each other. Two settings
       * and not one responsive one, because the two devices start from opposite
       * defaults — the picture is second on a desktop card and first on a phone —
       * and a responsive value inherits the desktop's until it is set, which
       * would move every existing hero's photograph below the fold.
       *
       * Card and open only. A full-bleed hero's picture is its background.
       */
      imageSide: { type: "enum", values: ["left", "right"], optional: true },
      mobileFirst: { type: "enum", values: ["picture", "text"], optional: true },
      /**
       * Full-bleed only: how much of the slide's copy a phone shows. The phone
       * has always drawn the headline alone, which is `title-only`; `full` adds
       * the badge and the subtitle back, sized for a phone.
       */
      mobileCopy: { type: "enum", values: ["full", "title-only"], optional: true },
      /*
       * The classic home hero, for a hero moved from it (plan §17, Phase 5 step 5);
       * all unset on a new hero. `slideshow` rotates even one slide, as the home
       * page's slides always did. The rest describe its banner hero, drawn from the
       * first slide: `storeBanner` shows the store banner where the slide has no
       * picture; `storeWords` keeps the store's name as a visible title and words
       * both buttons in the shopper's language ("Shop now", "Browse categories" —
       * "Start shopping" full width), each going to the catalogue without a link;
       * `campaignBadge` shows the running offer where the slide has no badge;
       * `promises` lists the store's promises under a card.
       */
      slideshow: { type: "boolean", optional: true },
      storeBanner: { type: "boolean", optional: true },
      storeWords: { type: "boolean", optional: true },
      campaignBadge: { type: "boolean", optional: true },
      promises: { type: "boolean", optional: true },
    },
    // The limits mirror the home hero's slides (`heroSlidesSchema`), so a
    // store's slides move onto a builder hero unchanged.
    blocks: {
      max: 5,
      settings: {
        image: { type: "image", optional: true },
        mobileImage: { type: "image", optional: true },
        focal: { type: "focal", responsive: true, optional: true },
        imageFit: { type: "enum", values: ["fit", "crop"], optional: true },
        // 60, the home banner hero's badge limit; its slides allow 40.
        badge: { type: "string", max: 60, optional: true },
        title: { type: "string", max: 90, optional: true },
        subtitle: { type: "string", max: 160, optional: true },
        buttonLabel: { type: "string", max: 30, optional: true },
        link: { type: "url", optional: true },
        /** A second button, on any card or open slide (decision D3). */
        secondaryLabel: { type: "string", max: 30, optional: true },
        secondaryLink: { type: "url", optional: true },
        /* Last, and after BOTH buttons. Spec order is the order the editor
           draws these controls in (`settings-fields.tsx` maps
           `Object.entries(specs)`), and sitting between `link` and
           `secondaryLabel` split the button pair down the middle of the panel. */
        hideTextOnMobile: { type: "boolean", optional: true },
      },
    },
  },
  "rich-text": {
    v: 1,
    pages: "all",
    settings: {
      body: { type: "richText", maxBytes: 200_000 },
    },
  },
  /**
   * A content page's body in the store's content frame — the core section of a
   * page moved from the Content screen (plan §6, §17 Phase 5 step 6). `body` is
   * the page's own text in whichever format it was stored: rich text, or the
   * markdown the CMS pages have always accepted (`ContentBodyView` reads both).
   */
  "content-body": {
    v: 1,
    pages: ["content"],
    settings: {
      title: { type: "string", max: 160 },
      body: { type: "string", max: 200_000 },
      /** The page's own "Last updated" date, kept from before the move. */
      updatedAt: { type: "date", optional: true },
      /**
       * The store's `templates.contentLayout` become a section setting, same
       * ids. Unset means "whatever the store's template says".
       *
       * Unlike the other core-section layouts, the store-wide value it falls
       * back to still has a Customize panel — `ContentFrame` also wraps the
       * ORDER TRACKING page, which has no builder page of its own, so the
       * setting is genuinely site-wide and this is only the per-page opt-out.
       */
      layout: {
        type: "enum",
        values: ["centered", "banner", "panel", "editorial"],
        optional: true,
      },
    },
  },
  /**
   * The cart, on a cart page that has moved onto the builder (plan §6, §17
   * Phase 5 step 7b). One core section per system page: it cannot be removed or
   * added twice, and the merchant's own sections sit above and below it.
   *
   * `layout` is the store's `templates.cartLayout` become a section setting.
   * Unset means "whatever the store's template says", so a cart page built
   * before the merchant ever opened this control draws exactly as it did.
   */
  "cart-lines": {
    v: 1,
    pages: ["cart"],
    settings: {
      layout: {
        type: "enum",
        values: ["panel", "compact", "cards", "editorial"],
        optional: true,
      },
    },
  },
  /** The checkout, on a checkout page that has moved onto the builder. */
  "checkout-form": {
    v: 1,
    pages: ["checkout"],
    settings: {
      layout: {
        type: "enum",
        values: ["single", "multi", "guided", "editorial"],
        optional: true,
      },
    },
  },
  /**
   * The account area, on an account page that has moved onto the builder.
   *
   * `layout` is the store's `templates.accountLayout` become a section setting,
   * in the SAME ids Customize stores (§6). Unset means "whatever the store's
   * template says", so an account page built by the migration draws exactly as
   * it did. What the area *shows* is the shopper's own data, and whether it
   * exists at all is a page control — neither is a setting here.
   */
  "account-area": {
    v: 1,
    pages: ["account"],
    settings: {
      layout: {
        type: "enum",
        values: ["sidebar", "tabs", "panel", "editorial"],
        optional: true,
      },
    },
  },
  /** The search results, on a search page that has moved onto the builder. */
  "search-results": {
    v: 1,
    pages: ["search"],
    settings: {},
  },
  /**
   * A collection's products, on the collection page once it is on the builder.
   *
   * `layout` and `pagination` are the store's `templates.collection` and
   * `templates.pagination` become section settings, in the SAME ids Customize
   * stores (§6); unset means "whatever the store's template says".
   *
   * `pagination` is the one here that is NOT only about this page: the search
   * results read the same store template. A merchant who sets it on this
   * section moves the collection page alone and leaves search on the store's
   * choice — which is the point of a page-level override, and why the field's
   * hint says which page it moves.
   */
  "collection-grid": {
    v: 1,
    pages: ["collection"],
    settings: {
      layout: {
        type: "enum",
        values: ["grid-3", "grid-4", "sidebar"],
        optional: true,
      },
      pagination: {
        type: "enum",
        values: ["pages", "infinite", "load-more"],
        optional: true,
      },
    },
  },
  /**
   * The product itself, on the product page once it is on the builder.
   * `hideRelated` drops its own "You may also like" row, for a page where the
   * merchant places a Related products section instead; unset keeps the row,
   * which is what every page moved from the classic product page draws.
   *
   * `layout` is the store's `templates.product` become a section setting, in
   * the SAME ids Customize stores and the same ids `single-product`'s
   * `galleryLayout` already uses. Unset means "whatever the store's template
   * says". It carries the third value `sticky-bar`, which `galleryLayout` does
   * not: a landing page's single product is one block on a longer page, while
   * this is the product page itself.
   */
  "product-main": {
    v: 1,
    pages: ["product"],
    settings: {
      layout: {
        type: "enum",
        values: ["gallery-left", "gallery-top", "sticky-bar"],
        optional: true,
      },
      hideRelated: { type: "boolean", optional: true },
    },
  },
  /**
   * Products like the one on the page — its collection's, else the newest — as
   * the product page's own row draws them. Product page only: it needs a product
   * to be like. `limit` unset shows four, the built-in row's number.
   */
  "related-products": {
    v: 1,
    pages: ["product"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      limit: { type: "number", min: 1, max: 8, int: true, optional: true },
    },
  },
  faq: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
    },
    blocks: {
      max: 30,
      settings: {
        question: { type: "string", min: 1, max: 200 },
        answer: { type: "string", min: 1, max: 2000 },
      },
    },
  },
  "call-to-action": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", min: 1, max: 120 },
      text: { type: "string", max: 400, optional: true },
      buttonLabel: { type: "string", min: 1, max: 40 },
      buttonHref: { type: "url" },
      align: { type: "enum", values: ["left", "center"], responsive: true, optional: true },
    },
  },
  "product-grid": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      source: { type: "enum", values: ["featured", "newest", "category", "tag", "manual"] },
      categoryId: { type: "ref", to: "category", optional: true },
      tagIds: { type: "refs", to: "tag", max: 10, optional: true },
      productIds: { type: "refs", to: "product", max: 24, optional: true },
      limit: { type: "number", min: 1, max: 24, int: true },
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      ...CARD_PHOTO,
      ...STORE_ROW,
      ctaLabel: { type: "string", max: 40, optional: true },
      ctaHref: { type: "url", optional: true },
      /** Drop the cards a last, short row would leave alone. A hand-picked row keeps every pick. */
      wholeRows: { type: "boolean", optional: true },
    },
  },
  "promises-band": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      /** The store's own promises (Customize → Footer) in place of the blocks, as the classic home band. */
      storePromises: { type: "boolean", optional: true },
    },
    blocks: {
      max: 6,
      settings: {
        text: { type: "string", min: 1, max: 120 },
        // Unset cycles truck, shield, tag.
        icon: ICON,
      },
    },
  },
  "image-text": {
    v: 1,
    pages: "all",
    settings: {
      image: { type: "image" },
      imageSide: { type: "enum", values: ["left", "right"], optional: true },
      imageRatio: { type: "enum", values: ["4:5", "1:1", "4:3", "16:9"], optional: true },
      badge: { type: "string", max: 60, optional: true },
      heading: { type: "string", min: 1, max: 160 },
      text: { type: "string", max: 600, optional: true },
      buttonLabel: { type: "string", max: 40, optional: true },
      buttonHref: { type: "url", optional: true },
      secondaryLabel: { type: "string", max: 40, optional: true },
      secondaryHref: { type: "url", optional: true },
    },
  },
  "shop-by-tag": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      tagIds: { type: "refs", to: "tag", max: 20 },
      /** The classic home row's heading — "Shop by age" in the shopper's language when Heading is empty. */
      storeHeading: { type: "enum", values: ["shopByAge"], optional: true },
    },
  },
  "collections-row": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      /** Unset or empty lists every top-level collection. */
      categoryIds: { type: "refs", to: "category", max: 30, optional: true },
      style: { type: "enum", values: ["card", "plain"], optional: true },
      layout: { type: "enum", values: ["strip", "grid"], optional: true },
      columns: { type: "number", min: 2, max: 6, int: true, optional: true },
      // Its own setting rather than a responsive `columns`: a phone takes 2–4,
      // not the desktop's 2–6 (`resolveHomeCollections`).
      mobileColumns: { type: "number", min: 2, max: 4, int: true, optional: true },
      align: { type: "enum", values: ["left", "center", "right"], optional: true },
      showLabels: { type: "boolean", optional: true },
    },
  },
  "selected-products": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      source: { type: "enum", values: ["featured", "newest", "category", "tag", "manual"] },
      categoryId: { type: "ref", to: "category", optional: true },
      tagIds: { type: "refs", to: "tag", max: 10, optional: true },
      productIds: { type: "refs", to: "product", max: 6, optional: true },
      limit: { type: "number", min: 1, max: 6, int: true },
      ctaLabel: { type: "string", max: 40, optional: true },
      ctaHref: { type: "url", optional: true },
      ...CARD_PHOTO,
      ...STORE_ROW,
    },
  },
  "product-carousel": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      source: { type: "enum", values: ["featured", "newest", "category", "tag", "manual"] },
      categoryId: { type: "ref", to: "category", optional: true },
      tagIds: { type: "refs", to: "tag", max: 10, optional: true },
      productIds: { type: "refs", to: "product", max: 24, optional: true },
      limit: { type: "number", min: 1, max: 24, int: true },
      ctaLabel: { type: "string", max: 40, optional: true },
      ctaHref: { type: "url", optional: true },
      ...CARD_PHOTO,
      ...STORE_ROW,
    },
  },
  "campaign-offers": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      /** "Current offers" in the shopper's language when Heading is empty, as the classic home row. */
      storeHeading: { type: "enum", values: ["campaignOffers"], optional: true },
    },
  },
  "category-tiles": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      /** Unset or empty lists every top-level collection. */
      categoryIds: { type: "refs", to: "category", max: 30, optional: true },
      mode: { type: "enum", values: ["tile", "overlay", "circle", "disc"], optional: true },
      layout: { type: "enum", values: ["strip", "grid"], optional: true },
      columns: { type: "number", min: 2, max: 6, int: true, optional: true },
      mobileColumns: { type: "number", min: 2, max: 4, int: true, optional: true },
      align: { type: "enum", values: ["left", "center", "right"], optional: true },
      showLabels: { type: "boolean", optional: true },
    },
  },
  "category-promo-cards": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      shape: { type: "enum", values: ["stacked", "split"], responsive: true, optional: true },
      side: { type: "enum", values: ["left", "right", "alternate"], responsive: true, optional: true },
      /** The picture's share of a split card, in percent. */
      split: { type: "number", min: 20, max: 80, int: true, responsive: true, optional: true },
      hideText: { type: "boolean", responsive: true, optional: true },
      /** The picture's height in px; replaces the ratio. */
      height: { type: "number", min: 20, max: 800, int: true, responsive: true, optional: true },
      flow: { type: "enum", values: ["wrap", "scroll"], responsive: true, optional: true },
      perRow: { type: "number", min: 1, max: 4, int: true, responsive: true, optional: true },
      ratio: { type: "enum", values: ["16:9", "4:3", "1:1", "3:4"], optional: true },
      radius: { type: "number", min: 0, max: 40, int: true, optional: true },
      arrows: { type: "boolean", optional: true },
      /** Every card gets a button — "Shop now" in the shopper's language where the card has no label — as on the classic home. */
      storeWords: { type: "boolean", optional: true },
    },
    blocks: {
      max: 4,
      settings: {
        categoryId: { type: "ref", to: "category" },
        title: { type: "string", max: 80, optional: true },
        description: { type: "string", max: 240, optional: true },
        image: { type: "image", optional: true },
        buttonLabel: { type: "string", max: 40, optional: true },
        buttonHref: { type: "url", optional: true },
      },
    },
  },
  /**
   * The embedded order form (backend plan storefront-builder §9): one product,
   * its options and quantity, and the store's own checkout rules — the order is
   * placed on the page, with no hop to /checkout. Landing pages only.
   */
  "order-form": {
    v: 1,
    pages: ["landing", "product"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      text: { type: "string", max: 400, optional: true },
      /** On the product page, the page's own product. */
      productId: { type: "ref", to: "product", fromPage: ["product"] },
      coupon: { type: "boolean", optional: true },
    },
  },
  /**
   * One product, bought on the page: the product page's photos, options, price
   * and buy controls. Landing pages only for now; the plan also names home,
   * which is not a builder page until the store migration.
   */
  "single-product": {
    v: 1,
    pages: ["landing"],
    settings: {
      productId: { type: "ref", to: "product" },
      /** Unset follows the store's `templates.product` (same ids). */
      galleryLayout: { type: "enum", values: ["gallery-left", "gallery-top"], optional: true },
      hideDescription: { type: "boolean", optional: true },
    },
  },
  /**
   * A product's price as an offer: the price, the struck original and the
   * discount, under the merchant's headline. No "only N left" line — the
   * glossary has no Bangla wording for it (owner decision, plan §17).
   */
  "offer-pricing": {
    v: 1,
    pages: ["landing", "product"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      text: { type: "string", max: 400, optional: true },
      /** On the product page, the page's own product. */
      productId: { type: "ref", to: "product", fromPage: ["product"] },
    },
  },
  /**
   * A bar pinned to the bottom of a phone screen: the product's name and price,
   * and a button to the page's order form — or, with none, to the product page
   * (on the product page itself: back up to its buy buttons). Hidden while an
   * order form is on screen.
   */
  "sticky-order-bar": {
    v: 1,
    pages: ["landing", "product"],
    settings: {
      /** On the product page, the page's own product. */
      productId: { type: "ref", to: "product", fromPage: ["product"] },
      buttonLabel: { type: "string", max: 30, optional: true },
    },
  },
  /**
   * What customers said, as the merchant entered it: words, stars, a photo, or a
   * screenshot of the review. A review needs a name, and words or a screenshot
   * to show. Never labelled "verified" (plan §8).
   */
  testimonials: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
    },
    blocks: {
      max: 12,
      settings: {
        name: { type: "string", min: 1, max: 80 },
        text: { type: "string", max: 600, optional: true },
        rating: { type: "number", min: 1, max: 5, int: true, optional: true },
        photo: { type: "image", optional: true },
        /** A screenshot of the review. */
        image: { type: "image", optional: true },
      },
    },
  },
  benefits: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      /** Past the breakpoint; a phone takes one column. */
      columns: { type: "number", min: 1, max: 4, int: true, optional: true },
    },
    blocks: {
      max: 12,
      settings: {
        icon: ICON,
        title: { type: "string", min: 1, max: 80 },
        text: { type: "string", max: 300, optional: true },
      },
    },
  },
  "how-to-order": {
    v: 1,
    pages: ["landing"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
    },
    blocks: {
      max: 8,
      settings: {
        title: { type: "string", min: 1, max: 80 },
        text: { type: "string", max: 300, optional: true },
      },
    },
  },
  /**
   * A YouTube or Facebook video behind a click-to-load cover. Any other link
   * draws nothing: an embed is provider + id from an allowlist (plan §11).
   */
  video: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      url: { type: "url" },
      /** The play button's and player's accessible name. */
      label: { type: "string", min: 1, max: 120 },
      poster: { type: "image", optional: true },
      ratio: { type: "enum", values: ["16:9", "9:16", "1:1"], optional: true },
    },
  },
  /**
   * One picture across the page — a promotion strip, a collection banner — with
   * the merchant's words and a button over it, or the whole picture as a link
   * when there is no button. `frame` crops it to a shape around `focal`; unset
   * shows the picture at its own proportions.
   */
  "image-banner": {
    v: 1,
    pages: "all",
    settings: {
      image: { type: "image" },
      mobileImage: { type: "image", optional: true },
      /** The picture's words for screen readers and search engines. */
      alt: { type: "string", max: 160, optional: true },
      frame: { type: "enum", values: ["4:1", "3:1", "21:9", "16:9", "4:3", "1:1"], responsive: true, optional: true },
      focal: { type: "focal", responsive: true, optional: true },
      heading: { type: "string", max: 120, optional: true },
      text: { type: "string", max: 240, optional: true },
      align: { type: "enum", values: ["left", "center"], optional: true },
      buttonLabel: { type: "string", max: 40, optional: true },
      link: { type: "url", optional: true },
    },
  },
  /**
   * Pictures in a grid, one block each, with an optional caption and link. `frame`
   * gives every tile one shape (cropped around the middle); unset keeps each
   * picture's own proportions. `columns` past the breakpoint; a phone takes its
   * own value, else two (or one, when the desktop has one).
   */
  gallery: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      frame: { type: "enum", values: ["1:1", "4:5", "3:4", "4:3", "16:9"], optional: true },
    },
    blocks: {
      max: 24,
      settings: {
        image: { type: "image" },
        alt: { type: "string", max: 160, optional: true },
        caption: { type: "string", max: 120, optional: true },
        link: { type: "url", optional: true },
      },
    },
  },
  /**
   * Empty room between two sections, optionally split by a thin line in the
   * theme's border colour. `space` is the band's height in px; the section's
   * own frame adds no padding, so the height is exactly what the merchant set.
   */
  spacer: {
    v: 1,
    pages: "all",
    settings: {
      space: { type: "number", min: 4, max: 240, int: true, responsive: true },
      line: { type: "boolean", optional: true },
    },
  },
  countdown: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      endsAt: { type: "date" },
      campaignId: { type: "ref", to: "campaign", optional: true },
    },
  },
} as const satisfies Record<string, SectionDefinition>;

export type SectionType = keyof typeof SECTION_SPECS;
