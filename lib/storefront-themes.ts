// coding-standard: maintained
/**
 * Ready-made themes — the store behind Online Store → Themes.
 *
 * **A theme is DATA, never code.** Each entry below is a bundle of values that
 * gets stamped into the merchant's own `theme` + `templates`; the storefront
 * then renders from their settings exactly as it always has and never learns
 * that a theme was involved. That is the whole architecture, and it is what
 * keeps one codebase serving every tenant: a new theme is a row here, not a set
 * of components, so a checkout fix or a new feature is written once rather than
 * once per theme.
 *
 * The corollary: **making themes look more different means widening the token
 * vocabulary, not adding branches.** If a theme you want cannot be expressed
 * here, add an axis to `theme.design` or a `templates.*` option — do not special
 * -case it in a component.
 *
 * **A theme may only write the look.** `theme` + `templates` are replaced
 * wholesale on apply; `copy`, `nav`, `trustBadges`, `promoTiles`, `heroSlides`,
 * `heroBanner`, the logo and the CMS pages are the merchant's and are never
 * touched — see `StorefrontCopy`. `applyThemeToDraft` in `use-customize-draft.ts`
 * is the one place that enforces it.
 *
 * Deliberately NOT stamped, though both are `templates.*` keys:
 *  - `hero` (slides vs banner) and `headerMenu` (collections vs custom) depend on
 *    what content the merchant actually has. A theme that forced `hero: "slides"`
 *    would show the built-in placeholder hero to every shop with no slides, and
 *    one that forced `headerMenu: "collections"` would hide a menu its owner
 *    built by hand. Both are content questions wearing a layout key's clothes.
 *
 * `checkout` USED to be on that list — "a checkout layout is a conversion
 * decision, not a look". That was wrong, and the owner overruled it: leaving it
 * unstamped is most of why four "different" themes still checked out
 * identically. It is stamped now, and it selects one of four whole page
 * components rather than a variation within one.
 */

import type { StoreDesign } from "@/lib/storefront-theme";
import type { HomePresetEntry } from "@/lib/storefront-section-ids";
import type { StoreHomeCollections } from "@/lib/storefront-client";
import {
  APPAREL_SAMPLE,
  BABY_SAMPLE,
  GROCERY_SAMPLE,
  NEUTRAL_SAMPLE,
  PHARMACY_SAMPLE,
  type ThemeSample,
} from "@/lib/storefront-theme-samples";

export interface ReadyMadeTheme {
  id: string;
  label: string;
  /** One line, merchant-facing — what the shop will feel like. */
  tagline: string;
  /** The trades it was drawn for. Marketing, not a gate: anyone can apply any theme. */
  bestFor: string;
  /** Colours the store card previews itself in. */
  brandColor: string;
  accentColor: string;
  design: StoreDesign;
  /** The category row's starting geometry. Applying a theme resets this look. */
  homeCollections: StoreHomeCollections;
  /**
   * The homepage, as an ordered section list. **This is what makes the themes
   * structurally different rather than differently painted** — they compose
   * different sections, not different arrangements of the same four.
   */
  sections: HomePresetEntry[];
  /**
   * Where the open hero's copy sits. Part of the LOOK, so a theme owns it —
   * and Classic sets `"left"` explicitly because Classic is the reset.
   */
  heroAlign?: "left" | "center";
  /**
   * What the PREVIEW fills a merchant's empty shop with — see
   * `storefront-theme-samples.ts`. Required on purpose: a theme that shipped
   * without one would preview another trade's stock, which is the bug this
   * field exists to close.
   */
  sample: ThemeSample;
  /** Only keys a theme is allowed to own — see the note above. */
  templates: {
    home: string;
    header: string;
    footer: string;
    collection: string;
    product: string;
    productCard: string;
    cardActions: string;
    pagination: string;
    imageFit: string;
    imageRatio: string;
    categoryTiles: string;
    accountLayout: string;
    checkout: string;
    contentLayout: string;
    cartLayout: string;
    shell: string;
  };
}

/**
 * The catalogue, **Classic first**.
 *
 * Order is meaningful: Classic is the storefront exactly as it ships, so it is
 * both the honest "this is what you already have" entry and the missing **reset
 * to default** — applying it stamps the built-in values back over whatever a
 * merchant experimented with. `apply-theme.test.ts` asserts that equivalence
 * field by field, because a Classic bundle that drifted from the defaults would
 * silently restyle every shop that was already on it.
 */
export const READY_MADE_THEMES: ReadyMadeTheme[] = [
  {
    id: "classic",
    sample: NEUTRAL_SAMPLE,
    label: "Classic",
    tagline: "The shop as it ships — a clear grid, a simple hero, nothing loud.",
    bestFor: "Any catalogue, and anyone who wants to start over",
    // The `default` colour preset, spelled out. These are values, not a
    // reference to the preset, so the reset does not depend on the preset
    // catalogue staying still.
    brandColor: "#111827",
    accentColor: "#2563eb",
    // `surface: "default"` is load-bearing, not filler: Classic IS the reset, so
    // it has to stamp every axis back — including one added after a merchant may
    // already have chosen a cream ground.
    design: {
      font: "sans",
      surface: "default",
      scale: "md",
      density: "cozy",
      radius: "soft",
      width: "contained",
    },
    homeCollections: { layout: "strip", align: "left" },
    // Spelled out because Classic is the RESET: a merchant who centred their
    // hero and then reached for "start over" must actually get it back.
    heroAlign: "left",
    // `HOME_PRESET_SECTIONS.classic`, spelled out for the same reason.
    sections: [
      "hero-card",
      "category-chips",
      "featured-grid",
      // The retired `latest-grid`: the same grid, sourced newest.
      { type: "featured-grid", config: { source: "newest" } },
    ],
    templates: {
      home: "classic",
      header: "classic",
      footer: "columns",
      collection: "grid-4",
      product: "gallery-left",
      productCard: "standard",
      cardActions: "add-buy",
      pagination: "pages",
      imageFit: "fit",
      imageRatio: "square",
      categoryTiles: "tile",
      // The account area the storefront has always had.
      accountLayout: "sidebar",
      // …and the checkout it has always had.
      checkout: "single-page",
      // …and the prose column its policy pages have always been.
      contentLayout: "centered",
      // …and the cart it has always had.
      cartLayout: "panel",
      // …and the one page skeleton the storefront has always had.
      shell: "stacked",
    },
  },
  {
    id: "fresh-market",
    sample: GROCERY_SAMPLE,
    label: "Fresh Market",
    tagline: "A warm cream market on printed paper — big type, round corners, everything to hand.",
    bestFor: "Grocery, food, household, daily needs",
    /* The exact swatches from the Claude Design mockup (`Fresh Market.dc.html`,
       2026-08-14) — terracotta on parchment. It replaced a leaf-green/citrus
       pair that was chosen to say "grocery" and instead said "the same shop as
       the other three, in green": brand hue was never the thing separating them.
       Olive `#7a8a5e` is the mockup's secondary and is NOT stamped, because
       `accentColor` is aliased to `--primary` in storefront.css and renders
       nowhere — stamping it would be a value that quietly does nothing. */
    brandColor: "#c67139",
    accentColor: "#7a8a5e",
    /* Where this theme now separates itself, in order of how much a shopper
       notices: the GROUND (cream page, cream cards, tan panels — the mockup's
       whole identity, and the one thing no previous axis could express), then a
       display face on the headings over plain body text, then generous corners.
       `md`/`cozy` rather than the old `md`/`compact`: the mockup breathes, and
       compact spacing on a cream ground reads as cramped rather than efficient. */
    /* Measured against the mockup rather than eyeballed: it runs a 66px h1, a
       34px h2 and `999px` on every button, over 28px cards. `lg` + `pill` is the
       closest the axes get, and both gaps that remained after the first pass
       (46px headings, 7px buttons) were this. */
    design: {
      font: "market",
      surface: "parchment",
      scale: "lg",
      density: "cozy",
      radius: "pill",
      width: "contained",
    },
    // No fixed column count: the original department row fits as many roomy
    // discs as the available width allows. The owner can still choose 2–6.
    homeCollections: { layout: "grid", align: "center" },
    /* The page, top to bottom: a typographic hero, a strip of department
       discs, the seasonal grid, the buy-again rail, then the merchant's own
       promise band when they have written one.

       `hero-open` reads as a reversal of the old note here ("no lifestyle
       hero — a weekly shop is not sold a photograph") and is not: the mockup's
       hero is a headline, a sentence and buttons on the page ground. The
       objection was to selling groceries with a photograph, and it still stands.

       `deal-strip` is dropped. The mockup has no countdown, and the strip was
       the weakest thing on the page — a live campaign already announces itself
       in the announcement bar and on every discounted card.

       No `search-hero`: the `search-first` header already carries the search
       box, and stacking a second one under it was a duplicate browser QA caught.

       The trust band still closes the page. It maps to nothing in the mockup —
       but it is the merchant's own three promises, and the `columns` footer does
       not show them either, so dropping it to match a mockup that had no
       merchant behind it would delete real content to gain a resemblance. */
    sections: [
      /* `hero-open`, NOT `hero-card`. Every other hero is a card, so the first
         screen of this shop was a full-width `#f9f4ed` block and the parchment
         ground only showed in the gutters beside it — the whole point of the
         surface, hidden exactly where it introduces itself. Pixel-sampling the
         mockup against the shop is what found it: the mockup's top strip reads
         page colour all the way across, ours read card. */
      "hero-open",
      "category-tiles",
      "featured-grid",
      "product-rail",
      "trust-band",
    ],
    templates: {
      home: "classic",
      // A white bar built around a pill search, with the delivery promise as a
      // tinted chip beside it — the quick-commerce anatomy.
      header: "search-first",
      // `columns`, NOT `rich` — even though the rich footer's trust strip is
      // exactly a grocery shopper's question. This theme already ends on the
      // `trust-band` section, and both read the same `trustBadges`, so pairing
      // them printed the merchant's three promises twice, a hundred pixels
      // apart. Browser QA caught it; nothing else could. The band wins because
      // it is the one the merchant can reorder.
      footer: "columns",
      collection: "grid-4",
      product: "gallery-left",
      productCard: "compact",
      // One button: groceries are re-orders, not considered purchases.
      cardActions: "add",
      pagination: "pages",
      // Packshots are square and already fill their frame.
      imageFit: "crop",
      imageRatio: "square",
      // The mockup's department strip: a lettered disc and a name, eight across.
      // `disc` rather than `tile` because it is the shape asked for rather than
      // fallen back to — `tile` gives the same row only when the merchant has
      // photographed nothing, which makes the good layout an accident.
      categoryTiles: "disc",
      // A repeat grocery shopper lives in Orders, so the account area spends its
      // width on the order list rather than on a column of section names.
      // (The mockup's Buy-again page: pill tabs over a reorder grid.)
      accountLayout: "tabs",
      // The mockup checks out on one screen — numbered blocks with a sticky
      // order summary beside them — rather than a step at a time. `single-page`
      // is the layout with that side panel; `guided` has the numbering but
      // spends the width, and a shopper who cannot see the total is the worse
      // trade of the two.
      checkout: "single-page",
      // A tracking page reached from the header should announce it is not the
      // catalogue any more; a brand banner is the fastest way to say so.
      contentLayout: "banner",
      // List on a card, totals in a sticky side panel — the mockup's basket.
      cartLayout: "panel",
      /* ⚠ `stacked`, NOT `rail` — a deliberate reversal, 2026-08-14.

         The rail (departments down the left of every page) shipped as this
         theme's marketplace move and worked. The mockup then answered the same
         question differently: no rail anywhere, a disc strip for departments on
         the home page, and the left column spent on FILTERS on the collection
         page, where a grocery shopper is actually narrowing something down.

         Nothing is lost by this. `rail` is a registered shell any theme can
         stamp and the Customize → Page layout picker offers it to every
         merchant; it simply is not what this design is. */
      shell: "stacked",
    },
  },
  {
    id: "meridian-care",
    sample: PHARMACY_SAMPLE,
    label: "Meridian Care",
    tagline: "A dispensary counter — search by name, departments always to hand.",
    bestFor: "Pharmacy, health, clinics, personal care",
    /* Ink-navy with a signal green. NOT the old teal + sky, which sat one hue
       away from Classic's blue and made the two read as the same shop twice.
       The green is spent on one job only — "in stock", "sealed", "verified" —
       so it works as a status colour rather than a second brand. */
    brandColor: "#1b3a5c",
    accentColor: "#1a8f5e",
    /* The old bundle said "clinical white is the point of this one — a pharmacy
       that tints its page stops reading as a pharmacy", and that was wrong in a
       way worth recording: it left this theme sharing a ground with Classic AND
       Muslin, so the only thing separating three of the four themes was a hue.
       `mist` inverts the relationship instead — a tinted page with pure white
       cards — which reads as MORE clinical, not less, because each sealed box
       now sits on the page as its own object.

       `grotesk`, `compact` and `sm` are the other three axes nothing else uses.
       Together they make a dense, technical page: a pharmacy is a shop with
       eight thousand lines, and it should feel stocked rather than curated. */
    design: {
      font: "grotesk",
      surface: "mist",
      scale: "sm",
      density: "compact",
      radius: "soft",
      width: "contained",
    },
    homeCollections: { layout: "grid", align: "center" },
    /* **No hero, and no category section.** The `rail` shell puts the conditions
       down the left of every page and the `clinical` header carries the search,
       so a hero could only repeat one of the two — which is exactly the bug this
       storefront has now shipped five times (trust badges twice, promises twice,
       the hero photograph twice, departments twice, and a search box twice in
       the first draft of this very theme).

       What is left is a page made only of things the shell cannot say:

       - `deal-strip` — a live campaign, and only when one is running.
       - `featured-grid` — what people actually buy.
       - `product-rail` — what just arrived. A different question from the grid,
         which is why both belong. */
    sections: [
      "deal-strip",
      "featured-grid",
      "product-rail",
      "trust-band",
    ],
    templates: {
      home: "classic",
      /* Logo, one wide search, icons. It is the only search on the page and it
         is on EVERY page, which is what a shop selling by product name needs —
         a hero search vanishes the moment the shopper scrolls or opens a box. */
      header: "clinical",
      /* People phone a pharmacy, so the footer leads with the number. */
      footer: "contact",
      /* The rail carries departments; the collection page's own left column is
         free to carry FILTERS, which is where a shopper narrows by strength,
         form or brand. */
      collection: "sidebar",
      product: "gallery-left",
      productCard: "standard",
      cardActions: "add",
      /* `load-more`, not numbered pages: a shopper scanning for one medicine
         reads down, and paging resets that scan. */
      pagination: "load-more",
      // A box shot must never be cropped — the strength is printed on it.
      imageFit: "fit",
      imageRatio: "square",
      // Unused by this theme (no category section), kept at the default so a
      // merchant who adds one back gets the ordinary photo tile.
      categoryTiles: "tile",
      // One decision per screen, targets big enough to hit without aiming.
      accountLayout: "panel",
      /* `multi-step`. A pharmacy basket is long and the shopper is cautious;
         one question at a time over a running total beats a single tall form. */
      checkout: "multi-step",
      // Nothing full-bleed, nothing loud, separated by space rather than rules.
      contentLayout: "panel",
      /* A thirty-line basket of small boxes: dense rows with the total following
         the shopper down, rather than a card per item. */
      cartLayout: "compact",
      /* ⚠ **THE structural move, and the first bundled theme to use it.**
         Conditions — diabetes, blood pressure, gastric — down the left of every
         page, not just the home page. A pharmacy shopper's next click is nearly
         always another condition, and no arrangement of home-page blocks can put
         that on the product page or in the cart.
         `rail` has been registered and offered in Customize since 2026-08-14
         with nothing stamping it; this is what it was built for. */
      shell: "rail",
    },
  },
  {
    id: "muslin",
    sample: APPAREL_SAMPLE,
    label: "Muslin",
    tagline: "Big imagery and quiet type — the photography does the selling.",
    bestFor: "Fashion, footwear, jewellery, gifts",
    // Light, not dark. A dark boutique is a look a merchant can reach with the
    // colour picker; shipping it as the only fashion option would have made
    // every clothing shop on the platform recognisably ours.
    //
    // **Wine, not near-black.** The approved swatches are wine + ink, and this
    // shipped as #1c1917/#a16207 — a greyscale shop with a gold accent, which is
    // Atelier (the direction Muslin replaced) wearing Muslin's name. `--primary`
    // drives the CTAs, the links and the `--primary-soft` band, so the wine has
    // to be the brand colour for any of them to carry it.
    brandColor: "#8c3b52",
    accentColor: "#241f26",
    // White, and deliberately: this theme's airy white space IS its luxury cue,
    // and a tinted ground would read as a warmer, cheaper shop.
    design: {
      font: "serif",
      surface: "default",
      scale: "lg",
      density: "airy",
      radius: "sharp",
      width: "contained",
    },
    // Overlay scenes keep their original adaptive, centred composition until
    // the merchant chooses an exact number per row.
    homeCollections: { layout: "grid", align: "center" },
    // A magazine, not a shop window: a **split** hero — photograph beside the
    // eyebrow, serif headline and one CTA — then "shop by occasion" as overlay
    // tiles, then a short edit of products with no card chrome, closing on the
    // promises band. No search hero and no deal strip; both would break it.
    //
    // ⚠ `hero-fullbleed` led this list until 2026-08-13 **with
    // `editorial-split` right under it**, and the two render the *same*
    // `banner` image — so the merchant's one photograph appeared twice, a
    // screen apart. `editorial-split` alone is the approved hero.
    sections: [
      "editorial-split",
      "category-tiles",
      "minimal-picks",
      "product-rail",
      "trust-band",
    ],
    templates: {
      home: "hero-split",
      // Wordmark, a hairline-underlined search, menu on its own row beneath.
      header: "boutique",
      footer: "newsletter",
      collection: "grid-3",
      product: "gallery-top",
      // No border, no fill, no buttons — the photograph is the card.
      productCard: "editorial",
      // Buttons stay off the photo until hover; phones always show them.
      cardActions: "reveal",
      pagination: "load-more",
      imageFit: "crop",
      // The single strongest signal that this is a clothing shop.
      imageRatio: "portrait",
      // Occasion tiles are scenes, so the name sits on the photograph.
      categoryTiles: "overlay",
      // No cards, no icons, no avatar disc — the account area reads as the same
      // boutique rather than a dashboard bolted onto it.
      accountLayout: "editorial",
      // One or two considered pieces, so seeing them while you type is
      // reassurance rather than clutter. Same reason there are no cards.
      checkout: "editorial",
      // A shop with no borders anywhere else does not put its About page in a box.
      contentLayout: "editorial",
      // A shop that shows its clothes without borders should not box them at the
      // moment of purchase.
      cartLayout: "editorial",
      shell: "stacked",
    },
  },
  {
    id: "little-steps",
    sample: BABY_SAMPLE,
    label: "Little Steps",
    tagline: "Soft and round, with the promises before the products.",
    bestFor: "Baby, kids, toys, gifts",
    // Dusty rose, not the obvious pastel pink: a nursery pink at full chroma
    // reads as a shop for the baby, and the person spending the money is a
    // tired parent deciding whether the formula is real. Muted enough to sit
    // under ৳8,500 of pram without looking like a toy shop, and far enough
    // from Muslin's wine (#8c3b52) to be its own storefront.
    brandColor: "#a15571",
    // Sage carries the quiet trust tints — the "date checked" chip, stock rows,
    // the promises band. It never touches a CTA: an accent that competes for
    // the buy button is a second primary.
    accentColor: "#6f8f75",
    design: {
      // Nunito + Baloo Da 2. The catalogue has described this face as "soft and
      // approachable — grocery, food, kids" since it shipped and no theme had
      // taken it.
      font: "rounded",
      surface: "nursery",
      // `md`, not `lg`. The warmth is doing the work here; big headlines on top
      // of it tips a gentle shop into a loud one.
      scale: "md",
      density: "airy",
      radius: "round",
      width: "contained",
    },
    homeCollections: { layout: "grid", align: "center" },
    /* **The promises come SECOND, above the catalogue** — the one structural
       argument this theme makes. Meridian Care closes on its trust band;
       everything else buries it. A parent's objection is not "what else do you
       sell", it is whether the formula is genuine and in date, and an answer
       below six rows of products is an answer they never read.

       `tag-chips` third, because a parent shops for their six-month-old long
       before they think about "Feeding" — it renders nothing unless the shop
       actually keeps age tags, so a gift shop applying this theme simply does
       not get the row. */
    sections: [
      "hero-fullbleed",
      "trust-band",
      "tag-chips",
      "category-tiles",
      "featured-grid",
      "deal-strip",
      "product-rail",
    ],
    templates: {
      home: "hero-split",
      // Wordmark centred with the departments beneath — a small shop's own
      // sign, not a marketplace's search bar.
      header: "centered",
      // The one footer with room for "not sure which size?" beside the links,
      // which for this trade is most of the support load.
      footer: "rich",
      // Three across, not four. Half this catalogue is a tin or a bottle shot
      // on white, and at four-up on a soft ground they stop reading as objects.
      collection: "grid-3",
      product: "gallery-top",
      productCard: "bold",
      // COD shoppers buy one thing; "Buy now" beside "Add" saves them the cart.
      cardActions: "add-buy",
      pagination: "pages",
      imageFit: "crop",
      imageRatio: "square",
      // Round photos — the shape the whole theme is built on, and the reason
      // the mode exists (`disc` refuses photographs).
      categoryTiles: "circle",
      accountLayout: "tabs",
      // First-time COD buyers, so one question per step beats one long form.
      checkout: "guided",
      contentLayout: "centered",
      cartLayout: "panel",
      shell: "stacked",
    },
  },
];

export const getReadyMadeTheme = (id?: string | null): ReadyMadeTheme | undefined =>
  READY_MADE_THEMES.find((t) => t.id === id);

/**
 * The theme drawn for a trade, keyed by the `industry` the merchant picked at
 * signup (`INDUSTRY_TYPES` on the backend organization model).
 *
 * **Why a recommendation and not a default.** Two of 43 storefronts have ever
 * applied a theme and five have touched any design axis, so the catalogue is
 * not failing to be good — it is failing to be *found*, by merchants who have no
 * reason to open a panel called Design. Naming the one theme built for their
 * trade turns "browse five and judge" into "this one, unless you disagree",
 * which is the only version of the question a non-designer can answer quickly.
 *
 * **A trade with no entry gets no recommendation, deliberately.** Falling back
 * to Classic would dress the shop as it already looks and call it a suggestion,
 * and pointing an electronics shop at a grocery theme is worse than silence.
 * Five of the twelve trades are unlisted for exactly this reason; each becomes a
 * row here when a theme is actually drawn for it, and not before.
 *
 * ⚠ `bestFor` on each theme is the merchant-facing half of the same claim.
 * Change one and the other reads as a different suggestion — keep them agreeing.
 */
const THEME_BY_INDUSTRY: Record<string, string> = {
  GROCERY_STORE: "fresh-market",
  // A restaurant or takeaway sells the same way a grocer does — a short menu of
  // departments, repeat buyers, everything in reach — and Fresh Market is the
  // theme drawn for that shape.
  RESTAURANT_FNB: "fresh-market",
  PHARMACY: "meridian-care",
  FASHION_APPAREL: "muslin",
  BABY_KIDS_STORE: "little-steps",
  // The Facebook/Instagram seller. Photo-led is the shape of the shop they
  // already run, whatever they sell — the picture IS the listing.
  ONLINE_SHOP: "muslin",
};

/** The theme drawn for this trade, or `undefined` when none has been. */
export const recommendedThemeFor = (
  industry?: string | null,
): ReadyMadeTheme | undefined =>
  getReadyMadeTheme(THEME_BY_INDUSTRY[industry ?? ""]);
