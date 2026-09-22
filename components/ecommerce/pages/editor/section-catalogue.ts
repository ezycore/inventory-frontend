// coding-standard: maintained
import type { SectionType } from "@/lib/storefront-builder/section-specs";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";

/**
 * What the page editor calls things: section names, their groups in the add
 * library (plan §8), and the label of every setting.
 *
 * English only for now — an owner decision (plan §17, Phase 3), like the rest of
 * the Online Store admin. The keys are the section specs' own
 * (`lib/storefront-builder/section-specs.ts`); a setting with no entry here still
 * gets a readable label from its key, so a new spec field never shows blank.
 */

export const SECTION_GROUPS = [
  "Hero & banners",
  "Products",
  "Categories",
  "Offers",
  "Social proof",
  "Content",
  "Conversion",
  "Layout",
] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export interface SectionEntry {
  label: string;
  group: SectionGroup;
  description: string;
  /** The name of one repeatable item, for sections that have them. */
  item?: string;
  /** False for a type the storefront cannot draw yet — it is never offered. */
  addable: boolean;
  /** Pinned to the screen rather than placed on the page, so it has no box for the Style tab. */
  pinned?: boolean;
}

export const SECTION_CATALOGUE: Record<SectionType, SectionEntry> = {
  hero: {
    label: "Hero",
    group: "Hero & banners",
    description: "A large picture with a headline and a button. Add slides to rotate several.",
    item: "Slide",
    addable: true,
  },
  "rich-text": {
    label: "Rich text",
    group: "Content",
    description: "Formatted text — headings, lists, links and pictures.",
    addable: true,
  },
  "content-body": {
    label: "Page body",
    group: "Content",
    description: "This page's own text, in your store's page frame. Every store page has one.",
    // Never offered in the library: it is the content page's own core section.
    // It cannot be removed either — but it may be left empty, and an empty one
    // draws nothing, so a page can be built from the sections around it.
    addable: false,
  },
  "cart-lines": {
    label: "Cart",
    group: "Content",
    description: "The cart itself. Created when your cart page moves onto the builder.",
    // The cart page's core section: never in the library, never twice on a page.
    addable: false,
  },
  "checkout-form": {
    label: "Checkout",
    group: "Content",
    description: "The checkout itself. Created when your checkout page moves onto the builder.",
    addable: false,
  },
  "account-area": {
    label: "Account area",
    group: "Content",
    description: "Sign-in and a shopper's orders. Created when your account page moves onto the builder.",
    addable: false,
  },
  "search-results": {
    label: "Search results",
    group: "Content",
    description: "What a shopper's search finds. Created when your search page moves onto the builder.",
    addable: false,
  },
  "collection-grid": {
    label: "Products",
    group: "Content",
    description: "A collection's products. Created when your collection page moves onto the builder.",
    addable: false,
  },
  "campaign-main": {
    label: "Campaign products",
    group: "Content",
    description:
      "The sale's banner and the products it discounts. Created with the campaign's own page.",
    // Not addable: the page IS this section, and which campaign it shows comes
    // from the page's address — a second one, or one on another page, would have
    // no campaign to draw.
    addable: false,
  },
  "product-main": {
    label: "Product",
    group: "Content",
    description: "A product's photos, options and buy buttons. Created when your product page moves onto the builder.",
    addable: false,
  },
  "related-products": {
    label: "Related products",
    group: "Products",
    description:
      "Products like the one on the page, from its collection. To show them here instead of under the product, turn on Hide “You may also like” in the Product section.",
    addable: true,
  },
  faq: {
    label: "FAQ",
    group: "Content",
    description: "Questions and answers that open when tapped.",
    item: "Question",
    addable: true,
  },
  "call-to-action": {
    label: "Call to action",
    group: "Conversion",
    description: "A headline, a short line and one button.",
    addable: true,
  },
  "product-grid": {
    label: "Product grid",
    group: "Products",
    description: "Products in rows — newest, featured, from a collection, a tag, or picked by hand.",
    addable: true,
  },
  "promises-band": {
    label: "Promises band",
    group: "Content",
    description: "A row of short promises, like cash on delivery or easy returns.",
    item: "Promise",
    addable: true,
  },
  "image-text": {
    label: "Image and text",
    group: "Content",
    description: "A picture beside a headline, a paragraph and up to two buttons.",
    addable: true,
  },
  "shop-by-tag": {
    label: "Shop by tag",
    group: "Categories",
    description: "Chips that link to products with a tag.",
    addable: true,
  },
  "collections-row": {
    label: "Collections row",
    group: "Categories",
    description: "Your collections as cards or plain links.",
    addable: true,
  },
  "selected-products": {
    label: "Selected products",
    group: "Products",
    description: "A few products side by side, with a link to see more.",
    addable: true,
  },
  "product-carousel": {
    label: "Product carousel",
    group: "Products",
    description: "Products in one row that scrolls sideways.",
    addable: true,
  },
  "campaign-offers": {
    label: "Campaign offers",
    group: "Offers",
    description: "Your running campaigns and when they end.",
    addable: true,
  },
  "category-tiles": {
    label: "Category tiles",
    group: "Categories",
    description: "Collection pictures as tiles, circles or overlays.",
    addable: true,
  },
  "category-promo-cards": {
    label: "Category promo cards",
    group: "Categories",
    description: "Large cards promoting up to four collections.",
    item: "Card",
    addable: true,
  },
  "order-form": {
    label: "Order form",
    group: "Conversion",
    description: "One product with its options and your checkout form — shoppers order without leaving the page.",
    addable: true,
  },
  "single-product": {
    label: "Single product",
    group: "Products",
    description: "One product with its photos, options, price and buy buttons, like its product page.",
    addable: true,
  },
  "offer-pricing": {
    label: "Offer & pricing",
    group: "Offers",
    description: "A product's price with its original price crossed out and the discount.",
    addable: true,
  },
  "sticky-order-bar": {
    label: "Sticky order bar",
    group: "Conversion",
    description:
      "A bar pinned to the bottom of phone screens. Its button goes to the order form on the page, or to the product's buy buttons when there is none.",
    addable: true,
    pinned: true,
  },
  testimonials: {
    label: "Testimonials",
    group: "Social proof",
    description: "What real customers said — their words, stars, photo or a screenshot of the review.",
    item: "Review",
    addable: true,
  },
  benefits: {
    label: "Benefits",
    group: "Content",
    description: "Cards with an icon, a title and a line about what the product does.",
    item: "Benefit",
    addable: true,
  },
  "how-to-order": {
    label: "How to order",
    group: "Content",
    description: "Numbered steps that show shoppers how ordering works.",
    item: "Step",
    addable: true,
  },
  video: {
    label: "Video",
    group: "Content",
    description: "A YouTube or Facebook video that starts when tapped.",
    addable: true,
  },
  "image-banner": {
    label: "Image banner",
    group: "Hero & banners",
    description: "One wide picture, with words and a button on it — or, with a link and no button, the whole picture as the link.",
    addable: true,
  },
  gallery: {
    label: "Gallery",
    group: "Content",
    description: "Pictures in a grid, each with a caption and a link if you like.",
    item: "Picture",
    addable: true,
  },
  spacer: {
    label: "Spacer",
    group: "Layout",
    description: "Empty space between two sections, with a line across it if you like.",
    addable: true,
  },
  countdown: {
    label: "Countdown",
    group: "Offers",
    description: "A timer to the end of an offer.",
    // Not drawn yet: its units have no Bangla terms in the glossary (plan §17).
    addable: false,
  },
};

/** Setting labels, by setting key. Shared across sections — the same key means the same thing. */
const FIELD_LABELS: Record<string, string> = {
  align: "Alignment",
  subheading: "Line under the heading",
  tileRatio: "Tile shape",
  sort: "Order",
  verticalAlign: "Words up or down",
  scrim: "Shade under the words",
  screens: "Show on",
  emptyHeading: "Heading when nothing is found",
  emptyText: "Text when nothing is found",
  expired: "When the clock runs out",
  expiredText: "What it says then",
  perView: "Cards in view",
  openFirst: "Open the first one",
  /* A different question from the Style tab's Text alignment, and it was asked
     in the same words. A grid already spans the content column, so there is no
     row left to move: this places each tile INSIDE its own column (`GRID_ALIGN`
     in `collection-tiles.tsx`), while the heading above it follows Style → Text
     alignment. Naming them apart is the fix; they are not duplicates. */
  "collections-row.align": "Tile position",
  "category-tiles.align": "Tile position",
  alt: "Picture description",
  answer: "Answer",
  arrows: "Show arrows",
  badge: "Badge",
  body: "Text",
  buttonHref: "Button link",
  buttonLabel: "Button label",
  campaignBadge: "Show the running offer as the badge",
  caption: "Caption",
  cardImageFit: "Card photo fit",
  cardImageRatio: "Card photo shape",
  cardCorners: "Card corners",
  cardButtons: "Card button style",
  categoryId: "Collection",
  categoryIds: "Collections",
  columns: "Columns",
  coupon: "Coupon box",
  ctaHref: "Link",
  ctaLabel: "Link label",
  description: "Description",
  flow: "Layout",
  focal: "Focus point",
  dots: "Slide dots",
  nav: "Slide controls",
  interval: "Seconds per slide",
  frame: "Picture shape",
  "hero.frame": "Hero shape",
  galleryLayout: "Photo layout",
  heading: "Heading",
  height: "Picture height (px)",
  /* The hero is the whole band, not a picture inside one — "Picture height"
     would be describing the wrong box. */
  "hero.height": "Hero height (px)",
  hideCoupon: "Hide the coupon field",
  hideDescription: "Hide the description",
  hideText: "Hide text",
  hideTextOnMobile: "Hide text on phones",
  icon: "Icon",
  image: "Picture",
  imageFit: "Picture fit",
  imageRatio: "Picture shape",
  imageSide: "Picture side",
  label: "Video name",
  layout: "Layout",
  limit: "Number of products",
  line: "Show a line",
  link: "Link",
  mobileColumns: "Columns on phones",
  mobileCopy: "Phone text",
  mobileFirst: "First on phones",
  mobileImage: "Phone picture",
  mode: "Style",
  name: "Name",
  perRow: "Cards per row",
  photo: "Photo",
  poster: "Cover picture",
  productId: "Product",
  hideRelated: "Hide “You may also like”",
  productIds: "Products",
  promises: "Show your promises",
  question: "Question",
  radius: "Corner roundness",
  rating: "Stars (1–5)",
  ratio: "Picture shape",
  secondaryHref: "Second button link",
  secondaryLabel: "Second button label",
  secondaryLink: "Second button link",
  shape: "Card shape",
  showLabels: "Show names",
  side: "Picture side",
  slideshow: "Show as a slideshow",
  space: "Height (px)",
  source: "Products to show",
  split: "Picture share (%)",
  storeBanner: "Use the store banner",
  storeHeading: "Heading when empty",
  storePromises: "Use your store's promises",
  storeWords: "Use the store's wording",
  style: "Style",
  subtitle: "Subtitle",
  tagIds: "Tags",
  text: "Text",
  title: "Title",
  url: "Video link",
  viewAll: "Show a “View all” link",
  wholeRows: "Only full rows",
  /* A core section's override of a store-wide layout, named as its Customize
     panel names it — one decision should not have two names. */
  "collection-grid.layout": "Products per row",
  "collection-grid.pagination": "Loading more products",
  /* `layout` above is already called "Products per row" — it is the store's own
     name for a choice that answers three things at once. This is the exact
     count, so it says so, and the hint says which one wins. */
  "collection-grid.columns": "Exact number in a row",
  "collection-grid.heading": "Heading (all collections)",
  "collection-grid.hideHeading": "Hide the heading",
  "collection-grid.hideCount": "Hide the results count",
  "collection-grid.cardImageRatio": "Card photo shape",
  "collection-grid.cardImageFit": "Card photo fit",
  "campaign-main.layout": "Products per row",
  "campaign-main.pagination": "Loading more products",
  "campaign-main.hideBanner": "Hide the sale banner",
  "product-main.layout": "Photo layout",
  /* The page's big photo, not a card — so it takes `image-text`'s words rather
     than "Card photo shape", which on THIS section means the row underneath. */
  "product-main.imageRatio": "Product photo shape",
  "product-main.imageFit": "Product photo fit",
  "product-main.hideDescription": "Hide the product's own words",
  "product-main.relatedLimit": "Related products shown",
  "product-main.relatedColumns": "Related products in a row",
  "product-main.cardImageRatio": "Related card photo shape",
  "product-main.cardImageFit": "Related card photo fit",
  "account-area.layout": "Account layout",
  "content-body.layout": "Page frame",
  "content-body.title": "Page heading",
  "content-body.body": "Page text",
};

const CARD_PHOTO_HINT = "Default follows Customize → Product cards, for every card on the store.";

const HINTS: Record<string, string> = {
  /* The overflow question, asked where the merchant actually asks it. Both
     category rows answer it with this one control, so neither needs a separate
     "what happens when they do not fit" setting — but nothing on the panel said
     so, and a merchant looking for wrapping had no reason to open Layout. */
  "category-tiles.layout": "Grid puts what does not fit on the next line. Strip keeps one row — arrows on a computer, a swipe on a phone.",
  "collections-row.layout": "Grid puts what does not fit on the next line. Strip keeps one row — arrows on a computer, a swipe on a phone.",
  /* Section-keyed rather than bare `arrows`: the promo row's arrows are the
     same component, but this sentence is about a row of small tiles a phone
     swipes, and naming the phone is the whole point of the hint. */
  "category-tiles.arrows": "Only on a computer, and only while the row is too long to fit. Phones always swipe it.",
  "collections-row.arrows": "Only on a computer, and only while the row is too long to fit. Phones always swipe it.",
  "category-tiles.hideDescription": "Keeps the collection's name alone. The sentence still heads the collection's own page.",
  "category-tiles.radius": "Empty follows your theme's Corner radius.",
  /* NOT the bare `tileRatio` hint below, which promises a square: only the
     tile, circle and disc styles draw one. An overlay has always been 3:4. */
  "category-tiles.tileRatio": "Empty keeps each style's own shape — a square tile, a taller overlay.",
  /* Names and the sentence under them are ONE decision in the markup (the tile
     draws both or neither), and the row overrides an off switch whenever a
     collection has no picture to stand on its own. Both are worth saying: the
     first stops a merchant hunting for a second control, the second explains a
     switch that appears to do nothing on a half-photographed catalogue. */
  "category-tiles.showLabels": "Off leaves the pictures to speak — no name, no description. A row where any collection has no picture keeps its names anyway.",
  "collections-row.radius": "Empty follows your theme's Corner radius.",
  /* Says the quiet part: the editor is where this page's words go, and leaving
     it empty is a choice rather than an unfinished page. Both settings are
     optional, and an empty section draws nothing at all. */
  "content-body.body":
    "Your page's own words. Leave it empty to build the page from the sections instead — nothing is shown here then.",
  "content-body.title": "Shown above the text. Leave it empty for a page with no heading of its own.",
  "checkout-form.hideCoupon":
    "Takes the code box off the checkout. Set it per screen — a coupon box on a phone invites a shopper to leave and hunt for a code.",
  hideRelated: "Add a Related products section to show them somewhere else on the page.",
  "collections-row.align": "Where each tile sits inside its own column. The heading follows Style → Text alignment.",
  "category-tiles.align": "Where each tile sits inside its own column. The heading follows Style → Text alignment.",
  alt: "Say what the picture shows. Screen readers read it aloud.",
  frame: "Default shows each picture whole. A shape crops it to fit.",
  /* NOT the bare `frame` hint above. A hero always has a box — it has never
     drawn a picture at its own proportions — so "default shows each picture
     whole" would be false on every hero. Says what unset draws instead. */
  "hero.frame":
    "Default keeps each layout's own shape: a card is 16:9 on phones and 4:3 above, an open hero 4:3, and a full-width hero fills a set height. A phone shape applies below 680px on card and open heroes, and below 640px on a full-width one.",
  buttonHref: "A page on your store like /products, a full web address, or tel: / mailto:.",
  link: "A page on your store like /products, a full web address, or tel: / mailto:.",
  ctaHref: "A page on your store like /products, or a full web address.",
  categoryIds: "Leave empty to show every collection.",
  mobileImage: "Optional. Shown on phones instead of the main picture.",
  subheading: "One line under the heading, for the sentence the heading cannot hold.",
  tileRatio: "Empty keeps the square tile this row has always drawn.",
  sort: "Empty keeps the order the source gives. A hand-picked row always keeps yours.",
  scrim: "Empty keeps each alignment's own shade — a gradient under words at the bottom, a flat wash under centred ones.",
  screens: "The bar has always been a phone thing. Computers too puts it on every screen — check it against your header and cart drawer first.",
  emptyHeading: "Empty keeps your shop's own wording in the shopper's language.",
  emptyText: "Empty keeps your shop's own wording in the shopper's language.",
  "order-form.buttonLabel": "Empty keeps your shop's own “Place order” in the shopper's language.",
  perView: "How many cards a shopper sees at once. Empty keeps the row's own measure.",
  openFirst: "Shows the first answer already open, for a page whose first answer is the one that sells.",
  flow: "Wrap puts what does not fit on another line. Scroll keeps one row a shopper swipes.",
  "testimonials.columns": "How many reviews sit side by side. On a phone this needs the row set to Wrap — a swipe row has no columns.",
  /* Section-keyed like its neighbours: only the hero has this field today, but a
     bare key is the collision `frame` already walked into — see `"hero.frame"`. */
  "hero.mobileFirst":
    "Default keeps each layout's own order. Text first pushes the picture down the phone's screen, often below the fold — use it where the picture is decoration rather than the product.",
  "hero.imageSide": "Which side the picture takes on a desktop. Phones show one column, so this does nothing there.",
  /* Section-keyed, like `"hero.frame"` above it and for the same reason: the
     promo row's `height` means a card's height, this one means the whole hero's,
     and the two layouts answer differently to a number. */
  "hero.height":
    "The hero's height in pixels. A height REPLACES Picture shape on the screen you set it for — set one or the other, not both. On a full-width hero it is a minimum, so the hero still grows if the words need more room.",
  /* Section-keyed for the reason `"hero.frame"` gives: `image-text` and the hero
     ask the same question of layouts that start from different defaults. */
  "image-text.mobileFirst":
    "Default leads the phone with the picture, as this section always has. The text first pushes the picture down the screen — use it where the words are what a shopper came for.",
  "image-text.imageSide": "Which side the picture takes on a desktop. Phones show one column, so this does nothing there.",
  "image-text.split":
    "How much of the desktop row the picture takes, 20 to 80 percent. The text takes the rest. Empty splits the row evenly. Phones stack, so this does nothing there.",
  "image-text.imageFit":
    "Default crops the picture to the shape. Fit shows the whole picture inside it, which is how the old home page's banner band drew it.",
  "image-text.imageRatio": "The shape the picture is drawn at. A phone shape applies below 680px.",
  "hero.mobileCopy":
    "A full-width hero lays its words over the photograph, so a phone shows the headline alone. Everything adds the badge and the subtitle back, smaller. The headline is two lines on a phone either way.",
  cardImageFit: CARD_PHOTO_HINT,
  cardImageRatio: CARD_PHOTO_HINT,
  cardCorners: "Default follows Look → Corner radius, for every card and panel in the store.",
  cardButtons: "The fill of this section's Add to cart and Buy now. Default follows Look → Buttons.",
  "product-main.cardCorners": "The corners of the “You may also like” cards. Default follows Look → Corner radius.",
  "product-main.cardButtons": "The fill of the “You may also like” buttons. Default follows Look → Buttons.",
  coupon: "Lets shoppers type a coupon code into the form. Off by default.",
  galleryLayout: "Default uses your store's product page layout.",
  "product-main.layout": "Default keeps the layout your store already used. This page shows every product, so a change here applies to all of them.",
  /* Says where unset comes FROM, like every other card-photo hint — and then
     the one thing this control can do that Customize cannot: move the product
     page's photo without moving every card in the shop. */
  "product-main.imageRatio":
    "The shape the product's photo is drawn in. Default follows Customize → Product cards; setting it here moves the product page only, and a phone shape applies below 680px.",
  "product-main.imageFit":
    "Default follows Customize → Product cards. Full photo shows the whole picture; Cropped fills the frame and trims what does not fit.",
  "product-main.hideDescription":
    "Takes the product's description off every product page. Use it where a Rich text or FAQ section below tells it better.",
  "product-main.relatedLimit": "How many products the “You may also like” row shows. Empty shows four.",
  "product-main.relatedColumns": "How many of them sit on a line. Empty follows your store's usual grid.",
  "collection-grid.layout": "Default keeps the layout your store already used, on every category page.",
  "collection-grid.columns":
    "Sets the exact number of products on a line, per screen. It wins over Products per row, so a page can keep its filter sidebar and still show four. Empty follows that choice.",
  /* The warning has to arrive BEFORE the merchant types, because the trap is
     invisible from this screen: the editor previews one collection and the
     setting names all of them. */
  "collection-grid.heading":
    "⚠ One page draws every collection, so your words replace the name of each one — and stay in the language you type. Empty shows each collection's own name, and “All products” in the shopper's language.",
  "collection-grid.subheading":
    "One line under the heading, on every collection page — a delivery promise or an offer reads well here. A collection's own words do not.",
  "collection-grid.hideHeading":
    "Takes the page's title off, for a page that opens with a picture or your own words above the grid.",
  "collection-grid.hideCount": "Takes the “84 results” line off.",
  "collection-grid.pagination":
    "Default keeps your store's choice. Setting it here moves category pages only — search results are unaffected.",
  "account-area.layout": "Default keeps the layout your store already used.",
  "content-body.layout":
    "Default follows Customize → Content & tracking, which also frames the order-tracking page. Setting it here moves this page only.",
  label: "Read aloud by screen readers for the play button.",
  photo: "Optional. Only with the customer's permission.",
  poster: "Optional. A YouTube video uses its own cover when this is empty.",
  rating: "Leave empty for no stars.",
  url: "A YouTube or Facebook video link. Any other link shows nothing.",
  storeHeading: "Shown in the shopper's language when Heading is empty.",
  secondaryLink: "A page on your store like /products, a full web address, or tel: / mailto:.",
  slideshow: "Rotates the slides with dots, even when there is only one.",
  nav: "What a shopper moves the slides with. Swipe works on a phone whichever you choose.",
  interval: "How long each slide stays before the next one. Empty runs the usual 5 seconds.",
  dots: "Where the little dots that count the slides sit. On the picture gives the hero back the strip of page the row underneath takes, and needs a picture on every slide.",
  space: "The room between the sections above and below.",
  storeBanner: "Shows the banner from Customize → Look when the first slide has no picture.",
  storeWords: "Uses your store's name and the storefront's own button words, in the shopper's language, where yours are empty.",
  storePromises: "Shows the promises from Customize → Footer instead of the rows below, and stays in step with them.",
  campaignBadge: "Names your running campaign when the first slide has no badge.",
  promises: "Lists your promises from Customize → Footer under the hero card.",
  viewAll: "Goes to Link, or else to this row's collection or all products.",
  wholeRows: "Hides the few products a short last row would leave on their own.",
};

/** Option names that only make sense for one setting, where the same value means something else elsewhere. */
const FIELD_VALUE_LABELS: Record<string, Record<string, string>> = {
  /* The store-wide lists' own words (`DESIGN_BUTTON_STYLES`, `DESIGN_RADII` in
     `lib/storefront-theme.ts`), pinned here rather than derived from the value.
     They are NOT in `CUSTOMIZE_OPTIONS` because that map reads
     `TEMPLATE_OPTIONS`, which holds the `templates.*` pickers — these two
     mirror `theme.design`, a different store setting with a different home. */
  cardButtons: { solid: "Solid", outline: "Outline", soft: "Soft" },
  cardCorners: { sharp: "Sharp", soft: "Soft", round: "Round" },
  mobileFirst: {
    picture: "The picture",
    text: "The text",
  },
  screens: {
    phones: "Phones",
    "phones-and-computers": "Phones and computers",
  },
  sort: {
    newest: "Newest first",
    "price-low": "Cheapest first",
    "price-high": "Dearest first",
  },
  expired: {
    hide: "Hide the section",
    keepZero: "Keep it, showing zero",
    message: "Show a message",
  },
  mobileCopy: {
    full: "Everything",
    "title-only": "Headline only",
  },
  dots: {
    under: "Under the hero",
    over: "On the picture",
  },
  nav: {
    dots: "Dots",
    arrows: "Arrows",
    both: "Both",
  },
  storeHeading: {
    featured: "“Featured products”",
    newArrivals: "“New arrivals”",
    selected: "“Selected for you”",
    collection: "The collection's name",
    shopByAge: "“Shop by age”",
    campaignOffers: "“Current offers”",
  },
};

/**
 * Settings whose options ARE a Customize choice, named the way Customize names
 * them — so "Extra tall" or "Full photo" reads the same on both screens, and a
 * rename there is a rename here.
 */
/**
 * Which Customize picker owns a setting's wording, so a section that mirrors a
 * store-wide choice offers the merchant the SAME option names rather than a
 * second vocabulary for one decision.
 *
 * Keyed by `"<section type>.<field>"` or a bare `"<field>"` — the qualified
 * entry wins, which is what lets `layout` mean four different lists on four
 * different sections. Same precedence as `fieldEmptyChoice`.
 */
const CUSTOMIZE_OPTIONS: Record<string, string> = {
  cardImageFit: "imageFit",
  cardImageRatio: "imageRatio",
  galleryLayout: "product",
  // A system page's core section overriding the store's own `templates.*`.
  "product-main.layout": "product",
  /* The same two lists Customize → Product cards offers, so "Extra tall" and
     "Full photo" read identically whichever screen the merchant is on. */
  "product-main.imageRatio": "imageRatio",
  "product-main.imageFit": "imageFit",
  "collection-grid.layout": "collection",
  "collection-grid.pagination": "pagination",
  "account-area.layout": "accountLayout",
  "content-body.layout": "contentLayout",
};

/** Readable names for enum values, where the raw value would not read well. */
const VALUE_LABELS: Record<string, string> = {
  "full-bleed": "Full width",
  "4:1": "Strip 4:1",
  "3:1": "Wide strip 3:1",
  "21:9": "Cinema 21:9",
  "4:5": "Portrait 4:5",
  "1:1": "Square",
  "4:3": "Landscape 4:3",
  "16:9": "Wide 16:9",
  "3:4": "Portrait 3:4",
  "9:16": "Tall 9:16",
  crop: "Fill and crop",
  fit: "Show the whole picture",
  manual: "Picked by hand",
  category: "From a collection",
  tag: "With a tag",
  featured: "Featured",
  newest: "Newest",
  disc: "Circle with ring",
  alternate: "Alternate",
  mapPin: "Map pin",
};

const words = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").toLowerCase();

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * A setting's entry in one of the label maps: the section's own
 * `"<type>.<field>"` first, then the bare `"<field>"` every section shares.
 *
 * The same precedence `fieldEmptyChoice` uses, and for the same reason — `layout`
 * names a different list on each section that has one, while `heading` means the
 * same thing everywhere.
 */
const bySection = <T,>(
  map: Record<string, T>,
  field: string,
  sectionType?: string,
): T | undefined => (sectionType ? map[`${sectionType}.${field}`] : undefined) ?? map[field];

export const fieldLabel = (key: string, sectionType?: string): string =>
  bySection(FIELD_LABELS, key, sectionType) ?? sentence(words(key));

export const fieldHint = (key: string, sectionType?: string): string | undefined =>
  bySection(HINTS, key, sectionType);

/** An option's label — Customize's own wording for a setting that mirrors a Customize choice. */
export const valueLabel = (value: string, field?: string, sectionType?: string): string => {
  const source = field ? bySection(CUSTOMIZE_OPTIONS, field, sectionType) : undefined;
  const customize = source ? TEMPLATE_OPTIONS[source]?.find((option) => option.value === value) : undefined;
  const own = field ? FIELD_VALUE_LABELS[field]?.[value] : undefined;
  return customize?.label ?? own ?? VALUE_LABELS[value] ?? sentence(words(value));
};

export const sectionLabel = (type: string): string =>
  Object.hasOwn(SECTION_CATALOGUE, type) ? SECTION_CATALOGUE[type as SectionType].label : sentence(words(type));

/**
 * Is this the page's **core section** — the one that draws the page itself?
 *
 * The same answer as "not offered in the add library": a section a merchant
 * cannot add is one the page's own move created, which is exactly the set that
 * must not be removed, hidden or duplicated either (§6). One source, so a new
 * core section cannot be registered as un-addable and still be deletable.
 */
export const isCoreSection = (type: string): boolean =>
  SECTION_CATALOGUE[type as SectionType]?.addable === false;
