// coding-standard: maintained

/**
 * The storefront menu — **one tree, every surface**.
 *
 * The desktop dropdown row, the compact anatomies' link rows, the phone menu
 * panel and the phone chips row all used to derive their links on their own:
 * `header-nav.tsx` expanded the menu for desktop, the phone panel printed the
 * whole category tree and then the custom menu flattened beneath it, and the
 * chips row read the tree a third way. So the Header's "Menu links come from"
 * setting governed desktop only, and a merchant's menu meant different things
 * on the two screens (plan `docs/plan/storefront-menu-controls.md`, M1/D2).
 *
 * `buildMenuTree` is now the only place a stored menu becomes links. Every
 * renderer draws `MenuNode`s and none of them knows what a `collections` block
 * or a leaf slug is.
 *
 * The file also carries the merchant's menu SETTINGS (`nav.menu`) — the option
 * registry Customize offers and the resolver that narrows a stored value — for
 * the same reason `lib/storefront-mobile.ts` carries the phone chrome's: the
 * backend stores loose ids, and this file is the authority on what they mean.
 */

import type {
  CatalogCategory,
  HeaderMenuSource,
  StoreMenuItem,
  StoreMenuSettings,
} from "@/lib/storefront-client";
import { thumbImageUrl } from "@/lib/storefront-image";
import { collectionHref, storeHref } from "@/lib/storefront-links";

/* ================================ settings ================================= */

export type MenuSubcategories = "auto" | "off";
export type MenuMobileLayout = "accordion" | "drill" | "expanded";
export type MenuOpenGroup = "active" | "first" | "none" | "all";
export type MenuChips = "parents" | "all";
export type MenuDropdown = "list" | "columns" | "mega";
export type MenuOpenOn = "hover" | "click";
export type MenuRailOpen = "active" | "first" | "all" | "flyout";
export type MenuOverflow = "wrap" | "more";

export interface MenuOption<T extends string> {
  id: T;
  label: string;
  description: string;
}

/**
 * The option catalogue, **default first** in every list — `resolveMenuSettings`
 * falls back to `[0]`, and Customize draws them in this order.
 */
export const MENU_SUBCATEGORIES: readonly MenuOption<MenuSubcategories>[] = [
  { id: "auto", label: "Show", description: "Each category lists its sub-categories underneath it" },
  { id: "off", label: "Hide", description: "Top-level links only — sub-categories stay on their category's page" },
];

/**
 * Accordion is the default for EVERY shop, existing ones included (owner
 * decision A, 2026-09-24). The fully expanded list — two departments and forty
 * sub-categories before "My account" — is the defect this plan exists to fix,
 * so it stays available only as a deliberate choice.
 */
export const MENU_MOBILE_LAYOUTS: readonly MenuOption<MenuMobileLayout>[] = [
  { id: "accordion", label: "Fold open", description: "Categories fold open in place when tapped" },
  { id: "drill", label: "Step in", description: "Tapping a category opens its own screen, with a Back row" },
  { id: "expanded", label: "Show all", description: "Every sub-category listed under its category, always open" },
];

export const MENU_OPEN_GROUPS: readonly MenuOption<MenuOpenGroup>[] = [
  { id: "active", label: "Current", description: "The category the shopper is browsing — the first one elsewhere" },
  { id: "first", label: "First", description: "Always the first category" },
  { id: "none", label: "None", description: "Everything folded until the shopper taps" },
  { id: "all", label: "All", description: "Every category open" },
];

export const MENU_CHIPS: readonly MenuOption<MenuChips>[] = [
  { id: "parents", label: "Categories", description: "One chip per top-level category" },
  { id: "all", label: "With sub-categories", description: "Each category followed by its sub-categories" },
];

export const MENU_DROPDOWNS: readonly MenuOption<MenuDropdown>[] = [
  { id: "list", label: "List", description: "One column under the link" },
  { id: "columns", label: "Columns", description: "A long list splits into columns" },
  { id: "mega", label: "Full width", description: "A wide panel across the page, with pictures" },
];

export const MENU_OPEN_ON: readonly MenuOption<MenuOpenOn>[] = [
  { id: "hover", label: "Point", description: "Opens when the pointer rests on the link" },
  { id: "click", label: "Click", description: "Opens on a click; the link's own page is the first row" },
];

export const MENU_RAIL_OPEN: readonly MenuOption<MenuRailOpen>[] = [
  { id: "active", label: "Current", description: "Only the category being browsed is open" },
  { id: "first", label: "First", description: "The first category is open until another is browsed" },
  { id: "all", label: "All", description: "Every category open" },
  { id: "flyout", label: "Pop out", description: "Sub-categories pop out beside the sidebar on hover" },
];

export const MENU_OVERFLOW: readonly MenuOption<MenuOverflow>[] = [
  { id: "wrap", label: "Wrap", description: "Links that do not fit move onto a second line" },
  { id: "more", label: "More", description: "Links that do not fit collapse into a More menu" },
];

export interface ResolvedMenuSettings {
  subcategories: MenuSubcategories;
  mobile: {
    layout: MenuMobileLayout;
    open: MenuOpenGroup;
    viewAll: boolean;
    images: boolean;
    /** Pictures on the sub-category rows too — separate from `images`, which is the parents'. */
    subImages: boolean;
    chips: MenuChips;
    /**
     * The panel's heading. `null` (never set) ⇒ the shopper's-language "Menu";
     * `""` ⇒ the merchant cleared it, so no heading at all.
     */
    title: string | null;
    /** The "All products" row at the top of the panel. */
    allProducts: boolean;
    /** That row's label; blank ⇒ the shopper's-language "All products". */
    allProductsLabel: string;
  };
  desktop: {
    dropdown: MenuDropdown;
    openOn: MenuOpenOn;
    railOpen: MenuRailOpen;
    overflow: MenuOverflow;
    row: boolean;
    /**
     * An "All ‹category›" row heading each dropdown. Forced on whenever the
     * trigger is not a link (click-to-open, a touch) — see `header-nav.tsx`.
     */
    viewAll: boolean;
  };
}

export const DEFAULT_MENU_SETTINGS: ResolvedMenuSettings = {
  subcategories: "auto",
  mobile: {
    layout: "accordion",
    open: "active",
    viewAll: true,
    images: false,
    subImages: false,
    chips: "parents",
    title: null,
    allProducts: true,
    allProductsLabel: "",
  },
  desktop: {
    dropdown: "list",
    openOn: "hover",
    railOpen: "active",
    overflow: "wrap",
    row: false,
    viewAll: false,
  },
};

function pick<T extends string>(options: readonly MenuOption<T>[], raw: unknown): T {
  return options.find((o) => o.id === raw)?.id ?? options[0].id;
}

const bool = (raw: unknown, fallback: boolean): boolean =>
  typeof raw === "boolean" ? raw : fallback;

/** Merchant-typed text, capped like the backend (`MENU_TEXT_MAX`); blank ⇒ the localized default. */
export const MENU_TEXT_MAX = 40;
const text = (raw: unknown): string =>
  typeof raw === "string" ? raw.trim().slice(0, MENU_TEXT_MAX) : "";
/** Like `text`, but keeps "never set" (`null`) apart from "cleared" (`""`). */
const optionalText = (raw: unknown): string | null =>
  typeof raw === "string" ? text(raw) : null;

/** Narrow a stored `nav.menu` — an unknown or retired id reads as the default. */
export function resolveMenuSettings(raw?: StoreMenuSettings | null): ResolvedMenuSettings {
  const d = DEFAULT_MENU_SETTINGS;
  return {
    subcategories: pick(MENU_SUBCATEGORIES, raw?.subcategories),
    mobile: {
      layout: pick(MENU_MOBILE_LAYOUTS, raw?.mobile?.layout),
      open: pick(MENU_OPEN_GROUPS, raw?.mobile?.open),
      viewAll: bool(raw?.mobile?.viewAll, d.mobile.viewAll),
      images: bool(raw?.mobile?.images, d.mobile.images),
      subImages: bool(raw?.mobile?.subImages, d.mobile.subImages),
      chips: pick(MENU_CHIPS, raw?.mobile?.chips),
      title: optionalText(raw?.mobile?.title),
      allProducts: bool(raw?.mobile?.allProducts, d.mobile.allProducts),
      allProductsLabel: text(raw?.mobile?.allProductsLabel),
    },
    desktop: {
      dropdown: pick(MENU_DROPDOWNS, raw?.desktop?.dropdown),
      openOn: pick(MENU_OPEN_ON, raw?.desktop?.openOn),
      railOpen: pick(MENU_RAIL_OPEN, raw?.desktop?.railOpen),
      overflow: pick(MENU_OVERFLOW, raw?.desktop?.overflow),
      row: bool(raw?.desktop?.row, d.desktop.row),
      viewAll: bool(raw?.desktop?.viewAll, d.desktop.viewAll),
    },
  };
}

/** Keep only the keys of `value` that differ from `base`; `undefined` when none do. */
function diff<T extends object>(value: T, base: T): Partial<T> | undefined {
  const out: Partial<T> = {};
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (value[key] !== base[key]) out[key] = value[key];
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * What to STORE: only the fields that differ from the defaults, the same
 * discipline as `theme.mobile`. A shop that never opens the Menu panel stores
 * nothing — and keeps following the defaults if they ever improve.
 */
export function menuSettingsOverrides(
  settings: ResolvedMenuSettings,
): StoreMenuSettings | undefined {
  const d = DEFAULT_MENU_SETTINGS;
  const out: StoreMenuSettings = {};
  if (settings.subcategories !== d.subcategories) out.subcategories = settings.subcategories;
  // The editor holds text as typed; store it the way the resolver reads it.
  const mobile = diff(
    {
      ...settings.mobile,
      title: optionalText(settings.mobile.title),
      allProductsLabel: text(settings.mobile.allProductsLabel),
    },
    d.mobile,
  );
  // `title` is only emitted when it differs from the `null` default, so it is a string.
  if (mobile) out.mobile = mobile as StoreMenuSettings["mobile"];
  const desktop = diff(settings.desktop, d.desktop);
  if (desktop) out.desktop = desktop;
  return Object.keys(out).length ? out : undefined;
}

/* ================================== tree =================================== */

/** One link in the resolved menu. Two levels at most, like the category tree. */
export interface MenuNode {
  /** Stable across renders — a category's id, else its position and label. */
  key: string;
  label: string;
  href: string;
  /** An absolute http(s) link — opened in a new tab. */
  external: boolean;
  children: MenuNode[];
  /** The collection path it lands on, when it lands on one — drives "active". */
  path?: string;
  /** The category's thumbnail, for the menu surfaces that draw pictures. */
  image?: string;
}

/**
 * Find a category by the value a menu item stores.
 *
 * Two shapes are live. Items saved before 2026-09-24 hold the category's LEAF
 * slug (`accessories`), which is only unique within its parent; the editor now
 * stores the full PATH (`phones/accessories`), which is unique. A value with a
 * slash is a path. A bare slug checks every parent before any child, so a
 * top-level collection always beats a same-named sub-category — a single
 * interleaved pass would let an earlier parent's child shadow a later parent.
 */
export function findCategory(
  categories: CatalogCategory[],
  value: string,
): CatalogCategory | undefined {
  if (!value) return undefined;
  const all = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  const byPath = all.find((c) => c.slugPath === value);
  if (byPath || value.includes("/")) return byPath;
  return (
    categories.find((c) => c.slug === value) ??
    categories.flatMap((c) => c.children ?? []).find((c) => c.slug === value)
  );
}

function categoryNode(
  base: string,
  c: CatalogCategory,
  children: MenuNode[],
  label = c.name,
): MenuNode {
  return {
    key: `cat:${c._id}`,
    label,
    href: collectionHref(base, c),
    external: false,
    children,
    path: c.slugPath,
    image: thumbImageUrl(c.image),
  };
}

/** A category's routable sub-categories as nodes. */
function subNodes(base: string, c: CatalogCategory | undefined): MenuNode[] {
  return (c?.children ?? [])
    .filter((child) => !!child.slugPath)
    .map((child) => categoryNode(base, child, []));
}

/**
 * The whole category tree as nodes — the `collections` source, the category
 * sidebar and the phone fallback. A node with no `slugPath` cannot route and is
 * skipped rather than emitted as a dead link.
 */
export function categoryNodes(
  base: string,
  categories: CatalogCategory[],
  subcategories: MenuSubcategories = "auto",
): MenuNode[] {
  return categories
    .filter((c) => !!c.slugPath)
    .map((c) => categoryNode(base, c, subcategories === "auto" ? subNodes(base, c) : []));
}

/** Href for a url/page item. Relative paths go through `storeHref`. */
function linkTarget(item: StoreMenuItem, base: string): { href: string; external: boolean; path?: string } {
  if (item.type === "page") {
    return { href: storeHref(base, `/pages/${item.value}`), external: false };
  }
  const v = item.value || "/";
  if (/^https?:\/\//i.test(v)) return { href: v, external: true };
  const rel = v.startsWith("/") ? v : `/${v}`;
  return { href: storeHref(base, rel), external: false, path: rel.replace(/^\/+|\/+$/g, "") || undefined };
}

/** One authored item (never a `collections` block) → a node, without children. */
function itemNode(
  item: StoreMenuItem,
  key: string,
  base: string,
  categories: CatalogCategory[],
): { node: MenuNode; category?: CatalogCategory } {
  if (item.type === "category") {
    const category = findCategory(categories, item.value);
    const node = category
      ? categoryNode(base, category, [], item.label || category.name)
      : // A category that no longer exists (deleted, unlisted) lands on the
        // full listing rather than a 404 — the pre-existing behaviour.
        { key, label: item.label, href: storeHref(base, "/products"), external: false, children: [] };
    return { node: { ...node, key }, category };
  }
  const { href, external, path } = linkTarget(item, base);
  return { node: { key, label: item.label, href, external, children: [], path } };
}

/**
 * A top-level item's dropdown, per its `childrenMode`.
 *
 * Unset keeps the rule that predates the field: authored children win, and a
 * category item with none inherits the category's sub-categories. The global
 * `subcategories: "off"` switch turns off the INHERITED ones only — a dropdown
 * the merchant built by hand is still their explicit choice.
 */
function itemChildren(
  item: StoreMenuItem,
  key: string,
  category: CatalogCategory | undefined,
  base: string,
  categories: CatalogCategory[],
  subcategories: MenuSubcategories,
): MenuNode[] {
  const authored = () =>
    (item.children ?? []).map((child, ci) => itemNode(child, `${key}/${ci}`, base, categories).node);
  const inherited = () => (subcategories === "auto" ? subNodes(base, category) : []);
  switch (item.childrenMode) {
    case "none":
      return [];
    case "custom":
      return authored();
    case "auto":
      return item.type === "category" ? inherited() : authored();
    default:
      return item.children?.length ? authored() : item.type === "category" ? inherited() : [];
  }
}

/**
 * The resolved menu — what every surface draws.
 *
 * `collections` source → the category tree. `custom` → the merchant's items,
 * with each `collections` block expanded in place into the listed categories.
 * An empty custom menu is an empty menu on desktop — the merchant's explicit
 * choice; the phone's safety net is `phoneMenuTree`.
 */
export function buildMenuTree({
  base,
  items,
  source,
  categories,
  subcategories = "auto",
}: {
  base: string;
  items: StoreMenuItem[];
  source: HeaderMenuSource;
  categories: CatalogCategory[];
  subcategories?: MenuSubcategories;
}): MenuNode[] {
  if (source !== "custom") return categoryNodes(base, categories, subcategories);
  return items.flatMap((item, i): MenuNode[] => {
    if (item.type === "collections") return categoryNodes(base, categories, subcategories);
    const key = `item:${i}`;
    const { node, category } = itemNode(item, key, base, categories);
    return [
      { ...node, children: itemChildren(item, key, category, base, categories, subcategories) },
    ];
  });
}

/**
 * The PHONE menu (owner decision B): the same tree as desktop, so a merchant's
 * custom menu is what a phone shopper sees too — with one safety net. A custom
 * menu naming no category and no collections block ("About · Contact") would
 * leave the only category navigation a phone has with no departments in it, so
 * the category tree is put in front of it.
 */
export function phoneMenuTree(args: Parameters<typeof buildMenuTree>[0]): MenuNode[] {
  const tree = buildMenuTree(args);
  if (!customMenuLacksCategories(args.source, args.items)) return tree;
  return [...categoryNodes(args.base, args.categories, args.subcategories), ...tree];
}

/** True when the phone will add the category tree in front of a custom menu. */
export function customMenuLacksCategories(
  source: HeaderMenuSource,
  items: StoreMenuItem[],
): boolean {
  return (
    source === "custom" &&
    !items.some((m) => m.type === "category" || m.type === "collections")
  );
}

/* ================================= active ================================== */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Is the shopper on (or under) this node's collection? Matched on whole path
 * SEGMENTS: `/phones` must not light up `/phones-cases`, which the sidebar's old
 * `includes()` check did.
 */
export function isNodeActive(node: MenuNode, pathname: string): boolean {
  if (node.path) {
    const re = new RegExp(`(^|/)${escapeRe(node.path)}(/|$)`);
    if (re.test(pathname.split(/[?#]/)[0])) return true;
  }
  return node.children.some((child) => isNodeActive(child, pathname));
}

/**
 * Which groups start open, as a rule rather than a setting id — the phone and
 * the sidebar name their choices differently, and read the same words
 * differently:
 *
 * - `active-or-first` — the department being browsed, else the first. The phone
 *   default: an accordion with every group shut reads as an empty menu.
 * - `active` — only the department being browsed (the sidebar's original rule).
 * - `first` — always the first.
 */
export type OpenRule = "active-or-first" | "active" | "first" | "all" | "none";

export const PHONE_OPEN_RULE: Record<MenuOpenGroup, OpenRule> = {
  active: "active-or-first",
  first: "first",
  none: "none",
  all: "all",
};

export const RAIL_OPEN_RULE: Record<MenuRailOpen, OpenRule> = {
  active: "active",
  first: "active-or-first",
  all: "all",
  // Nothing is open in place — sub-categories pop out on hover instead.
  flyout: "none",
};

export function initialOpenKeys(
  nodes: MenuNode[],
  rule: OpenRule,
  pathname: string,
): Set<string> {
  const groups = nodes.filter((n) => n.children.length > 0);
  if (rule === "all") return new Set(groups.map((n) => n.key));
  if (rule === "none") return new Set();
  const first = groups[0]?.key;
  if (rule === "first") return new Set(first ? [first] : []);
  const active = groups.find((n) => isNodeActive(n, pathname))?.key;
  if (active) return new Set([active]);
  return new Set(rule === "active-or-first" && first ? [first] : []);
}

/**
 * The chips row: parents only, or each parent followed by its sub-categories.
 *
 * `pathname` applies the rule shared with the filter plan (§3.6): on a page
 * inside a department that HAS sub-categories, the collection page draws its own
 * sub-category strip, so the row falls back to parents — otherwise one phone
 * screen lists the same sub-categories twice.
 */
export function chipNodes(nodes: MenuNode[], mode: MenuChips, pathname?: string): MenuNode[] {
  if (mode !== "all") return nodes;
  const stripShown =
    pathname !== undefined && nodes.some((n) => n.children.length > 0 && isNodeActive(n, pathname));
  return stripShown ? nodes : nodes.flatMap((n) => [n, ...n.children]);
}
