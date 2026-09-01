// coding-standard: maintained
/**
 * Storefront theme catalog (frontend). Mirrors the backend preset/section ids
 * (src/constants/storefront-theme.ts) and adds the visual swatch each preset
 * maps to. The merchant picks a preset and may override brand/accent colors.
 */

export interface ThemePreset {
  id: string;
  label: string;
  brandColor: string;
  accentColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", label: "Default", brandColor: "#111827", accentColor: "#2563eb" },
  { id: "minimal", label: "Minimal", brandColor: "#0f172a", accentColor: "#64748b" },
  { id: "bold", label: "Bold", brandColor: "#dc2626", accentColor: "#f59e0b" },
  { id: "elegant", label: "Elegant", brandColor: "#4c1d95", accentColor: "#a78bfa" },
];

export const getPreset = (id?: string): ThemePreset =>
  THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];

/* The homepage section catalogue used to live here as `HOMEPAGE_SECTIONS` /
   `DEFAULT_HOMEPAGE_SECTIONS`, listing four ids — `banner`, `categories`,
   `featured`, `products` — that no section component ever answered to. It was
   superseded by the real registry (`SECTION_COMPONENTS` / `SECTION_LABELS` /
   `HOME_PRESET_SECTIONS` in lib/storefront-section-ids.ts, and `SECTION_COMPONENTS`
   in components/storefront/home/home-sections.tsx) and
   had no remaining callers, so it is deleted rather than left as a second,
   wrong answer to "what sections exist". */

/** Resolve the effective brand/accent colors from a theme (preset + overrides). */
export function resolveThemeColors(theme?: {
  preset?: string;
  brandColor?: string;
  accentColor?: string;
}) {
  const preset = getPreset(theme?.preset);
  return {
    brandColor: theme?.brandColor || preset.brandColor,
    accentColor: theme?.accentColor || preset.accentColor,
  };
}

/* ---------------------------------------------------------------------------
 * Design tokens (`theme.design`) — the visual vocabulary a store renders in.
 *
 * These are what make two shops read as unrelated businesses; brand colour
 * barely does. Each axis is a plain id that `StoreShell` stamps onto `.sf-shell`
 * as a `data-*` attribute, and `app/(storefront)/storefront.css` resolves into
 * concrete custom properties.
 *
 * **The ids here and the CSS attribute selectors there are one contract.**
 * Adding an option means adding a `.sf-shell[data-<axis>="<id>"]` block — and
 * for `scale`/`density`, repeating it inside BOTH `@media` blocks, since those
 * tokens are responsive and an unrepeated block silently flattens the ramp.
 *
 * Unlike `templates`, the ids need no admin→storefront translation: they are
 * already short and mean the same thing on both sides, so there is no `pick()`
 * map here — just an allow-list derived from the catalogue itself, which is why
 * the catalogue cannot drift out of sync with the validator.
 * ------------------------------------------------------------------------- */

/** One option on a design axis. Descriptions read from the shop's side, matching TEMPLATE_OPTIONS' voice. */
export interface DesignOption {
  id: string;
  label: string;
  description: string;
}

/**
 * Type families. Each is a Latin face chained to a Bengali face that suits it —
 * the storefront is EN/BN, so an option whose Bengali fallback is an afterthought
 * is an option that looks broken to half the market. Declared in
 * `app/(storefront)/layout.tsx`; the pairing itself lives in storefront.css.
 */
export const DESIGN_FONTS: DesignOption[] = [
  { id: "sans", label: "Modern sans", description: "Clean and neutral — suits any catalogue" },
  { id: "serif", label: "Elegant serif", description: "Editorial headlines — fashion, beauty, gifts" },
  { id: "grotesk", label: "Techy grotesk", description: "Squared-off and precise — electronics, gadgets" },
  { id: "rounded", label: "Friendly rounded", description: "Soft and approachable — grocery, food, kids" },
  { id: "humanist", label: "Clear humanist", description: "Calm and legible — pharmacy, health, services" },
  /* The one PAIRED option: a display face on the headings, a plain one on
     everything else. It is not "another font" — it is the only id that makes
     `--font-display` differ from `--font-storefront`, which is what lets a shop
     have a voice in its headlines without setting its prices and form labels in
     a face never drawn below 20px. See the note in `fonts.ts`. */
  { id: "market", label: "Display + text", description: "Bold headline face over plain body text — market, deli, bakery" },
];

/**
 * The GROUND a shop is printed on — page, cards, panels, hairlines and text.
 * Drives `--page`/`--card`/`--surface`/`--text`/`--muted`/`--border`.
 *
 * **Deliberately not the brand colour.** `--primary` stays the merchant's own
 * and is layered on top, so a surface never fights a brand: the two answer
 * different questions ("what paper is this printed on" vs "what colour is the
 * shop's own mark"). That is also why a surface must never redefine
 * `--primary-soft` — it is `color-mix(…, transparent)` off the brand, so it
 * picks up whichever ground is behind it for free.
 *
 * This axis exists because it was the last thing making every theme read as one
 * family. Four themes had four brand hues, four typefaces and four page
 * structures, and still looked related, because all four were white cards on a
 * near-white page — the one thing a shopper registers before anything else.
 */
export const DESIGN_SURFACES: DesignOption[] = [
  { id: "default", label: "Clean white", description: "White cards on a near-white page — the default" },
  { id: "parchment", label: "Warm parchment", description: "Cream ground with tan panels — grocery, food, craft" },
  // The inverse of the other two: the PAGE is tinted and the card is pure white,
  // so every card reads as a separate object rather than a slightly lighter
  // patch of the same sheet.
  { id: "mist", label: "Cool mist", description: "White cards on a soft grey-blue page — pharmacy, clinical, technical" },
  // Mist's STRUCTURE — tinted page, pure-white card — at the opposite end of the
  // wheel. Parchment is the only other warm ground and it is yellow-tan, which
  // reads as bakery paper; this is a pink-neutral that reads as a nursery.
  { id: "nursery", label: "Soft nursery", description: "White cards on a warm blush page — baby, kids, gifts" },
];

/**
 * `[page, card, panel]` per surface, for the **admin's** previews — the Customize
 * swatch and the theme-store tile. Page, card, panel is the order a shopper sees
 * them stacked.
 *
 * Literals, copied from the `[data-surface]` blocks in
 * `app/(storefront)/storefront.css`, and that duplication is deliberate: those
 * tokens live under `.sf-root` and the admin is not inside it, so a preview that
 * referenced them would paint every tile the admin's own grey. It lives HERE
 * rather than in either component because there are two call sites and a third
 * copy is where a colour starts drifting from the shop it claims to show.
 * ⚠ Adding a surface means adding a row — a missing one silently falls back to
 * `default`, and the merchant judges the theme from a tile showing the wrong
 * shop.
 */
const SURFACE_SWATCH: Record<string, [string, string, string]> = {
  default: ["#f8fafc", "#ffffff", "#f1f5f9"],
  parchment: ["#f5ead8", "#f9f4ed", "#ebddc5"],
  mist: ["#eef2f5", "#ffffff", "#e2e9ee"],
  nursery: ["#faf3ef", "#ffffff", "#f4e8e2"],
};

/** The swatch for a surface id, falling back to the built-in look. */
export const surfaceSwatch = (id: string) =>
  SURFACE_SWATCH[id] ?? SURFACE_SWATCH.default;

/** Heading size ramp. Drives `--h1`/`--h1m`/`--h2`. */
export const DESIGN_SCALES: DesignOption[] = [
  { id: "md", label: "Balanced", description: "Headings sit comfortably above the products" },
  { id: "sm", label: "Understated", description: "Small headings — the catalogue does the talking" },
  { id: "lg", label: "Statement", description: "Big headings that lead the page" },
];

/** Spacing rhythm + grid width. Drives `--pad`/`--gap`/`--cols`. */
export const DESIGN_DENSITIES: DesignOption[] = [
  { id: "cozy", label: "Cozy", description: "The balance most shops want" },
  { id: "compact", label: "Compact", description: "Tighter spacing, more products per screen" },
  { id: "airy", label: "Airy", description: "Generous white space, fewer products in view" },
];

/**
 * Corner radius. Drives `--radius-sm`/`--radius-md`/`--radius-lg` — and only
 * those: the storefront's `999px` pills and `50%` circles are shape constants,
 * not radii, so they are deliberately outside this scale (see storefront.css).
 */
export const DESIGN_RADII: DesignOption[] = [
  { id: "soft", label: "Soft", description: "Gently rounded corners — the default" },
  { id: "sharp", label: "Sharp", description: "Crisp, near-square corners" },
  { id: "round", label: "Round", description: "Generously rounded, friendlier" },
  // The step where controls stop having a radius and become a shape. Buttons,
  // chips and search boxes go fully round; cards stay square-cornered enough to
  // hold a paragraph.
  { id: "pill", label: "Pill buttons", description: "Fully round buttons and chips over soft cards" },
];

/**
 * How much of the screen the shop occupies. Drives `--maxw` **and `--cols`**.
 *
 * ⚠ The column half is not optional. `--cols` is a fixed count, not a function
 * of available space — 4 at desktop, 5 on compact, 3 on airy — so widening
 * `--maxw` alone does not add products, it inflates the ones already there. On a
 * 27" monitor an uncapped page would render the same four cards at roughly
 * 600px each, which is the opposite of what anyone asking for full width wants.
 * A width step therefore always moves the column count with it.
 *
 * Prose deliberately does NOT follow — see `--maxw-prose` in storefront.css.
 */
export const DESIGN_WIDTHS: DesignOption[] = [
  { id: "contained", label: "Contained", description: "A centred 1200px page — the default" },
  { id: "wide", label: "Wide", description: "More of the screen, and a fifth column of products" },
  { id: "full", label: "Full width", description: "Edge to edge, with six columns on a large screen" },
];

/** The resolved design a storefront renders with. */
export interface StoreDesign {
  font: string;
  surface: string;
  scale: string;
  density: string;
  radius: string;
  width: string;
}

/**
 * Defaults = the storefront exactly as it looked before design tokens existed,
 * so an untouched store is visually unchanged. Each is the FIRST entry of its
 * catalogue, matching the `TEMPLATE_OPTIONS`/`seedTemplates` convention.
 */
export const DEFAULT_DESIGN: StoreDesign = {
  font: DESIGN_FONTS[0].id,
  surface: DESIGN_SURFACES[0].id,
  scale: DESIGN_SCALES[0].id,
  density: DESIGN_DENSITIES[0].id,
  radius: DESIGN_RADII[0].id,
  width: DESIGN_WIDTHS[0].id,
};

const idsOf = (options: DesignOption[]) => new Set(options.map((o) => o.id));
const FONT_IDS = idsOf(DESIGN_FONTS);
const SURFACE_IDS = idsOf(DESIGN_SURFACES);
const SCALE_IDS = idsOf(DESIGN_SCALES);
const DENSITY_IDS = idsOf(DESIGN_DENSITIES);
const RADIUS_IDS = idsOf(DESIGN_RADII);
const WIDTH_IDS = idsOf(DESIGN_WIDTHS);

const pickId = (allowed: Set<string>, raw: string | undefined, fallback: string) =>
  raw && allowed.has(raw) ? raw : fallback;

/**
 * Resolve a store's raw `theme.design` into the ids the shell stamps. The single
 * validation point — an unknown id (a retired option, a hand-edited document, a
 * theme from a newer build) falls back to the default rather than reaching the
 * DOM, where it would match no CSS block and render an unstyled store.
 *
 */
export function resolveDesign(design?: {
  font?: string;
  surface?: string;
  scale?: string;
  density?: string;
  radius?: string;
  width?: string;
}): StoreDesign {
  return {
    font: pickId(FONT_IDS, design?.font, DEFAULT_DESIGN.font),
    surface: pickId(SURFACE_IDS, design?.surface, DEFAULT_DESIGN.surface),
    scale: pickId(SCALE_IDS, design?.scale, DEFAULT_DESIGN.scale),
    density: pickId(DENSITY_IDS, design?.density, DEFAULT_DESIGN.density),
    radius: pickId(RADIUS_IDS, design?.radius, DEFAULT_DESIGN.radius),
    width: pickId(WIDTH_IDS, design?.width, DEFAULT_DESIGN.width),
  };
}

/**
 * The `data-*` attributes `StoreShell` stamps on `.sf-shell`.
 *
 * A default axis is stamped as `undefined` — i.e. the attribute is omitted — so
 * `storefront.css` needs a block only for the non-defaults and the `.sf-root`
 * base values stay the single definition of the built-in look. Duplicating the
 * defaults into a `[data-density="cozy"]` block would be two places to change.
 *
 * Lives here rather than in the shell so this rule sits beside `DEFAULT_DESIGN`
 * and cannot drift from it.
 */
export function designAttrs(design: StoreDesign) {
  const omitDefault = (value: string, fallback: string) =>
    value === fallback ? undefined : value;
  return {
    "data-font": omitDefault(design.font, DEFAULT_DESIGN.font),
    "data-surface": omitDefault(design.surface, DEFAULT_DESIGN.surface),
    "data-scale": omitDefault(design.scale, DEFAULT_DESIGN.scale),
    "data-density": omitDefault(design.density, DEFAULT_DESIGN.density),
    "data-radius": omitDefault(design.radius, DEFAULT_DESIGN.radius),
    "data-width": omitDefault(design.width, DEFAULT_DESIGN.width),
  };
}
