---
name: query-cache
description: 'TanStack Query cache rules for this repo — query KEYS, INVALIDATION, dropdown option caching, and session/scope eviction. USE WHEN: adding or changing any `useQuery`/`useMutation`, adding a query key, wiring what a mutation refreshes, adding a `<select>` that fetches its options, or debugging "list did not refresh after save", "dropdown missing the row I just created", "stale name/rate after editing a category", "dashboard disagrees with the page", "wrong location''s stock flashed", "I see another shopper''s orders", "Page 1 of undefined", a `no-restricted-syntax` query-key lint error, a `query-cache/*` lint warning, or a red `services/api/__tests__/invalidation.test.ts`. Owns `services/api/{query-keys,invalidation,select-options}.ts`, `services/api/modules/{query-helpers,use-select-options}.ts`, `services/storefront/hooks.ts`, `eslint-rules/query-cache.mjs`. **MUST be updated whenever those files, the `EFFECTS` event list, or the enforcement gates change.** Companion to the `api-module` skill (module plumbing + generated types) — that file does not restate these rules.'
---

# Query cache: keys, invalidation, and the gates

Everything here exists because of a specific bug. The audit that produced these rules, with every
defect and file reference, is [`docs/plan/query-invalidation.md`](../../../docs/plan/query-invalidation.md);
read it when you want the *why* at length. This file is the *how*.

**Three files own the whole subject.** Do not add a fourth.

| File | Owns |
|---|---|
| [`services/api/query-keys.ts`](../../../services/api/query-keys.ts) | every admin query key |
| [`services/api/invalidation.ts`](../../../services/api/invalidation.ts) | what each domain event dirties |
| [`services/api/select-options.ts`](../../../services/api/select-options.ts) | every `<select>` endpoint + its cache root |

The shopper storefront is deliberately separate — see §6.

---

## 1. The one invariant

> **Every key a resource owns starts with that resource's `all()`.**

That single property is what makes `invalidateQueries({ queryKey: queryKeys.brands.all() })` a
*complete* flush of everything brand-shaped — lists, details, stats, and the `<select>` options behind
every form — without the caller knowing what those keys look like.

Break it and the failure is silent: the query still caches, the invalidation still "runs", and the
screen just stops updating. Nothing throws.

---

## 2. Adding a query key

`resourceKeys(root)` in `query-keys.ts` builds the standard shape. Spread it, then add the extras:

```ts
brands: {
  ...resourceKeys("brands"),                                    // all/lists/list/details/detail/options/stats/summary
  bySlug: (slug: string) => ["brands", "slug", slug] as const,  // starts with the root ✔
},
```

### The cases

| Case | Do this |
|---|---|
| Plain CRUD resource | `resourceKeys("<root>")`, nothing else |
| Extra read (`bySlug`, `ledger`, `statement`, `byProduct`) | add a function whose array **starts with the root** |
| Sub-resource of one record (a sale's payments) | nest under the detail: `["sales-orders", "detail", id, "payments"]` — then `detail(id)` and `all()` both reach it |
| A resource whose root differs from its name | fine, but be explicit — `stockMovements` roots at `["stock","movements"]` so `stock.all()` flushes it |
| Singleton (organization, profile) | hand-write `all()` + named sub-keys; the CRUD shape doesn't fit |
| Composed at the call site | `[...queryKeys.inventory.lowStock(), "import-dialog"]` is fine — it's derived from the registry and keeps the prefix |
| **A literal array** | **never.** ESLint rejects it |

**Filters belong in the key.** `list(params)` takes them because two callers asking for different
projections of the same resource are two different queries. A `list()` that ignored its filters is
what made eight call sites share one `["accounts","list"]` entry, so whichever mounted first decided
which *fields* everyone else saw — a field-level data bug that reads like a backend fault.

---

## 3. Fetching

Four paths. Pick by use site.

| Path | When | Key |
|---|---|---|
| `createResourceHooks` ([`query-helpers.ts`](../../../services/api/modules/query-helpers.ts)) | standard CRUD resource | `queryKeys.<r>.list(filters)` / `.detail(id)` / `.stats()` |
| `DataTable` ([`ui/components/dataTable`](../../../ui/components/dataTable)) | full list page | page passes the **root**; the table appends `{page, limit, ...filters, sort}` |
| Hand-written `useQuery` | anything bespoke | a registry key, always |
| `useSelectOptions` | a `<select>` that fetches | see §5 |

`DataTable`'s `queryKey` prop is typed `QueryKey`, so pass the registry call directly —
`queryKey: queryKeys.products.all()`. If you find yourself writing `[...queryKeys.x.all()]`, the
spread is a leftover from when the prop was `any[]`; drop it.

**A lazy read modelled as a `useMutation`** (runs on click, not on mount) is legitimate — see
`useOrderFraudScore`, `useOrganizationUsers`. It must be allowlisted in the gate (§7).

### Every paginated hand-written `useQuery` needs `placeholderData: keepPreviousData`

`page` (and each filter) is part of the key, so **page 2 is a cache miss**: `isLoading` flips true,
and any page gated on it tears its table down to "Loading…" and rebuilds it. The result is a visible
collapse-and-reappear on every page click, filter tap and search keystroke.

`DataTable` and `DataCard` set it centrally, so their pages are already covered — this is only for
**hand-rolled list pages**. Two of them shipped without it and had to be fixed after the fact
(`useCatalogProducts`, `useNotificationLog`, both 2026-08-09), while `useAbandonedCarts` /
`useOnlineCustomers` / `useOnlineCustomerOrders` had it from the start. Copy the shape:

```ts
useQuery({
  queryKey: queryKeys.<r>.list(params),   // params include page + filters
  queryFn: () => api.list(params),
  placeholderData: keepPreviousData,      // keep last page up while the next loads
  select: (r) => r.data,
});
```

Then **gate the empty/loading row on `isLoading`, not `isFetching`** — with this set, `isLoading` is
true only when there is genuinely nothing to show — and pass `isFetching` to the footer
(`<ListPagination isFetching>`) so the shopkeeper still gets the "Updating…" cue.

---

## 4. Invalidation: declare the event, not the keys

A mutation declares **what it did**. `invalidation.ts` owns **what that dirties**.

```ts
// hand-written hook
onSuccess: () => invalidate(qc, "sale.posted"),

// factory-built resource — its own all() is always flushed, so name only the EXTRA effect
createResourceHooks(api, queryKeys.brands, { events: ["catalog.changed"] })
```

Why inverted: nobody knows the whole graph. Expecting each mutation author to remember that confirming
a storefront order reserves stock, that marking it paid posts a Sale and moves money, and that all
three restate the dashboard is how that pipeline ended up refreshing none of them.

### The cases

| Situation | Do this |
|---|---|
| Mutation dirties **only its own resource** | factory: nothing. Hand-written: `invalidateQueries({ queryKey: queryKeys.<r>.all() })` is fine and correct |
| Mutation dirties **another resource too** | `invalidate(qc, "<event>")`. Never hand-list the second resource |
| The event exists but misses a key | add the key **in `invalidation.ts`**. Every call site is fixed at once |
| No event fits | add one. Name it after the *backend* state transition, not the UI action |
| New event overlaps existing ones | compose with `union(...)`, don't re-list: `union([k.salesOrders.all()], MONEY, STOCK)` |
| Mutation returns the fresh row | `setQueryData(key, data)` — seeding is stronger than invalidating, and counts for the gate |
| Mutation genuinely changes nothing cached | allowlist it in the gate with a reason (§7) |
| **Everything** really did change | `invalidateQueries()` bare — but justify it in a comment + `eslint-disable-next-line` |
| A **scope** changed (location, org, shopper) | **evict, don't invalidate** — §6 |

### Event vocabulary

Grouped bundles `DERIVED` (dashboard + reports), `STOCK`, `MONEY` are composed into the events.
Current list: `stock.moved`, `money.moved`, `sale.posted`, `sale.drafted`, `sale.paid`,
`sale.returned`, `purchase.ordered`, `purchase.received`, `purchase.paid`, `purchase.returned`,
`order.changed`, `order.confirmed`, `order.settled`, `order.returned`, `catalog.changed`,
`storefront.catalog.changed`, `storefront.content.changed`, `storefront.page.drafted`,
`storefront.page.published`, `party.changed`, `org.changed`.

`storefront.page.drafted` is deliberately **lists only**: its hooks `setQueryData` the page they got
back, because a refetch under an open page editor would race the next autosave (storefront skill →
"Pages").

Keep them aligned with the backend skills (`sales-flow`, `purchase-flow`, `inventory-stock`,
`accounting-ledger`, `storefront-orders`). An event with no backend counterpart means the frontend is
inventing a workflow.

**Coarse is usually right.** `catalog.changed` covers product/category/brand/unit/tax/discount as one
event, and `org.changed` sweeps in the derived read models. `invalidateQueries` only *refetches*
queries that are actually mounted — the rest are just marked stale — so over-listing costs far less
than under-listing, and nobody is watching the dashboard while editing settings.

---

## 5. Dropdowns that fetch their options

**Never hand-write an options URL.** Both the path and the cache root come from
[`services/api/select-options.ts`](../../../services/api/select-options.ts):

```ts
optionsApi: selectOptions("brands", { fields: "_id,name,isDefault" })
// → "/brands?all=true&fields=_id,name,isDefault"
// → cached at ["brands", "options", "<url>"]
```

The key is rooted at the **resource**, so `queryKeys.brands.all()` — which the factory already
flushes on every brand mutation — refreshes *every* brands dropdown, whatever projection it asked for.

This replaced a keying scheme where the full URL *was* the identity. Refreshing a dropdown then meant
invalidating a string-identical URL written in another file, so eight modules hand-enumerated URL
lists, and **every new form silently added a cache entry nobody had registered**. Four dropdowns were
provably never refreshed, including the payment-account picker on every sale.

### The cases

| Situation | Do this |
|---|---|
| New dropdown on an existing endpoint | `selectOptions("<name>", { fields })`. Nothing else |
| New dropdown on a **new** endpoint | add a row to `OPTION_SOURCES` — `{ path, root }`. That's the whole change |
| Endpoint rejects `all=true` (already a bounded picker) | mark it `noAll: true` in the table |
| Path has a placeholder (`/products/{{_id}}/variants`) | put the template in `path`; both the template and the substituted form resolve to the same root |
| Two forms need different `fields=` | just ask for what you need. Different URLs, same root, one flush |
| Dropdown must refresh after a *different* resource changes | that's an event — §4 |
| Quick-add-from-dropdown | `config/quickAddConfig.ts` carries `queryRoot`, a registry root, not a URL |
| You see `[useSelectOptions] no option source for "…"` in the console | the endpoint isn't in `OPTION_SOURCES`. Add it — the dropdown currently never refreshes |

**Projections must match what the UI reads.** Two tax pickers exist on purpose: the products form asks
for `isDefault` because its `defaultFlag` prefill reads it, and the categories form does not.
Collapsing them onto one projection silently disables the prefill.

---

## 6. Scope changes evict, they do not invalidate

`invalidateQueries` marks queries stale and refetches the **active** ones. **Inactive** queries keep
their data for the full `gcTime` (10 min) and hand it back *synchronously* on the next mount, before
the refetch lands. When the thing that changed is *who you are* or *what you're looking at*, that
means rendering someone else's data.

| Boundary | Call | Where |
|---|---|---|
| Active location switch | `queryClient.clear()` | [`LocationSwitcher.tsx`](../../../ui/components/LocationSwitcher.tsx), [`change-default-location-dialog.tsx`](../../../components/profile/change-default-location-dialog.tsx) |
| Staff login / signup | `queryClient.invalidateQueries()` (bare, justified) | [`auth/hooks.ts`](../../../services/api/modules/auth/hooks.ts) |
| Shopper login / register / logout / 401 | `clearShopperCache(qc, slug)` | [`services/storefront/hooks.ts`](../../../services/storefront/hooks.ts), [`lib/storefront-client.ts`](../../../lib/storefront-client.ts) |

Location is request-scope state (the `X-Active-Location` header), not a query argument — so it is
**not** in the keys, and switching evicts instead. Threading it through every key factory would touch
the whole data layer to buy two-location caching, which is a footgun on location-scoped stock.

### The shopper storefront

Storefront keys live in `services/storefront/hooks.ts`, **not** the admin registry: different session
model (shopper token), a `slug` dimension no admin key carries, SSR-seeded `initialData`, and zero
overlap — a shopper mutation cannot dirty an admin query.

Same invariant, plus one more: **everything private to the signed-in shopper starts with
`storefront.shopper(slug)`**, so a session change is one `clearShopperCache` call. That prefix exists
because the orders key once carried only the store slug, so signing out left the previous shopper's
order numbers, addresses and phone numbers in cache — and the next sign-in on the same device read
them back. Shared phones and shop counters make that a routine path.

**Never call `useShopperStore().logout` directly** — use `useShopperLogout(slug)`. Public store data
(products, categories, campaigns, pages) is deliberately *not* evicted: identical for every visitor,
SSR-seeded, so clearing it only causes a flash. ESLint warns on the raw call.

---

## 7. The gates

| Gate | Level | Catches |
|---|---|---|
| `no-restricted-syntax` ([`eslint.config.mjs`](../../../eslint.config.mjs)) | **error** | an inline array literal as a query key |
| [`services/api/__tests__/invalidation.test.ts`](../../../services/api/__tests__/invalidation.test.ts) | **fails CI** | a mutation hook that invalidates nothing; an `EFFECTS` entry that is empty, duplicated, or names an unknown root; an `OPTION_SOURCES` row that doesn't round-trip to its own key |
| `query-cache/no-blanket-invalidate` ([`eslint-rules/query-cache.mjs`](../../../eslint-rules/query-cache.mjs)) | warn | argument-less `invalidateQueries()` |
| `query-cache/no-cross-resource-invalidate` | warn | a handler hand-listing **two different** resources' keys |
| `query-cache/no-raw-shopper-logout` | warn | `useShopperStore().logout` outside the eviction sites |

All run in CI (`pnpm lint`, `pnpm test`).

**Warnings are judgement calls, not noise.** Each is usually wrong and occasionally right, so it asks
for a justification instead of refusing. Silence one with `eslint-disable-next-line <rule> -- reason`
on its own line — the directive must be the **last line before the code**, or ESLint reports it as an
unused directive and the original warning stands.

**Adding a mutation that genuinely caches nothing:** add it to `READ_ONLY_MUTATIONS` in the test file
*with a reason*. That list is a claim — if the endpoint writes something, it doesn't belong there.

---

## 8. Symptom → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| List doesn't refresh after saving | mutation invalidates nothing, or the wrong root | `invalidate(qc, "<event>")`; the test would have caught a hook with none |
| Stale category/brand/unit **name** on the products list | the mutated resource doesn't declare `events: ["catalog.changed"]` | add it to its `createResourceHooks` options |
| Dropdown missing a row you just created | its endpoint isn't in `OPTION_SOURCES` (look for the dev-console warning) | add the row |
| Dropdown refreshes in one form but not another | you hand-wrote the URL instead of `selectOptions()` | use the builder |
| A field is `undefined` that the API definitely returns | two callers share a list cache entry with different `fields=` | filters must be in the key — `list(filters)`, not `list()` |
| Two records show the same detail data | the key doesn't include the id (or is `[]`) | key off the id |
| Stats card shows list data (or vice versa) | two `queryFn`s on one key | give stats its own `stats()` key |
| Dashboard/report disagrees with the page you came from | the event omits `DERIVED` | add it in `invalidation.ts` |
| Previous location's rows flash after switching | invalidated instead of evicted | `queryClient.clear()` |
| You can see another shopper's orders | session change didn't evict | `clearShopperCache`; use `useShopperLogout` |
| Invalidation "runs" but nothing refetches | the key is a literal that no longer matches the root — or a prefix of nothing (`["stockMovements"]` vs `["stock","movements"]`) | use the registry |
| Table blanks to "Loading…" and re-appears on every page click | hand-written paginated `useQuery` with no `placeholderData` — page 2 is a cache miss, so `isLoading` goes true | `placeholderData: keepPreviousData` (§3) |
| `Page 1 of undefined` | list envelope lost its pagination meta | keep `{ success, data, message, meta }`; see the `api-module` skill |
| `TS4104: readonly … cannot be assigned to any[]` | a prop typed `any[]` receiving a registry key | type the prop `QueryKey` |

---

## 9. Things NOT to do

- **Don't inline a key array.** It works only while it happens to match the root; a rename breaks it
  silently, and nothing fails.
- **Don't hand-list another resource's keys in a mutation.** Declare the event.
- **Don't create a second key registry**, or a `selectOptions`-style helper "just for this feature".
- **Don't put the active location, org id, or shopper id in a key** to avoid eviction. Evict.
- **Don't raise `staleTime` to paper over a missing invalidation.** It widens the window to be wrong.
- **Don't turn on `refetchOnWindowFocus` to hide one either** — it makes this class of bug *harder* to
  find, not rarer.
- **Don't delete a `READ_ONLY_MUTATIONS` entry to make the test pass.** Either it caches nothing (keep
  it, with the reason) or it does (wire the event).
