// coding-standard: maintained

import type { HomeSectionId } from "@/lib/storefront-home-sections";

/**
 * Ready-made whole-store themes — one click instead of ten pickers.
 *
 * **A theme is layout and colour only.** It never carries content: no hero
 * slides, trust-badge copy, footer link groups, menu items or announcement
 * text. Those are the merchant's own work, and a theme that overwrote them
 * would turn a styling choice into data loss.
 *
 * Applying one **stamps** these values into the draft; the storefront then
 * renders from `theme`/`templates` exactly as it would for a hand-tuned store.
 * Nothing resolves a theme at render time, so a theme edited here can never
 * silently repaint a live shop — `appliedThemeId` is provenance for the editor,
 * not configuration.
 *
 * Two keys are deliberately absent from every manifest:
 * - **`hero`** (slides vs. static banner) — forcing "banner" would hide the
 *   slides a merchant had already built.
 * - **`headerMenu`** (collections vs. custom links) — which is a content
 *   decision about their own menu, not a look.
 */
export interface StoreThemeManifest {
  id: string;
  label: string;
  /** One line, from the shop's side — what it looks like, not what it sets. */
  description: string;
  /** The `theme.preset` this look aligns to, so the Brand part stays coherent. */
  preset: string;
  brandColor: string;
  accentColor: string;
  /** `templates.*` ids. Keys not listed here are left as the merchant had them. */
  templates: Record<string, string>;
  homepageSections: HomeSectionId[];
}

export const STORE_THEMES: StoreThemeManifest[] = [
  {
    id: "classic-shop",
    label: "Classic Shop",
    description: "Familiar and dense — hero card, category row, two product rails",
    preset: "default",
    brandColor: "#111827",
    accentColor: "#2563eb",
    templates: {
      header: "classic",
      footer: "columns",
      productCard: "standard",
      cardActions: "add-buy",
      home: "classic",
      collection: "grid-4",
      pagination: "pages",
      product: "gallery-left",
      checkout: "single-page",
    },
    homepageSections: ["hero", "categories", "featured", "latest"],
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Quiet and typographic — lots of space, buttons only on hover",
    preset: "minimal",
    brandColor: "#0f172a",
    accentColor: "#64748b",
    templates: {
      header: "centered",
      footer: "simple",
      productCard: "compact",
      cardActions: "reveal",
      home: "minimal",
      collection: "grid-3",
      pagination: "load-more",
      product: "gallery-top",
      checkout: "single-page",
    },
    homepageSections: ["hero", "categories", "featured"],
  },
  {
    id: "bold-market",
    label: "Bold Market",
    description: "Loud and fast — big type, Buy now first, endless scrolling",
    preset: "bold",
    brandColor: "#dc2626",
    accentColor: "#f59e0b",
    templates: {
      header: "classic",
      footer: "rich",
      productCard: "bold",
      cardActions: "buy-first",
      home: "hero-split",
      collection: "grid-4",
      pagination: "infinite",
      product: "sticky-bar",
      checkout: "multi-step",
    },
    homepageSections: ["hero", "trust", "featured", "promo", "latest"],
  },
  {
    id: "boutique",
    label: "Boutique",
    description: "Premium and calm — filters beside the grid, one gentle button",
    preset: "elegant",
    brandColor: "#4c1d95",
    accentColor: "#a78bfa",
    templates: {
      header: "centered",
      footer: "rich",
      productCard: "standard",
      cardActions: "add",
      home: "minimal",
      collection: "sidebar",
      pagination: "pages",
      product: "gallery-left",
      checkout: "single-page",
    },
    homepageSections: ["hero", "categories", "featured", "trust"],
  },
];

export const getStoreTheme = (id?: string): StoreThemeManifest | undefined =>
  STORE_THEMES.find((t) => t.id === id);

/** What a theme apply is allowed to touch. Both default on in the editor. */
export interface ThemeApplyScope {
  layout: boolean;
  colors: boolean;
}

/**
 * How far a store has drifted from the theme it last applied, counted over the
 * keys that theme actually owns — so a merchant who changed their footer text
 * (which no theme sets) is still "on" their theme, while one who switched the
 * product page away from it is not.
 */
export function themeDrift(
  theme: StoreThemeManifest,
  current: {
    brandColor: string;
    accentColor: string;
    templates: Record<string, string>;
    homepageSections: string[] | null;
  },
): number {
  let drift = 0;
  if (current.brandColor !== theme.brandColor) drift += 1;
  if (current.accentColor !== theme.accentColor) drift += 1;
  for (const [key, value] of Object.entries(theme.templates)) {
    if (current.templates[key] !== value) drift += 1;
  }
  // `null` means the merchant never reordered, which for an applied theme is
  // impossible (applying writes the order) — treat it as drifted rather than
  // silently equal.
  const sections = current.homepageSections;
  if (!sections || sections.join() !== theme.homepageSections.join()) drift += 1;
  return drift;
}
