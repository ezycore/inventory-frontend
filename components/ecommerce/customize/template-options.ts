// coding-standard: maintained

/**
 * The catalogue of per-page layout options a merchant can pick in Customize —
 * the admin half of `lib/storefront-templates.ts`, whose `resolveTemplates` maps
 * these kebab-case ids onto the storefront's own names.
 *
 * Descriptions are written from the shop's side, not the schema's: a merchant
 * chooses "Buy now leads, Add to cart second", not "cardActions: buy-first".
 * The first option of each key is its default — `seedTemplates` relies on that.
 */
export interface TemplateOption {
  value: string;
  label: string;
  description?: string;
}

export const TEMPLATE_OPTIONS: Record<string, TemplateOption[]> = {
  home: [
    { value: "classic", label: "Classic", description: "Hero card, category chips, product rails" },
    { value: "hero-split", label: "Hero Split", description: "Split hero, trust row, promo tiles" },
    { value: "minimal", label: "Minimal", description: "Centered manifesto, quiet product grid" },
  ],
  collection: [
    { value: "grid-3", label: "3 per row", description: "Bigger pictures, fewer products in view" },
    { value: "grid-4", label: "4 per row", description: "More products before scrolling" },
    { value: "sidebar", label: "Filters sidebar", description: "Filters pinned beside the grid" },
  ],
  pagination: [
    { value: "pages", label: "Numbered pages", description: "1 · 2 · 3 at the bottom" },
    { value: "infinite", label: "Infinite scroll", description: "Loads two more pages, then a button" },
    { value: "load-more", label: "Load more button", description: "Shoppers ask for each page" },
  ],
  product: [
    { value: "gallery-left", label: "Photos left", description: "Photos beside the price and buttons" },
    { value: "gallery-top", label: "Photos on top", description: "Full-width photos, details below" },
    { value: "sticky-bar", label: "Sticky buy bar", description: "Price and Buy stay pinned while scrolling" },
  ],
  productCard: [
    { value: "standard", label: "Standard", description: "Photo, name, price, button" },
    { value: "compact", label: "Compact", description: "Tighter cards — more per screen" },
    { value: "bold", label: "Bold", description: "Large name and a full-width button" },
  ],
  cardActions: [
    { value: "add-buy", label: "Add + Buy now", description: "Two buttons on every card" },
    { value: "add", label: "Add to cart only", description: "One button; shoppers check out from the cart" },
    { value: "icons", label: "Icon buttons", description: "Cart and buy icons, no words" },
    { value: "buy-first", label: "Buy now first", description: "Buy now leads, Add to cart second" },
    { value: "reveal", label: "Show on hover", description: "Buttons appear over the photo; always shown on phones" },
    { value: "icon-only", label: "Single + button", description: "One small add button in the corner" },
  ],
  header: [
    { value: "classic", label: "Classic", description: "Logo left, menu beside it" },
    { value: "minimal", label: "Minimal", description: "Logo and icons only — no menu row" },
    { value: "centered", label: "Centered", description: "Logo centred, menu underneath" },
  ],
  footer: [
    { value: "columns", label: "Columns", description: "Your link groups side by side" },
    { value: "simple", label: "Simple", description: "One quiet row of links" },
    { value: "rich", label: "Rich", description: "Trust badges above the link columns" },
  ],
  checkout: [
    { value: "single-page", label: "Single page", description: "Everything on one screen" },
    { value: "multi-step", label: "Multi-step", description: "Address, then delivery, then payment" },
  ],
};

/** Keys the settings PATCH carries but no picker owns (retired or derived). */
export const RETIRED_TEMPLATE_KEYS = ["search", "cart"] as const;
