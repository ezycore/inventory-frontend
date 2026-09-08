// coding-standard: maintained

/**
 * The mobile chrome registry — what a shop looks like at the top and bottom of
 * a phone screen.
 *
 * **A mobile template is DATA, never a component.** Every entry in
 * `MOBILE_TEMPLATES` below is a complete `MobileChrome` value; one renderer
 * (`components/storefront/mobile/`) draws all of them, and the merchant's own
 * edits are the same shape laid over the one they picked. That is what makes
 * this scale: template number twenty is an object in this file plus a wireframe
 * in the Customize sketch map, not a new component tree shipped to every
 * shopper's phone. Nothing downstream — the preview store, the settings PATCH,
 * the validator, the public DTO — learns that it exists.
 *
 * The same rule as `lib/storefront-themes.ts`, one level down: **if a shape you
 * want cannot be expressed here, widen the vocabulary — add an action to
 * `MOBILE_ACTIONS` or a row to `MobileRow` — do not branch inside the renderer.**
 *
 * ## Where the pieces are stored
 *
 * - `templates.mobile` — WHICH template. An axis like every other layout
 *   choice, so a ready-made theme can stamp it.
 * - `theme.mobile` — the merchant's overrides on top, and **only the fields
 *   that differ from the template** (see `mobileOverrides`). A shop that never
 *   opens the panel stores nothing at all, which is the difference between
 *   zero bytes and a full config object across a hundred thousand shops.
 * - `mobileLogo` — the phone artwork. A top-level image beside `logo`/`banner`,
 *   because it is merchant MEDIA: a theme replaces `theme` and `templates`
 *   wholesale and must never delete a file its owner uploaded.
 */

import type { IconName } from "@/components/storefront/sf-icons";
import type { StoreTemplatesRaw } from "@/lib/storefront-client";

/* ================================ actions ================================= */

/**
 * One tappable thing in the top bar.
 *
 * Adding one is an entry here plus a branch in `mobile-actions.tsx` — the only
 * pair in this system that is not pure data, because an action is behaviour
 * (open a drawer, toggle a store, follow a link) rather than arrangement.
 */
export type MobileActionId =
  | "menu"
  | "search"
  | "cart"
  | "account"
  | "home"
  | "lang"
  | "theme"
  | "call"
  | "track";

export interface MobileActionSpec {
  id: MobileActionId;
  /** Merchant-facing name, for the Customize slot editor. */
  label: string;
  /** The glyph when the merchant has not chosen another. */
  icon: IconName;
  /**
   * Glyphs a merchant may swap in, `icon` first. An action with one entry is
   * not offered a picker — there is nothing to choose between.
   */
  icons: IconName[];
  /**
   * Renders nothing unless the shop has something for it to do — `call` with no
   * published number is a button that dials nowhere. Checked by the renderer;
   * declared here so the Customize panel can grey the same rows out.
   */
  needs?: "phone";
}

/**
 * Every action, in the order the Customize slot editor offers them.
 *
 * `lang` and `theme` are in this list rather than hard-wired into the bar the
 * way they used to be: a shop selling to one city in one language should be
 * able to take them out, and until the chrome became data there was no way to.
 */
export const MOBILE_ACTIONS: readonly MobileActionSpec[] = [
  {
    id: "menu",
    label: "Menu",
    icon: "menu",
    icons: ["menu", "menuAlt", "grid", "list", "dots"],
  },
  { id: "search", label: "Search", icon: "search", icons: ["search", "zoomIn"] },
  { id: "cart", label: "Cart", icon: "cart", icons: ["cart", "bag", "basket"] },
  { id: "account", label: "Account", icon: "user", icons: ["user"] },
  { id: "home", label: "Home", icon: "home", icons: ["home"] },
  { id: "lang", label: "Language", icon: "dot", icons: ["dot"] },
  { id: "theme", label: "Light / dark", icon: "moon", icons: ["moon"] },
  { id: "call", label: "Call", icon: "phone", icons: ["phone"], needs: "phone" },
  { id: "track", label: "Track order", icon: "box", icons: ["box", "truck"] },
];

const ACTION_BY_ID = new Map(MOBILE_ACTIONS.map((a) => [a.id, a]));

export const mobileAction = (id: MobileActionId): MobileActionSpec | undefined =>
  ACTION_BY_ID.get(id);

/* ================================== tabs ================================== */

/**
 * A bottom-bar tab. A deliberate subset of the actions: a tab is a *destination*
 * with a label under it, so `lang` and `theme` — which change the page you are
 * already on — are not offered here. They live in the bar or in the menu.
 */
export type MobileTabId = Extract<
  MobileActionId,
  "home" | "menu" | "search" | "cart" | "account" | "call" | "track"
>;

export const MOBILE_TAB_IDS: readonly MobileTabId[] = [
  "home",
  "menu",
  "search",
  "cart",
  "account",
  "call",
  "track",
];

/**
 * Five tabs at 390px leaves each one 78px wide, which still holds "Account".
 * Six starts truncating the labels, and a tab bar whose labels are cut off is
 * worse than one tab fewer.
 */
export const MAX_MOBILE_TABS = 5;

/** Actions per bar slot. Three glyphs beside a logo is where 390px runs out. */
export const MAX_SLOT_ACTIONS = 3;

/* ================================= chrome ================================= */

/** What sits on the row under the brand bar. */
export type MobileRow = "none" | "search" | "chips";

/** What the `menu` action opens. */
export type MobileMenuStyle = "drawer" | "sheet";

/**
 * The complete mobile chrome — a template's value, and the shape a merchant's
 * overrides are merged into. Every field is present after `resolveMobileChrome`,
 * so nothing downstream re-derives a default.
 */
export interface MobileChrome {
  /** Actions left of the brand. */
  left: MobileActionId[];
  /** Actions right of the brand. */
  right: MobileActionId[];
  /** Where the brand lockup sits on the bar. */
  brand: "left" | "center";
  /** The row beneath the bar. */
  row: MobileRow;
  /**
   * Put the search field **on the brand row**, sharing it with the logo, rather
   * than under it.
   *
   * A field, not the `search` glyph — those are different controls and a shop
   * wants one of them: an everyday catalogue puts a real box on screen because
   * search IS the navigation, while a boutique gives it an icon because browsing
   * is. This is the axis that lets a template be one 56px bar with a search box
   * in it instead of two stacked rows, which at 390px is most of the difference
   * between "compact" and "not".
   */
  searchInline: boolean;
  /** The bottom tab bar. **Empty means there is no bar at all.** */
  tabs: MobileTabId[];
  /** Whether `menu` opens a side drawer or a bottom sheet. */
  menuStyle: MobileMenuStyle;
  /** Glyph overrides, keyed by action — "change the hamburger". */
  icons: Partial<Record<MobileActionId, IconName>>;
  /** Brand height in the bar, px. */
  logoHeight: number;
  /** Does the bar follow the shopper down the page. */
  sticky: boolean;
}

export interface MobileTemplate extends MobileChrome {
  id: string;
  label: string;
  /** One line, merchant-facing — what their phone header will do. */
  description: string;
}

/* ------------------------------- the five -------------------------------- */

/**
 * The catalogue, **`tabs` first**.
 *
 * Order is meaningful the same way `READY_MADE_THEMES` is: `tabs` is the
 * storefront's mobile chrome exactly as it shipped before this system existed,
 * so it is both the honest "this is what you already have" entry and the reset.
 * `storefront-mobile.test.ts` pins it field by field — a drift there would
 * silently re-chrome every shop on the platform, none of whose owners asked for
 * a new phone header.
 */
export const MOBILE_TEMPLATES: readonly MobileTemplate[] = [
  {
    id: "tabs",
    label: "App tabs",
    description: "A bottom tab bar like a phone app, with search under your logo",
    left: [],
    right: ["lang", "theme"],
    brand: "left",
    row: "search",
    searchInline: false,
    tabs: ["home", "menu", "cart", "account"],
    // The bottom bar already owns the primary navigation, so its Menu opens
    // upward from the thumb rather than sliding in from an edge nothing points at.
    menuStyle: "sheet",
    icons: {},
    logoHeight: 33,
    sticky: false,
  },
  {
    id: "drawer",
    label: "Menu drawer",
    description: "Hamburger left, logo centred, search and cart right — no bottom bar",
    left: ["menu"],
    right: ["search", "cart"],
    brand: "center",
    row: "none",
    searchInline: false,
    tabs: [],
    menuStyle: "drawer",
    icons: {},
    logoHeight: 36,
    sticky: true,
  },
  {
    id: "search",
    label: "Search first",
    description: "A search box in the bar itself — for large everyday catalogues",
    left: ["menu"],
    right: ["cart"],
    brand: "left",
    // The bar IS the search box on this one — see `searchInline`.
    row: "none",
    searchInline: true,
    tabs: [],
    menuStyle: "drawer",
    // Smaller: this template spends its bar on the search field, so the mark
    // sits beside it rather than leading a row of its own.
    logoHeight: 28,
    icons: {},
    sticky: true,
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Your logo, the cart and a menu button — nothing else",
    left: [],
    /* Two controls and a wordmark: the quietest bar that still works.
       `menu` is on it rather than "navigation lives on the page", which is what
       this template said until the registry's own guard caught it — the menu
       panel is the ONLY category navigation a phone has, so a bar without it
       leaves a shopper on the home page with nowhere to go but the cart. The
       hamburger sits on the right, which is where a boutique layout expects it. */
    right: ["cart", "menu"],
    brand: "left",
    row: "none",
    searchInline: false,
    tabs: [],
    menuStyle: "drawer",
    icons: {},
    logoHeight: 34,
    sticky: true,
  },
  {
    id: "browse",
    label: "Category strip",
    description: "Logo bar with your categories scrolling underneath",
    left: ["menu"],
    right: ["search", "cart"],
    brand: "center",
    row: "chips",
    searchInline: false,
    tabs: [],
    menuStyle: "drawer",
    icons: {},
    logoHeight: 34,
    sticky: true,
  },
];

export const DEFAULT_MOBILE_TEMPLATE = MOBILE_TEMPLATES[0].id;

const TEMPLATE_BY_ID = new Map(MOBILE_TEMPLATES.map((t) => [t.id, t]));

/**
 * The Customize picker's option list, **derived rather than written**.
 *
 * `TEMPLATE_OPTIONS.mobile` re-exports this, so a template added above appears
 * in the admin with its label and description already correct. A hand-kept
 * second list is how the picker ends up offering an id the storefront cannot
 * render, or hiding one it can.
 */
export const MOBILE_TEMPLATE_OPTIONS = MOBILE_TEMPLATES.map((t) => ({
  value: t.id,
  label: t.label,
  description: t.description,
}));

/** The template a stored id names, falling back to the default. */
export function mobileTemplate(id: string | undefined): MobileTemplate {
  return (id && TEMPLATE_BY_ID.get(id)) || MOBILE_TEMPLATES[0];
}

/* =============================== resolution =============================== */

/**
 * A merchant's stored overrides. Every field optional and every one loose —
 * this arrives from a database document the API only length-checks, so
 * `resolveMobileChrome` treats all of it as untrusted.
 */
export interface MobileChromeOverrides {
  left?: string[];
  right?: string[];
  brand?: string;
  row?: string;
  searchInline?: boolean;
  tabs?: string[];
  menuStyle?: string;
  icons?: Record<string, string>;
  logoHeight?: number;
  sticky?: boolean;
}

const isActionId = (v: unknown): v is MobileActionId =>
  typeof v === "string" && ACTION_BY_ID.has(v as MobileActionId);

const isTabId = (v: unknown): v is MobileTabId =>
  typeof v === "string" && MOBILE_TAB_IDS.includes(v as MobileTabId);

/**
 * Keep the known ids, drop the rest, de-duplicate, and cap the length.
 *
 * All four matter and none is theoretical. The list is merchant-controlled
 * stored data: a retired action id survives in documents long after the code
 * that drew it is gone, a duplicate would mount two components on one React
 * key, and an uncapped array is a bar that overflows the phone it is drawn on.
 */
function cleanList<T extends string>(
  raw: unknown,
  keep: (v: unknown) => v is T,
  max: number,
): T[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: T[] = [];
  for (const v of raw) {
    if (keep(v) && !out.includes(v)) out.push(v);
    if (out.length === max) break;
  }
  return out;
}

/** Icon overrides, narrowed to glyphs the action actually offers. */
function cleanIcons(
  raw: unknown,
): Partial<Record<MobileActionId, IconName>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Partial<Record<MobileActionId, IconName>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const spec = isActionId(key) ? ACTION_BY_ID.get(key) : undefined;
    // Against the action's OWN list, not the whole icon set: an arbitrary glyph
    // in the menu slot is not customisation, it is a shop whose hamburger is a
    // printer. The picker offers these exact values.
    if (spec && typeof value === "string" && spec.icons.includes(value)) {
      out[spec.id] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const oneOf = <T extends string>(raw: unknown, allowed: readonly T[]): T | undefined =>
  typeof raw === "string" && allowed.includes(raw as T) ? (raw as T) : undefined;

/**
 * The chrome a phone actually renders: the named template, with the merchant's
 * overrides laid on top.
 *
 * **Nothing unvalidated reaches the DOM.** Every field is narrowed against the
 * registry, so a stored value from a retired template, a hand-edited document or
 * a future version of the admin degrades to the template's own answer rather
 * than rendering an empty slot or an unknown glyph. Same rule as `resolveDesign`
 * and `resolveTemplates`, and for the same reason: these ids are merchant data.
 */
export function resolveMobileChrome(
  templates: StoreTemplatesRaw | undefined,
  overrides: MobileChromeOverrides | undefined,
): MobileChrome & { template: string } {
  const base = mobileTemplate(templates?.mobile);
  const o = overrides ?? {};
  const height = typeof o.logoHeight === "number" ? o.logoHeight : undefined;
  return {
    template: base.id,
    left: cleanList(o.left, isActionId, MAX_SLOT_ACTIONS) ?? base.left,
    right: cleanList(o.right, isActionId, MAX_SLOT_ACTIONS) ?? base.right,
    brand: oneOf(o.brand, ["left", "center"] as const) ?? base.brand,
    row: oneOf(o.row, ["none", "search", "chips"] as const) ?? base.row,
    searchInline:
      typeof o.searchInline === "boolean" ? o.searchInline : base.searchInline,
    tabs: cleanList(o.tabs, isTabId, MAX_MOBILE_TABS) ?? base.tabs,
    menuStyle:
      oneOf(o.menuStyle, ["drawer", "sheet"] as const) ?? base.menuStyle,
    icons: cleanIcons(o.icons) ?? base.icons,
    // Clamped, not rejected: a merchant typing 200 wants a big logo, and giving
    // them the largest one that fits is a better answer than silently ignoring
    // the number they typed.
    logoHeight: height ? Math.min(Math.max(Math.round(height), 18), 60) : base.logoHeight,
    sticky: typeof o.sticky === "boolean" ? o.sticky : base.sticky,
  };
}

/**
 * The merchant's chrome as the smallest thing worth storing — only the fields
 * that differ from the template they picked, and `undefined` when none do.
 *
 * This is the reason `theme.mobile` costs nothing on a shop whose owner took a
 * template and left it alone, which is nearly all of them. It also makes
 * switching template a real reset: the diff is recomputed against the new
 * template, so a field that matches it stops being an override.
 */
export function mobileOverrides(
  templateId: string,
  chrome: MobileChrome,
): MobileChromeOverrides | undefined {
  const base = mobileTemplate(templateId);
  const out: MobileChromeOverrides = {};
  const sameList = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  if (!sameList(chrome.left, base.left)) out.left = [...chrome.left];
  if (!sameList(chrome.right, base.right)) out.right = [...chrome.right];
  if (chrome.brand !== base.brand) out.brand = chrome.brand;
  if (chrome.row !== base.row) out.row = chrome.row;
  if (chrome.searchInline !== base.searchInline) out.searchInline = chrome.searchInline;
  if (!sameList(chrome.tabs, base.tabs)) out.tabs = [...chrome.tabs];
  if (chrome.menuStyle !== base.menuStyle) out.menuStyle = chrome.menuStyle;
  if (chrome.logoHeight !== base.logoHeight) out.logoHeight = chrome.logoHeight;
  if (chrome.sticky !== base.sticky) out.sticky = chrome.sticky;

  // Icons are compared per action rather than as an object: the template's own
  // glyph is not an override, so a merchant who picks the default back gets a
  // clean document instead of one recording that they thought about it.
  const icons: Record<string, string> = {};
  for (const spec of MOBILE_ACTIONS) {
    const chosen = chrome.icons[spec.id];
    if (chosen && chosen !== (base.icons[spec.id] ?? spec.icon)) {
      icons[spec.id] = chosen;
    }
  }
  if (Object.keys(icons).length) out.icons = icons;

  return Object.keys(out).length ? out : undefined;
}

/** The glyph one action renders with, honouring the merchant's choice. */
export function mobileIcon(chrome: MobileChrome, id: MobileActionId): IconName {
  return chrome.icons[id] ?? ACTION_BY_ID.get(id)?.icon ?? "dot";
}

/**
 * Whether the chrome puts this action in front of the shopper anywhere.
 *
 * The menu panel uses it to decide what it has to carry itself: a shop whose bar
 * has no account button and no Account tab must still be able to reach the
 * account area, and the drawer is the only place left. Without this the
 * `drawer` and `minimal` templates would have stranded every signed-in shopper.
 */
export function chromeHas(chrome: MobileChrome, id: MobileActionId): boolean {
  return (
    chrome.left.includes(id) ||
    chrome.right.includes(id) ||
    (isTabId(id) && chrome.tabs.includes(id))
  );
}

/**
 * The bar slots minus whatever the utility bar above them is already showing.
 *
 * The neighbour of `chromeHas`, and the other half of the same question: that
 * one asks what the DRAWER must carry, this asks what the BAR must drop. Only
 * `lang` and `theme` can collide — they are the two atoms the utility bar also
 * offers — and the `tabs` template ships BOTH in its right-hand slot, so a
 * merchant who switched that bar on for phones got two language switches and
 * two theme switches stacked directly on top of each other.
 *
 * Takes the resolved flags rather than the bar so the arbitration lives in one
 * place (`headerNeeds`) and this stays a pure list filter.
 */
export function keptSlot(
  ids: MobileActionId[],
  needs: { needsTheme: boolean; needsLang: boolean },
): MobileActionId[] {
  return ids.filter(
    (id) =>
      (id !== "theme" || needs.needsTheme) && (id !== "lang" || needs.needsLang),
  );
}

/**
 * Can a shopper on a phone reach the catalogue at all?
 *
 * **The menu panel is the only category navigation a phone has** — the header's
 * dropdown row and the `rail` shell's department column are both desktop-only —
 * so a chrome with no `menu` anywhere strands a shopper on whatever page they
 * landed on with nothing but the cart. The shipped templates are pinned against
 * this in `storefront-mobile.test.ts`; the Customize panel warns on it rather
 * than forbidding it, because it is the merchant's shop and a shop whose
 * catalogue is one flat page is a real (if rare) thing to want.
 */
export function canBrowse(chrome: MobileChrome): boolean {
  return chromeHas(chrome, "menu");
}
