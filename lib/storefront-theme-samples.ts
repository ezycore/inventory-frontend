// coding-standard: maintained

/**
 * Sample departments for the theme PREVIEW, one set per ready-made theme.
 *
 * A merchant choosing their first theme usually has no categories yet, and the
 * features that set themes apart hang off the taxonomy (`RailShell` renders
 * nothing without one). Per theme, so a pharmacy theme previews over pharmacy
 * departments rather than a grocer's.
 *
 * It carried sample products, offers, tags and promises too, for the classic
 * home's sections; those went with that home (2026-09-29).
 *
 * ⚠ **Preview only, and never a replacement** — see `padCategoriesForPreview`.
 */

export interface ThemeSample {
  /** Departments for the rail, tiles, chips and links. */
  categories: string[];
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
};

/** Fresh Market. */
export const GROCERY_SAMPLE: ThemeSample = {
  categories: [
    "Fruit & veg",
    "Bakery",
    "Dairy & eggs",
    "Meat & fish",
    "Pantry",
    "Household",
  ],
};

/** Meridian Care. */
export const PHARMACY_SAMPLE: ThemeSample = {
  categories: [
    "Prescriptions",
    "Vitamins",
    "Baby care",
    "Personal care",
    "Devices",
    "First aid",
  ],
};

/** Little Steps. */
export const BABY_SAMPLE: ThemeSample = {
  categories: [
    "Diapers & wipes",
    "Feeding",
    "Baby food",
    "Bath & skin care",
    "Baby clothing",
    "Toys & learning",
  ],
};

/** Muslin. */
export const APPAREL_SAMPLE: ThemeSample = {
  categories: [
    "New in",
    "Sarees",
    "Kurtis",
    "Occasion",
    "Accessories",
    "Sale",
  ],
};
