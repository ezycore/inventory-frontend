// coding-standard: maintained

import type { StoreDesign } from "@/lib/storefront-design-tokens";
import type { HomeSectionId } from "@/lib/storefront-home-sections";

/**
 * What each home template offers, as data — no React.
 *
 * The component map lives beside the components
 * (`components/storefront/home/templates/registry.tsx`) and reads its order and
 * capability from here, so the admin editor can ask "which blocks does this
 * look have?" without importing a single storefront component into the admin
 * bundle. Same split as `storefront-home-sections` vs. its renderer, for the
 * same reason.
 *
 * `available` is the contract: a template only offers blocks it has a design
 * for. Listing one it does not implement would put a block in the merchant's
 * Hidden list that could never be switched on.
 */
export interface HomeTemplateMeta {
  id: string;
  /** Merchant-facing name, shown in the Layout picker. */
  label: string;
  /** One line describing the result, from the shop's side. */
  description: string;
  available: HomeSectionId[];
  defaultOrder: HomeSectionId[];
  /** Typeface / type scale / density / corners this look ships with. */
  design: StoreDesign;
}

export const HOME_TEMPLATE_META: HomeTemplateMeta[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Hero card, category chips, product rails",
    available: ["hero", "categories", "featured", "latest", "trust", "promo"],
    defaultOrder: ["hero", "categories", "featured", "latest"],
    design: { font: "sans", scale: "normal", density: "normal", radius: "soft" },
  },
  {
    id: "hero-split",
    label: "Hero Split",
    description: "Split hero, trust row, promo tiles",
    available: ["hero", "categories", "featured", "latest", "trust", "promo"],
    defaultOrder: ["hero", "trust", "featured", "promo"],
    design: { font: "sans", scale: "normal", density: "normal", radius: "soft" },
  },
  {
    id: "superstore",
    label: "Superstore",
    description: "Promo beside department shortcuts, deals first, dense grids",
    // No `promo`: this look already closes with product, and two promo tiles
    // under a deals rail is the same message twice.
    available: ["hero", "categories", "deals", "featured", "latest", "trust"],
    defaultOrder: ["hero", "trust", "deals", "categories", "featured", "latest"],
    // Familiar rather than characterful, small type, tight grid, near-square
    // corners: a general-retail shop is judged on breadth and price, and every
    // vertical pixel of styling competes with another row of product.
    design: { font: "sans", scale: "compact", density: "dense", radius: "sharp" },
  },
  {
    id: "lookbook",
    label: "Lookbook",
    description: "Full-bleed opening image, collection panels, large quiet product tiles",
    // No `deals` and no `promo`: a shop selling on how things look does not
    // lead with a discount rail, and neither block has an editorial treatment.
    available: ["hero", "categories", "featured", "latest", "trust"],
    defaultOrder: ["hero", "categories", "featured", "latest", "trust"],
    // Serif at a large scale with air around everything and near-square
    // corners — the vocabulary of a printed lookbook rather than a catalogue.
    design: { font: "serif", scale: "generous", density: "airy", radius: "sharp" },
  },
  {
    id: "grocery",
    label: "Grocery",
    description: "Slim promo bar, departments first, compact shelves",
    available: ["hero", "categories", "deals", "featured", "latest", "trust"],
    // Departments before product: these shoppers know what they came for.
    defaultOrder: ["hero", "categories", "deals", "featured", "trust", "latest"],
    // Familiar sans, small type, tight grid, friendly corners. Speed over
    // beauty — every decorative pixel is a row of shopping the customer has
    // to scroll past on their way to the same six things they buy weekly.
    design: { font: "sans", scale: "compact", density: "dense", radius: "soft" },
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Centered manifesto, quiet product grid",
    // No `latest`, no `promo`: this look is deliberately one short page, and
    // offering blocks it has no design for would be offering a worse version
    // of another template.
    available: ["hero", "categories", "featured", "trust"],
    defaultOrder: ["hero", "categories", "featured"],
    design: { font: "sans", scale: "normal", density: "normal", radius: "soft" },
  },
];

/** Falls back to Classic — the look every store had before templates existed. */
export const getHomeTemplateMeta = (id?: string): HomeTemplateMeta =>
  HOME_TEMPLATE_META.find((t) => t.id === id) ?? HOME_TEMPLATE_META[0];
