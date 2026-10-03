// coding-standard: maintained
/**
 * A list's page, page size, sort and filters, read from and written to the URL.
 *
 * Every paged list keeps this in the address bar, so opening a row and pressing
 * Back lands on the same page with the same filters, a refresh keeps them, and
 * the view can be shared as a link. Pure functions only — the hook that binds
 * them to the router is `hooks/use-list-url-state.ts`.
 *
 * Rules the functions keep, so a URL stays short and honest:
 *  - **A default is never written.** An untouched list is its bare path.
 *  - **Only this list's keys are touched.** Every other param (a `returnTo`, a
 *    second list's keys) survives a write.
 *  - **A prefix separates two lists on one screen** (`o_page`, `r_page`).
 *
 * The shapes a filter can take are the filter bar's own: text, a number, a
 * boolean, a multi-select's array (`a,b`), a date range (`from,to`) and a number
 * range (`min,max`) — the same wire forms the filter bar has always read from a link, so a
 * link built elsewhere (`/products?tags=a,b`) lands filtered.
 */
import type { FilterField } from "@/types/filter";

export type SortOrder = "asc" | "desc";

export type ListFilterValue =
  | string
  | number
  | boolean
  | string[]
  | { from: string; to: string }
  | { min: number; max: number }
  | null
  | undefined;

export type ListFilters = Record<string, ListFilterValue>;

/** How one filter reads back from its URL string. */
export type FilterDecoder = (raw: string) => ListFilterValue;

export interface ListState<F extends ListFilters = ListFilters> {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters: F;
}

export interface ListUrlSpec<F extends ListFilters = ListFilters> {
  /** Prepended to every key, for a second list on the same screen. */
  prefix?: string;
  defaults: ListState<F>;
  /** One decoder per filter key; a key without one is not this list's. */
  decoders: Record<string, FilterDecoder>;
  /** Page sizes the list offers; a URL naming another falls back to the default. */
  limitOptions?: readonly number[];
}

const PAGE = "page";
const LIMIT = "limit";
const SORT_BY = "sort_by";
const SORT_ORDER = "sort_order";

const pair = (raw: string): [string, string] | null => {
  const [a, b] = raw.split(",");
  return a && b ? [a, b] : null;
};

/** The decoder a filter-bar field implies, the same forms a link has always used. */
export function decoderForField(field: FilterField): FilterDecoder {
  switch (field.type) {
    case "number":
      return (raw) => {
        const value = Number(raw);
        return Number.isNaN(value) ? undefined : value;
      };
    case "number-range":
      return (raw) => {
        const parts = pair(raw);
        return parts ? { min: Number(parts[0]), max: Number(parts[1]) } : undefined;
      };
    case "date-range":
      // Kept as `YYYY-MM-DD` strings: a picked day is cut on the organization's
      // calendar server-side, and a `Date` here would be a UTC instant.
      return (raw) => {
        const parts = pair(raw);
        return parts ? { from: parts[0], to: parts[1] } : undefined;
      };
    case "boolean":
    case "checkbox":
      return (raw) => raw === "true";
    default:
      return field.mode === "multiple"
        ? (raw) => raw.split(",").filter(Boolean)
        : (raw) => raw;
  }
}

/** The decoder a filter's default value implies — for lists built without a filter bar. */
export function decoderForDefault(value: ListFilterValue): FilterDecoder {
  if (typeof value === "number") return decoderForField({ name: "", label: "", type: "number" });
  if (typeof value === "boolean") return (raw) => raw === "true";
  if (Array.isArray(value)) return (raw) => raw.split(",").filter(Boolean);
  return (raw) => raw;
}

/** A filter's URL string, or `null` when it holds nothing worth keeping. */
export function encodeFilterValue(value: ListFilterValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value === "" ? null : value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length ? value.join(",") : null;
  if ("from" in value) return value.from && value.to ? `${value.from},${value.to}` : null;
  if ("min" in value) return `${value.min},${value.max}`;
  return null;
}

const positiveInt = (raw: string | null): number | undefined => {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
};

/** The list's state as the URL states it, the defaults filling every gap. */
export function readListState<F extends ListFilters>(
  params: URLSearchParams,
  spec: ListUrlSpec<F>,
): ListState<F> {
  const key = (name: string) => `${spec.prefix ?? ""}${name}`;
  const { defaults } = spec;

  const limit = positiveInt(params.get(key(LIMIT)));
  const order = params.get(key(SORT_ORDER));
  const filters = { ...defaults.filters } as Record<string, ListFilterValue>;
  for (const [name, decode] of Object.entries(spec.decoders)) {
    const raw = params.get(key(name));
    if (raw === null || raw === "") continue;
    const value = decode(raw);
    if (value !== undefined) filters[name] = value;
  }

  return {
    page: positiveInt(params.get(key(PAGE))) ?? defaults.page,
    limit:
      limit !== undefined && (!spec.limitOptions || spec.limitOptions.includes(limit))
        ? limit
        : defaults.limit,
    sortBy: params.get(key(SORT_BY)) ?? defaults.sortBy,
    sortOrder: order === "asc" || order === "desc" ? order : defaults.sortOrder,
    filters: filters as F,
  };
}

/**
 * `params` with this list's keys set to `state`. A value equal to its default
 * is removed rather than written; every key that is not this list's is kept.
 */
export function writeListState<F extends ListFilters>(
  params: URLSearchParams,
  state: ListState<F>,
  spec: ListUrlSpec<F>,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const key = (name: string) => `${spec.prefix ?? ""}${name}`;
  const { defaults } = spec;
  const put = (name: string, value: string | null, fallback: string | null) => {
    if (value === null || value === fallback) next.delete(key(name));
    else next.set(key(name), value);
  };

  put(PAGE, String(state.page), String(defaults.page));
  put(LIMIT, String(state.limit), String(defaults.limit));
  put(SORT_BY, state.sortBy ?? null, defaults.sortBy ?? null);
  put(SORT_ORDER, state.sortOrder ?? null, defaults.sortOrder ?? null);

  const names = new Set([...Object.keys(spec.decoders), ...Object.keys(state.filters)]);
  for (const name of names) {
    put(
      name,
      encodeFilterValue(state.filters[name]),
      encodeFilterValue(defaults.filters[name]),
    );
  }
  return next;
}
