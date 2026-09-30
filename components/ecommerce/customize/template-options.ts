// coding-standard: maintained

import { MOBILE_TEMPLATE_OPTIONS } from "@/lib/storefront-mobile";

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
  /**
   * **Derived, not written.** The mobile templates are a registry
   * (`lib/storefront-mobile.ts`) whose entries already carry the label and the
   * sentence, so re-typing them here would be a second list to keep in step —
   * and the failure mode is a picker offering an id the storefront cannot draw,
   * or hiding one it can. Adding a mobile template is that one object; this line
   * picks it up. (The other keys below are written out because their options are
   * components, not data.)
   */
  mobile: [...MOBILE_TEMPLATE_OPTIONS],
  home: [
    { value: "classic", label: "Classic", description: "Hero card, category chips, product rails" },
    { value: "hero-split", label: "Hero Split", description: "Split hero and weekly picks" },
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
    { value: "editorial", label: "Editorial", description: "No card, no buttons — just the photo, name and price" },
  ],
  cardActions: [
    { value: "add-buy", label: "Add + Buy now", description: "Two buttons on every card" },
    { value: "add", label: "Add to cart only", description: "One button; shoppers check out from the cart" },
    { value: "icons", label: "Icon buttons", description: "Cart and buy icons, no words" },
    { value: "buy-first", label: "Buy now first", description: "Buy now leads, Add to cart second" },
    { value: "reveal", label: "Show on hover", description: "Buttons appear over the photo; always shown on phones" },
    { value: "icon-only", label: "Single + button", description: "One small add button in the corner" },
  ],
  // Card badges. The first option of each is today's card (and so the seed a
  // store that never touched them gets) — see docs/plan/product-card-badges.md.
  cardTagBadges: [
    { value: "2", label: "Two", description: "Up to two tag badges on each photo" },
    { value: "1", label: "One", description: "Only the most important tag badge" },
    { value: "0", label: "None", description: "No tag badges on cards; tags still show on the product page" },
  ],
  discountBadge: [
    { value: "percent", label: "-25%", description: "The saving as a percentage" },
    { value: "amount", label: "-৳150", description: "The saving as an amount of money" },
    { value: "off", label: "Off", description: "No badge; the crossed-out price still shows the saving" },
  ],
  header: [
    { value: "classic", label: "Classic", description: "Logo, search box and cart on one line, menu underneath" },
    { value: "minimal", label: "Minimal", description: "Logo, menu links and icons on one line — no search box" },
    { value: "centered", label: "Centered", description: "Logo centred, menu underneath" },
    { value: "search-first", label: "Search first", description: "White bar built around a big search box — for large everyday catalogues" },
    { value: "clinical", label: "Search led", description: "A wide plain search field and nothing else — no menu row, no top strip" },
    { value: "boutique", label: "Boutique", description: "Wordmark and an underlined search field, menu on its own row" },
  ],
  footer: [
    { value: "columns", label: "Columns", description: "Brand and contact left, link groups right" },
    { value: "simple", label: "Centered", description: "One centered stack — best with few links" },
    { value: "rich", label: "Trust badges", description: "Your three promises above the columns" },
    { value: "contact", label: "Contact first", description: "Your phone and chat lead the footer" },
    { value: "newsletter", label: "Stay in touch", description: "An email sign-up beside your links" },
  ],
  // Four separate page components. The first two ids predate the layout registry
  // and keep their exact behaviour, so no existing store's checkout moves.
  checkout: [
    { value: "single-page", label: "Single page", description: "Everything on one screen, with the total in a side panel" },
    { value: "multi-step", label: "Multi-step", description: "One step at a time over a running total that follows the shopper — best for big baskets" },
    { value: "guided", label: "One column", description: "Every section open and numbered, large fields, nothing hidden" },
    { value: "editorial", label: "Order first", description: "What they're buying on the left, the form on the right, no boxes" },
  ],
  imageFit: [
    { value: "fit", label: "Full photo", description: "Shows the whole photo; fills extra space with a soft blur of itself" },
    { value: "crop", label: "Cropped", description: "Fills the frame edge-to-edge; trims whatever doesn't fit" },
  ],
  // The FRAME, where `imageFit` decides what happens to a photo that doesn't
  // match it. Square stays first (and so the default) — it is what every store
  // rendered before this existed.
  imageRatio: [
    { value: "square", label: "Square", description: "Equal sides — the safe choice for a mixed catalogue" },
    { value: "portrait", label: "Portrait", description: "Taller than wide — clothing, shoes, bottles" },
    { value: "landscape", label: "Landscape", description: "Wider than tall — furniture, electronics" },
    { value: "tall", label: "Extra tall", description: "Full-length shots — dresses, sarees" },
  ],
  // How the homepage's Category tiles section presents one department. `tile`
  // stays first (and so the default) — `overlay` needs a real photograph on
  // every category, and on a half-photographed catalogue it puts a scrim over a
  // grid of letters.
  categoryTiles: [
    { value: "tile", label: "Name below", description: "Photo on a tinted card with the name underneath" },
    { value: "overlay", label: "Name over photo", description: "Taller photo with the name across the bottom of it" },
    // `tile` already falls back to this shape when NO category has a photo. As
    // an option it is the same row chosen on purpose — a department is a
    // wayfinding target, and a shop with a hundred of them wants a scannable
    // strip of discs above the products rather than seven photographs competing
    // with them.
    { value: "disc", label: "Round icons", description: "A lettered disc per department, name underneath — no photos" },
    // The photo modes above are both rectangles. This is the round one: same
    // pictures, corners gone — which is what a soft catalogue (baby, gifts,
    // beauty) wants, and what `disc` cannot give because it refuses photos.
    { value: "circle", label: "Round photos", description: "Your department photo cropped round, name underneath" },
  ],
  /* The four keys below are WHOLE PAGE LAYOUTS, not variations within one page:
     each id selects a different component. The first option of each is its
     default, and in every case that default is the page the storefront has
     always rendered — so a store that never opens Themes is untouched. */
  // The page SKELETON — the only axis that changes what KIND of site a shop is
  // rather than what it contains. Applies to every page.
  shell: [
    { value: "stacked", label: "Stacked", description: "Header on top, everything in one column beneath it" },
    { value: "rail", label: "Category sidebar", description: "Your departments down the left of every page — for big catalogues" },
  ],
  // The whole cart page.
  cartLayout: [
    { value: "panel", label: "List + panel", description: "Your items on a card with the total in a side panel" },
    { value: "compact", label: "Dense list", description: "Small rows and a total bar that follows the shopper — best for big baskets" },
    { value: "cards", label: "One per card", description: "Each item in its own block with a large photo" },
    { value: "editorial", label: "Big photos", description: "Large photos separated by lines, no boxes" },
  ],
  // Frames for the CMS pages and order tracking.
  contentLayout: [
    { value: "centered", label: "Prose column", description: "A narrow centred column with the title over a line" },
    { value: "banner", label: "Coloured header", description: "A full-width brand banner with the page on a card below" },
    { value: "panel", label: "Two blocks", description: "Title on a tinted block, the page on a card beneath" },
    { value: "editorial", label: "Magazine", description: "A large light title and plain text, no boxes" },
  ],
  // The signed-in account area (components/storefront/account/layouts/).
  accountLayout: [
    { value: "sidebar", label: "Side menu", description: "A sticky column of sections beside the content" },
    { value: "tabs", label: "Tabs", description: "A coloured banner over full-width tabs — best if shoppers reorder often" },
    { value: "panel", label: "Big buttons", description: "Large cards your customer taps into, with a back link — easiest on a phone" },
    { value: "editorial", label: "Plain", description: "A quiet line of links, no cards or icons" },
  ],
};

/** Keys the settings PATCH carries but no picker owns (retired or derived). */
export const RETIRED_TEMPLATE_KEYS = ["search", "cart"] as const;
