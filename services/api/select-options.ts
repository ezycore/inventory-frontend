// coding-standard: maintained
/**
 * The catalogue of endpoints that feed a `<select>`, and the single place that builds their URLs.
 *
 * Before this file, every form config hand-wrote its own query string
 * (`"/brands?all=true&fields=_id,name,isDefault"`). Two problems, one of which was a live bug:
 *
 *  1. The URL *was* the cache key, so two forms asking for the same brands with different `fields=`
 *     lists were two unrelated cache entries that had to be invalidated by string-identical URL.
 *     `services/api/modules/use-select-options.ts` fixed that half by rooting the key under the
 *     resource — but it had to *guess* the resource by sniffing the URL's first path segment.
 *  2. Nothing tied a URL to a resource, so a typo, a renamed route or a novel `fields=` list was
 *     invisible until a dropdown quietly stopped refreshing.
 *
 * Naming the source fixes both: `selectOptions("brands", { fields: "…" })` cannot misspell a path,
 * and the root comes from this table by lookup rather than inference.
 *
 * **Adding a dropdown on a new endpoint:** add a row here. That is the whole change — the URL
 * builder and the cache root both read from it.
 */
import { queryKeys } from "./query-keys";
import type { QueryKey } from "@tanstack/react-query";

interface OptionSource {
  /** Request path. May contain a `{{field}}` placeholder the form renderer substitutes. */
  path: string;
  /** The registry root that owns this data — what a mutation flushes to refresh the dropdown. */
  root: () => QueryKey;
  /** Endpoints that are already a bounded picker list and reject `all=true`. */
  noAll?: true;
}

export const OPTION_SOURCES = {
  accounts: { path: "/accounts", root: queryKeys.accounts.all },
  // Minimal id/name/isDefault list for the sale/purchase payment picker —
  // reachable by sales.create/purchases.create as well as accounts.view, so
  // a sell-only or receiving-only role can take payment without the full
  // list (balances included). Already a bounded picker, not paginated.
  accountPaymentOptions: {
    path: "/accounts/payment-options",
    root: queryKeys.accounts.all,
    noAll: true,
  },
  brands: { path: "/brands", root: queryKeys.brands.all },
  tags: { path: "/tags", root: queryKeys.tags.all },
  categories: { path: "/categories", root: queryKeys.categories.all },
  customers: { path: "/sales/customers", root: queryKeys.customers.all },
  purchaseDiscounts: { path: "/discounts/purchase", root: queryKeys.discounts.all },
  salesDiscounts: { path: "/discounts/sales", root: queryKeys.discounts.all },
  locations: { path: "/locations", root: queryKeys.locations.all },
  activeLocations: { path: "/locations/active", root: queryKeys.locations.all, noAll: true },
  products: { path: "/products", root: queryKeys.products.all },
  /** Variants of one product. `{{_id}}` is substituted by the form renderer from the product field. */
  productVariants: {
    path: "/products/{{_id}}/variants",
    root: queryKeys.products.all,
    noAll: true,
  },
  suppliers: { path: "/suppliers", root: queryKeys.suppliers.all },
  taxes: { path: "/taxes", root: queryKeys.taxes.all },
  units: { path: "/units", root: queryKeys.units.all },
  users: { path: "/users", root: queryKeys.users.all },

  // Inventory-scoped product pickers. Rooted under `inventory`, not `products`: what they return
  // depends on stock, so a product edit alone does not restate them (`catalog.changed` covers both).
  sellableProducts: {
    path: "/inventory/sellable-products",
    root: queryKeys.inventory.all,
    noAll: true,
  },
  purchasableProducts: {
    path: "/inventory/purchasable-products",
    root: queryKeys.inventory.all,
    noAll: true,
  },
  adjustableProducts: {
    path: "/inventory/adjustable-products",
    root: queryKeys.inventory.all,
    noAll: true,
  },
} as const satisfies Record<string, OptionSource>;

export type OptionSourceName = keyof typeof OPTION_SOURCES;

/** Query params a picker may narrow itself with. `fields` is the lean projection. */
interface OptionParams {
  fields?: string;
  status?: string;
  inventory?: boolean;
  all?: boolean;
  /**
   * Category level. `"null"` asks for top-level categories only — the value
   * `product.categoryId` must hold. May also be a template substituted with the
   * selected parent's id, by either renderer that owns a sub-category select:
   * `{{value}}` in a form (resolved from the field's `dependsOn`), or
   * `{{categoryId}}` in a filter bar (resolved from the sibling filter).
   */
  parentId?: string;
  /** Server-side term for a searchable picker (a catalogue is too big for `all=true`). */
  search?: string;
  /** Page size. Pair with `all: false` — `all=true` ignores it. */
  limit?: number;
  /** Comma-separated id whitelist, for resolving labels of an already-chosen set. */
  ids?: string;
}

/**
 * Build the URL for a named option source.
 *
 * ```ts
 * selectOptions("brands")                                  // /brands?all=true
 * selectOptions("brands", { fields: "_id,name,isDefault" }) // /brands?all=true&fields=_id,name,isDefault
 * selectOptions("taxes", { status: "active", fields: "_id,name,rate" })
 * ```
 *
 * `all=true` is the default because a picker wants the whole list, not page one — the recurring
 * "the option I just created isn't in the dropdown" report. Pass `all: false` to opt out.
 */
export const selectOptions = (
  name: OptionSourceName,
  params: OptionParams = {},
): string => {
  const source: OptionSource = OPTION_SOURCES[name];
  const { all = !source.noAll, ...rest } = params;

  const query = new URLSearchParams();
  if (all) query.set("all", "true");
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) query.set(key, String(value));
  }

  // `URLSearchParams.toString()` percent-encodes everything, which turns a
  // `{{value}}` template into `%7B%7Bvalue%7D%7D`. That silently breaks the
  // dependent-select machinery: `field-select-inputs.tsx` decides whether to
  // hold a request back by testing `optionsApi.includes("{{")`, so an encoded
  // template reads as an ordinary URL, the gate never fires, and the LITERAL
  // placeholder is sent to the API — a 400 the select renders verbatim
  // ("Error: query.parentId: Invalid ObjectId format"), before and after the
  // dependency is chosen, because `resolveApiTemplate` is never reached either.
  //
  // Restoring the braces keeps `{{…}}` the one canonical spelling for every
  // consumer. Path templates (`/products/{{_id}}/variants`) never hit this —
  // they are not built through URLSearchParams, which is why this stayed hidden
  // until the first template landed in a QUERY parameter.
  const qs = query.toString().replace(/%7B%7B(.+?)%7D%7D/g, "{{$1}}");
  return qs ? `${source.path}?${qs}` : source.path;
};

/**
 * The registry root that owns the data behind an option URL, matched by longest path prefix.
 *
 * Returns `undefined` for a URL no source claims — `useSelectOptions` turns that into a dev warning
 * rather than silence, so an unregistered endpoint is loud at the moment it is added instead of on
 * the day someone notices a dropdown never refreshing.
 */
export const optionSourceRoot = (url: string): QueryKey | undefined => {
  const path = url.split("?")[0].replace(/^\/+/, "");
  const segments = path.split("/");

  // Longest prefix first, so `sales/customers` beats a bare `sales` and
  // `inventory/sellable-products` beats a bare `inventory`.
  for (let depth = Math.min(segments.length, 2); depth > 0; depth -= 1) {
    const prefix = segments.slice(0, depth).join("/");
    const match = Object.values(OPTION_SOURCES).find(
      (source) => source.path.replace(/^\/+/, "") === prefix,
    );
    if (match) return match.root();
  }

  // `/products/{{_id}}/variants` and `/products/abc123/variants` both resolve here.
  const byFirstSegment = Object.values(OPTION_SOURCES).find(
    (source) => source.path.replace(/^\/+/, "").split("/")[0] === segments[0],
  );
  return byFirstSegment?.root();
};
