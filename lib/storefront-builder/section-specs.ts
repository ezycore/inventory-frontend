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
      /** Read by the `open` layout only. */
      align: { type: "enum", values: ["left", "center"], optional: true },
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
        badge: { type: "string", max: 40, optional: true },
        title: { type: "string", max: 90, optional: true },
        subtitle: { type: "string", max: 160, optional: true },
        buttonLabel: { type: "string", max: 30, optional: true },
        link: { type: "url", optional: true },
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
    },
  },
  "promises-band": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
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
    },
  },
  "campaign-offers": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
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
    pages: ["landing"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      text: { type: "string", max: 400, optional: true },
      productId: { type: "ref", to: "product" },
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
      /** Unset follows Customize → Product page (`templates.product`, same ids). */
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
    pages: ["landing"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      text: { type: "string", max: 400, optional: true },
      productId: { type: "ref", to: "product" },
    },
  },
  /**
   * A bar pinned to the bottom of a phone screen: the product's name and price,
   * and a button to the page's order form — or to the product page when the page
   * has none. Hidden while an order form is on screen.
   */
  "sticky-order-bar": {
    v: 1,
    pages: ["landing"],
    settings: {
      productId: { type: "ref", to: "product" },
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
