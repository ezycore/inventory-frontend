# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Sibling repos:** one of several under `easeventory/` (`inventory-backend`, `inventory-frontend`, `inventory-landing`, `mission-control`). For the repo map, aliases, and the cross-repo contracts that connect them, see the workspace-root [`../CLAUDE.md`](../CLAUDE.md).
>
> **Cross-repo master reference:** `mission-control/docs/EZYCORE_MASTER_REFERENCE.md` — the full cross-product reference (data model, features, API surface, permissions, MC/billing, pricing, marketing guardrails) across all five repos. **Update it in the same PR** whenever your change shifts a count or fact it documents — a new admin page, storefront route, feature toggle, or sidebar/permission change.

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

## LIVE: this product has real customers

**Launched 1 September 2026.** Real merchants use this app to run their shops every day. Anything
that ships here reaches them on their next page load.

This repo carried the opposite instruction until 2026-09-10 ("there are no production users yet —
renaming needs no migration, wipe and reseed"). **That is now inverted.**

- **A rename is a migration.** A route, a message key, or a persisted field (anything in
  `localStorage`, a saved filter, a stored preference) has live values behind it. Ship the new shape
  alongside the old and read both, or leave every current user on a broken screen.
- **Never wipe or reseed a database to fix something.** If that looks like the answer, stop and ask
  which cluster.
- **A broken build is a closed shop.** There is no window where a regression only costs the team
  time; a merchant is mid-sale.
- **Merchant-visible copy is customer-facing.** A wrong Bangla string or a mislabelled money field is
  seen by someone billing a customer with it.

Two consequences specific to this repo, both easy to miss because they don't fail a build:

- **The storefront is somebody's shopfront.** A broken checkout, a mispriced product or a 500 on
  `app/(storefront)` is now a real lost sale for a real merchant, not a demo glitch. Weight
  storefront regressions accordingly.
- **A persisted client-side key is production state too.** `localStorage` keys (cart, draft sale,
  filters) survive a deploy on a shopper's or a merchant's device — renaming one silently drops
  whatever it held. That was free while every user was us.

Unchanged: the API contract gates (`pnpm verify`), the help-docs freshness gate (`pnpm help:verify`
still fails on a renamed `ui_labels` string), and the backend's invariants — posted documents stay
immutable by design, and now for old rows' sake too.

Mirrors the same section in `inventory-backend/CLAUDE.md`.

## Commands

**Node 22 LTS (`.nvmrc`) — `nvm use` before anything else.** Next 16 targets 20.9+/22 LTS. A dev
server on Node 25 (a non-LTS *Current* release, so a newer V8 with different GC behaviour) was seen
climbing to a **3.9 GB heap and dying** with `Ineffective mark-compacts near heap limit` after ~26
minutes, having already tripped Next's own "approaching the used memory threshold, restarting"
guard. That restart is also what produces a `ChunkLoadError` in an open tab: the recompile emits new
content-hashed chunk names and the tab is still asking for the old ones (the overlay says
**"(stale)"** when this is what happened — reloading fixes it, which is how you tell it apart from a
real module error). `.nvmrc` is advisory, not enforced; there is deliberately no `engines` field,
which would fail installs rather than warn.

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint — errors fail the run; warnings do not (--max-warnings=-1)
pnpm lint:fix     # ESLint with auto-fix
pnpm typecheck    # TypeScript type check (tsc --noEmit)
pnpm test         # Run tests once (Vitest)
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage

# Pixel diff for moving a store onto the Storefront Builder (tests/pixel, output in .pixel/)
PIXEL_STORE=<slug> pnpm pixel:capture   # screenshot the store's pages before a change
PIXEL_STORE=<slug> pnpm pixel:compare   # fail on any page that no longer matches

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

## Infra env templates (mandatory)

**A new `NEXT_PUBLIC_*` is not done until four files agree.** Every env var this app reads is
`NEXT_PUBLIC_*`, which means it is **baked into the image at BUILD time** — the running container
reads nothing. So a var added here and nowhere else is not "missing in prod", it is *permanently
empty in prod*, and no server-side env edit can fix it: it needs a rebuild.

The four that move together, in the same change:

| File | Role |
|---|---|
| `.env.example` (this repo) | local dev + the documented meaning of each var |
| `Dockerfile` | `ARG X` + `ENV X=$X` — without this the build never sees it |
| `.github/workflows/deploy.yml` | `build-args:` — the per-branch value (main → prod, else staging) |
| [`easystock-infra/templates/frontend.env.example`](../easystock-infra/templates/frontend.env.example) | the deploy registry: runtime `NODE_ENV` only, plus these listed as build-time-only |

Rules:

- **Never add a runtime var to the infra template expecting it to work.** `env_file: ./.env.frontend`
  is loaded, but Next has already inlined `NEXT_PUBLIC_*` into the bundle at build time — editing it
  on the server changes nothing. If you genuinely need a runtime value, it has to be fetched from the
  API, not read from `process.env`.
- **The Dockerfile `ARG` and the workflow `build-arg` are separate steps.** Declaring the `ARG`
  without passing the `build-arg` produces a silently empty value in every image —
  `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP` is in that state today (intentionally: self-serve domains resolve
  dynamically via `/api/public/store-by-host`).
- **`NEXT_PUBLIC_ROOT_DOMAIN` and `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` must be equal** — the second
  parses store slugs against the first's subdomains, and a mismatch breaks storefront host resolution.
- **No secrets, ever.** `NEXT_PUBLIC_*` is shipped to the browser by definition.
- **The audit command**, when you suspect drift:
  ```bash
  grep -rhoE 'process\.env\.[A-Z0-9_]+' --include='*.ts' --include='*.tsx' . \
    --exclude-dir=node_modules --exclude-dir=.next | sort -u
  ```

## Architecture

This is a **Next.js 16 App Router** application for an inventory management SaaS. The stack is: React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS v4, Radix UI, React Hook Form + Zod, and Sonner for toasts.

### Route Structure

- `app/(auth)/` — Public auth pages (login, signup, forgot-password, etc.)
- `app/(protected)/` — All authenticated pages; guarded by `ProtectedShell` (`components/layout/protected-shell.tsx`)
- `app/(storefront)/` — The public shop

**There is no `app/layout.tsx` — the app has two root layouts.** `(auth)` and `(protected)` each render
`AdminRootLayout` (`components/layout/admin-root-layout.tsx`: `<html>`, fonts, `globals.css`, next-intl,
the workspace gate, the admin providers); `app/(storefront)/layout.tsx` renders the shop's own `<html>`
with its own Tailwind build (`storefront-base.css`). Split on 2026-09-14 because one shared root cost
every shopper the admin's 312 KB render-blocking stylesheet, and because a root layout that reads
`headers()`/`cookies()` makes every route beneath it dynamic. **Never import `globals.css` or read the
request in the storefront root layout.** Moving between the two trees is a full page load.

The protected shell (`components/layout/protected-shell.tsx`, rendered by the server `app/(protected)/layout.tsx`) verifies the session via `useMe()` and checks subscription status on every mount. If the subscription is inactive it forces logout to `/login?subscription=inactive`.

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

**Query cache — read [`.claude/skills/query-cache/SKILL.md`](.claude/skills/query-cache/SKILL.md)
before adding any `useQuery`, `useMutation`, or query key.** Three files own the subject and there is
no fourth: `services/api/query-keys.ts` (every key), `services/api/invalidation.ts` (what each domain
event dirties), `services/api/select-options.ts` (every `<select>` endpoint + its cache root). The
invariant: **every key a resource owns starts with its `all()`**, so one
`invalidateQueries({ queryKey: queryKeys.<r>.all() })` flushes the whole resource — lists, details,
stats and dropdowns. Never inline a key array; never hand-list another resource's keys in a mutation
(declare an event instead).

Enforcement is deliberately two-tier (`eslint.config.mjs`), and only the hard tier can fail a build:

- **Hard — errors.** Inlining a key array is `no-restricted-syntax`, so `pnpm lint` rejects it. The
  mutation-coverage test `services/api/__tests__/invalidation.test.ts` is the other hard gate.
- **Soft — warnings.** The `query-cache/*` rules (`no-blanket-invalidate`, `no-cross-resource-invalidate`,
  `no-raw-shopper-logout`) are `warn` on purpose: each is usually wrong and occasionally right, so they
  ask for an `eslint-disable-next-line` **with a reason** rather than refusing. Since `pnpm lint` runs
  `--max-warnings=-1`, these **do not** fail lint or CI — a violation is a message, not a gate. Read
  them; don't assume a green lint means none fired.

Background: `docs/plan/query-invalidation.md`.

### API response types are generated from the backend (single source of truth)

Response shapes are **not** hand-written — they are generated from the backend's OpenAPI spec, which is
itself emitted from the backend's tested response DTOs. So a field only has a frontend type if the
backend really sends it, and a rename/removal on the backend becomes a **compile error** here instead of
a silent `undefined`.

- `types/api-generated.ts` — generated, **do not edit**. Regenerate with `pnpm gen:api-types` (reads
  `../inventory-backend/docs/reference/openapi.json`).
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
resolves backend `src/…` citations against the `inventory-backend` repo checked out beside this one;
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

The same rule applies **within** this repo: `query-cache` owns keys/invalidation/option caching, and
`api-module` links to it rather than restating it. If two skills would say the same thing, one of them
is wrong soon.

### Adding a New Resource Module

1. Create `services/api/modules/<resource>/api.ts` with a plain object using `apiClient`
2. Create `services/api/modules/<resource>/hooks.ts` using `createResourceHooks()` from `../query-helpers`
3. Add query keys to `services/api/query-keys.ts` (`resourceKeys(root)`) and declare what its
   mutations dirty — see the [`query-cache`](.claude/skills/query-cache/SKILL.md) skill
4. Export both from `services/api/index.ts`

If the resource supports CSV import, spread `createImportApi("/<resource>")`
(`services/api/modules/import-api.ts`) into the api object — it provides
`importPreview`/`importCommit` with optional column-mapping support (the shared
`ImportDialog` + `ColumnMapper` in `components/shared/import/` drive the flow).

### UI Components

Shadcn/Radix-based primitives live in `ui/components/`. Feature-specific components are in `components/<feature>/`. Shared/cross-feature components are in `components/shared/`.

**Permission display** — helpers for `resource.action` permission strings (grouping, action icons, category colors) plus the `PermissionGroupCard` category card live in `components/shared/permissions/`. Used by the profile Permissions tab and Settings → Roles; reuse these instead of re-deriving category colors or action icons.

**Masked fields** — every password *and* every secret shown as dots (API keys, courier credentials)
uses a component that carries its own reveal toggle, so a user can verify what they typed. There are
two, one per design system, and no third: `Password` (`ui/components/input-password.tsx`) for the
admin app (shadcn `Input`, labels from `common.actions.{showPassword,hidePassword}`), and
`SfPasswordInput` (`components/storefront/sf-password-input.tsx`) for the shopper side (inline
`sfInput` skin, labels from the storefront dictionary). Never hand-roll
`type={show ? "text" : "password"}` again — that pattern had been pasted into the profile
password tab three times and left every other field with no toggle at all.

The `useCrudModal` hook (`hooks/use-crud-handlers.ts`) is the standard pattern for CRUD pages — it manages modal open state, edit/view/add modes, and delegates delete/bulkDelete to caller-provided async functions.

**Hydration-safe client state:** components that read persisted zustand stores (auth/cart), `window`,
or the current time/locale must gate on `useHydrated()` (`hooks/use-hydrated.ts`) so the first client
render matches the SSR HTML — never hand-roll `useSyncExternalStore` or `typeof window` initializers.

**Browser tab (title + icon) is client-side, by necessity.** The organization lives in the persisted
auth store, which no server `generateMetadata` can read — so both are set imperatively from
`ProtectedShell` (`components/layout/protected-shell.tsx`): `useOrgFavicon()` (org **favicon** → tab icon, via `useFaviconOverride`) and
`useOrgDocumentTitle()` (`"<Page> · <Org>"`, e.g. `Products · ZeroDrop`). The page name is the **last
breadcrumb**, so it is already translated and already matches the sidebar label — renaming a nav item
renames the tab, and no page needs its own `metadata`. The storefront titles tabs separately via its
own `generateMetadata` (store name). **Do not add `export const metadata` with a title to a page
under `app/(protected)/`** — it can't see the org and will fight the hook.

**The favicon is `organization.favicon` and nothing else** — admin app, auth pages, storefront and
custom domains all read that one field, and it **never falls back to the org or store logo**. The two
are separate uploads (Settings → Organization) because they are separate jobs: a wordmark logo
cover-cropped to the 200×200 thumbnail renders in a tab as an unreadable middle slice, so an org with
no favicon gets the platform mark instead. Don't "helpfully" re-add a `favicon ?? logo` fallback in
`useOrgFavicon`, `StoreHead` (`components/storefront/store-head.tsx`) or `StoreShell` — it was removed on purpose. The **one** place the
two mix is the 20×20 brand mark in storefront email (backend `storefront-shopper.service`), where
`favicon ?? store.logo ?? org.logo` applies because no mark at all is worse than a cropped one.
The storefront reads a **pre-resolved** `store.favicon` — the backend `getStoreInfo` owns that
resolution, so nothing chains client-side.

Three wiring points that browser QA caught and nothing else can, so don't unpick them:

- **`useUpdateOrganization` must sync `favicon` into the auth store.** `useOrgFavicon` reads it
  straight off that store, so a field missing from that `updateUser` block lags a full reload.
- **`useUpdateOrganization` must call `revalidateStorefront()`.** The favicon is public storefront
  data, and the shop's SSR payload is cached under `store:{slug}` for 5 minutes — without the flush
  the merchant's change is invisible to shoppers until the window lapses.
- **`useFaviconOverride` resets to the default when `href` goes from set → absent**, gated on an
  `applied` ref. That ref is load-bearing: resetting whenever `href` is merely falsy would paint over
  the SSR-rendered storefront icon during hydration, which is the flash the hook exists to prevent.

Next owns the `<title>` tag, and that cuts three ways — every case below was found in a browser,
because none of them shows up in typecheck, lint, or tests:

- **Initial load:** Next renders its metadata `<title>` *during hydration*, i.e. after the hook's
  effect. A one-shot `document.title = …` is silently reverted by every fresh load and every
  refresh, while still looking correct after client-side navigation. `useOrgDocumentTitle` therefore
  re-asserts via a `MutationObserver` on `<head>` (equality-checked, so it can't loop).
- **Unmount:** the restore is equally load-bearing — every route resolves to the same root metadata,
  so on a client-side exit React sees no change and would never repaint over our value, stranding a
  workspace title on the login screen.
- **Navigation:** Next re-asserts root metadata on *every* client-side navigation, which flashed
  `BRAND.documentTitle` on every sidebar click before the hook could rewrite it. **The root layout
  therefore has no `title` at all** — same resolution as `metadata.icons`, and for the same reason.
  Each tree owns its own instead: `(auth)` via its own `metadata`, `(protected)` via a raw `<title>`
  in the layout JSX that React 19 hoists, the storefront via per-page `generateMetadata`. The
  protected one renders a **constant** — React only writes the DOM when a rendered value changes, so
  a constant is written once and then never fights the hook that rewrites its text. It must stay in
  *both* return branches: SSR renders the `!hydrated` one, so dropping it there leaves the server HTML
  titleless and the tab shows the raw URL until hydration.
  **Do not "simplify" this back into root `metadata.title`.** Reaching for a metadata title anywhere
  above `(protected)` reintroduces the flash, and nothing in typecheck, lint, or tests will catch it.

**Image upload fields:** a labelled upload tile (preview + upload/change/remove/cancel, staged until
the surrounding form's Save) is `<ImageUploadField>` (`components/shared/image-upload-field.tsx`)
over `useImageUploadField` (`hooks/use-image-upload-field.ts`), which owns the staged-file state and
the blob-URL lifecycle. Settings → Organization renders two of them (logo, favicon). **Never
hand-roll a file input + `URL.createObjectURL` preview** — the revoke is the part that gets dropped,
and the hook also carries the 5 MB cap and accepted MIME list that must match the backend's multer
`imageFilter`. (The storefront Customize editor's `MediaField` is a deliberate separate one: it
uploads immediately via its own media PATCH rather than staging for a form Save.)

**Image galleries (multi-image):** a gallery row — thumbnail, name, Primary badge, **replace**,
reorder arrows, delete — is `<GalleryItemRow>` + `describeGalleryEntry`
(`components/shared/gallery-item-row.tsx`), shared by the DynamicForm `file-upload` field
(`ui/components/form/field-file-input.tsx`), `<ImageGalleryUpload>`
(`components/shared/image-gallery-upload.tsx`) and the variant editor
(`components/products/variant-manager.tsx`). **Never copy a gallery row between them** — all three
held byte-identical markup until 2026-09-09. Gallery helpers (`buildImageOrder`, `galleryFiles`,
`moveGalleryEntry`, `replaceGalleryEntry`) live in `lib/image-gallery-order.ts`: the backend discards
the client's `images` on update and rebuilds the array itself, so a gallery's order survives **only**
if `imageOrder` is sent alongside the files, appended in the same order. Position 0 is the storefront
cover. **Replace owns its own file input** — routing it through the gallery's would add the file and
leave the old one — so it re-applies the accept/size checks via `lib/file-accept.ts`, shared with the
`FileUpload` primitive. Row labels are `common.gallery` (en + bn). Full rules, including the
cross-repo token grammar and the per-variant `upload:<n>` trap, in the `products` skill.

**Discount display:** campaign/coupon discount values render via `<DiscountCell>`
(`components/ecommerce/discount-cell.tsx`) — `10%` for percentage, org-currency for fixed amounts.

**Tag display:** a product's tags render via `<TagChips>` (`components/shared/tag-chips.tsx`) —
coloured outline chips with a `max` before collapsing to `+N` (2 in a table row, `Infinity` on a
detail page). **Never map `product.tags` to chips inline.** The colour goes on the border and text,
never as a fill: merchants pick arbitrary colours and half of them would make a filled chip
unreadable. Until 2026-08-07 the table had the only copy and the card view plus both detail panels
showed nothing, so switching views silently lost the tags.

**Category display:** a product's place in the taxonomy renders via `<CategoryPath>`
(`components/shared/category-path.tsx`) — `Personal Care › Skin Care`, with the child dimmed by
`opacity` so it inherits the caller's colour. **Never print `product.category?.name` on its own.**
The pair is denormalized (`categoryId` = the top-level category, `subcategoryId` = its child), so
reading only the first half renders cleanly and silently loses half the answer — that is exactly how
the products card view, the detail hero, the detail info card and the location stock report each
showed less than the table beside them (fixed 2026-08-07). Callers pass names, not objects, so a
report row with `categoryName`/`subcategoryName` strings uses it too.

**Printed documents (one engine):** every printout (sales invoice/receipt, PO, return, payment receipt,
statement, AND storefront/ecommerce order invoices) renders through `utils/print-documents.ts`, whose
letterhead is the org's `receiptSettings` (Settings → Receipt & Print) via `orgToPrintHeader`. Order
invoices use the adapter `utils/print-storefront-order.ts`: admin orders pages print via
`<OrderInvoicePrintButton>` (`components/ecommerce/order-invoice-print.tsx`, a `PrintMenu` wrapper —
paper sizes, popup toast, `invoicePrinting` gate; one page per order in bulk), and the shopper route
(`/shop/account/orders/[n]/invoice`) shows the composed document in a WYSIWYG iframe (letterhead comes
from the public store payload's `printable` block). Never hand-roll invoice markup or a raw
`window.print()` — add an adapter to the engine instead.

**Storefront CMS page bodies** render through `<ContentBodyView>` (`components/storefront/content-body-view.tsx`).
A body saved from the rich-text editor is TipTap JSON and renders with `<RichDocView>`
(`components/storefront/rich-doc-view.tsx`, parsed by `lib/storefront-rich-doc.ts`). Only a **legacy** body
that is not rich-doc JSON falls back to `lib/storefront-markdown.ts` (dependency-free subset parser → block
model, XSS-safe by construction) + `<MarkdownView>` (`components/storefront/markdown-view.tsx`), where
consecutive `Q:`/`A:` lines become styled FAQ cards. Never dump raw page text or add a markdown dependency
without checking here first.

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

**Copy to clipboard — always `copyText()` (`utils/clipboard.ts`), never `navigator.clipboard`
directly.** That API only exists in a **secure context** (HTTPS / `localhost` / `127.0.0.1`), so a
direct call is `undefined` and throws when the dev app is opened from a phone over LAN HTTP
(`http://192.168.x.x:3000`) — the helper falls back to a hidden-textarea `execCommand("copy")` there.
It **rejects** on failure, so keep your own try/catch and error toast: several call sites used to
fire-and-forget and toast success unconditionally, which claimed a copy that never happened (worst
on the 2FA backup codes).

**Tables — pick by use site, never hand-roll raw `Table*` primitives:**
- **`DataTable`** (`ui/components/dataTable`) for full list pages — needs pagination, search/toolbar, column adapter, row selection, delete dialog.
- **`SimpleTable`** (`ui/components/simple-table.tsx`) for the small tables embedded in cards / detail panels. Column-driven: `<SimpleTable columns rows getRowKey />`, where each `SimpleColumn` has `header`, `cell: (row) => node`, optional `align`/`headClassName`/`cellClassName`; plus `rowClassName`/`headerRowClassName` for per-row styling. Cells can hold inputs/checkboxes, so lightly interactive grids fit too (see `variant-manager.tsx`).
- Only drop to the raw `ui/components/table` primitives inside `SimpleTable` itself.
- **Paging UI is one component: `<PaginationControls>`** (`ui/components/pagination-controls.tsx`) —
  first/prev/numbered pages/next/last, over the pure `pageWindow()` in `utils/page-window.ts`. Both
  `DataTablePagination` and the ecommerce list pages' `ListPagination` render it, so every list in
  the app pages identically. A page that hand-rolls its own table still uses this footer; never ship
  a bare Previous/Next pair. (The storefront's `<Pager>` is the one deliberate exception — a
  separate design system, inline-styled against storefront CSS vars, with its own constant-width
  window and its own test.)

**Cross-field rules in a CRUD form** go through `operations.onFieldChange(fieldName,
value, allValues, form)` — wired by **both** DataTable and DataCard. The `form` argument is that
component's own `useForm` instance — the form is
created inside the component, so that is the only way a caller gets `setValue`. See
`components/products/use-category-vat-prefill.ts` (category → VAT rate). Do not fork the form or
duplicate the field elsewhere to work around it.

`operations` is ONE type (`Operations` in `types/DataTable.ts`), imported by `types/DataCard.ts`
rather than copied — a ViewToggle page hands the same object to both views, so a private copy
drifts. It did: DataCard's copy omitted `onFieldChange` and never bridged it, which silently
disabled every cross-field rule in card view (the products VAT prefill among them, since cards are
that page's default). Add a key to the shared type and wire it in **both** components.

**Form inputs — use the shared primitives, never re-implement:** these carry the project's validation, empty-state, accessibility, and UX contracts. Reach for them before writing any new input, and before creating a new input abstraction.
- **`NumberField`** (`ui/components/number-field.tsx`) for **every** numeric input — never a raw `<input type="number">`. Contract: `value: number | null`, `onChange: (number | null) => void`; empty → `null`; clamps `min`/`max` on blur; `precision` rounds (money `2`, qty/counts `0`, generic/UOM `undefined`); `showSteppers` for +/- buttons. Do **not** default `precision` in generic/config-driven renderers.
  - **The DynamicForm engine routes `type: "number"` here too** (`ui/components/form/field-number-input.tsx`; `input` and `number` share the affix chrome in `field-affix.tsx`). So a config-driven number field declares its own `precision` — see the table in `docs/DYNAMIC_FORM.md` → "Number fields". A cleared field submits `null`, and `generateSchemaFromConfig` preprocesses `null`/`""` → `undefined`, so optional numbers can be emptied and required ones say `"<Label> is required"`.
- **`DatePicker`** (`ui/components/date-picker.tsx`) for **every** single date input. Props: `date?: Date | string`, `onSelect: (string | undefined) => void`. Default output is timezone-safe `yyyy-MM-dd` (never native ISO — avoids the BDT/UTC+ off-by-one); pass `outputFormat` only for datetime. Restrict selectable days with `fromDate`/`toDate`/`disabledDates`.
- **`DateRangePicker`** (`ui/components/date-range-picker.tsx`) for date **range** selection (`value: DateRange`, `onChange`). For a from/to pair backed by two separate string states, two `DatePicker`s with cross-bounds (`toDate`/`fromDate`) is the established pattern — but do not hand-roll it for a date **range filter**: `components/shared/period-filter.tsx` already owns that, as `PeriodFilter` (pills, where the range is the page's primary control) and `PeriodSelect` (a dropdown, where it is one filter among several). It carries the cross-bounds, the preset vocabulary the server accepts, and the org-timezone default.
- **Do not add native `type="date"` / `type="number"` inputs** unless there's a documented technical reason. The repo has **zero** native date/number inputs as of 2026-07-25, when the DynamicForm engine — the last holdout, and the one feeding ~30 fields across products, purchases, sales, inventory, accounts, coupons and campaigns — was migrated to `NumberField`. If you must add one, put a comment saying why. (The storefront price-range filter in `components/storefront/filters/filter-rows.tsx` is *not* an exception: it is `type="text"` + `inputMode="numeric"` with a digit filter, kept hand-rolled because it is inline-styled against storefront CSS vars rather than shadcn tokens.)
- **Never introduce a duplicate date/number input implementation.** Extend the shared primitive (add a prop) instead of forking it. New forms follow this shared-field pattern for consistency, validation, accessibility, and UX.
- **Select fields — prefer `type: "select"` and let it choose the renderer.** In a DynamicForm config, `select` auto-picks between the plain `<AdvancedSelect>` (Radix dropdown) and the searchable `<FuseAdvancedSelect>` (Fuse.js combobox) via `shouldUseSearchableSelect()` (`ui/components/select-strategy.ts`): a **single-mode** field becomes searchable when it has an `optionsApi` **or** more than **10** static `options`; a short static enum stays a plain dropdown; **multiple-mode** stays `<AdvancedSelect>` (→ `<MultiSelect>`, already searchable inside its popover), so the heuristic skips it. **Filter-bar selects share the same helper** (`ui/components/filters/filter-field-renderer.tsx`), so a filter dropdown auto-upgrades to search on the same rule. Therefore **do not hand-pick `fuseSelect` for an `optionsApi` field** — `select` upgrades it automatically. Use `type: "fuseSelect"` **only to force** typeahead on a *short static* list the heuristic would leave plain. Full comparison: `docs/DYNAMIC_FORM.md` → "Select fields" and the `dynamic-form` skill.
- **Selects outside DynamicForm:** use **`SimpleSelect`** (`ui/components/simple-select.tsx`) for a plain `options` array in a dialog, table cell, or filter bar; drop to the base **`Select`** (`ui/components/select.tsx`) only when you need custom per-row markup (icons, separators, `SelectGroup`). **Never import `MultiSelect`** (`ui/components/multi-select.tsx`) directly — reach it through `<AdvancedSelect>` / `select` with `mode: "multiple"`.
  - A `SimpleSelectOption` may carry a **`description`** — one line under the label, *inside the dropdown only*; the trigger keeps showing the label alone. That is what makes a select viable for a choice whose five or six options each need explaining, and it is why such a choice does not need a hand-rolled popover.
- **Picking a control for a "choose one of these" setting** — there are four, and the wrong one is what makes an editor panel three screens tall. Match the control to the *kind* of question:
  | The question is | Control | Where |
  |---|---|---|
  | An **ordinal ramp**, 2–4 steps ("how big / how tight / how round") | **`SegmentedField`** | `ui/components/segmented-field.tsx` |
  | A **colour or material** ("which ground / which palette") | **`SwatchField`** | `ui/components/swatch-field.tsx` |
  | A **list of 5+ named things** that each need a sentence | **`SimpleSelect`** with `description` | `ui/components/simple-select.tsx` |
  | **Spatial / structural** ("which layout") — a sketch is the only honest answer | **`OptionCard`** with `media` | `ui/components/option-card.tsx` |

  All four share one rule: **a description that repeats what the control already shows is height with no information in it.** `SegmentedField`, `SwatchField` and `TemplatePicker` therefore render the sentence *once, under the control, for the selected option only* (their `caption` prop, on by default) rather than under every tile — a per-tile description in a 3-up grid inside the 380px Customize rail is read at ~95px and wraps to four lines. The storefront Customize editor is the reference implementation; see the `storefront` skill.
- **Grouping controls inside one panel:** `PartBlock` (`components/ecommerce/customize/part-group.tsx`) is one slot per question and costs `py-4`; **`PartField`** is the compact sibling for several settings sharing a slot. Six settings as six `PartBlock`s spend 192px on block padding before drawing a single control. An on/off setting is a **`PartSwitch`** row (same file) — never another hand-rolled label + `Switch`.

### Permission guards and plan ceilings (shared hooks)

Two hooks own questions that were previously answered inline on every page that asked them, and both
were wrong in the same direction — acting on an answer that had not arrived yet.

- **`useRequireAccess(requirements[])`** (`hooks/use-require-access.ts`) — redirect off a screen the
  signed-in user may not use. Five settings pages each carried their own
  `if (user && !canManage) { toast; push("/") }`, and **a truthy `user` does not mean `permissions`
  has arrived**: any render with a session but no permission list read as "signed in, allowed
  nothing" and threw the merchant to the dashboard with a false message (QA-R21). The hook acts only
  when the session is staying *and* `permissions` is an actual array — **absent is not empty**, and
  only empty is grounds to act. Requirements are checked in order, first failure wins, so
  "no permission" and "feature off" never race two toasts to the same screen.
- **`usePlanLimit(key)`** (`hooks/use-plan-limit.ts`) — where the workspace stands against a plan
  ceiling (`locations`, `users`, `inventory`, `salesToday`, `purchasesToday`), with the same alias
  list the backend enforces (`utils/plan-limits.ts`). Show the count **before** it bites: a merchant
  at 3 of 3 locations used to see an enabled Add button, fill the form in and get a 403, with no
  count on screen and nothing linking to the upgrade (QA-R11). Returns `known: false` — never
  `atLimit: true` — when the count cannot be read: the usage endpoint needs `organization.view`, and
  blocking a merchant who has room is worse than the bug.
- **`useStorageLimit()`** (same file) — the `storageGb` ceiling, which is deliberately **not** in
  `usePlanLimit`'s alias map: it is the one limit whose usage is bytes rather than a count of things,
  and "3 of 5 locations" and "1.6 of 2 GB" do not share a shape. Returns `usedBytes`/`limitBytes`/
  `ratio` plus `atLimit` **and `nearLimit`** — storage is the one cap a merchant cannot free in the
  moment, so the backend warns from `STORAGE_WARN_RATIO` (0.8) and blocks at 1.0, and the FE constant
  must move with it. Degrades to `known: false` exactly like `usePlanLimit`. Rendered by
  `<StorageNotice>` (`components/shared/storage-warning.tsx`) inside every image field and by the
  billing page's storage panel — never re-derive a percentage from `usage.storageBytes` inline.

Neither replaces backend enforcement. Both exist so the answer is visible before the work is done.

**A route's gates are resolved from its URL, not from where it sits in the sidebar tree.**
`featuresForPath` / `permissionsForPath` (`lib/nav-utils.ts`) match a pathname against
`constants/navItem.ts` **by URL prefix** and accumulate the ancestors' `features` down the chain, so
the path you choose IS the gate you get. Two consequences worth knowing before naming a new page:

- A page under `/accounts/…` inherits `features: ["accounts"]` from the Cash & Bank row even if its
  endpoints are gated on something else. Courier payouts live at `/ecommerce/payouts` for exactly
  this reason — they are `storefront`-gated so a merchant with the ledger off can still see what a
  courier is holding, and `/accounts/payouts` would have feature-locked a screen the backend serves.
  Pinned in `lib/__tests__/nav-utils.test.ts`.
- The **nearest gated ancestor** supplies the permission too, which is usually broader than the
  endpoint's. `/ecommerce` grants `storefront.view`; the payout endpoints want
  `storefront.orders.view`. A page whose permission differs from its parent's needs its own nav row,
  or a role holding the parent's permission passes `RouteAccessGuard` and then 403s every request.

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

**Plans are grouped, not listed flat.** A tier sold monthly *and* yearly is **two** plans in Mission
Control sharing a `group` (`start-monthly` + `start-yearly`, both `group: "start"`) — the slug is the
billing key, so each cadence must stay its own plan. `utils/plan-groups.ts` collapses them:
`groupPlans()` (one card per package), `planCadences()` (the billing-cycle switch), `variantFor()`
(which variant a card shows), `defaultCadence()` (which cycle the switch opens on). Rendering the
flat list instead shows two identical-looking cards with the same name. Three rules that are easy to
get wrong:

- **`resolvePlanChangeDirection()` is a cross-repo contract** — it mirrors
  `mission-control/src/utils/plan-change-direction.ts` and must change in lockstep. Tier rank first,
  cadence second, raw amount only as the legacy fallback. This side only labels a button; MC decides
  what happens. When they disagree, a card reading "Downgrade" charges the customer immediately.
- **`planCadences()` returns `[]` unless some package really sells more than one cadence.** Without
  that filter, ungrouped plans (each a group of one) still yield differing month counts and render an
  **inert** switch — every card falls back to its only variant, so clicking does nothing.
- **The switch opens on the customer's own cadence, via `defaultCadence()` — never on `cadences[0]`.**
  `isCurrent` compares slugs, so defaulting a yearly subscriber to Monthly matches their
  `start-yearly` against the *monthly* variant: **no card gets the "Current plan" badge at all**, and
  their own tier renders a live "Downgrade" button beside a price they do not pay. `defaultCadence()`
  reads `interval`/`intervalCount` off the entitlement (what they are billed at, and it survives the
  plan being retired), falling back to the shortest cycle only when that cadence is not on sale.

The billing grid is split three ways so no piece outgrows the component size limit:
`available-plans.tsx` (orchestrator — cadence state, grouping, both dialogs), `plan-card.tsx` (one
card + its action button), `billing-cycle-toggle.tsx` (the switch). Two dialogs, and they are not
interchangeable: `trial-info-modal.tsx` explains a trial **before** it starts (gated on
`entitlement.trialUsed`, which is one-time per workspace), `trial-end-confirm-dialog.tsx` confirms
**ending** a running trial to switch to a paid plan.

**Billing reads accept `organization.view` *or* `organization.edit`.** The page gates on
`useCanManageBilling()` (owner **or** `organization.edit`, since edit is what the plan-change POSTs
need), so the backend's billing GETs — `/organization/subscription`, `/organization/plans`,
`/organization/billing/pay-link` — take both via `checkAnyPermission`. They are separate checkboxes
in the merchant's custom-role editor, and an edit-without-view role used to open the billing page and
then 403 every request behind it. Note the gates still disagree for an **owner holding neither**:
`useCanManageBilling()` lets them in as a lockout escape hatch, but the backend has no owner bypass
anywhere, so that page cannot load. Don't widen the frontend gate further without a backend change.

Subscription/billing enforcement lives in `lib/subscription-utils.ts`. `classifyEntitlementAccess()` returns `active | read_only | reactivate | blocked` (mirrors the backend `entitlementAccess` — keep in sync); the protected layout uses `shouldBlockWorkspaceAccess()` to force-logout only `blocked` orgs, the overdue banner uses `isPaymentOverdue()` (`read_only`) to show "Pay now", and `needsReactivation()` (`reactivate` = canceled **or** `incomplete`, i.e. awaiting a first payment) routes the user to `/dashboard/billing` to subscribe or re-subscribe (their data is retained; the backend confines them to billing routes). Both of those arrive from MC as `status:"inactive"`, so the classifier resolves them **before** the `inactive → blocked` branch — reordering that check silently locks customers out of checkout. A live `graceUntil` (`isInGrace()`) outranks all of it and resolves to `read_only`: MC grants grace when a trial lapses unpaid, when a renewal fails, and while an in-trial upgrade waits for payment, and the backend keeps `org.status` `active` for it so the merchant's storefront stays online while they pay. The same file carries `trialDaysLeft()` / `graceDaysLeft()`, which drive the trial countdown and grace copy in `BillingAlertBanner` — during a trial its "Pay now" mints a *prepay* session, so paying early costs the merchant none of their remaining trial days. Once they do, `isTrialPrepaid()` is what every surface reads: the countdown and its button disappear, and Settings → Billing renders `<TrialPrepaidBanner>` plus a **Paid** chip beside the status. That is not cosmetic — a prepaid subscription is still `trialing` with the same end date and no open invoice, so without a positive statement the page silently swallows the payment and the "Trialing" badge reads as "still owes money".

### Timezones (mandatory policy)

**The organization's calendar, never the browser's or the server's.** Merchants use this app from
devices in any zone, and Next renders on servers in UTC. A date decided with `new Date().getDate()`,
`toISOString().slice(0, 10)` or `toLocaleString()` is right on a Dhaka laptop and wrong everywhere
else. The rule, shared with the backend (`inventory-backend/CLAUDE.md` → Timezones):

- **Timestamps are UTC on the wire.** Format an instant in `organization.timezone`:
  `useFormatters()` (`formatDate`/`formatDateTime` are org-tz; pass `formatDateOnly` for stored
  date-only values), or `formatInTimeZone(…, timezone, …)` with `useOrgCalendar().timezone`.
  Printed documents (`utils/print-documents.ts`) use the org zone too.
- **Weeks start on `organization.weekStartDay`** (default Sunday, set in Settings → Organization).
  The server applies it to every period — **never send a hard-coded `weekStartDay`**.
- **Date-only values** (`YYYY-MM-DD` from `DatePicker`, stored as UTC midnight): keep them as strings
  end-to-end — never round-trip through `new Date("YYYY-MM-DD")` (UTC midnight → the previous day
  west of UTC). Read a stored one with `storedDateKey` / `formatDateOnly`; "today" is
  `orgDateKey(timezone)`.
- **Expiry dates are good through the end of the org's local expiry day** — decide with
  `isExpiryPast` / `daysUntilDateOnly` (`lib/org-calendar.ts`), the mirror of the backend's
  `isPastExpiry`. `ExpiryBadge`, `batch-select`, `use-batch-draws` and the expiry report all go
  through them.
- **Campaign and coupon windows** are whole days the server stores as org-local first/last
  instants. The edit form must put them back as the org-local day (`orgDayOfInstant`), not hand the
  stored ISO to the date field: the browser's zone can name a different day, and an untouched field
  is sent back as-is. The backend reads a returned instant on the org's calendar too.
- **A day clicked in a picker** (`DateRangePicker` hands back local midnight of that day) is keyed with
  `pickedDayKey` — the one sanctioned read of a `Date`'s local parts. Never pass it an instant.
- **Helpers:** `lib/org-calendar.ts` (`resolveTimezone`, `orgDateKey`, `orgDayOfInstant`,
  `pickedDayKey`, `storedDateKey`, `isExpiryPast`, `daysUntilDateOnly`, `isDateKeyBeforeOrgToday`) and
  `hooks/use-org-calendar.ts` (`useOrgCalendar`, and `getOrgTimezone` outside components).
- **Enforced on merchant screens.** `eslint.config.mjs` (`merchantRestrictedSyntax`) forbids, in
  `app/`, `components/`, `hooks/` and `utils/` minus the shopper storefront and tests: browser-clock
  getters/setters, `toLocaleDateString`/`toLocaleTimeString`/`new Date(…).toLocaleString()` and
  `Intl.DateTimeFormat` without `timeZone`, and `format`/`startOfDay`/… from `date-fns`. `lib/` holds
  the sanctioned helpers and is outside the scope. An `eslint-disable` there needs a reason.
- **Tests run with `TZ=UTC`** (`vitest.config.ts`); write date cases in the 00:00–05:59 Dhaka window
  where UTC disagrees (`lib/org-calendar.test.ts`).
- **Known exceptions, documented rather than hidden:** a landing page's schedule
  (`components/ecommerce/pages/page-schedule.ts`) takes and shows times on the merchant's *device*
  clock — its own design, predating this policy; moving it onto the org calendar is an open decision.
  The courier payout "Received" date is sent as `YYYY-MM-DD` and still read as UTC midnight by the
  backend (`inventory-backend/CLAUDE.md` → Timezones, "Not on the org calendar yet").
- **Storefront exception — shown on the SHOPPER's clock.** A campaign's end is still one instant
  decided by the org's timezone server-side, but the "Ends … at …" label prints it in the viewer's
  own zone (`campaignEndsLabel`), and therefore only after hydration — the UTC server cannot know
  that zone. The shopper's zone only *prints*; whether the campaign is live and what it costs are
  decided by the backend on its own clock. See the `storefront` skill.
- **Four clocks, one job each:** UTC stores instants; the organization's zone decides every merchant
  date; the shopper's zone only prints an already-resolved instant on the storefront; Asia/Dhaka is
  Mission Control's (backend `CLAUDE.md` → Timezones has the table).
- **Mission Control is different** — its admin shows Asia/Dhaka (`mission-control/CLAUDE.md`).

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
  - **Form fields:** `useVatGatedFormConfig(config, module)` (`hooks/use-vat-gated-form-config.ts`)
    is the one gate — it lists the VAT-only field names per module and strips them (and any section
    left empty). Pages and the quick-add modal (`hooks/use-quick-add-module.ts`) both run it, so a
    new VAT field is registered there, never re-filtered inline.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
