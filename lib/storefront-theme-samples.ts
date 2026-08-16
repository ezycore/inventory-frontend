// coding-standard: maintained

/**
 * Sample shop content for the theme PREVIEW, one set per ready-made theme.
 *
 * **Why this exists.** A merchant choosing their first theme is, by definition,
 * a merchant with an empty catalogue — and every section that distinguishes one
 * theme from another hides itself on no data (`RailShell` returns null without
 * categories, `deal-strip` without a campaign, `trust-band` without badges). So
 * the four themes rendered as four near-identical empty shells at exactly the
 * moment the choice is made.
 *
 * **Why it is per theme.** Neutral filler fixed the empty shells but left
 * Meridian Care — a pharmacy theme — previewing fruit and veg on a grocer's
 * data. A theme's structure only reads as deliberate when the content matches
 * the trade it was drawn for: a clinical department rail makes sense over
 * "Prescriptions / Vitamins / Baby care" and looks arbitrary over "Bakery".
 *
 * **Why this is not a `themeId` branch.** These are values carried by a theme
 * bundle and streamed to the storefront through the existing preview bridge,
 * exactly as `badges` and `collections` already are. No component asks which
 * theme it is rendering — it renders whatever content it was handed. Adding a
 * fifth theme means adding a fifth sample set here, and changing no component.
 *
 * ⚠ **Preview only, and never a replacement.** The storefront gates all of this
 * on the preview store's `active` flag, and every pad function returns the
 * merchant's own data untouched whenever they have any. A real campaign or a
 * badge they wrote is never overwritten — samples only ever fill a gap.
 */

export interface ThemeSample {
  /** Departments for the rail, tiles, chips and links. */
  categories: string[];
  /** Products in display order. Prices are minor-unit-free numbers, like the API's. */
  products: { name: string; price: number; image: string }[];
  /** Promises for `trust-band`, which renders nothing without them. */
  promises: string[];
  /**
   * A running offer for `deal-strip`, which renders nothing without one.
   *
   * `endsAt` is deliberately absent here and computed at render — a date baked
   * into a bundle would go stale and preview an offer that expired months ago.
   */
  campaign: { name: string; type: "percentage" | "fixed"; value: number };
}

/**
 * Classic's set, and the fallback for any theme without its own.
 *
 * Deliberately trade-less: Classic is the shop as it ships and is applied by
 * grocers and boutiques alike, so naming a trade here would make the default
 * theme look like it was drawn for someone else's shop.
 */
export const NEUTRAL_SAMPLE: ThemeSample = {
  categories: [
    "New arrivals",
    "Best sellers",
    "Offers",
    "Everyday",
    "Gifts",
    "Clearance",
  ],
  products: [
    { name: "Sample item one", price: 480, image: "/samples/neutral/1.svg" },
    { name: "Sample item two", price: 1250, image: "/samples/neutral/2.svg" },
    { name: "Sample item three", price: 320, image: "/samples/neutral/3.svg" },
    { name: "Sample item four", price: 890, image: "/samples/neutral/4.svg" },
    { name: "Sample item five", price: 2100, image: "/samples/neutral/5.svg" },
    { name: "Sample item six", price: 650, image: "/samples/neutral/6.svg" },
    { name: "Sample item seven", price: 1490, image: "/samples/neutral/7.svg" },
    { name: "Sample item eight", price: 275, image: "/samples/neutral/8.svg" },
  ],
  promises: ["Fast delivery", "Easy returns", "Secure payment"],
  campaign: { name: "Sample offer — this week", type: "percentage", value: 10 },
};

/** Fresh Market. Prices spread the way a grocery basket really does. */
export const GROCERY_SAMPLE: ThemeSample = {
  categories: [
    "Fruit & veg",
    "Bakery",
    "Dairy & eggs",
    "Meat & fish",
    "Pantry",
    "Household",
  ],
  products: [
    { name: "Sample rice — 5 kg", price: 620, image: "/samples/grocery/1.svg" },
    { name: "Sample lentils — 1 kg", price: 165, image: "/samples/grocery/2.svg" },
    { name: "Sample cooking oil — 2 L", price: 385, image: "/samples/grocery/3.svg" },
    { name: "Sample milk — 1 L", price: 95, image: "/samples/grocery/4.svg" },
    { name: "Sample tea — 400 g", price: 240, image: "/samples/grocery/5.svg" },
    { name: "Sample biscuits — pack", price: 55, image: "/samples/grocery/6.svg" },
    { name: "Sample sugar — 1 kg", price: 145, image: "/samples/grocery/7.svg" },
    { name: "Sample soap — 3 bars", price: 180, image: "/samples/grocery/8.svg" },
  ],
  promises: ["Delivered same day", "Freshness guaranteed", "Cash on delivery"],
  campaign: {
    name: "Sample offer — weekly grocery deal",
    type: "percentage",
    value: 15,
  },
};

/**
 * Meridian Care.
 *
 * Names are dosage forms and pack sizes — never a real brand, and never a
 * generic name plus strength. That last one is not squeamishness: the catalogue
 * has **no field** for a generic name or a strength, so a sample claiming one
 * would advertise a capability the product does not have.
 */
export const PHARMACY_SAMPLE: ThemeSample = {
  categories: [
    "Prescriptions",
    "Vitamins",
    "Baby care",
    "Personal care",
    "Devices",
    "First aid",
  ],
  products: [
    { name: "Sample tablets — strip of 10", price: 45, image: "/samples/pharmacy/1.svg" },
    { name: "Sample syrup — 100 ml", price: 130, image: "/samples/pharmacy/2.svg" },
    { name: "Sample capsules — bottle of 30", price: 420, image: "/samples/pharmacy/3.svg" },
    { name: "Sample multivitamin — 60 tabs", price: 890, image: "/samples/pharmacy/4.svg" },
    { name: "Sample thermometer", price: 350, image: "/samples/pharmacy/5.svg" },
    { name: "Sample antiseptic — 250 ml", price: 175, image: "/samples/pharmacy/6.svg" },
    { name: "Sample bandage roll", price: 60, image: "/samples/pharmacy/7.svg" },
    { name: "Sample baby lotion — 200 ml", price: 310, image: "/samples/pharmacy/8.svg" },
  ],
  promises: ["Licensed pharmacy", "Genuine medicines", "Discreet delivery"],
  campaign: {
    name: "Sample offer — 10% off vitamins",
    type: "percentage",
    value: 10,
  },
};

/** Muslin. A boutique's spread — fewer, dearer, and shown large. */
export const APPAREL_SAMPLE: ThemeSample = {
  categories: [
    "New in",
    "Sarees",
    "Kurtis",
    "Occasion",
    "Accessories",
    "Sale",
  ],
  products: [
    { name: "Sample handloom saree", price: 4800, image: "/samples/apparel/1.svg" },
    { name: "Sample cotton kurti", price: 1650, image: "/samples/apparel/2.svg" },
    { name: "Sample silk scarf", price: 950, image: "/samples/apparel/3.svg" },
    { name: "Sample embroidered blouse", price: 1450, image: "/samples/apparel/4.svg" },
    { name: "Sample tote bag", price: 1200, image: "/samples/apparel/5.svg" },
    { name: "Sample linen shirt", price: 2300, image: "/samples/apparel/6.svg" },
    { name: "Sample beaded earrings", price: 780, image: "/samples/apparel/7.svg" },
    { name: "Sample festive dupatta", price: 1900, image: "/samples/apparel/8.svg" },
  ],
  promises: ["Handmade in Bangladesh", "7-day exchange", "Free delivery over ৳3000"],
  campaign: {
    name: "Sample offer — end of season",
    type: "percentage",
    value: 20,
  },
};
