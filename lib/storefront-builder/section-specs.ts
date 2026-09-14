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
        // Names from `components/storefront/sf-icons.tsx`; unset cycles truck, shield, tag.
        icon: {
          type: "enum",
          values: [
            "truck", "shield", "tag", "check", "coins", "box", "clock", "phone",
            "star", "heart", "lock", "card", "bolt", "mapPin", "receipt", "home",
          ],
          optional: true,
        },
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
