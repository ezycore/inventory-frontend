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
