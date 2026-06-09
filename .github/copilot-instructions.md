# EasyStock Frontend — Copilot Instructions

## Stack

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js (App Router, Turbopack) | 16 |
| UI | React | 19 |
| Language | TypeScript | 5.9 |
| Server state | TanStack Query | 5 |
| Client state | Zustand (with persist middleware) | 5 |
| Forms | React Hook Form + Zod + `@hookform/resolvers` | 7 / 4 / 5 |
| Styling | Tailwind CSS | 4 |
| UI primitives | Radix UI + shadcn-style (`components/ui/`) | latest |
| Tables | TanStack Table | 8 |
| Icons | lucide-react | — |
| Toast | sonner | — |
| Charts | recharts | — |
| Command palette | kbar | — |
| Date | date-fns + date-fns-tz | — |
| Fuzzy search | Fuse.js | — |
| Theme | next-themes | — |
| Package manager | **pnpm** | — |

## Scripts

```bash
pnpm dev              # next dev --turbopack
pnpm build            # next build
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint . --max-warnings=-1
pnpm lint:fix         # eslint . --fix
pnpm test             # vitest run
pnpm test:watch       # vitest (watch mode)
pnpm test:coverage    # vitest run --coverage
```

## Path aliases (tsconfig.json)

```
@/*                → ./*
@ui/*              → ./ui/*
@/services/api/*   → ./services/api/*
@repo/shared-types → types/index.ts
```

## Folder structure

```
app/
  (auth)/              → login, register, forgot-password
  (protected)/         → authenticated routes (one folder per resource)
  landing/
components/
  <resource>/          → feature components (table, form, dialogs)
  shared/              → reusable cross-feature components (column-settings, truncated-text, values-popover)
  ui/                  → shadcn primitives — DO NOT edit without good reason
  layout/              → sidebar, header, breadcrumbs
services/
  api/
    modules/<resource>/  → api.ts (raw fetchers) + hooks.ts (TanStack Query) + index.ts
    modules/query-helpers.ts → createResourceHooks factory
    query-keys.ts        → CENTRAL key factory — always use it
    utils.ts             → buildQueryParams, BaseFilters
  stores/              → Zustand stores (use-*-store.ts)
hooks/                 → reusable React hooks (use-dynamic-form.ts, etc.)
lib/                   → framework-agnostic helpers (api-client.ts, error-handling.ts, utils.ts)
types/                 → shared TS types and DTOs (index.ts)
config/                → quickAddConfig.ts (creatable select modules)
constants/             → navItem.ts, organization-options.ts
docs/                  → DYNAMIC_FORM.md, SCHEMA_GENERATION.md, TANSTACK_QUERY_SETUP.md, etc.
tests/                 → setup.ts, mocks/, test files
```

## Environment variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_DOMAIN=eazystock.com
NEXT_PUBLIC_SUBDOMAIN_ENABLED=false
```

---

## API layer

### HTTP client (`lib/api-client.ts`)

Singleton `apiClient` class. Every request:
1. Reads `token` and `activeLocationId` from Zustand auth store.
2. Sets `Authorization: Bearer {token}` and `X-Active-Location: {locationId}` headers.
3. On **401** → clears auth state, redirects to login (prevents infinite loops).
4. Handles `FormData` payloads (skips JSON `Content-Type`).
5. Throws `ApiError` with `{ message, status, data }`.

### API modules (`services/api/modules/<resource>/`)

Every resource gets two files:

**`api.ts`** — raw fetchers using `apiClient`:
```ts
export const productsApi = {
  getAll:  (filters) => apiClient.get(`/products${buildQueryParams(filters)}`),
  getById: (id)      => apiClient.get(`/products/${id}`),
  create:  (data)    => apiClient.post("/products", data),
  update:  (id, data)=> apiClient.put(`/products/${id}`, data),
  delete:  (id)      => apiClient.delete(`/products/${id}`),
}
```

**`hooks.ts`** — TanStack Query hooks via factory:
```ts
const hooks = createResourceHooks<Product, CreateProductDto>(productsApi, queryKeys.products)
export const useProducts      = hooks.useList
export const useProduct       = hooks.useDetail
export const useCreateProduct = hooks.useCreate
export const useUpdateProduct = hooks.useUpdate
export const useDeleteProduct = hooks.useDelete
```

### `createResourceHooks` factory (`services/api/modules/query-helpers.ts`)

Returns: `useList`, `useDetail`, `useBySlug`, `useCreate`, `useUpdate`, `useDelete`, `useBulkDelete`, `useStats`.
- **Select/unwrap**: Each hook uses `.select: (data) => data.data` to unwrap the envelope.
- **Mutations**: Auto-invalidate `all` + `detail` + related keys on success; auto-toast `data.message`.
- **Stale time**: Default 10 minutes, overridable per resource.

### Query keys (`services/api/query-keys.ts`)

Hierarchical factory — never inline keys:
```ts
queryKeys.products.all()           // ["products"]
queryKeys.products.list(filters)   // ["products", "list", filters]
queryKeys.products.detail(id)      // ["products", "detail", id]
```

### Response envelope

Backend always returns `{ success, data, message, meta? }`.
- `ApiResponse<T>` type: `{ success: boolean, data: T, message: string }`
- `PaginatedResponse<T>`: `{ items: T[], total, page, limit, totalPages }`
- Unwrap via the factory's `.select` — never read `res.data.data` in components.

### Error handling (`lib/error-handling.ts`)

- `isApiError(error)` — type guard
- `getErrorMessage(error)` — extract human-readable message
- `handleMutationError(error)` — shows toast
- `shouldRetryError(error)` — retries 5xx + network errors, not 4xx (except 408, 429)

---

## Forms — DynamicForm system

> **Full docs**: `docs/DYNAMIC_FORM.md`, `docs/SCHEMA_GENERATION.md`

### Hook: `useDynamicForm(config, defaultValues?)`

Returns `{ form, schema, config, defaultValues }`.
- Auto-generates Zod schema from field configs via `generateSchemaFromConfig()`.
- Validation mode: `onTouched` + reValidation `onChange`.
- Always provide `defaultValues` to avoid uncontrolled→controlled warnings.

### Field types

`input | textarea | select | fuseSelect | radio-group | checkbox | switch | file-upload | date | number | custom | custom-fields | password`

### Key field config properties

| Property | Purpose |
|----------|---------|
| `name` | Form field path (supports dot-notation for nested) |
| `type` | One of the field types above |
| `required` | Marks field required in generated schema |
| `validation` | `{ min, max, minLength, maxLength, pattern, email, url, custom }` |
| `options` / `optionsApi` | Static or API-driven select options |
| `dependsOn` | Field dependency with conditions (`eq, ne, truthy, falsy, in, notIn`) and actions (`show, hide, enable, disable`) |
| `creatable` + `quickAddModule` | Inline quick-add modal (registered in `config/quickAddConfig.ts`) |
| `autoFillFields` / `copyValueTo` | Auto-populate other fields from selected option |
| `columnSpan` | Grid layout (1–12 columns) |
| `suffix` / `prefix` / `helperText` | Can be string or `(values) => string` for dynamic display |

### Form config structure

```ts
const formConfig: DynamicFormConfig = {
  sections: [
    { title: "Basic Info", fields: [...] },
    { title: "Pricing",    fields: [...] },
  ],
  layout: { maxColumns: 12 },
}
```

Define config **outside** components for stable reference.

---

## State management

### Zustand stores (`services/stores/`)

For **ephemeral/UI state only**: sell page cart, stock transfer, column settings, auth.

**Auth store** (`use-auth-store.ts`):
- State: `user`, `token`, `isAuthenticated`, `activeLocationId`
- `User` includes `role` (`super_admin | admin | manager | staff | viewer`), `permissions[]`, `organization` (with `settings`, `features`, `currency`, `timezone`)
- Actions: `setUser()`, `clearAuth()`, `setActiveLocation()`, `hydrateAuth()`
- Persisted to cookies (`auth-token`, `active-location`) via `cookies-next`
- Components read auth via `useAuthStore` selectors — never read cookies directly.

**Rule**: NEVER mirror server data in Zustand — use TanStack Query cache.

---

## Types (`types/index.ts`)

### Base types
- `BaseEntity`: `{ _id, createdAt, updatedAt }`
- All resource types extend `BaseEntity`

### Key enums
- `ProductStatus`: `active | inactive | archived`
- `StockMovementType`: `in | out | adjustment | transfer`
- `StockMovementReason`: `purchase | sale | return | damage | lost | adjustment | transfer_in | transfer_out`
- `OrganizationFeatures`: `sales | accounts | expiryTracking | barcodeSystem | invoicePrinting | returns | uomConversion`

### DTO convention
- `CreateXxxDto` / `UpdateXxxDto` for every resource

---

## UI / UX conventions

- Every **list page** must handle: loading skeleton, empty state, error state, pagination.
- Every **form** must handle: inline validation errors, submit loading (`mutation.isPending`), success toast (`sonner`), close-on-success.
- Reuse `components/shared/` first; promote to shared if a pattern repeats in 2+ resources.
- **Tailwind only** — no inline styles. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Dark mode**: use semantic tokens (`bg-background`, `text-foreground`), not raw colors.
- **Accessibility**: labels on every input, `aria-*` on interactive elements, keyboard nav for dialogs/menus (Radix handles most).

---

## Code conventions

- **Filenames**: kebab-case. **Components**: PascalCase exports.
- Named exports preferred. Default exports only for `page.tsx` / `layout.tsx`.
- No `any`. Prefer `unknown` + narrowing or generics.
- Server components by default; add `"use client"` only when needed (state, effects, browser APIs).
- Co-locate component-specific types; shared types go in `types/`.
- ESLint v9 flat config with Next.js core web vitals.

---

## Multi-tenancy

- Active organization + location come from auth store. Backend enforces — FE just sends auth header + `X-Active-Location`.
- When switching location, **invalidate ALL** location-scoped queries (inventory, sales, purchases, stock movements, dashboard).
- Subdomain system docs: `docs/ORGANIZATION_SLUG_SYSTEM.md`

---

## Testing

- **Unit/integration**: Vitest + React Testing Library + `@testing-library/jest-dom`
- **E2E**: Playwright for critical flows (login, create sale, stock transfer)
- **API mocking**: MSW — handlers in `tests/mocks/`
- **Config**: `vitest.config.ts` — jsdom environment, globals enabled, setup in `tests/setup.ts`
- **Coverage**: form validation, list rendering (loading/empty/error), mutation success + error toast

---

## When asked to "add a new resource"

1. Create `services/api/modules/<resource>/api.ts` — raw fetchers.
2. Create `services/api/modules/<resource>/hooks.ts` — use `createResourceHooks` factory.
3. Add query keys to `services/api/query-keys.ts`.
4. Add types/DTOs to `types/index.ts`.
5. Create `components/<resource>/` — table, form config, dialogs.
6. Create `app/(protected)/<resource>/page.tsx`.
7. Add nav item to `constants/navItem.ts`.

## When asked to "audit a resource"

1. Read `app/(protected)/<resource>/`, `components/<resource>/`, `services/api/modules/<resource>/`.
2. List every field consumed from API responses (grep usage of the response type).
3. Cross-reference backend `<resource>.service.ts` / model.
4. Produce a table: `field | used in component | recommendation (keep / remove from BE / lazy-load)`.
5. Wait for approval before changing types or removing fields.

## When asked to "add tests"

1. Create test file next to the component or in `__tests__/`.
2. Use MSW handler for API mocking (`tests/mocks/`).
3. Required coverage: form validation, list rendering (loading/empty/error), mutation success + error toast.

---

## Existing documentation

Reference these before duplicating content:
- `docs/DYNAMIC_FORM.md` — complete DynamicForm guide
- `docs/SCHEMA_GENERATION.md` — auto-schema generation from form config
- `docs/TANSTACK_QUERY_SETUP.md` — query client config, optimistic updates, cache management
- `docs/ORGANIZATION_SLUG_SYSTEM.md` — multi-tenant subdomain system
- `docs/PARALLEL_ROUTES_PATTERN.md` — Next.js intercepting routes for quick-add modals

---

## Things NOT to do

- Don't call `fetch` directly in components — use a TanStack Query hook.
- Don't inline query keys — use `queryKeys` from the central factory.
- Don't store server data in Zustand — use TanStack Query cache.
- Don't bypass the response envelope unwrap (`.select: (d) => d.data`).
- Don't add shadcn components by hand — use `pnpm dlx shadcn@latest add ...`.
- Don't change the API envelope structure — backend contract is fixed.
- Don't read cookies directly for auth — use `useAuthStore` selectors.
- Don't define form configs inside components — define them outside for stable references.
- Don't write manual Zod schemas for DynamicForm — use `generateSchemaFromConfig`.

---

## ⚠️ Sales-flow maintenance discipline (MANDATORY)

The Sale → Sales Return → Payment → Customer Ledger → Customer Credit Balance flow is documented as a skill: [`.github/skills/sales-flow/SKILL.md`](./skills/sales-flow/SKILL.md). The backend has a mirror at `easystock-backend/.github/skills/sales-flow/SKILL.md`.

**Before touching ANY of these files**, read the sales-flow skill first:
- `app/(protected)/sales/**`, `app/(protected)/customers/**`
- `components/sales/**`, `components/customers/**`, `components/shared/returns/**`
- `services/api/modules/{sales,sales-returns,customers,payments}/**`
- `types/index.ts` (Sale / SalesReturn / Customer / Payment / RefundAllocation / CustomerLedger)

**After any change** to those files you MUST, in the same commit/PR:
1. Update `.github/skills/sales-flow/SKILL.md` (file map, display contract, allocation, UX, pitfalls — whichever applies).
2. Update `easystock-backend/.github/skills/sales-flow/SKILL.md` if the contract crosses the wire.
3. Never let the skill drift from the code. Either both move or neither moves.

---

## ⚠️ Purchase-flow maintenance discipline (MANDATORY)

The PurchaseOrder → Purchase Return → Payment → Supplier Ledger → Supplier Credit Balance flow is documented as a skill: [`.github/skills/purchase-flow/SKILL.md`](./skills/purchase-flow/SKILL.md). The backend has a mirror at `easystock-backend/.github/skills/purchase-flow/SKILL.md`.

Money flow is the **inverse** of sales-flow (we pay supplier; supplier may refund us).

**Before touching ANY of these files**, read the purchase-flow skill first:
- `app/(protected)/purchases/**`, `app/(protected)/suppliers/**`
- `components/purchases/**`, `components/suppliers/**`
- `services/api/modules/{purchase-orders,purchase-returns,suppliers,payments}/**`
- `types/index.ts` (PurchaseOrder / PurchaseReturn / Supplier / Payment / PurchaseRefundAllocation / SupplierLedgerEntry)

**After any change** to those files you MUST, in the same commit/PR:
1. Update `.github/skills/purchase-flow/SKILL.md`.
2. Update `easystock-backend/.github/skills/purchase-flow/SKILL.md` if the contract crosses the wire.
3. Never let the skill drift from the code.
