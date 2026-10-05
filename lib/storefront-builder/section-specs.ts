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

/**
 * A product card's CHROME — its corners, and the fill of its buy buttons.
 * `CARD_PHOTO`'s sibling, on the same six sections, and unset the same way:
 * follow the store (Look → Corner radius, Look → Buttons).
 *
 * ⚠ **Neither forks the card.** Both resolve to custom properties the section
 * writes on its own wrapper — `--radius-md` and the `--btn-*` group, the very
 * tokens `storefront.css` sets store-wide — so the cards inside are the
 * storefront's own `ProductCard`, drawn by the same code, reading different
 * values. That distinction is what the master plan's S6 ("no per-section card
 * style") was protecting: a second card COMPONENT would fork the piece most
 * shared across the storefront. A token override cannot.
 *
 * `cardCorners` offers three steps and not the store scale's four. The fourth,
 * `pill`, is not a rounder card — it is the step where CONTROLS stop having a
 * radius and become a shape, which is a decision about buttons and chips across
 * the whole shop, not about one row's cards.
 */
const CARD_LOOK = {
  cardCorners: { type: "enum", values: ["sharp", "soft", "round"], optional: true },
  cardButtons: { type: "enum", values: ["solid", "outline", "soft"], optional: true },
} as const;

/** An icon a row or card may carry — names from `components/storefront/sf-icons.tsx`. */
/**
 * A product row's link to where its products live, and the heading it takes
 * when the merchant typed none. `storeHeading` names the row in the
 * shopper's language (`featured`, `newArrivals`, `selected`) or after its
 * collection; `viewAll` draws the link, worded "View all" unless `ctaLabel` is
 * set, to `ctaHref` or else the row's collection or the catalogue. Both unset on
 * a new section, which shows only the merchant's words.
 */
/**
 * A line under a section's heading. Thirteen sections offered a heading and
 * nothing beneath it, and the alternative — stacking a Rich text section above
 * the row — has its own padding, its own width and its own place in the tree,
 * so the pair drifts apart the moment either is styled (owner decision D5 of
 * `inventory-frontend/docs/plan/storefront-section-controls.md`).
 */
const SUBHEADING = { subheading: { type: "string", max: 240, optional: true } } as const;

const STORE_ROW = {
  ...SUBHEADING,
  storeHeading: { type: "enum", values: ["featured", "newArrivals", "selected", "collection"], optional: true },
  viewAll: { type: "boolean", optional: true },
} as const;

/**
 * What a row does when its items do not fit: wrap onto another line, or scroll
 * sideways. `category-promo-cards` named this first; every row that asks the
 * same question uses its word rather than minting a second one.
 */
const FLOW = { type: "enum", values: ["wrap", "scroll"], responsive: true, optional: true } as const;

/**
 * A row's or card's glyph, and the ONE value that means there is none.
 *
 * Unset is not "no icon" anywhere: every renderer substitutes a fallback — the
 * promises band cycles truck/shield/tag by position, a benefit card draws
 * `check` — so a merchant who wanted a bare row had nothing to choose. `none` is
 * that choice, and it is a stored value rather than the empty one because the
 * fallbacks are what every band written before it already draws.
 */
export const NO_ICON = "none";

/** Every glyph a row or card may pick — also the store promises' picker (Customize → Footer). */
export const ICON_NAMES = [
  "truck", "shield", "tag", "check", "coins", "box", "clock", "phone",
  "star", "heart", "lock", "card", "bolt", "mapPin", "receipt", "home",
] as const;

const ICON = {
  type: "enum",
  values: [...ICON_NAMES, NO_ICON],
  optional: true,
} as const;

/**
 * How a promises list draws its icons: on a solid accent disc, as a bare glyph,
 * or not at all. One vocabulary for the promises band and the footer's promises
 * block (`FOOTER_ICON_STYLES`), so the two can be made to match. Each surface
 * keeps its own unset — `disc` on the band, `plain` in the footer — which is
 * what each drew before the setting.
 */
export const PROMISE_ICON_STYLES = ["disc", "plain", "none"] as const;

/**
 * The parts of the product page's column beside the photos, which the merchant
 * orders and hides as `product-main`'s blocks.
 *
 * The first eight are what that column always drew, and the order here is the
 * order it drew them in — a page with no parts saved still draws exactly that
 * (`lib/storefront-builder/product-parts.ts`). The last three are added by the
 * merchant: their own text, a title that opens onto text (a size chart, care),
 * and the store's promises.
 */
export const PRODUCT_PARTS = [
  "name",
  "badges",
  "price",
  "summary",
  "options",
  "quantity",
  "buy",
  "delivery",
  "promises",
  "text",
  "collapsible",
] as const;

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
      /**
       * The hero's height in pixels, per device.
       *
       * ⚠ **A height REPLACES the shape** on the screen it is given — the same
       * rule the promo card row states, and for the same reason: with both, an
       * aspect box computes its width from the height and the picture collapses
       * to a column. The stylesheet hands `--herocard-ratio` / `--heroopen-ratio`
       * to `auto` wherever a height applies, so the two are never both in force.
       *
       * ⚠ On the FULL-WIDTH hero it is a `min-height`, not a fixed box, because
       * that hero lays its type over the photograph under `overflow: hidden` —
       * a fixed box shorter than the words slices them off the top, which is the
       * trap `ASPECT_RATIO_PADDING` exists to avoid. A floor lets the copy grow
       * past it, and a floor is what that layout's own default already is.
       */
      height: {
        type: "number",
        min: 120,
        max: 900,
        int: true,
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
      /**
       * What a shopper moves the slides WITH, on a hero with more than one.
       *
       * Unset is `dots`, which is what every rotating hero here has drawn since
       * the dark carousel's arrows were dropped with it (decision D4) — those
       * were white chevrons on a translucent dark pill, built for a photograph
       * and wrong on a light card. `arrows` brings them back in the store's own
       * surface and border instead, so they read as part of the shop; `both`
       * draws the pair. Swipe works under all three and is never a setting.
       */
      nav: { type: "enum", values: ["dots", "arrows", "both"], optional: true },
      /**
       * How long each slide holds, in seconds. Unset is the 5-second beat every
       * hero has always run at.
       *
       * ⚠ It is also what the dots' progress sweep is timed to, so the two are
       * driven from one value (`--sf-hero-beat`) rather than set twice — a
       * sweep that finishes early and then waits is the clearest way to make a
       * slideshow look broken.
       *
       * The floor is 2 seconds because below that a hero reads as a flicker
       * rather than a rotation, and nothing a shopper can act on stays on
       * screen long enough to act on. The ceiling is 30 because past it a
       * merchant wants a still picture, which is what one slide already is.
       */
      interval: { type: "number", min: 2, max: 30, int: true, optional: true },
      /**
       * Where the rotation dots sit, on a hero with more than one slide.
       *
       * Unset is `under` — the row beneath the hero this file has always drawn,
       * because a bordered card has no surface to lay dots on and dots inside
       * one read as part of the merchant's own content. `over` puts them on the
       * bottom of the PICTURE instead, the way the full-width hero has always
       * drawn its own.
       *
       * ⚠ **`over` needs a picture on EVERY slide.** The dots ride inside the
       * active slide's media box, so a slide with no photograph has nowhere to
       * put them and the hero would drop its dots mid-rotation; `HeroSlidesView`
       * falls back to the row for the whole stack instead of letting them move.
       * `field-visibility.ts` hides the control in the same case, so the
       * fallback is what a merchant sees rather than what surprises them.
       *
       * Full-bleed sets nothing here: that hero draws its own dots on the
       * photograph already, and has no second place to put them.
       */
      dots: { type: "enum", values: ["under", "over"], optional: true },
      /*
       * The store-worded hero; all unset on a new hero. `slideshow` rotates even
       * one slide. The rest describe its banner hero, drawn from the
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
      /**
       * Which running offer `campaignBadge` names. Unset is automatic: the
       * storewide offer, else the one ending soonest. A picked offer that is not
       * running (ended, paused, not started) names nothing — never a different
       * offer the merchant did not choose.
       */
      campaignId: { type: "ref", to: "campaign", optional: true },
      /**
       * The badge's colour, as a TONE and never a hex — the checkout notices'
       * rule. Each tone resolves per theme in storefront.css
       * (`.sf-hero-badge[data-tone]`), so every choice stays readable in light
       * and dark; a typed colour cannot. Unset is `accent`, the badge's colour
       * before this setting existed.
       */
      badgeTone: {
        type: "enum",
        values: ["accent", "brand", "sale", "neutral", "solid"],
        optional: true,
      },
      promises: { type: "boolean", optional: true },
    },
    // At most five slides, the same bound the backend's hero spec sets.
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
   * A content page's body in the store's content frame — the core section of
   * every store page. `body` is the page's own text in whichever format it was
   * stored: rich text, or markdown (`ContentBodyView` reads both).
   *
   * Required and unremovable, but allowed to be EMPTY — see the settings below.
   */
  "content-body": {
    v: 1,
    pages: ["content"],
    settings: {
      /**
       * The page's heading. Optional with `body` below: a store page whose
       * content is built from other sections keeps an empty core section, and an
       * empty section has no heading either.
       */
      title: { type: "string", max: 160, optional: true },
      /**
       * The page's own text, in the same rich-text editor the Content screen
       * always had. `legacyFormat` is what lets a body written before that
       * editor — plain markdown — open and save untouched; it converts lazily,
       * on the merchant's first real edit.
       *
       * Optional, because the editor is the page's starting point and not an
       * obligation (plan §3.4): a merchant may empty it and build the page from
       * the sections around it, and the section then draws nothing at all.
       */
      body: { type: "richText", maxBytes: 200_000, optional: true, legacyFormat: "markdown" },
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
      /**
       * Take the coupon field off the checkout, per screen.
       *
       * ⚠ **A hide flag, not a show flag, and that is the whole reason for the
       * name.** Every checkout has shown this field since it existed, so unset
       * must keep showing it — a `coupon: boolean` would read as "off" when
       * absent and take the field off every live store's checkout on the day it
       * shipped. Same shape and same reason as `category-promo-cards.hideText`
       * and `single-product.hideDescription`. (`order-form.coupon` is a SHOW
       * flag because that form never had one by default; the two are not
       * inconsistent, they are each the safe default for their own history.)
       *
       * Responsive, because that is what it is for: a phone checkout is a column
       * a shopper scrolls, and a coupon box near the top of it invites them to
       * leave and hunt for a code. The merchant may want it on the desktop and
       * gone on the phone, or the reverse.
       */
      hideCoupon: { type: "boolean", responsive: true, optional: true },
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
    settings: {
      /**
       * What a shopper reads when a search finds nothing — the one thing on this
       * page a merchant would write, and the section had no settings at all.
       * Unset keeps the storefront's own wording in the shopper's language.
       */
      emptyHeading: { type: "string", max: 120, optional: true },
      emptyText: { type: "string", max: 300, optional: true },
    },
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
      /**
       * The cards' own count per screen, over whatever `layout` implies.
       *
       * ⚠ **It WINS over `layout`, on the screen it is set for**, and that is
       * the whole reason it exists: `layout` answers three questions at once
       * (how many columns, whether a filter rail stands beside them, and on
       * which screens), so a merchant who wanted the rail AND four cards had to
       * choose between them. A phone-only count leaves the desktop on the
       * layout's — the classes are emitted per screen (`responsiveClasses`), so
       * the untouched screen never moves.
       */
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      ...CARD_PHOTO,
      ...CARD_LOOK,
      /**
       * The page's own `<h1>`, and the line under it.
       *
       * ⚠ **One page draws every collection**, so a typed heading names all of
       * them — `/products`, `/sarees`, `/sarees/jamdani` alike — in the one
       * language it was typed in. Unset keeps what the page has always drawn:
       * the collection's own name, or the narrowest active facet's, or "All
       * products" in the SHOPPER's language. That is why this is an override
       * rather than the heading, and why the hint says so before the merchant
       * types.
       *
       * `subheading` carries the same caveat and wears it better: a line like
       * "Free delivery over 2000 taka" reads correctly above every collection,
       * which is the case the control is really for.
       */
      heading: { type: "string", max: 120, optional: true },
      ...SUBHEADING,
      /**
       * Two switches and not one, deliberately (the CTA-alignment lesson, X11):
       * a merchant who puts a hero above the grid wants the heading gone and
       * the count kept, and a merchant with a thin catalogue wants the opposite.
       * A single "Hide the heading" that took both would leave one of them
       * unable to ask.
       */
      hideHeading: { type: "boolean", optional: true },
      hideCount: { type: "boolean", optional: true },
    },
  },
  /**
   * A campaign's banner and the products it discounts — the core section of a
   * campaign page, served at the sale's own address `/campaigns/<slug>`.
   *
   * **Which campaign is decided by the ADDRESS, not by a setting.** One page
   * belongs to one campaign, and a merchant able to re-point it would have a
   * page whose banner and grid disagreed with the link they had already shared.
   * So, like `collection-grid`, this draws what the route resolved rather than
   * what a field says.
   *
   * `layout` and `pagination` are the same store templates the collection page's
   * core section overrides, unset on every page created with a campaign.
   * `hideBanner` is for the merchant who writes their own headline above the
   * grid with a hero or an image banner — the discount is still on every card,
   * so the sale is never unannounced.
   */
  "campaign-main": {
    v: 1,
    pages: ["campaign"],
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
      hideBanner: { type: "boolean", optional: true },
    },
  },
  /**
   * The product itself, on the product page once it is on the builder.
   *
   * `layout` is the store's `templates.product` become a section setting, in
   * the SAME ids Customize stores and the same ids `single-product`'s
   * `galleryLayout` already uses. Unset means "whatever the store's template
   * says". It carries the third value `sticky-bar`, which `galleryLayout` does
   * not: a landing page's single product is one block on a longer page, while
   * this is the product page itself.
   *
   * ### The photo, and the row under it
   *
   * Until 2026-09-22 this section answered two questions — the photo layout and
   * whether the related row showed — and everything else about the page was the
   * store's, set once under Customize → Product cards for every card in the
   * shop. A merchant who wanted portrait product photos on the product page and
   * square cards on the home page had no way to ask, which is the request this
   * grew from.
   *
   * So it now carries the shape controls the product ROWS already had, split by
   * which photo they frame:
   *
   * - `imageRatio` / `imageFit` — the **big photo**, the one the page is built
   *   around. Named as `image-text`'s are rather than `cardImage*`, because this
   *   is not a card. Unset follows the store, so a page nobody has touched is
   *   unchanged; `imageRatio` is responsive because a shape that reads well in a
   *   desktop's half-width column is often too tall for a phone, which gets the
   *   photo at the full width of the screen.
   * - `cardImageRatio` / `cardImageFit` — the **related cards**, the same pair
   *   every other product row carries (`CARD_PHOTO`), meaning the same thing.
   *
   * ⚠ A section shape applies to BOTH gallery layouts, including the one whose
   * hero is a fixed 16:11 letterbox (`gallery-top`). Unset keeps that letterbox;
   * a merchant who names a shape has said what they want, and a control that
   * silently does nothing on one of two layouts is the defect the visibility
   * rules exist to prevent.
   *
   * ### The related row
   *
   * `hideRelated` drops the built-in "You may also like" row, for a page where
   * the merchant places a Related products section instead; unset keeps the row.
   * `relatedLimit` and `relatedColumns` shape the row in place, so the common
   * case — four cards, three to a line — no longer needs the row hidden and a
   * whole second section added to answer it. They are deliberately the same two
   * settings `related-products` carries, with the same bounds: one decision, one
   * vocabulary, whichever way the merchant reaches it.
   *
   * `hideDescription` is `single-product`'s, for the page whose description is
   * told better by a Rich text or FAQ section below. It hides the merchant's own
   * words on EVERY product at once, which is why the hint says so.
   *
   * ### The column beside the photos — `blocks`, one per part
   *
   * Each block is one `PRODUCT_PARTS` entry, in the merchant's order. **No blocks
   * means the column as it always was**, so a page nobody has reordered stores
   * nothing and draws exactly what it drew before the parts could move; the
   * editor writes the whole list the first time the merchant changes it.
   *
   * - `hidden` takes a part off the page without losing its place. The ways to
   *   order (`options`, `buy`) ignore it, and the renderer puts either back if a
   *   list arrives without it — a product page that cannot sell is never the
   *   right reading of a stored list.
   * - `title`, `text` and `open` belong to the merchant's own parts: `text`
   *   draws `text`; `collapsible` draws `title` and opens onto `text`, open at
   *   first when `open` is on. The editor shows them only for those parts.
   * - Options and quantity must sit above the buy buttons. The page always
   *   preselects an option, so options below the button would let a shopper buy
   *   one they never saw — the editor refuses that move; the schema cannot say it.
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
      imageRatio: {
        type: "enum",
        values: ["square", "portrait", "landscape", "tall"],
        responsive: true,
        optional: true,
      },
      imageFit: { type: "enum", values: ["fit", "crop"], optional: true },
      hideDescription: { type: "boolean", optional: true },
      hideRelated: { type: "boolean", optional: true },
      relatedLimit: { type: "number", min: 1, max: 8, int: true, optional: true },
      relatedColumns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      ...CARD_PHOTO,
      ...CARD_LOOK,
    },
    blocks: {
      max: 16,
      settings: {
        part: { type: "enum", values: PRODUCT_PARTS },
        hidden: { type: "boolean", optional: true },
        title: { type: "string", max: 80, optional: true },
        text: { type: "richText", maxBytes: 12_000, optional: true },
        open: { type: "boolean", optional: true },
        /*
         * The products a text or collapsible part shows on — those in any of
         * these categories, or carrying any of these tags; both unset is every
         * product (`showsOnProduct`). The rules the manifest cannot say — only
         * those two parts, never an empty list — are the backend's
         * `checkProductPartTargets` and `lib/storefront-builder/product-parts.ts`.
         */
        categoryIds: { type: "refs", to: "category", max: 20, optional: true },
        tagIds: { type: "refs", to: "tag", max: 20, optional: true },
      },
    },
  },
  /**
   * The product's own description, wherever the merchant places it — the twin
   * of `related-products`: turn on `product-main.hideDescription` and put this
   * where the words should go (under testimonials, above the FAQ). Product page
   * only, since it has nothing to show without the page's product.
   *
   * It draws the whole description, short or long. Unset heading is the shop's
   * own word, "Description", in the shopper's language — what the block below
   * the photos has always been titled; `hideHeading` drops it.
   */
  "product-description": {
    v: 1,
    pages: ["product"],
    settings: {
      heading: { type: "string", max: 120, optional: true },
      hideHeading: { type: "boolean", optional: true },
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
      ...SUBHEADING,
      limit: { type: "number", min: 1, max: 8, int: true, optional: true },
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      ...CARD_PHOTO,
      ...CARD_LOOK,
    },
  },
  faq: {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      ...SUBHEADING,
      /** Opens the first question, for a page whose first answer is the one that sells. */
      openFirst: { type: "boolean", optional: true },
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
      /**
       * The order the products come back in, over whatever the source gives.
       * Unset keeps the source's own order — which for `manual` is the order the
       * merchant picked them in, and must stay that way.
       *
       * ⚠ **No `name` here, against the plan's own list.** The catalogue sorts by
       * newest and by price and nothing else (`storefront-catalog.service.ts`),
       * and a fourth value would be a control that quietly falls back to the
       * default. Adding alphabetical order is a catalogue change with its own
       * index question, not an enum entry.
       */
      sort: { type: "enum", values: ["newest", "price-low", "price-high"], optional: true },
      categoryId: { type: "ref", to: "category", optional: true },
      tagIds: { type: "refs", to: "tag", max: 10, optional: true },
      productIds: { type: "refs", to: "product", max: 24, optional: true },
      limit: { type: "number", min: 1, max: 24, int: true },
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      ...CARD_PHOTO,
      ...CARD_LOOK,
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
      ...SUBHEADING,
      /**
       * The store's own promises (Customize → Footer) in place of the blocks. A
       * new band starts with it on when the store has
       * promises (`defaultsForStore`), so the band and the footer say the same
       * thing and one edit changes both.
       */
      storePromises: { type: "boolean", optional: true },
      /**
       * Unset keeps the store's own ramp — three past the breakpoint, one on a
       * phone (`--trustcols`). A band of two long promises and a band of six
       * short ones are not the same row, and the phone is the screen that ramp
       * serves worst: one promise per line is a lot of scrolling for "Cash on
       * delivery".
       */
      columns: { type: "number", min: 1, max: 4, int: true, responsive: true, optional: true },
      /** Unset is `disc`. A row's own "No icon" still wins over `disc` and `plain`. */
      iconStyle: { type: "enum", values: PROMISE_ICON_STYLES, optional: true },
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
      /** A phone picture of its own, where the desktop's crop reads badly upright. */
      mobileImage: { type: "image", optional: true },
      imageSide: { type: "enum", values: ["left", "right"], optional: true },
      /**
       * Which of the picture and the copy leads the phone's single column.
       *
       * ⚠ A SECOND setting rather than making `imageSide` responsive, and for
       * the hero's reason (hero plan §5, D4): the two devices start from
       * opposite defaults — the desktop from a side, the phone from the
       * picture — so one responsive value would inherit the desktop's and move
       * every photograph already below the fold.
       */
      mobileFirst: { type: "enum", values: ["picture", "text"], optional: true },
      /**
       * The picture's share of the row past the breakpoint, in percent.
       *
       * ⚠ **Not responsive**, unlike `category-promo-cards`'s setting of the
       * same name. That row keeps its cards side by side on a phone, so a phone
       * split means something there. This section stacks into one column below
       * the breakpoint, where there is no row left to divide — storing a phone
       * value would be storing a value nothing draws.
       */
      split: { type: "number", min: 20, max: 80, int: true, optional: true },
      /**
       * Whether the picture is cropped to its shape or shown whole inside it.
       * Unset keeps `cover`, which is what every `image-text` drew before this
       * existed.
       */
      imageFit: { type: "enum", values: ["fit", "crop"], optional: true },
      imageRatio: { type: "enum", values: ["4:5", "1:1", "4:3", "16:9"], responsive: true, optional: true },
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
      ...SUBHEADING,
      flow: FLOW,
      /** "Shop by age" in the shopper's language when Heading is empty. */
      storeHeading: { type: "enum", values: ["shopByAge"], optional: true },
    },
  },
  "collections-row": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      ...SUBHEADING,
      /** Unset or empty lists every top-level collection. */
      categoryIds: { type: "refs", to: "category", max: 30, optional: true },
      style: { type: "enum", values: ["card", "plain"], optional: true },
      layout: { type: "enum", values: ["strip", "grid"], optional: true },
      /** See `category-tiles.arrows` — the same track, the same rule. */
      arrows: { type: "boolean", optional: true },
      columns: { type: "number", min: 2, max: 6, int: true, optional: true },
      // Its own setting rather than a responsive `columns`: a phone takes 2–4,
      // not the desktop's 2–6.
      mobileColumns: { type: "number", min: 2, max: 4, int: true, optional: true },
      align: { type: "enum", values: ["left", "center", "right"], optional: true },
      /** The tile's shape. Unset keeps each layout's own. */
      tileRatio: { type: "enum", values: ["1:1", "4:5", "3:4", "4:3", "16:9"], responsive: true, optional: true },
      /** The tile's corners in px. Unset keeps the theme's own radius token. */
      radius: { type: "number", min: 0, max: 40, int: true, optional: true },
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
      /* ⚠ No `CARD_LOOK` here, unlike the five sections beside it.
         `PickGrid` is deliberately NOT a `ProductCard` — "no border, no
         background, no buttons", says its own docstring — so a card's corners
         and a buy button's fill are two controls with nothing on the page to
         change. The rule is `field-visibility`'s, applied a step earlier: a
         setting that can never do anything is better not offered than offered
         and hidden. */
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
      /** Cards in view at once; unset keeps the rail's own measure. */
      perView: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      arrows: { type: "boolean", optional: true },
      ctaLabel: { type: "string", max: 40, optional: true },
      ctaHref: { type: "url", optional: true },
      ...CARD_PHOTO,
      ...CARD_LOOK,
      ...STORE_ROW,
    },
  },
  "campaign-offers": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      ...SUBHEADING,
      limit: { type: "number", min: 1, max: 12, int: true, optional: true },
      /** "Current offers" in the shopper's language when Heading is empty. */
      storeHeading: { type: "enum", values: ["campaignOffers"], optional: true },
    },
  },
  "category-tiles": {
    v: 1,
    pages: "all",
    settings: {
      heading: { type: "string", max: 120, optional: true },
      ...SUBHEADING,
      /** Unset or empty lists every top-level collection. */
      categoryIds: { type: "refs", to: "category", max: 30, optional: true },
      mode: { type: "enum", values: ["tile", "overlay", "circle", "disc"], optional: true },
      layout: { type: "enum", values: ["strip", "grid"], optional: true },
      /**
       * The strip's paging arrows on a pointer device. Unset is ON, which is
       * every row drawn before the control existed. A phone never sees them
       * whatever this says — it swipes the track — so this is a computer's
       * question only (`.sf-cat-strip-arrow` in `storefront.css`).
       */
      arrows: { type: "boolean", optional: true },
      columns: { type: "number", min: 2, max: 6, int: true, optional: true },
      mobileColumns: { type: "number", min: 2, max: 4, int: true, optional: true },
      align: { type: "enum", values: ["left", "center", "right"], optional: true },
      /** The tile's shape. Unset keeps each mode's own. */
      tileRatio: { type: "enum", values: ["1:1", "4:5", "3:4", "4:3", "16:9"], responsive: true, optional: true },
      /** The tile's corners in px. Unset keeps the theme's own radius token. */
      radius: { type: "number", min: 0, max: 40, int: true, optional: true },
      showLabels: { type: "boolean", optional: true },
      /**
       * Drop the collection's own one-liner and keep the name alone. Unset
       * DRAWS it, which is what the row has always done — the sentence is the
       * difference between a wayfinding tile and a card that sells, and a
       * catalogue whose descriptions are internal notes needs it gone.
       */
      hideDescription: { type: "boolean", optional: true },
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
      /** Every card gets a button — "Shop now" in the shopper's language where the card has no label. */
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
      /** Every other buy control in the builder lets the merchant write the button. */
      buttonLabel: { type: "string", max: 30, optional: true },
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
      ...SUBHEADING,
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
      /**
       * Which screens the bar stands on. Phones only until 2026-09-21, by a
       * `display: none !important` a merchant could not reach.
       */
      screens: { type: "enum", values: ["phones", "phones-and-computers"], optional: true },
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
      ...SUBHEADING,
      columns: { type: "number", min: 1, max: 4, int: true, responsive: true, optional: true },
      /** Unset keeps the phone's swipe row and the desktop's wrap — a choice now, not a law. */
      flow: FLOW,
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
      ...SUBHEADING,
      /**
       * ⚠ Responsive since 2026-09-21. It was written into a `min-width: 680px`
       * block, so the one screen the merchant's choice could not reach was the
       * phone — which was always one column.
       */
      columns: { type: "number", min: 1, max: 4, int: true, responsive: true, optional: true },
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
      ...SUBHEADING,
      /** Unset wraps the steps into as many columns as fit, at 220px each. */
      columns: { type: "number", min: 1, max: 4, int: true, responsive: true, optional: true },
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
      ratio: { type: "enum", values: ["16:9", "9:16", "1:1"], responsive: true, optional: true },
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
      /**
       * Where the words sit ACROSS the picture. Until 2026-09-21 this decided
       * three things at once — side, height and the shade under the words — so a
       * merchant could not ask for left copy in the middle, or touch the shade
       * at all. It now answers one question; `verticalAlign` and `scrim` answer
       * the other two, and unset on all three reproduces the old pair exactly.
       */
      align: { type: "enum", values: ["left", "center", "right"], responsive: true, optional: true },
      verticalAlign: { type: "enum", values: ["top", "middle", "bottom"], responsive: true, optional: true },
      /** Percent of black under the words. Unset keeps each alignment's own. */
      scrim: { type: "number", min: 0, max: 80, int: true, optional: true },
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
      ...SUBHEADING,
      columns: { type: "number", min: 1, max: 6, int: true, responsive: true, optional: true },
      frame: { type: "enum", values: ["1:1", "4:5", "3:4", "4:3", "16:9"], responsive: true, optional: true },
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
