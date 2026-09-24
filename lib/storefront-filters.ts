// coding-standard: maintained

/**
 * The storefront catalogue's filters & sort — **settings registry + group
 * resolver**, one file for every surface that draws a filter (the phone sheet,
 * the drawer, the desktop sidebar and bar, the quick-chip row) and for the
 * Customize panel that edits them.
 *
 * Settings are stored sparse in `nav.filters` with loose ids, exactly like
 * `nav.menu` (`lib/storefront-menu.ts`): the backend keeps strings, and this
 * file is the authority on what they mean. `resolveFilterSettings` narrows
 * every field and falls back to the default for anything it does not know.
 *
 * Plan: `docs/plan/storefront-filter-controls.md`.
 */

import type {
  StoreFacets,
  StoreFilterSettings,
  StorefrontStore,
} from "@/lib/storefront-client";

/* ================================ settings ================================= */

export type FilterEntry = "sheet" | "drawer";
export type FilterPlacement = "drawer" | "sidebar" | "bar";
export type FilterPriceMode = "both" | "presets" | "typed";
export type SortId = "featured" | "newest" | "price_asc" | "price_desc" | "discount";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
  description: string;
}

/**
 * The bottom sheet is the default for EVERY shop, existing ones included (owner
 * decision A, 2026-09-24): it is the phone convention for filters, and it frees
 * the left edge for the menu drawer, which used to open from the same side.
 */
export const FILTER_ENTRIES: readonly FilterOption<FilterEntry>[] = [
  { id: "sheet", label: "Bottom sheet", description: "Filters slide up from the bottom of the screen" },
  { id: "drawer", label: "Side panel", description: "Filters slide in from the right-hand edge" },
];

export const FILTER_PLACEMENTS: readonly FilterOption<FilterPlacement>[] = [
  { id: "drawer", label: "Panel", description: "A Filters button opens them in a side panel" },
  { id: "sidebar", label: "Sidebar", description: "Filters stay pinned beside the products" },
  { id: "bar", label: "Bar", description: "One dropdown per filter, in a row above the products" },
];

export const FILTER_PRICE_MODES: readonly FilterOption<FilterPriceMode>[] = [
  { id: "both", label: "Both", description: "Ready-made price ranges, plus boxes to type a range" },
  { id: "presets", label: "Ranges", description: "Ready-made price ranges only — one tap each" },
  { id: "typed", label: "Typed", description: "Boxes to type the lowest and highest price" },
];

/** Customize's names for the sorts (the storefront uses its own localized ones). */
export const SORT_LABELS: Record<SortId, string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  discount: "Biggest discount",
};

/** Every sort the catalogue serves, `featured` first (it is the unset one). */
export const SORT_IDS: readonly SortId[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "discount",
];

export interface FilterGroupSetting {
  id: string;
  label?: string;
  hidden?: boolean;
  open?: boolean;
}

export interface ResolvedFilterSettings {
  enabled: boolean;
  /** Only the groups the merchant touched, in their order. */
  groups: FilterGroupSetting[];
  mobile: { entry: FilterEntry; stickyBar: boolean; quickChips: string[] };
  desktop: { placement: FilterPlacement };
  priceMode: FilterPriceMode;
  pricePresets: { min?: number; max?: number }[];
  brandMulti: boolean;
  showCounts: boolean;
  sort: { default: SortId; hidden: SortId[] };
}

export const DEFAULT_FILTER_SETTINGS: ResolvedFilterSettings = {
  enabled: true,
  groups: [],
  // The sticky bar is on for every shop too (owner decision B): it hides on
  // scroll-down, so it never takes space from the grid while reading.
  mobile: { entry: "sheet", stickyBar: true, quickChips: [] },
  desktop: { placement: "drawer" },
  priceMode: "both",
  pricePresets: [],
  brandMulti: true,
  showCounts: true,
  sort: { default: "featured", hidden: [] },
};

/** Most quick chips the phone row carries — more stops fitting one thumb-swipe. */
export const MAX_QUICK_CHIPS = 6;

function pick<T extends string>(options: readonly FilterOption<T>[], raw: unknown): T | undefined {
  return options.find((o) => o.id === raw)?.id;
}

const bool = (raw: unknown, fallback: boolean): boolean =>
  typeof raw === "boolean" ? raw : fallback;

const isSort = (raw: unknown): raw is SortId => SORT_IDS.includes(raw as SortId);

const num = (raw: unknown) =>
  typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : undefined;

/**
 * Narrow a stored `nav.filters`.
 *
 * `legacyLayout` is the collection layout (`templates.collection` or the
 * section's own `layout`). Its `sidebar` value promised "Filters pinned beside
 * the grid" long before this setting existed and drew no sidebar (plan D1) —
 * so until the merchant picks a placement, that layout IS the answer, and the
 * old control finally does what it said with no data change.
 */
export function resolveFilterSettings(
  raw?: StoreFilterSettings | null,
  legacyLayout?: string,
): ResolvedFilterSettings {
  const d = DEFAULT_FILTER_SETTINGS;
  const groups = (raw?.groups ?? [])
    .filter((g) => typeof g?.id === "string" && g.id)
    .map((g) => ({
      id: g.id,
      label: g.label?.trim() || undefined,
      hidden: g.hidden || undefined,
      open: g.open || undefined,
    }));
  const presets = (raw?.pricePresets ?? [])
    .map((p) => ({ min: num(p?.min), max: num(p?.max) }))
    .filter((p) => p.min !== undefined || p.max !== undefined);
  return {
    enabled: bool(raw?.enabled, d.enabled),
    groups,
    mobile: {
      entry: pick(FILTER_ENTRIES, raw?.mobile?.entry) ?? d.mobile.entry,
      stickyBar: bool(raw?.mobile?.stickyBar, d.mobile.stickyBar),
      quickChips: (raw?.mobile?.quickChips ?? [])
        .filter((id): id is string => typeof id === "string" && !!id)
        .slice(0, MAX_QUICK_CHIPS),
    },
    desktop: {
      placement:
        pick(FILTER_PLACEMENTS, raw?.desktop?.placement) ??
        (legacyLayout === "sidebar" ? "sidebar" : d.desktop.placement),
    },
    priceMode: pick(FILTER_PRICE_MODES, raw?.priceMode) ?? d.priceMode,
    pricePresets: presets,
    brandMulti: bool(raw?.brandMulti, d.brandMulti),
    showCounts: bool(raw?.showCounts, d.showCounts),
    sort: {
      default: isSort(raw?.sort?.default) ? raw.sort.default : d.sort.default,
      hidden: (raw?.sort?.hidden ?? []).filter(isSort),
    },
  };
}

/**
 * What to STORE: only the fields that differ from the defaults, like
 * `menuSettingsOverrides`. A shop that never opens the panel stores nothing and
 * keeps following the defaults if they improve.
 */
export function filterSettingsOverrides(
  s: ResolvedFilterSettings,
): StoreFilterSettings | undefined {
  const d = DEFAULT_FILTER_SETTINGS;
  const out: StoreFilterSettings = {};
  if (s.enabled !== d.enabled) out.enabled = s.enabled;
  // Order alone is a setting too, so a group with no override still keeps its place.
  if (s.groups.length) out.groups = s.groups;
  const mobile: NonNullable<StoreFilterSettings["mobile"]> = {};
  if (s.mobile.entry !== d.mobile.entry) mobile.entry = s.mobile.entry;
  if (s.mobile.stickyBar !== d.mobile.stickyBar) mobile.stickyBar = s.mobile.stickyBar;
  if (s.mobile.quickChips.length) mobile.quickChips = s.mobile.quickChips;
  if (Object.keys(mobile).length) out.mobile = mobile;
  if (s.desktop.placement !== d.desktop.placement) out.desktop = { placement: s.desktop.placement };
  if (s.priceMode !== d.priceMode) out.priceMode = s.priceMode;
  if (s.pricePresets.length) out.pricePresets = s.pricePresets;
  if (s.brandMulti !== d.brandMulti) out.brandMulti = s.brandMulti;
  if (s.showCounts !== d.showCounts) out.showCounts = s.showCounts;
  const sort: NonNullable<StoreFilterSettings["sort"]> = {};
  if (s.sort.default !== d.sort.default) sort.default = s.sort.default;
  if (s.sort.hidden.length) sort.hidden = s.sort.hidden;
  if (Object.keys(sort).length) out.sort = sort;
  return Object.keys(out).length ? out : undefined;
}

/**
 * The merchant's default sort for a store — what a catalogue URL with no `sort`
 * means. Saved settings only: the server seed has no Customize draft, and the
 * live preview refetches under its own key anyway.
 */
export const defaultSortOf = (store?: Pick<StorefrontStore, "nav"> | null): SortId =>
  resolveFilterSettings(store?.nav?.filters).sort.default;

/** The sorts a shopper is offered: every sort minus the hidden, the default always kept. */
export function visibleSorts(s: ResolvedFilterSettings): SortId[] {
  return SORT_IDS.filter((id) => id === s.sort.default || !s.sort.hidden.includes(id));
}

/* ================================== groups ================================= */

/**
 * A filter group's id. Fixed groups plus two families keyed by the merchant's
 * own words: `option:<attribute>` (Size, Colour) and `tagGroup:<group>`
 * (Fabric, Occasion).
 */
export type FilterGroupKind =
  | "category"
  | "option"
  | "brand"
  | "tags"
  | "tagGroup"
  | "price"
  | "availability";

export interface FilterGroup {
  id: string;
  kind: FilterGroupKind;
  /** The merchant's rename, else `null` (the caller supplies the built-in label). */
  label: string | null;
  /** The attribute / tag-group name for the two families. */
  name?: string;
  /** Open by default in the accordion. */
  open: boolean;
}

export const optionGroupId = (name: string) => `option:${name}`;
export const tagGroupId = (name: string) => `tagGroup:${name}`;

/** Rank of each kind in the default order — today's order, options after category. */
const KIND_RANK: Record<FilterGroupKind, number> = {
  category: 0,
  option: 1,
  brand: 2,
  tags: 3,
  tagGroup: 4,
  price: 5,
  availability: 6,
};

/**
 * The groups a filter surface draws, in order.
 *
 * Built from what the facets endpoint says exists for this result set — a group
 * with nothing to offer is left out rather than drawn empty. The merchant's
 * `groups` list then orders, renames, hides and pre-opens; a group they never
 * touched (a new Size attribute, say) keeps its default place after theirs.
 *
 * `active` lists the groups carrying a value right now. They are always open —
 * a shopper reopening the panel must see what is applied — and never hidden: a
 * merchant hiding Brand must not strand a `?brandId=` link with no way out.
 */
export function orderFilterGroups({
  facets,
  settings,
  hideCategory,
  inStockActive,
  active,
}: {
  facets: Pick<StoreFacets, "brands" | "tags" | "options" | "anyOutOfStock">;
  settings: ResolvedFilterSettings;
  hideCategory: boolean;
  inStockActive: boolean;
  active: Set<string>;
}): FilterGroup[] {
  const present: Omit<FilterGroup, "label" | "open">[] = [];
  if (!hideCategory) present.push({ id: "category", kind: "category" });
  for (const o of facets.options) present.push({ id: optionGroupId(o.name), kind: "option", name: o.name });
  if (facets.brands.length) present.push({ id: "brand", kind: "brand" });
  if (facets.tags.some((t) => !t.group)) present.push({ id: "tags", kind: "tags" });
  const groupNames = [...new Set(facets.tags.map((t) => t.group).filter((g): g is string => !!g))];
  for (const name of groupNames.sort()) present.push({ id: tagGroupId(name), kind: "tagGroup", name });
  present.push({ id: "price", kind: "price" });
  // Offered only when it would narrow something — never on an untracked shop,
  // where every product is buyable (plan F6). Kept while it is ON, or the
  // shopper could not see or undo it.
  if (facets.anyOutOfStock || inStockActive) present.push({ id: "availability", kind: "availability" });

  const byId = new Map(settings.groups.map((g) => [g.id, g]));
  const groups = sortGroups(present, settings)
    .filter((g) => active.has(g.id) || !byId.get(g.id)?.hidden)
    .map((g) => ({
      ...g,
      label: byId.get(g.id)?.label ?? null,
      open: active.has(g.id) || !!byId.get(g.id)?.open,
    }));
  // Nothing active and nothing the merchant opened: open the first group, so the
  // sheet never lands as a stack of closed headings.
  if (groups.length && !groups.some((g) => g.open)) groups[0].open = true;
  return groups;
}

/**
 * Order groups the way the merchant arranged them: their list first, in their
 * order; anything they never placed after it, in the default kind order. Shared
 * by the storefront and the Customize editor so the two cannot disagree.
 */
export function sortGroups<T extends { id: string; kind: FilterGroupKind }>(
  list: T[],
  settings: Pick<ResolvedFilterSettings, "groups">,
): T[] {
  const index = new Map(settings.groups.map((g, i) => [g.id, i]));
  const rank = (g: T) => index.get(g.id) ?? settings.groups.length + KIND_RANK[g.kind];
  return [...list].sort((a, b) => rank(a) - rank(b));
}

/** The group id's kind — `option:Size` → `option`. */
export function groupKind(id: string): FilterGroupKind | undefined {
  if (id.startsWith("option:")) return "option";
  if (id.startsWith("tagGroup:")) return "tagGroup";
  return (Object.keys(KIND_RANK) as FilterGroupKind[]).find(
    (k) => k === id && k !== "option" && k !== "tagGroup",
  );
}

/* =============================== URL helpers =============================== */

/** Query key for one option group — `opt.Size`. The backend matches case-insensitively. */
export const optionParam = (name: string) => `opt.${name}`;

/** Every `opt.*` param in a query string, as `{ Size: ["M", "L"] }`. */
export function readOptionParams(sp: { forEach: (cb: (v: string, k: string) => void) => void }) {
  const out: Record<string, string[]> = {};
  sp.forEach((value, key) => {
    if (!key.startsWith("opt.")) return;
    const values = value.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length) out[key.slice(4)] = values;
  });
  return out;
}

/** Comma list param → array (`brandId`, `tags`, `opt.*`). */
export const listParam = (raw: string) => (raw ? raw.split(",").filter(Boolean) : []);

/** Toggle one value in a comma list; `undefined` when the list empties (deletes the param). */
export function toggleInList(list: string[], value: string): string | undefined {
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  return next.join(",") || undefined;
}
