# Query cache & invalidation — audit and remediation plan

**Status:** **COMPLETE — P0–P4, 2026-07-21.**
**Written:** 2026-07-21.
**Owner doc after landing:** [`.claude/skills/api-module/SKILL.md`](../../.claude/skills/api-module/SKILL.md).

---

## 0. The complaint

> "We need to invalidate the queries. The current implementation doesn't cover the full project, it's
> wrong in many places, and in many places it isn't implemented at all."

All three are true, and they are three different problems with three different fixes. This document
separates them, lists every defect found with a file reference, and proposes the smallest structural
change that stops the class of bug rather than the instances of it.

The audit covers `services/api/**`, `services/storefront/hooks.ts`, `ui/components/dataTable/`, and
every `app/(protected)/**` page that declares a query key. Counts as of 2026-07-21:
**144 `invalidateQueries` calls across 26 files**, **37 API modules**, **1 canonical key registry plus
12 private ones**.

---

## 1. How caching works here today

Four independent fetch paths coexist. This is fine in itself — the problem is that only one of them
uses the key registry, and the fourth (every dropdown in the app) is keyed in a way that makes
invalidation structurally unreliable — see A4.

| Path | Where | Key shape |
|---|---|---|
| **Resource factory** | `services/api/modules/query-helpers.ts` → `createResourceHooks` | `queryKeys.<r>.list()` / `.detail(id)` |
| **DataTable** (the real list fetcher for most pages) | `ui/components/dataTable/index.tsx:121-123` | `[...queryKey, { page, limit, ...filters, sort_by, sort_order }]` — page supplies the root |
| **Hand-written hooks** | each module's `hooks.ts` | whatever that file decided |
| **Select options** (every dropdown in every form) | `services/api/modules/use-select-options.ts:24` | `["select-options", <full URL including the `fields=` projection>]` |

`createResourceHooks` is adopted by 13 modules (accounts, brands, categories, customers, discounts,
inventory, locations, products, suppliers, taxes, units, users, variants). It gives them
list/detail/create/update/delete/bulkDelete and invalidates `queryKeys.<r>.all()` plus an optional
`relatedQueryKeys` array on every mutation. Ten modules actually pass `relatedQueryKeys`.

Everything else — sales, purchases, returns, transactions, stock, reports, dashboard, profile, auth,
and the entire ecommerce surface — hand-writes its mutations and hand-lists its invalidations.

QueryClient defaults (`lib/react-query.ts`): `staleTime` 1 min, `gcTime` 10 min,
`refetchOnWindowFocus: false`. **Window-focus refetch is off**, so a missed invalidation is not
papered over by the user alt-tabbing — it stays wrong for up to a minute, or until remount.

---

## 2. Defects found

Severity: **A** = wrong data reaches the user, **B** = stale data reaches the user, **C** = latent /
dead code.

### A1 — `useAccounts` filters are not in the cache key

`createResourceHooks.useList` (`services/api/modules/query-helpers.ts:82-92`) builds
`queryKey: queryKeys.list()` — with **no arguments** — and then passes `filters` to the `queryFn`.
The filters never reach the key. Every caller of a given resource's list shares one cache entry.

Eight live call sites, three different payload shapes, one key `["accounts", "list"]`:

| Call site | Filters |
|---|---|
| `components/purchases/seller-payment-section.tsx:41` | `{ all: true, fields: "_id,name,isDefault,balance,type,status" }` |
| `components/customers/customer-ledger-sheet.tsx:74` | `{ status: "active", limit: 100 }` or `undefined` |
| `components/purchases/returns/use-purchase-returns-page.ts:104` | `{ status: "active", limit: 100 }` or `undefined` |
| `components/purchases/orders/receive-items-dialog.tsx:72` | `{ all: true }` |
| `components/purchases/history/use-purchase-history-page.ts:84` | none |
| `components/sales/history/use-sales-history-page.ts:62` | none |
| `components/sales/returns/use-sales-return-page.ts:75` | `{ status: "active", limit: 100 }` or `undefined` |
| `components/suppliers/SupplierLedgerSheet.tsx:123` | `{ status: "active", limit: 100 }` or `undefined` |

Whichever mounts first within the staleTime window defines what all the others see. The payment
section asks for a `fields` projection including `balance`; if the ledger sheet's query populated the
cache first, `balance` is simply absent from the rows the payment section renders. This is a
**field-level data bug that looks like a backend problem**.

Several resource key factories already accept filters (`queryKeys.inventory.list(filters)`,
`.customers.list(filters)`, `.locations.list(filters)`, `.transactions.list(filters)`) — the factory
just never passes them.

### A2 — `useStats` and `useList` share one key

`query-helpers.ts:69-79` gives `useStats` the key `queryKeys.list()` — **identical to `useList`**.
Two different `queryFn`s, one cache entry; the second to mount reads the first one's response shape.

Six modules export it: `useProductStats`, `useCategoryStats`, `useBrandStats`, `useDiscountStats`,
`useLocationStats`, `useUserStats`. Today the collision is dormant because no page mounts the factory
`useList` for those resources (pages fetch lists through DataTable, which uses a different key). It
fires the moment someone uses the hook that is exported for exactly that purpose.

### A3 — `useInventoryHistory` has an empty key

`services/api/modules/stock/hooks.ts:55` — `queryKey: []`, with the correct key commented out on the
next line. Consequences: every `(productId, locationId, variantId)` triple shares one cache entry, so
opening a second product's history shows the first product's rows; and an empty key matches no
prefix filter, so **nothing invalidates it** — not a stock adjustment, not a transfer, not a receive.

### A4 — select-option dropdowns are keyed by URL, so invalidation is a hand-maintained URL list

**This is the largest gap, and the one that guarantees the problem recurs.**

Every `<select>` in every form fetches through `useSelectOptions(url)`
(`services/api/modules/use-select-options.ts`), which keys the cache as
**`["select-options", url]` — the full URL, including the `fields=` projection**, with a `staleTime`
of 5 minutes (five times the app default).

The key therefore encodes the *projection*, not the *data*. Two forms that need the same brands with
different `fields=` lists are two unrelated cache entries. To refresh a dropdown after a mutation, the
mutating module must invalidate a **string-identical URL** that lives in a different file — so eight
modules hand-enumerate URL literals in `relatedQueryKeys`:

```ts
// services/api/modules/units/hooks.ts:11-12  — two entries for ONE resource
["select-options", "/units?all=true&fields=_id,name,shortName"],
["select-options", "/units?all=true&fields=_id,name,shortName,isDefault"],
```

`discounts/hooks.ts:12-15` lists four. `categories/hooks.ts:19` and `taxes/hooks.ts:18` gave up and
use a bare `["select-options"]`, which flushes every dropdown in the app — the only entries that are
actually correct.

What the enumeration misses today:

| Resource | Projections in use | Registered | Never invalidated |
|---|---|---|---|
| **products** | `…inventory=false&fields=_id,name,unitId,productType,hasExpiry` (`components/inventory/form-config.ts:16`)<br>`…fields=_id,name,price,productType,variants` (`components/products/combo-components-field.tsx:49`)<br>`…fields=_id,name` (`components/ecommerce/campaigns/form-config.ts:93`) | 1st only (`products/hooks.ts:12`) | **combo component picker, campaign product picker** |
| **accounts** | `…fields=_id,name,isDefault,balance,type,status` (`components/sales/form-configs.tsx:59`) | none — `accounts/hooks.ts` passes no `relatedQueryKeys` | **the payment-account dropdown on every sale** |
| **locations** | `…fields=_id,name` (`components/products/form-config.tsx:420`) | none | **the location dropdown in the product form** |
| **brands** | `_id,name` / `_id,name,isDefault` / `id,name` (`components/purchases/import-low-stock-dialog.tsx:252`) | 1st two | **the `id,name` variant** |
| units, customers, suppliers, discounts | 2–4 each | all, by hand | — (holds only until the next form) |
| categories, taxes | 3 / 2 | bare `["select-options"]` | — (over-invalidates, correctly) |

So: create an account, open a sale → the account dropdown does not list it for up to 5 minutes. Add a
product, open the combo builder → it isn't there. And **every new form is a new cache key nobody
registered** — this defect regenerates itself with each feature.

Related, same root cause: `config/quickAddConfig.ts` (the create-inline-from-a-dropdown flow) carries
an `optionsApiPath` string that `ui/components/advanced-select.tsx:316` invalidates after a quick-add.
It must match the consuming form's URL exactly. The `discount` entry (`quickAddConfig.ts:65`) has
`optionsApiPath: ""` — invalidating `["select-options", ""]`, which matches nothing. It works anyway,
purely because `useCreateDiscount` happens to list four discount URLs itself.

### B1 — no cross-resource invalidation on the ecommerce order pipeline

`services/api/modules/storefront-orders/hooks.ts` has **20 mutations** and one shared helper
(line 52-53) that invalidates `["storefront-orders"]` and nothing else. But:

| Mutation | Also changes | Invalidated? |
|---|---|---|
| `useConfirmOrder` (:55) | reserves stock | ✗ inventory, products, variants |
| `useRecordAdvance` (:107) | money in | ✗ accounts, transactions |
| `useMarkOrderPaid` (:133) | money in, creates Sale | ✗ sales-orders, accounts, transactions, customers |
| `useReturnOrder` (:146) | stock back, money out | ✗ inventory, sales-returns, accounts, transactions |
| `useUpdateCourierCost` (:120) | order cost | ✗ dashboard, reports |
| `useCreateConsignment` / `useBulkConsignment` | fulfilment state | ✗ dashboard |

The orders page compensates by hand — `app/(protected)/ecommerce/orders/page.tsx:176-177` invalidates
`["storefront-orders"]` and `["ecommerce-dashboard"]` itself. That is the smell: the page knows what
the mutation forgot.

### B2 — stock mutations skip the inventory list

`services/api/modules/stock/hooks.ts` — `useAdjustStock` (:82-86), `useTransferStock` (:103-105),
`useBulkStockAdjustment` (:122-124) each invalidate `['stock']`, `['stockMovements']`, `['variants']`.
They do **not** invalidate `["inventory"]`, which is the key the inventory list, the low-stock page and
the inventory analytics all live under. Adjust stock on the movements page → the inventory page shows
the old quantity.

### B3 — `dashboard` and `reports` are invalidated by almost nothing

Both are pure derivations of sales, purchases, stock, and money. `queryKeys.dashboard.all()` appears
in no mutation's invalidation list; `REPORT_KEYS.all()` (`services/api/modules/reports/hooks.ts:9`)
is not exported into any mutation path at all. Every figure on both surfaces can be up to a minute
stale after the user themselves caused the change — with no focus-refetch to rescue it.

### B4 — switching location invalidates but does not evict, so the previous location's data flashes

`ui/components/LocationSwitcher.tsx:59` and `components/profile/change-default-location-dialog.tsx:58`
both call a bare `queryClient.invalidateQueries()` on location change.

`invalidateQueries` marks matching queries stale and refetches the **active** ones. **Inactive**
queries keep their cached data for the full `gcTime` (10 min), and when the user next navigates to
that page the query mounts, returns the cached row set **synchronously**, and refetches in the
background. The user sees the *previous location's* stock, sales, or purchase list render first, then
correct itself.

On a location-scoped ERP that is not a cosmetic glitch — it's showing one warehouse's quantities under
another warehouse's heading. See §3.4 for the fix (`clear()`, not `invalidateQueries()`).

### B5 — key registry is fragmented, so invalidation is string-matching by luck

Canonical registry: `services/api/query-keys.ts` (~25 domains).
`lib/query-keys.ts` is a deprecated re-export — and is still the import path used by live modules
(`services/api/modules/customers/hooks.ts:3`, `dashboard/hooks.ts:2`) while others import the
canonical path (`inventory/hooks.ts:4`). Both resolve to the same object, so this is cosmetic, but it
means "grep for the registry" gives two answers.

Eleven modules define private roots that are **not in the registry**:
`auth`, `campaigns`, `content-pages`, `coupons`, `domains`, `profile`, `reports`,
`storefront-catalog`, `storefront-customers`, `storefront-dashboard`, `storefront-orders`.

And pages inline raw strings that must happen to match those private roots:

| Literal | Where | Matches |
|---|---|---|
| `["coupons"]` | `app/(protected)/ecommerce/coupons/page.tsx:66` | `coupons/hooks.ts` ROOT |
| `["campaigns"]` | `app/(protected)/ecommerce/campaigns/page.tsx:63` | `campaigns/hooks.ts` ROOT |
| `["storefront-orders"]`, `["ecommerce-dashboard"]` | `app/(protected)/ecommerce/orders/page.tsx:176-177` | two private roots |
| `["locations", "storefront-options"]` | `app/(protected)/ecommerce/settings/page.tsx:157` | `queryKeys.locations` by prefix, accidentally |
| `["select-options", <url>]` | `use-select-options.ts:24`, `advanced-select.tsx:316`, `fuse-advanced-select.tsx:318` | invalidated by hand in `categories/hooks.ts:37`, `customers/hooks.ts:13` |
| `["accounts", "order-options"]` | `hooks/use-order-account-options.ts:18` | `queryKeys.accounts` by prefix, accidentally |
| `["inventory", "product", id]` | `components/products/product-detail.tsx:67` | `queryKeys.inventory` by prefix, accidentally |
| `["auth"]`, `["users", "me"]` | `profile/hooks.ts:49,71,97,210`, `users/hooks.ts:41,54-55` | each other, by convention only |

None of these are wrong *today*. All of them break silently the day someone renames a root, because
nothing connects the literal to the registry.

### C1 — dead invalidation: `['stockMovements']`

`stock/hooks.ts:83`, `:104`, `:123`. The real key is `["stock", "movements"]`
(`services/api/query-keys.ts:85`). `["stockMovements"]` is a prefix of nothing. Three no-ops.
They are harmless only because the sibling `['stock']` call happens to cover the same subtree.

### C2 — redundant `relatedQueryKeys`

`services/api/modules/customers/hooks.ts:13` and `discounts/hooks.ts:11` pass their own
`.all()` as a related key; the factory already invalidates it. Cosmetic, but it signals that the
mechanism isn't understood at the call sites.

### C3 — `docs/TANSTACK_QUERY_SETUP.md` is fiction

It documents `hooks/use-query-hooks.ts`, `useStocks`, `useStock(symbol)` and an
`useAddToPortfolio` mutation — a stock-*trading* boilerplate. None of it exists in this repo. It is
the only doc a newcomer would find by name, and it describes a different application.
(`docs/` is not exempt from `pnpm docs:verify`, but the verifier checks cited **paths**, and this file
cites its paths inside a fenced block, which is why it survived.)

---

## 3. Target design

Three changes. Each one closes one of the three complaints.

### 3.1 One registry — closes "doesn't cover the full project"

`services/api/query-keys.ts` becomes the only place a query key is constructed. Every private root
moves in; `lib/query-keys.ts` is deleted; page-level literals are replaced with registry calls.

Uniform shape for every resource, no exceptions:

```ts
<resource>: {
  all:     () => [<root>] as const,
  lists:   () => [...all(), "list"] as const,
  list:    (filters?: Record<string, unknown>) => [...lists(), filters ?? {}] as const,
  details: () => [...all(), "detail"] as const,
  detail:  (id: string) => [...details(), id] as const,
}
```
plus whatever sub-keys the resource genuinely needs (`summary`, `stats`, `ledger`, `bySlug`). The
invariant that makes invalidation work: **every key a resource owns starts with that resource's
`all()`**, so `invalidateQueries({ queryKey: r.all() })` is always a complete flush of that resource.

### 3.2 Invalidation declared as an effect graph — closes "wrong / not implemented"

The recurring failure is that each mutation author must know the *whole* dependency graph of the
system. They don't, and they can't be expected to. So invert it: a mutation declares **what it did**,
and one file owns **what that dirties**.

New file, `services/api/invalidation.ts`:

```ts
import type { QueryKey } from "@tanstack/react-query";
import { queryKeys as k } from "./query-keys";

/** Read models that are a pure derivation of everything else. Almost every write dirties these. */
const DERIVED: QueryKey[] = [k.dashboard.all(), k.reports.all()];

/**
 * Domain event → every key it dirties. A mutation names the event it causes; adding a new
 * consumer of some data means editing ONE entry here, not hunting every mutation that feeds it.
 */
export const EFFECTS = {
  "stock.moved":     [k.inventory.all(), k.stock.all(), k.variants.all(), k.products.all(), ...DERIVED],
  "money.moved":     [k.accounts.all(), k.transactions.all(), ...DERIVED],
  "sale.posted":     [k.salesOrders.all(), k.customers.all(), ...EFFECTS_MONEY, ...EFFECTS_STOCK],
  "purchase.received": [k.purchaseOrders.all(), k.suppliers.all(), /* … */],
  "order.confirmed": [k.storefrontOrders.all(), k.storefrontDashboard.all(), /* … */],
  // …
} satisfies Record<string, QueryKey[]>;

export type DomainEvent = keyof typeof EFFECTS;

export const invalidate = (qc: QueryClient, ...events: DomainEvent[]) =>
  Promise.all(
    [...new Set(events.flatMap((e) => EFFECTS[e]))].map((queryKey) =>
      qc.invalidateQueries({ queryKey }),
    ),
  );
```

Call sites become one line and stop encoding knowledge they don't have:

```ts
// services/api/modules/storefront-orders/hooks.ts
onSuccess: () => invalidate(qc, "order.confirmed"),
```

The event list is deliberately small and named after the **backend** state transitions, which are
already documented per domain in the backend skills (`sales-flow`, `purchase-flow`,
`inventory-stock`, `accounting-ledger`, `storefront-orders`). Starting list:

`stock.moved`, `money.moved`, `sale.posted`, `sale.returned`, `purchase.ordered`,
`purchase.received`, `purchase.returned`, `order.placed`, `order.confirmed`, `order.fulfilled`,
`order.returned`, `catalog.changed` (product/category/brand/unit/tax/discount master data),
`party.changed` (customer/supplier), `org.changed` (settings, features, locations, users).

Composition (`"sale.posted"` including the effects of `money.moved` and `stock.moved`) keeps it
honest: a sale really does move both.

**Why not just `queryClient.invalidateQueries()` with no key on every mutation?** It works, and it is
tempting given `staleTime: 60_000` limits the refetch storm. Rejected: it refetches every mounted
query in the app on every keystroke-level mutation, including the expensive report and dashboard
aggregates, on a product whose users are on Bangladeshi mobile connections. `auth/hooks.ts:26,75`
already does this for signup/login, where a full flush is correct.

### 3.3 Select options are rooted under their resource — closes A4 permanently

**Rule: a dropdown's cache key must start with the key of the resource it lists.** Then the resource's
own mutations already flush it, by prefix, with no URL knowledge anywhere.

```ts
// services/api/modules/use-select-options.ts
["select-options", url]                       // before — projection is the identity
[...queryKeys.brands.all(), "options", url]   // after  — resource is the identity, url only disambiguates
```

`createResourceHooks` already invalidates `queryKeys.brands.all()` on every brand mutation. Rooting
the options under it means **every projection of brands, present and future, refreshes for free.**
Every hand-enumerated URL literal in `relatedQueryKeys` gets deleted — eight modules, ~20 lines.

Call sites do not change. The root is derived inside the hook from the URL's resource path:

```ts
/** URL path → the registry root that owns that data. */
const OPTION_ROOTS: Record<string, () => QueryKey> = {
  "sales/customers": queryKeys.customers.all,
  accounts:   queryKeys.accounts.all,
  brands:     queryKeys.brands.all,
  categories: queryKeys.categories.all,
  discounts:  queryKeys.discounts.all,
  locations:  queryKeys.locations.all,
  products:   queryKeys.products.all,
  roles:      queryKeys.roles.all,
  suppliers:  queryKeys.suppliers.all,
  taxes:      queryKeys.taxes.all,
  units:      queryKeys.units.all,
};
```

An unmapped path falls back to `["select-options", url]` **and warns in dev**. That inverts today's
failure mode: an unregistered endpoint becomes loud at the moment it's added, instead of silently
never refreshing.

Two follow-ons:

- `quickAddConfig` swaps `optionsApiPath: string` for `resource: keyof typeof OPTION_ROOTS`, and
  `advanced-select.tsx` / `fuse-advanced-select.tsx` invalidate that root. Kills the `""` entry.
- Drop the hook's 5-minute `staleTime` to the app default (1 min). It exists to make dropdowns feel
  cheap; once invalidation is reliable it's just a longer window to be wrong in.

**Why not key by `(resource, params)` and drop the URL entirely?** That's the cleaner endpoint —
form configs would name a resource instead of hand-writing `?all=true&fields=…`. It also means
touching ~20 form-config files. Do §3.3 first (one file, no call-site churn); treat the form-config
migration as an optional follow-up once the bug is dead.

> **Follow-up landed 2026-07-21.** `services/api/select-options.ts` now holds one
> `OPTION_SOURCES` table — `{ path, root }` per source — and both the URL builder
> (`selectOptions("brands", { fields })`) and the cache-root lookup read from it. All ~40
> hand-written option URLs across 20 files are gone, and the root is looked up rather than
> *inferred* from a path segment, so `OPTION_ROOTS` (the interim map described above) no longer
> exists. Five round-trip tests in the gate keep the table honest.
>
> One near-miss worth recording: collapsing the products and categories tax pickers onto a single
> shared constant would have dropped `isDefault` from the products projection and silently disabled
> its default-rate prefill. Projections are not interchangeable just because the resource is.

### 3.4 Location switch evicts, it does not invalidate — closes B4

```ts
// ui/components/LocationSwitcher.tsx, components/profile/change-default-location-dialog.tsx
await queryClient.invalidateQueries();   // before — inactive queries keep the old location's rows
queryClient.clear();                     // after  — nothing survives the switch
```

The active location is **session state, not a query argument** — it rides on the auth context, not in
any URL the hooks build. So the alternative (thread `activeLocationId` into every key factory and
every call site) touches everything and buys only the ability to cache two locations at once, which is
a footgun on location-scoped data and a benefit users would never notice: they switch rarely.

Evicting is the standard treatment for a tenant/scope switch, and here it is also strictly safer:
`clear()` cannot flash the wrong warehouse's numbers, and `invalidateQueries()` demonstrably can.
Same reasoning applies to org switch and logout — audit those in the same pass.

### 3.5 Enforcement — closes "it happens again next month"

Nothing above survives contact with the next feature unless a gate holds it:

1. **ESLint** — `no-restricted-syntax` on an array-literal `queryKey:` / `invalidateQueries({queryKey: […]})`
   whose first element is a string literal. Message: *"query keys come from `services/api/query-keys.ts`"*.
2. **Unit test** — `services/api/__tests__/invalidation.test.ts`: every exported `use*` hook in
   `services/api/modules/**/hooks.ts` that calls `useMutation` must either call `invalidate(...)` or
   appear in an explicit `READ_ONLY_MUTATIONS` allowlist with a reason. Current legitimate members:
   `useEmailCustomerStatement`, `useEmailSaleReceipt`, `useOrderFraudScore`, `useCourierPrice`,
   `useTestCourier`, `useCourierStores`, `useCourierPackages` — mutations used for their response,
   not their effect.
3. **Test** — every `EFFECTS` value is non-empty and every key in it is reachable from `queryKeys`.
4. **Warn-level local rules** (`eslint-rules/query-cache.mjs`) for the judgement calls that can't be
   hard-banned, because each is usually wrong and occasionally right:
   - `no-blanket-invalidate` — argument-less `invalidateQueries()`. Three sites are legitimately
     "everything" (signup, login, demo-data wipe); each now carries a one-line written justification,
     which is the point of a warning rather than an error.
   - `no-cross-resource-invalidate` — a handler that hand-lists **two different** resources' keys.
     Own-root plus own-detail stays quiet (same root), so it flags exactly the re-derived-graph habit.
   - `no-raw-shopper-logout` — `useShopperStore().logout` outside the files that implement eviction.
   All three are zero-hit on the current tree and were verified to fire against a probe file.

---

## 4. Phases

> **Landed 2026-07-21.** All five phases are done; every checkbox below is ticked and the gates are
> green (`pnpm verify`, `pnpm lint`, `pnpm test` — 212 tests, of which 115 are the new invalidation
> gate). Three extra defects surfaced during the work and were fixed in place — see §8.


### P0 — one registry (no behaviour change)
- [x] Move the 11 private roots into `services/api/query-keys.ts`: `auth`, `campaigns`,
      `contentPages`, `coupons`, `domains`, `profile`, `reports`, `storefrontCatalog`,
      `storefrontCustomers`, `storefrontDashboard`, `storefrontOrders`. Keep each module's existing
      literal root string so no cache identity changes.
- [x] Add the registry entries the loose literals need: `accounts.orderOptions()`,
      `locations.storefrontOptions()`, `inventory.byProduct(id)`, `users.me()`, `storefrontOrders.courierWebhook()`.
      Add `<resource>.options(url)` to every resource that feeds a dropdown (§3.3) — **not** a
      top-level `selectOptions(url)`, which would repeat today's mistake in a new file.
- [x] Normalise every resource to the `all/lists/list/details/detail` shape from §3.1.
- [x] Replace all page-level and component-level key literals with registry calls (table in B5).
- [x] Delete `lib/query-keys.ts`; repoint its importers (`customers/hooks.ts`, `dashboard/hooks.ts`,
      and any other) at `services/api/query-keys.ts`.
- [x] Delete the dead `['stockMovements']` invalidations (C1) and the redundant `relatedQueryKeys` (C2).

Exit: `pnpm typecheck` green; `grep -rn 'queryKey: \["' app components ui hooks` returns nothing.

### P1 — fix the cache-identity bugs
- [x] `query-helpers.ts` `useList`: `queryKey: queryKeys.list(filters)`. Requires every resource's
      `list()` to accept an optional filters argument — done in P0. **This changes cache identity for
      13 modules**; verify each list page still paints (they mostly fetch through DataTable, so the
      blast radius is smaller than it looks).
- [x] `query-helpers.ts` `useStats`: give it its own `queryKeys.<r>.stats()` key (A2).
- [x] `stock/hooks.ts:55` `useInventoryHistory`: restore the real key — the correct call is already
      sitting commented on line 56 (A3).
- [x] Add `["inventory"]` to the stock mutations' invalidation set (B2) — superseded by P2, but land
      it here so the user-visible bug is fixed before the refactor.
- [x] **Select options (A4, §3.3)** — the highest-value item in this plan:
      - `use-select-options.ts`: add `OPTION_ROOTS`, key as `[...root(), "options", url]`, dev-warn on
        an unmapped path, drop `staleTime` to the default.
      - Delete every `["select-options", "<url>"]` literal from `relatedQueryKeys` in `brands`,
        `customers`, `discounts`, `inventory`, `products`, `suppliers`, `taxes`, `units`,
        `categories` — the resource root now covers them.
      - `quickAddConfig.ts`: `optionsApiPath: string` → `resource` key; update
        `advanced-select.tsx:316` and `fuse-advanced-select.tsx:318` to invalidate that root.
        Removes the dead `optionsApiPath: ""` on `discount`.
- [x] **Location switch (B4, §3.4)** — `LocationSwitcher.tsx:59` and
      `change-default-location-dialog.tsx:58`: `invalidateQueries()` → `clear()`. Audit org-switch and
      logout for the same pattern.

Exit: manual QA —
- two products' movement histories in sequence show different rows;
- adjusting stock on the movements page updates the inventory page;
- the purchase payment dialog always sees `balance`;
- **create an account → it appears in the sale payment dropdown immediately;**
- **create a product → it appears in the combo component picker immediately;**
- **switch location → no page renders the previous location's rows, even briefly.**

### P2 — the effect graph
- [x] Write `services/api/invalidation.ts` per §3.2.
- [x] Convert modules in dependency order, each a separate commit:
      stock/inventory → sales-orders → sales-returns → purchase-orders → purchase-returns →
      transactions/accounts → storefront-orders → storefront-catalog → the factory's
      `relatedQueryKeys` (which becomes an optional `events` option) → master data (categories,
      brands, units, taxes, discounts, products, variants) → org/profile/users/locations.
- [x] Delete the page-level compensation at `app/(protected)/ecommerce/orders/page.tsx:176-177` once
      `order.*` events carry it.

Exit: every admin-side mutation hook is one `invalidate(qc, …)` call or an allowlisted read-only
mutation.

### P3 — enforcement
- [x] ESLint rule (§3.5.1) in `eslint.config.mjs`.
- [x] `services/api/__tests__/invalidation.test.ts` (§3.5.2 + §3.5.3).
- [x] Rewrite `.claude/skills/api-module/SKILL.md` §"Cross-resource invalidation" — it currently
      teaches `relatedQueryKeys`, which P2 replaces. Its "recurring bug" table stays; the fix column
      changes.
- [x] Replace `docs/TANSTACK_QUERY_SETUP.md` (C3) with the real setup, or delete it and let the skill
      own the topic. Prefer deleting — one owner per subject.

### P4 — the shopper storefront (D3)
- [x] Audited `services/storefront/hooks.ts`. Found **S1** (below) — the most severe defect in the
      whole plan, because the stale data belongs to a *different person*.
- [x] **Decided: its own key space, not the `EFFECTS` graph.** The surface has a different session
      model (shopper token, not the staff JWT), a `slug` dimension no admin key carries, SSR-seeded
      `initialData`, and zero overlap — a shopper mutation cannot dirty an admin query. Folding it in
      would thread `slug` through a graph where nothing else needs it. It keeps the *invariant*
      (every key starts with its root) without sharing the registry.
- [x] Restructured the local `key()` helper into an exported `storefront` key factory, with
      everything private to the signed-in shopper under one `storefront.shopper(slug)` prefix.
- [x] `usePlaceOrder` / `useCancelShopperOrder` now invalidate that one prefix instead of listing
      `orders` and `order` separately (`"orders"` is not a prefix of `["order", n]`, so the pair was
      load-bearing and easy to get wrong).
- [x] Extended the invalidation gate to cover `services/storefront/hooks.ts`.

#### S1 — signing out left the previous shopper's orders in the cache

`useShopperStore.logout()` cleared the token and nothing else. But
`["storefront", <slug>, "orders"]` **carried no shopper identity** — only the store slug — so the
rows survived for the full `gcTime`. The next shopper to sign in on the same device hit
`useShopperOrders`, whose `enabled: !!token` had just flipped true, and the query returned the
*previous* shopper's order history — order numbers, delivery addresses, phone numbers — synchronously
from cache before its own fetch landed.

On a Bangladeshi storefront (shared phones, family devices, shop counters) this is not a theoretical
race. It is the same defect class as B4, one severity higher: B4 showed you the wrong warehouse, S1
shows you another customer.

Fixed by evicting on every session boundary, via one shared `clearShopperCache(qc, slug)`:

| Boundary | Where |
|---|---|
| logout | new `useShopperLogout(slug)` — the account sidebar now calls this, never the raw store action |
| login / register | `useShopperAuth`, before `setAuth` |
| session death (401) | `lib/storefront-client.ts` — the auto-logout path already existed, and had the same hole |

Public store data (products, categories, campaigns, pages) is deliberately **not** evicted: it is
identical for every visitor and SSR-seeded, so clearing it would only cause a flash.

---

## 5. Non-goals

- **Optimistic updates.** Not adopted anywhere today. Out of scope; the effect graph doesn't block it.
- **`setQueryData` surgical patching.** Invalidate-and-refetch is correct and cheap enough at this
  scale. Revisit only with a measured slow path.
- **Changing the global `staleTime`, or turning on `refetchOnWindowFocus`.** Focus-refetch would mask
  missing invalidations rather than fix them — it makes the class of bug *harder* to find. Leave it
  off until P2 lands, then reconsider on its own merits. (The one `staleTime` this plan *does* touch
  is `useSelectOptions`'s 5-minute override, which is dropped to the default in P1 — that is removing
  an outlier, not tuning the global.)
- **The backend.** No API change is needed for any of this.

## 6. Verification

`pnpm verify` (`verify:api-types` + `docs:verify` + `help:verify` + `typecheck`) after each phase, and
`pnpm lint` after P3. Manual QA scenarios, one per defect class, listed at each phase's Exit line.

**Final state, 2026-07-21:** `pnpm verify` ✓ · `pnpm lint` ✓ (0 errors, 0 warnings) · `pnpm test` ✓
(13 files, 212 tests) · `pnpm build` ✓.

## 7. Decisions

These were open when the plan was drafted. Each is resolved below, with the reasoning, so a later
reader doesn't relitigate them.

**D1 — `catalog.changed` stays coarse.** One event covering product / category / brand / unit / tax /
discount, rather than six.

Once §3.3 lands, a resource's *own* lists and dropdowns are flushed automatically by prefix — the
factory already invalidates `queryKeys.<r>.all()`. So `catalog.changed` is left carrying only the
genuine **cross**-resource effect: product and inventory rows that embed a category/brand/unit name or
a tax rate. That's two or three keys. Splitting it six ways would add six event names to buy one
avoided refetch of a list that is already on screen. Coarse is right here; revisit only if a profile
shows the products list refetching in a hot loop.

**D2 — do not put `activeLocationId` in the keys. Evict the cache on switch instead.** See §3.4.

The active location is session state carried on the `X-Active-Location` request header
(`lib/api-client.ts`), not an argument any hook builds into a URL. Threading it into every key factory
and every call site would touch the whole data layer to buy the ability to hold two locations' data at
once — which, on location-scoped inventory and sales, is a footgun rather than a feature, and which
users would never notice because they switch rarely. Evicting on scope change is the standard
treatment and is also strictly safer: `clear()` cannot flash the wrong warehouse's numbers, and the
current `invalidateQueries()` demonstrably can (B4). **This also settles the concern about deciding
before P0 freezes key shapes — nothing about location enters the key shapes at all.**

**D3 — the shopper storefront gets its own pass, after P3.** `services/storefront/hooks.ts`
(15 mutations, 3 invalidations) is a different app surface with a different key space and a different
session model (shopper, not user). Folding it into P2 would double the review surface of every commit
for no shared code. It is not being ignored — cart and checkout mutations are the risk there — it is
being sequenced. Track it as P4.

**D4 — select options are part of this plan, not a follow-up.** They were absent from the first draft
and are, on the evidence in A4, the single largest source of the reported symptom: **every form's
dropdowns are cached under a key nobody can reliably invalidate, and each new form silently adds
another one.** §3.3 is scheduled in P1 rather than deferred.

---

## 8. What changed once the work started

Two defects were not in the audit. Both were found by building the fix, not by reading the code — which
is the argument for the gates in §3.5.

### C4 — `["auth"]` was invalidated five times and queried zero times

`profile/hooks.ts` (×4) and `users/hooks.ts` (×1) invalidated `["auth"]` after changing the profile,
the password, 2FA, or the default location — to "refresh the session". But `useMe`
(`services/api/modules/auth/hooks.ts`) is a **`useMutation`**, not a query: the session is refreshed by
the protected layout calling `.mutate()`, and nothing in the cache is ever keyed `["auth"]`. Five
no-ops that read as coverage. Deleted; the same handlers now fire `org.changed`, which does reach the
profile and org queries.

### The `queryKey: any[]` prop was what forced the spread workaround

Fourteen pages wrote `queryKey: [...queryKeys.products.all()]`. The spread was not style — `DataTable`
and `DataCard` typed the prop as the mutable `any[]`, and a registry key is a `readonly` tuple, so
passing it directly was a type error (`TS4104`). Every page had quietly worked around the prop's type.
Retyping both props as TanStack's own `QueryKey` removed all fourteen spreads and let the ESLint rule in
§3.5 be written without carve-outs.

### S1 — the shopper cache outlived the shopper

Found in P4, written up there. Worth repeating here because it is the one defect in this document
where the stale data belongs to **a different person**, not a different page.

### Deviations from the plan as written

- **`storefront-collections` and `storefront-courier-webhook` were re-rooted.** Both were top-level
  roots that broke §3.1's invariant. Collections now sit under `storefront-catalog`; the courier keys
  moved to their own `couriers` resource (courier *config* is a sibling of orders, not part of an
  order).
- **`docs/TANSTACK_QUERY_SETUP.md` was deleted in P0, not P3.** Once `lib/query-keys.ts` was gone the
  doc cited a file that no longer existed, so it could not wait.
- **`org.changed` absorbed the organization/profile/user mutations wholesale**, including `DERIVED`.
  Coarse on purpose: `invalidateQueries` only *refetches* mounted queries, and nobody is watching the
  dashboard while editing settings — the rest are just marked stale.
- **CI now runs `pnpm test`.** The step existed, commented out, in
  `.github/workflows/pr-lint-build-check.yml`. A gate nobody runs is not a gate.
- **P4 kept its own key space** rather than joining `EFFECTS` — the reasoning is in the P4 checklist,
  and it is the answer to D3.
