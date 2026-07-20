# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working agreement (mandatory)

Applies to **every file you touch**. The repo is brought to this standard **incrementally,
file-by-file as touched** (via the marker below) — never mass-rewrite the repo in one sweep.

### Coding standard on touch
- Before editing any source file, look at its first line. If it is the marker
  `// coding-standard: maintained`, the file already conforms — skip the standard review and just make
  your change.
- If the marker is absent, review the file against this repo's coding standard (naming, structure,
  imports, idioms, comment density, no dead code / stray logs). If it does **not** conform, STOP and ask
  the user for permission to rewrite it to standard — preserving **identical functionality, behavior, and
  design/output**. Never rewrite without explicit approval.
- Once the file conforms (after your change, or after an approved rewrite), add
  `// coding-standard: maintained` as the file's first line — immediately after a leading `"use client";`
  directive if present — so future edits skip the review.

### File size & single responsibility
- One file = one clear responsibility — don't let a file grow into a god-file.
- A source file past **~400 lines** (or a React component past **~250**) is a smell: split it —
  helpers → `utils/`, hooks → `hooks/`, sub-components → their own files, data/query glue → the
  resource module. Split by concern; each piece must stand alone and be testable.

### Reusability without over-engineering
- Before writing non-trivial logic or markup, search for an existing home first: `utils/*`, `lib/*`,
  `hooks/*`, shared components in `components/shared/`, `ui/components/`. Reuse it — do not re-implement.
- **No duplicate code:** if the same logic/JSX would exist in **2+ files**, extract **one** shared
  util/hook/component and import it everywhere. Never copy-paste. (Tax single sources: see "Tax (UI) conventions".)
- **Make a component** whenever UI is used in more than one place — never copy markup between files.
- **But don't over-engineer:** prefer the simplest thing that removes the duplication — no premature
  abstraction, generics, or indirection for a single use site. Abstract on the *second* use, not the first.
- When you add a shared util/component, record it where the next change will look (the relevant skill
  doc and/or the matching CLAUDE.md section) so it gets reused, not re-duplicated.

### Docs on touch (mandatory)
A change that makes a doc wrong is an **unfinished change** — the doc update ships in the *same* commit,
never as a follow-up. Before calling any task done, ask: *does a doc now describe something that is no
longer true?*

- **Grep before you finish.** For every UI label, route, command, script, env var, filename or exported
  symbol you renamed/moved/removed, grep `docs/` and `.claude/skills/` for it and fix every hit.
- **Where to look, by what you changed:**
  | Changed | Check |
  |---|---|
  | A route, or `constants/navItem.ts` | `docs/help/en/*.md` `covers_routes` + `docs/help/BACKLOG.md` |
  | A user-facing label in `messages/**` | `ui_labels` in `docs/help/en/*.md` (a rename **breaks the build** on every page quoting it) |
  | Nav / layout / an entry point | `docs/help/README.md`, this file's "Customer help docs" + "Route Structure" |
  | A shared util/component/pattern | The matching `.claude/skills/*/SKILL.md` **and** this file's section for it |
  | An API module or response type | `docs/` API notes; regenerate with `pnpm gen:api-types` |
- **Bangla too.** Editing `messages/en/*.json` means editing `messages/bn/*.json` in the same commit —
  use `docs/I18N-GLOSSARY.md` for the term, don't invent one. Same for `docs/help/en/` ↔ `docs/help/bn/`.
- **Stale docs you pass through:** if you find a doc that is wrong *near* what you touched, fix it if the
  truth is verifiable in the code; otherwise flag it to the user. Don't silently leave a known lie.
- **Never hand-edit** `lib/help/content.generated.ts` — edit `docs/help/**` and run `pnpm help:build`.

### Verification commands (ask first)
- Do **not** run these automatically. Ask the user for permission first; if declined, skip and proceed.
- `pnpm typecheck` and `pnpm lint` — after any source change.
- `pnpm help:build` — after editing `docs/help/**` (regenerates `lib/help/content.generated.ts`;
  `predev`/`prebuild` run it too, but the generated file must be committed).
- `pnpm docs:verify` — after editing any `docs/**` or skill doc. Catches dead file refs, broken relative
  `.md` links, phantom `/api/…` routes.
- `pnpm help:verify` — after editing `docs/help/**`, `messages/**`, or `constants/navItem.ts`. The
  freshness gate: stale `ui_labels`, phantom `covers_routes`, sidebar routes no page covers.
- `pnpm verify` — all of the above except lint (`verify:api-types` + `docs:verify` + `help:verify` +
  `typecheck`). Prefer this one when the change spans code **and** docs.

## Pre-launch: there are no production users yet

**As of 2026-07-20 the product has no live customers and no production data.** Every organization in
any database is seed, demo, or test data.

So a breaking change is cheap — prefer the clean shape over a compatibility shim:

- Renaming a route, a message key, or a persisted field needs **no migration and no dual-read
  window**. Wipe and reseed instead.
- Don't build backwards-compatibility for data nobody has.

Unchanged by this: the API contract gates (`pnpm verify`), the help-docs freshness gate
(`pnpm help:verify` still fails on a renamed `ui_labels` string), and the backend's invariants —
posted documents stay immutable by design, not for the sake of old rows.

**Delete this section the day the first real customer signs up.** Mirrors the same section in
`easystock-backend/CLAUDE.md`.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint (no warnings allowed)
pnpm lint:fix     # ESLint with auto-fix
pnpm typecheck    # TypeScript type check (tsc --noEmit)
pnpm test         # Run tests once (Vitest)
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage

# Docs & contract gates — see "Docs on touch" above
pnpm help:build       # Regenerate lib/help/content.generated.ts from docs/help/** (also predev/prebuild)
pnpm help:verify      # Help freshness gate: stale ui_labels, phantom covers_routes, uncovered routes
pnpm docs:verify      # Dead file refs, broken .md links, phantom /api/… routes in docs/ + skills
pnpm gen:api-types    # Regenerate types/api-generated.ts from the backend OpenAPI spec
pnpm verify:api-types # Fail if committed api-generated.ts drifted from the backend spec
pnpm verify           # verify:api-types + docs:verify + help:verify + typecheck
```

Run a single test file:
```bash
pnpm test path/to/file.test.ts
```

## Architecture

This is a **Next.js 16 App Router** application for an inventory management SaaS. The stack is: React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS v4, Radix UI, React Hook Form + Zod, and Sonner for toasts.

### Route Structure

- `app/(auth)/` — Public auth pages (login, signup, forgot-password, etc.)
- `app/(protected)/` — All authenticated pages; guarded by `app/(protected)/layout.tsx`

The protected layout (`app/(protected)/layout.tsx`) verifies the session via `useMe()` and checks subscription status on every mount. If the subscription is inactive it forces logout to `/login?subscription=inactive`.

### State Management

**Auth** is in a Zustand store (`services/stores/use-auth-store.ts`) persisted to `localStorage` as `easystock-auth`. The store also syncs the JWT to a cookie (`auth-token`) and the active location to another cookie (`active-location`) so the Next.js middleware can read them server-side.

**Active Location** (`activeLocationId`) flows from the auth store into every API request via the `X-Active-Location` header in `lib/api-client.ts`. Switching location calls `setActiveLocation` on the auth store.

**Server state** uses TanStack Query. The singleton client is in `lib/react-query.ts` (staleTime 1 min, gcTime 10 min, no refetch on window focus, no retry on 4xx except 408/429).

### API Layer

All HTTP calls go through the `ApiClient` singleton (`lib/api-client.ts`). It automatically:
- Attaches `Authorization: Bearer <token>` from the auth store
- Attaches `X-Active-Location` header
- Redirects to `/login` and clears auth on 401

API modules live under `services/api/modules/<resource>/` with two files each:
- `api.ts` — plain object with methods calling `apiClient`
- `hooks.ts` — TanStack Query hooks, usually built via `createResourceHooks()` from `services/api/modules/query-helpers.ts`

Everything is barrel-exported from `services/api/index.ts`.

Query keys are centrally defined in `services/api/query-keys.ts` (re-exported from `lib/query-keys.ts` for backwards compatibility).

### API response types are generated from the backend (single source of truth)

Response shapes are **not** hand-written — they are generated from the backend's OpenAPI spec, which is
itself emitted from the backend's tested response DTOs. So a field only has a frontend type if the
backend really sends it, and a rename/removal on the backend becomes a **compile error** here instead of
a silent `undefined`.

- `types/api-generated.ts` — generated, **do not edit**. Regenerate with `pnpm gen:api-types` (reads
  `../easystock-backend/docs/reference/openapi.json`).
- `types/api.ts` — the only place that maps a backend schema to a friendly name (`Api`-prefixed where it
  would clash with a hand-written type, e.g. `ApiInventory`, `ApiVariant`). **Import response types from
  `@/types/api`**, never reach into `api-generated` directly.
- In an `api.ts` module, type the response envelope with the generated type
  (`Promise<ApiResponse<ProductDetail>>`, `Promise<ApiResponse<PaginatedResponse<ProductListItem>>>`).
  The `createResourceHooks` factory is generic-preserving, so the type flows through to the hook and out
  to components — a component reading a field the backend doesn't send then fails to compile.
- Keep `any` only where the data is genuinely dynamic or the endpoint has **no backend DTO yet** (a few
  are marked with `TODO(backend)` comments); prefer fixing the backend DTO over hand-typing.

**Workflow when the backend response contract changes:** run `pnpm gen:api-types`, then `pnpm typecheck`
and fix whatever breaks (that is the drift surfacing), then commit the regenerated `api-generated.ts`.

**The gate:** `pnpm verify:api-types` regenerates into a temp file and fails if it differs from the
committed `types/api-generated.ts` — i.e. it catches "backend contract changed but the frontend types
weren't regenerated." `pnpm verify` runs that plus `pnpm docs:verify` plus `typecheck`. Wire
`pnpm verify` into CI/pre-commit.

### Docs must match the code (`pnpm docs:verify`)

`scripts/verify-docs.mjs` (ported from the backend's `scripts/docs/verify-docs.ts`) fails the build when
a doc/skill lies about the code — a dead file reference (`src/…`, `components/…`), a broken relative
`.md` link, a phantom `/api/…` route the backend router does not serve, or something declared absent that
now exists. It reads the backend's generated `docs/reference/endpoints.json` for the known-route set and
resolves backend `src/…` citations against the `easystock-backend` repo checked out beside this one;
when a sibling repo is absent it skips those checks rather than failing. Bare paths that resolve nowhere
are advisory (never a failure) — they are genuinely ambiguous. `docs/archive/**` and `docs/plan/**` are
exempt.

### Skills are paired, one per repo, non-duplicating

Skills live in `.claude/skills/<name>/SKILL.md` — Claude Code discovers them there (they were moved
out of `.github/skills/`, Copilot's location, since the project uses Claude now).
Each frontend skill that has a real backend half **links to the backend skill and does not restate it** —
e.g. `api-module` → backend `api-contract`, `rbac-auth`/`inventory-stock`/`accounting-ledger`/
`reporting-analytics`/`import-export` → their same-named backend counterparts, `storefront` →
backend `storefront-orders`/`promotions-coupons`/`custom-domains`. The API contract is written once (the
backend DTOs) and generated twice — never documented in both repos. `docs:verify` checks those
cross-repo links resolve.

### Adding a New Resource Module

1. Create `services/api/modules/<resource>/api.ts` with a plain object using `apiClient`
2. Create `services/api/modules/<resource>/hooks.ts` using `createResourceHooks()` from `../query-helpers`
3. Add query keys to `services/api/query-keys.ts`
4. Export both from `services/api/index.ts`

If the resource supports CSV import, spread `createImportApi("/<resource>")`
(`services/api/modules/import-api.ts`) into the api object — it provides
`importPreview`/`importCommit` with optional column-mapping support (the shared
`ImportDialog` + `ColumnMapper` in `components/shared/import/` drive the flow).

### UI Components

Shadcn/Radix-based primitives live in `ui/components/`. Feature-specific components are in `components/<feature>/`. Shared/cross-feature components are in `components/shared/`.

**Permission display** — helpers for `resource.action` permission strings (grouping, action icons, category colors) plus the `PermissionGroupCard` category card live in `components/shared/permissions/`. Used by the profile Permissions tab and Settings → Roles; reuse these instead of re-deriving category colors or action icons.

The `useCrudModal` hook (`hooks/use-crud-handlers.ts`) is the standard pattern for CRUD pages — it manages modal open state, edit/view/add modes, and delegates delete/bulkDelete to caller-provided async functions.

**Hydration-safe client state:** components that read persisted zustand stores (auth/cart), `window`,
or the current time/locale must gate on `useHydrated()` (`hooks/use-hydrated.ts`) so the first client
render matches the SSR HTML — never hand-roll `useSyncExternalStore` or `typeof window` initializers.

**Discount display:** campaign/coupon discount values render via `<DiscountCell>`
(`components/ecommerce/discount-cell.tsx`) — `10%` for percentage, org-currency for fixed amounts.

**Printed documents (one engine):** every printout (sales invoice/receipt, PO, return, payment receipt,
statement, AND storefront/ecommerce order invoices) renders through `utils/print-documents.ts`, whose
letterhead is the org's `receiptSettings` (Settings → Receipt & Print) via `orgToPrintHeader`. Order
invoices use the adapter `utils/print-storefront-order.ts`: admin orders pages print via
`<OrderInvoicePrintButton>` (`components/ecommerce/order-invoice-print.tsx`, a `PrintMenu` wrapper —
paper sizes, popup toast, `invoicePrinting` gate; one page per order in bulk), and the shopper route
(`/shop/account/orders/[n]/invoice`) shows the composed document in a WYSIWYG iframe (letterhead comes
from the public store payload's `printable` block). Never hand-roll invoice markup or a raw
`window.print()` — add an adapter to the engine instead.

**Storefront CMS page bodies** render through `lib/storefront-markdown.ts` (dependency-free subset
parser → block model, XSS-safe by construction) + `<MarkdownView>` (`components/storefront/markdown-view.tsx`);
consecutive `Q:`/`A:` lines become styled FAQ cards. Extend the parser — never dump raw page text or add
a markdown dependency without checking here first.

The parser is now shared with the **customer help docs**, so it is no longer storefront-only despite the
filename. Two renderers consume it and both must handle every block kind, or new syntax silently vanishes
on one surface: `<MarkdownView>` (storefront — inline styles against storefront CSS vars, so an owner's
themed shop stays consistent) and `<HelpMarkdown>` (`components/help/help-markdown.tsx`, admin — Tailwind +
shadcn tokens). They are deliberately separate: a themeable single renderer would thread a class map
through every block for two callers whose styling primitives have nothing in common. Tables are recognised
only by a `|---|---|` delimiter row — owner prose contains stray pipes far more often than tables.

### Customer help docs (`docs/help/`)

End-user guides for shop owners, reachable two ways — the header's "?" (`<HelpSheet>`), which opens the
guide for the **current route** via each page's `covers_routes` frontmatter, and the sidebar user menu's
**Help** item (`components/layout/app-sidebar.tsx`), which routes to `/help` for browsing all topics.
Keep both: contextual help and a browsable index answer different questions, and `/help` has no other
entry point. Content is Markdown in `docs/help/en/`,
baked into `lib/help/content.generated.ts` by `pnpm help:build` (`predev`/`prebuild`) because `docs/` is not
in the Docker image — a runtime read would work in dev and 404 in production.

`pnpm help:verify` (in `pnpm verify` and the PR workflow) is the freshness gate: each page lists the
message keys behind the UI text it quotes (`ui_labels`), and the gate fails when a key's current English
value no longer appears in the page — i.e. **renaming a button breaks the build on every page quoting it**.
It also fails on a sidebar route that no page covers and `docs/help/BACKLOG.md` does not defer. Write pages
with the `help-docs` skill. Its one blind spot: a backend change that alters what a number *means* with no
frontend diff (valuation method, tax rules) — check the reports pages by hand.

**Tables — pick by use site, never hand-roll raw `Table*` primitives:**
- **`DataTable`** (`ui/components/dataTable`) for full list pages — needs pagination, search/toolbar, column adapter, row selection, delete dialog.
- **`SimpleTable`** (`ui/components/simple-table.tsx`) for the small tables embedded in cards / detail panels. Column-driven: `<SimpleTable columns rows getRowKey />`, where each `SimpleColumn` has `header`, `cell: (row) => node`, optional `align`/`headClassName`/`cellClassName`; plus `rowClassName`/`headerRowClassName` for per-row styling. Cells can hold inputs/checkboxes, so lightly interactive grids fit too (see `variant-manager.tsx`).
- Only drop to the raw `ui/components/table` primitives inside `SimpleTable` itself.

**Form inputs — use the shared primitives, never re-implement:** these carry the project's validation, empty-state, accessibility, and UX contracts. Reach for them before writing any new input, and before creating a new input abstraction.
- **`NumberField`** (`ui/components/number-field.tsx`) for **every** numeric input — never a raw `<input type="number">`. Contract: `value: number | null`, `onChange: (number | null) => void`; empty → `null`; clamps `min`/`max` on blur; `precision` rounds (money `2`, qty/counts `0`, generic/UOM `undefined`); `showSteppers` for +/- buttons. Do **not** default `precision` in generic/config-driven renderers.
- **`DatePicker`** (`ui/components/date-picker.tsx`) for **every** single date input. Props: `date?: Date | string`, `onSelect: (string | undefined) => void`. Default output is timezone-safe `yyyy-MM-dd` (never native ISO — avoids the BDT/UTC+ off-by-one); pass `outputFormat` only for datetime. Restrict selectable days with `fromDate`/`toDate`/`disabledDates`.
- **`DateRangePicker`** (`ui/components/date-range-picker.tsx`) for date **range** selection (`value: DateRange`, `onChange`). For a from/to pair backed by two separate string states, two `DatePicker`s with cross-bounds (`toDate`/`fromDate`) is the established pattern (see `report-period-filter.tsx`, `dashboard/period-filter.tsx`).
- **Do not add native `type="date"` / `type="number"` inputs** unless there's a documented technical reason. The repo currently has **zero** native date/number inputs — keep it that way. If you must add one, put a comment saying why.
- **Never introduce a duplicate date/number input implementation.** Extend the shared primitive (add a prop) instead of forking it. New forms follow this shared-field pattern for consistency, validation, accessibility, and UX.

### Navigation labels are translated, the constants are not

`constants/navItem.ts` keeps **English titles as identity** — they are the message-key source
(`navLabelKey`), the filter/permission keys and the kbar search keywords. They are never display
strings.

Everything that renders a nav title goes through **`useNavLabels().itemLabel(title)`**
(`hooks/use-nav-labels.ts`), which maps the title to `layout.nav.items.<kebab-title>` and falls back
to the English title when the key is missing. Sidebar, kbar and **breadcrumbs** all use it.

Two consequences:

- **Renaming a nav title renames its message key.** "Tax Settings" → "VAT" moves the lookup from
  `items.tax-settings` to `items.vat`, so the `layout.json` key must be renamed in **both locales** in
  the same commit — otherwise the fallback quietly serves English and nothing fails.
- **Breadcrumbs used to render `navItem.title` raw**, so the whole trail stayed English in every
  locale (fixed 2026-07-20). If you add a crumb source, translate it the same way.

### Feature Flags & Subscription

`OrganizationFeatures` (defined in `types/index.ts`) controls which modules are enabled per organization. Helper functions in `lib/feature-utils.ts` (`isFeatureEnabled`, `areAllFeaturesEnabled`) check feature state from `user.organization.features` in the auth store.

Subscription/billing enforcement lives in `lib/subscription-utils.ts`. `classifyEntitlementAccess()` returns `active | read_only | blocked` (mirrors the backend `entitlementAccess` — keep in sync); the protected layout uses `shouldBlockWorkspaceAccess()` to force-logout only `blocked` orgs, and the overdue banner uses `isPaymentOverdue()` (`read_only`) to show "Pay now".

### Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `./*` (project root) |
| `@ui/*` | `./ui/*` |
| `@/services/api` | `./services/api` |
| `@repo/shared-types` | `./types/index.ts` |

### Testing

Tests use Vitest + Testing Library + MSW for API mocking. Setup is in `tests/setup.ts`; MSW server is in `tests/mocks/`. Test files go alongside source files as `*.test.ts(x)` or inside `__tests__/` folders.

The `NEXT_PUBLIC_API_URL` env var sets the backend base URL (defaults to `http://localhost:5000/api`).

### VAT (UI) conventions

The VAT module is optional and per-line. **Operating manual: [`.claude/skills/vat/SKILL.md`](.claude/skills/vat/SKILL.md).**
Keep these single sources — never re-derive VAT inline:

- **Gate** every VAT surface with `isVatActive(org)` (`lib/feature-utils.ts`). When inactive: hide
  VAT UI/columns and neutralize VAT in previews.
  - There is **no per-area argument** any more. It replaced `isTaxActive(org, "sales" | "purchase")`:
    VAT registration is a property of the organization, so sales and purchases share one answer.
  - `isVatActive` mirrors the backend `resolveOrgVat(...).chargesLineVat`, including that
    **`turnover_4` is false** — a turnover taxpayer issues invoices with no VAT line at all.
  - `claimsInputRebate(org)` is the *separate* question (only `standard_15`). Charging VAT and
    reclaiming it are not the same thing; conflating them is what made the VAT report wrong.
  - `vatRegistrationOf(org)` carries a **temporary** bridge: feature ON + no declared history ⇒
    `standard_15`. The backend has the identical branch — delete both together once onboarding
    forces the choice.
- **Math** only through `utils/tax.ts`: `computeOrderTax` (cart rollups → `addedTax`/`includedTax`/
  `taxTotal`/`grandTotal`), `computeLineTax` (one line), `splitLineTax` (added-vs-included from a posted
  doc's stored line snapshot, for detail/receipt views).
- **Presentation** via shared components: `<TaxSummaryLines>` (`components/shared/tax-summary-lines.tsx`)
  for the "Tax (added) / Total / Includes … in price" summary; `<LineTaxCell>`
  (`components/shared/line-tax-cell.tsx`) for the cart per-line Tax column.
- Backend is authoritative; FE numbers are previews and must match `applyLineTaxes` exactly.
- **The contract lives in the backend:** `easystock-backend/docs/features/vat.md` — the tax math,
  the worked examples, and the sales/purchase/return rules. It used to be `docs/TAX_BACKEND_CONTRACT.md`
  in *this* repo, still saying "backend pending" long after the backend shipped it; it moved because
  8 of its 9 sections describe backend behavior. **If you change `utils/tax.ts`, change
  `SaleUtils.applyLineTaxes` identically** — both sides now have tests
  (`utils/tax.test.ts` here, `src/services/__tests__/tax-contract.test.ts` there).
