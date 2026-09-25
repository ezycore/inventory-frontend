// coding-standard: maintained
/**
 * Storefront theme catalog (frontend). Mirrors the backend preset/section ids
 * (src/constants/storefront-theme.ts) and adds the visual swatch each preset
 * maps to. The merchant picks a preset and may override brand/accent colors.
 */

import { isDarkBackground } from "@/lib/color-contrast";

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
  { id: "slab", label: "Sturdy slab", description: "Solid, catalogue-like type — hardware, parts, wholesale" },
  /* The SECOND paired option, and the reason `market` was written as a
     mechanism rather than an exception: a display serif on the headings over
     the plain text face. `market`'s display is a fat poster face; this one is
     high-contrast and quiet, which is the other half of the request. */
  { id: "boutique", label: "Editorial display", description: "High-contrast headlines over plain text — fashion, jewellery, beauty" },
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
  // Nursery's structure in the two hue families the catalogue had no entry for.
  // Both stay low-chroma for the same reason nursery does: the ground is behind
  // every product photo in the shop, not a decoration on one screen.
  { id: "sage", label: "Herb garden", description: "White cards on a soft green page — herbal, organic, plants, home care" },
  { id: "bloom", label: "Petal", description: "White cards on a soft lilac page — beauty, cosmetics, skincare" },
  // The value end rather than a hue: a page grey enough that a white card reads
  // as a physical card. `mist` is the same structure two steps lighter and blue,
  // which is a different answer to "is this shop soft or is it a catalogue".
  { id: "slate", label: "Grey catalogue", description: "White cards that float on a plain grey page — electronics, hardware, wholesale" },
  // The one dark ground. See `isDarkSurface` for what a surface being dark
  // changes beyond these twelve tokens.
  { id: "midnight", label: "Midnight", description: "A dark shop — pale type on near-black — gadgets, gaming, streetwear" },
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
  sage: ["#eef3ec", "#ffffff", "#e2ebdf"],
  bloom: ["#f3f0f7", "#ffffff", "#e9e4f1"],
  slate: ["#dfe3e7", "#ffffff", "#d0d6db"],
  midnight: ["#0f1115", "#191c22", "#23272f"],
};

/** The swatch for a surface id, falling back to the built-in look. */
export const surfaceSwatch = (id: string) =>
  SURFACE_SWATCH[id] ?? SURFACE_SWATCH.default;

/**
 * Is this surface a DARK ground?
 *
 * Four things follow the ground rather than the shopper's light/dark toggle, and
 * all four are silent when missed: the brand colour must use its lifted variant
 * or a navy button vanishes on near-black; the accent likewise; the skeleton
 * shimmer is a white sweep that glares; and `color-scheme` decides whether the
 * browser draws scrollbars and native controls light or dark. `designAttrs`
 * stamps one `data-ground="dark"` attribute for all four, so `storefront.css`
 * asks the question once per concern instead of listing surface ids in four
 * places — the fifth of which would be forgotten.
 *
 * **Derived from the swatch, not a second table.** The swatch's first entry IS
 * the page colour, so a surface cannot be dark in the CSS and light here: the
 * answer comes from the same literal the merchant is shown.
 */
export const isDarkSurface = (id: string) =>
  isDarkBackground(surfaceSwatch(id)[0]);

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

/**
 * What a header menu link does when it is pointed at — **asked twice**, once
 * for the top row and once for the dropdown beneath it.
 *
 * `none` is the default and is the honest one: the storefront had no hover
 * treatment on its nav at all, so a shop that never opens this control is
 * unchanged. It is offered as a real choice rather than being the absence of a
 * setting, because a merchant who wants a bare, typographic header is making a
 * decision and should see it selected.
 *
 * ⚠ **Two axes, not one.** A soft highlight reads as a button behind a 13px bar
 * link and reads as ordinary behaviour on a dropdown option, so the answer that
 * suits one row rarely suits the other — and with a single setting a merchant
 * who wants an underline up top and nothing below has no way to say it.
 *
 * A hover state is pointer-only by definition: none of this reaches a phone,
 * where the same menu is the drawer in `mobile-menu.tsx` and a tap is the whole
 * interaction. That is why this sits in `design` (the look) rather than in the
 * mobile chrome registry.
 */
export const DESIGN_NAV_HOVERS: DesignOption[] = [
  { id: "none", label: "None", description: "No effect — the header stays still" },
  { id: "color", label: "Colour", description: "The label takes your brand colour" },
  { id: "underline", label: "Underline", description: "A rule appears under the label" },
  { id: "highlight", label: "Highlight", description: "A soft pill behind the label" },
];

/**
 * How the menu marks the page the shopper is on — every menu surface at once:
 * the phone menu, the collection page's sub-category row, the desktop header
 * row and its dropdowns, and the category sidebar. One answer, so a shop reads
 * the same on the phone and the computer.
 *
 * Unlike hover this DOES reach a phone: "you are here" matters most in the
 * phone menu, where it is the only sign of where the shopper stands.
 *
 * `fill` is the default because it is what the phone menu and the sidebar drew
 * before this existed (soft fill + leading bar). Where a surface has no room
 * for a bar — the header row, a chip — each style draws its nearest
 * equivalent; the stylesheet (`.sf-current`) owns those translations.
 */
export const DESIGN_NAV_ACTIVES: DesignOption[] = [
  { id: "fill", label: "Fill", description: "A soft background in the colour, with a bar at its edge" },
  { id: "bar", label: "Bar", description: "A bar at its edge and the colour — no background" },
  { id: "color", label: "Colour", description: "The label alone takes the colour, in bold" },
  { id: "underline", label: "Underline", description: "The label is underlined in the colour" },
];

/**
 * Which colour marks it. Tokens first: `brand` and `accent` follow the
 * merchant's colours through light and dark. `custom` reads `navActiveCustom`
 * and gets the same dark-theme lift the brand colour does
 * (`activeColorStyle` in `lib/storefront-shell-theme.ts`), so a navy picked on
 * the light theme never vanishes on the dark one.
 *
 * `accent` exists because a brand colour can be near-black — every row of the
 * menu is then already that colour, and the current page does not stand out.
 */
export const DESIGN_NAV_ACTIVE_COLORS: DesignOption[] = [
  { id: "brand", label: "Brand", description: "Your brand colour" },
  { id: "accent", label: "Accent", description: "Your second colour, from Look" },
  { id: "custom", label: "Custom", description: "A colour of your own" },
];

/** A stored custom colour, narrowed to `#rrggbb`; anything else is none. */
export function navActiveCustomColor(raw: unknown): string {
  return typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw.trim())
    ? raw.trim().toLowerCase()
    : "";
}

/**
 * Buttons — plan §5.1 `buttons { shape, style, size }` (Storefront Builder
 * Phase 6, step 8), kept in `design` beside the other axes until the look is
 * reshaped.
 *
 * ⚠ **Every default is "as drawn today", not a value.** The storefront's
 * buttons were never one style: the cart drawer's is 8px round, the buy panel's
 * 9px, a builder section's 10px, a card's follows Corners. So the default shape
 * is not a radius — it is the absence of the `--btn-radius` token, and each
 * button falls back to its own literal (`brandButton` in
 * `lib/storefront-button.ts`). Picking a shape is what makes them one family.
 * Size works the same way: a scale on each button's own padding and type, so a
 * drawer button stays smaller than a buy button at every size.
 */
export const DESIGN_BUTTON_SHAPES: DesignOption[] = [
  { id: "auto", label: "Default", description: "Each button keeps the corners it has today" },
  { id: "square", label: "Square", description: "Near-square corners on every button" },
  { id: "rounded", label: "Rounded", description: "Softly rounded corners on every button" },
  { id: "pill", label: "Pill", description: "Fully round ends on every button" },
];

/**
 * How a main button is filled. Only the brand-coloured buttons change — a
 * plain secondary button beside one is already an outline. Buttons laid over a
 * photo (a hero slide, a banner) keep their fill, where an outline in the brand
 * colour could vanish into the picture.
 */
export const DESIGN_BUTTON_STYLES: DesignOption[] = [
  { id: "solid", label: "Solid", description: "Filled with your brand colour — the default" },
  { id: "outline", label: "Outline", description: "A brand-colour border and label on a clear button" },
  { id: "soft", label: "Soft", description: "A pale tint of your brand colour behind the label" },
];

export const DESIGN_BUTTON_SIZES: DesignOption[] = [
  { id: "md", label: "Default", description: "Buttons at the size they have today" },
  { id: "sm", label: "Compact", description: "Slightly smaller buttons" },
  { id: "lg", label: "Large", description: "Bigger buttons, easier to tap" },
];

/**
 * Heading type beyond the typeface and its size ramp: weight and letter case,
 * on the same headings `--font-display` reaches (h1–h4 and `.sf-display`).
 * Latin only in effect for case — Bengali has none, so a Bangla shop reads the
 * same either way.
 */
export const DESIGN_HEADING_WEIGHTS: DesignOption[] = [
  { id: "default", label: "Default", description: "Headings as bold as they are today" },
  { id: "regular", label: "Light", description: "A lighter weight — quieter, more editorial" },
  { id: "heavy", label: "Heavy", description: "An extra-bold weight that leads the page" },
];

export const DESIGN_HEADING_CASES: DesignOption[] = [
  { id: "default", label: "As typed", description: "Headings in the letters you typed" },
  { id: "upper", label: "Capitals", description: "Every heading in capital letters, slightly spaced" },
];

/** The resolved design a storefront renders with. */
export interface StoreDesign {
  font: string;
  surface: string;
  scale: string;
  density: string;
  radius: string;
  width: string;
  navHover: string;
  navChildHover: string;
  navActive: string;
  navActiveColor: string;
  /** `#rrggbb`, or `""` — read only while `navActiveColor` is `custom`. */
  navActiveCustom: string;
  buttonShape: string;
  buttonStyle: string;
  buttonSize: string;
  headingWeight: string;
  headingCase: string;
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
  navHover: DESIGN_NAV_HOVERS[0].id,
  navChildHover: DESIGN_NAV_HOVERS[0].id,
  navActive: DESIGN_NAV_ACTIVES[0].id,
  navActiveColor: DESIGN_NAV_ACTIVE_COLORS[0].id,
  navActiveCustom: "",
  buttonShape: DESIGN_BUTTON_SHAPES[0].id,
  buttonStyle: DESIGN_BUTTON_STYLES[0].id,
  buttonSize: DESIGN_BUTTON_SIZES[0].id,
  headingWeight: DESIGN_HEADING_WEIGHTS[0].id,
  headingCase: DESIGN_HEADING_CASES[0].id,
};

const idsOf = (options: DesignOption[]) => new Set(options.map((o) => o.id));
const FONT_IDS = idsOf(DESIGN_FONTS);
const SURFACE_IDS = idsOf(DESIGN_SURFACES);
const SCALE_IDS = idsOf(DESIGN_SCALES);
const DENSITY_IDS = idsOf(DESIGN_DENSITIES);
const RADIUS_IDS = idsOf(DESIGN_RADII);
const WIDTH_IDS = idsOf(DESIGN_WIDTHS);
// One catalogue, both axes: the two rows offer the same answers.
const NAV_HOVER_IDS = idsOf(DESIGN_NAV_HOVERS);
const NAV_ACTIVE_IDS = idsOf(DESIGN_NAV_ACTIVES);
const NAV_ACTIVE_COLOR_IDS = idsOf(DESIGN_NAV_ACTIVE_COLORS);
const BUTTON_SHAPE_IDS = idsOf(DESIGN_BUTTON_SHAPES);
const BUTTON_STYLE_IDS = idsOf(DESIGN_BUTTON_STYLES);
const BUTTON_SIZE_IDS = idsOf(DESIGN_BUTTON_SIZES);
const HEADING_WEIGHT_IDS = idsOf(DESIGN_HEADING_WEIGHTS);
const HEADING_CASE_IDS = idsOf(DESIGN_HEADING_CASES);

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
  navHover?: string;
  navChildHover?: string;
  navActive?: string;
  navActiveColor?: string;
  navActiveCustom?: string;
  buttonShape?: string;
  buttonStyle?: string;
  buttonSize?: string;
  headingWeight?: string;
  headingCase?: string;
}): StoreDesign {
  const navActiveCustom = navActiveCustomColor(design?.navActiveCustom);
  const navActiveColor = pickId(
    NAV_ACTIVE_COLOR_IDS,
    design?.navActiveColor,
    DEFAULT_DESIGN.navActiveColor,
  );
  return {
    font: pickId(FONT_IDS, design?.font, DEFAULT_DESIGN.font),
    surface: pickId(SURFACE_IDS, design?.surface, DEFAULT_DESIGN.surface),
    scale: pickId(SCALE_IDS, design?.scale, DEFAULT_DESIGN.scale),
    density: pickId(DENSITY_IDS, design?.density, DEFAULT_DESIGN.density),
    radius: pickId(RADIUS_IDS, design?.radius, DEFAULT_DESIGN.radius),
    width: pickId(WIDTH_IDS, design?.width, DEFAULT_DESIGN.width),
    navHover: pickId(NAV_HOVER_IDS, design?.navHover, DEFAULT_DESIGN.navHover),
    navChildHover: pickId(
      NAV_HOVER_IDS,
      design?.navChildHover,
      DEFAULT_DESIGN.navChildHover,
    ),
    navActive: pickId(NAV_ACTIVE_IDS, design?.navActive, DEFAULT_DESIGN.navActive),
    // `custom` with no usable colour is the brand: there is nothing to paint.
    navActiveColor:
      navActiveColor === "custom" && !navActiveCustom ? DEFAULT_DESIGN.navActiveColor : navActiveColor,
    navActiveCustom,
    buttonShape: pickId(BUTTON_SHAPE_IDS, design?.buttonShape, DEFAULT_DESIGN.buttonShape),
    buttonStyle: pickId(BUTTON_STYLE_IDS, design?.buttonStyle, DEFAULT_DESIGN.buttonStyle),
    buttonSize: pickId(BUTTON_SIZE_IDS, design?.buttonSize, DEFAULT_DESIGN.buttonSize),
    headingWeight: pickId(HEADING_WEIGHT_IDS, design?.headingWeight, DEFAULT_DESIGN.headingWeight),
    headingCase: pickId(HEADING_CASE_IDS, design?.headingCase, DEFAULT_DESIGN.headingCase),
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
    "data-nav-hover": omitDefault(design.navHover, DEFAULT_DESIGN.navHover),
    "data-nav-child-hover": omitDefault(
      design.navChildHover,
      DEFAULT_DESIGN.navChildHover,
    ),
    "data-nav-active": omitDefault(design.navActive, DEFAULT_DESIGN.navActive),
    "data-nav-active-color": omitDefault(design.navActiveColor, DEFAULT_DESIGN.navActiveColor),
    "data-button-shape": omitDefault(design.buttonShape, DEFAULT_DESIGN.buttonShape),
    "data-button-style": omitDefault(design.buttonStyle, DEFAULT_DESIGN.buttonStyle),
    "data-button-size": omitDefault(design.buttonSize, DEFAULT_DESIGN.buttonSize),
    "data-heading-weight": omitDefault(design.headingWeight, DEFAULT_DESIGN.headingWeight),
    "data-heading-case": omitDefault(design.headingCase, DEFAULT_DESIGN.headingCase),
    /* DERIVED, not an axis the merchant sets — see `isDarkSurface`. Omitted on
       a light ground, so the default shop stamps nothing here either. */
    "data-ground": isDarkSurface(design.surface) ? "dark" : undefined,
  };
}
