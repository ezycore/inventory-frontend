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

### Type-check & lint (ask first)
- Do **not** run type-check or lint automatically. Ask the user for permission first. If granted, run
  `pnpm typecheck` and `pnpm lint`. If declined, skip and proceed.

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

### Tax (UI) conventions

The tax module is optional and per-line. Keep these single sources — never re-derive tax inline:

- **Gate** every tax surface with `isTaxActive(org, "sales" | "purchase")` (`lib/feature-utils.ts`).
  When inactive: hide tax UI/columns and neutralize tax in previews.
- **Math** only through `utils/tax.ts`: `computeOrderTax` (cart rollups → `addedTax`/`includedTax`/
  `taxTotal`/`grandTotal`), `computeLineTax` (one line), `splitLineTax` (added-vs-included from a posted
  doc's stored line snapshot, for detail/receipt views).
- **Presentation** via shared components: `<TaxSummaryLines>` (`components/shared/tax-summary-lines.tsx`)
  for the "Tax (added) / Total / Includes … in price" summary; `<LineTaxCell>`
  (`components/shared/line-tax-cell.tsx`) for the cart per-line Tax column.
- Backend is authoritative; FE numbers are previews and must match `applyLineTaxes` exactly.
