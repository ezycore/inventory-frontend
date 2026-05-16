# EasyStock Frontend — Copilot Instructions

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- State: Zustand 5 (client), TanStack Query 5 (server cache)
- Forms: React Hook Form 7 + Zod 4 + `@hookform/resolvers`
- UI: Tailwind 4, Radix UI primitives, shadcn-style components in `components/ui/`
- Tables: TanStack Table 8
- Icons: lucide-react
- Toast: sonner
- Charts: recharts
- Command palette: kbar
- Date: date-fns + date-fns-tz
- Package manager: pnpm

## Scripts
- `pnpm dev` — `next dev --turbopack`
- `pnpm build` — `next build`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` / `pnpm lint:fix`

## Folder structure
```
app/
  (auth)/        -> login, register, forgot-password
  (protected)/   -> authenticated routes (one folder per resource)
  landing/
components/
  <resource>/    -> feature components (table, form, dialogs)
  shared/        -> reusable cross-feature components
  ui/            -> shadcn primitives (do not edit lightly)
  layout/        -> sidebar, header, breadcrumbs
services/
  api/
    modules/<resource>/  -> api.ts (fetch fns), hooks.ts (TanStack Query), index.ts
    query-keys.ts        -> CENTRAL key factory — use it, never inline keys
    utils.ts             -> apiClient + envelope unwrap
  stores/        -> Zustand stores (use-*-store.ts)
hooks/           -> reusable React hooks
lib/             -> framework-agnostic helpers
types/           -> shared TS types
```

## API layer rules
- Every resource has: `services/api/modules/<resource>/api.ts` (raw fetchers) + `hooks.ts` (`useQuery`/`useMutation`).
- Always import query keys from `services/api/query-keys.ts`. Never inline `["products", id]`.
- Server data ONLY through TanStack Query hooks. Do not call `fetch` from components.
- After a successful mutation: invalidate the resource's list key + any related keys (e.g., dashboard stats).
- Backend response envelope is `{ success, data, message, meta }`. Unwrap via the helper in `services/api/utils.ts` — never read `res.data.data` in components.

## Forms
- Zod schema lives next to the form (or in `lib/validations/`). Same shape on FE and BE — keep them aligned.
- Use `useForm({ resolver: zodResolver(schema), defaultValues })`. Always provide `defaultValues` to avoid uncontrolled→controlled warnings.
- Submit handler calls a TanStack mutation hook. Show loading + error state via `mutation.isPending` / `mutation.error`.

## State
- Zustand stores for ephemeral UI/cart-like state (sell page, stock transfer, column settings, auth tokens).
- DO NOT mirror server data in Zustand — use TanStack Query cache.
- Auth token: `use-auth-store.ts` + cookies via `cookies-next`.

## UI / UX conventions
- Every list page must handle: loading skeleton, empty state, error state, pagination.
- Every form must handle: validation errors (inline), submit loading, success toast (`sonner`), close-on-success.
- Use `components/shared/` first; lift to shared if a pattern repeats in 2+ resources.
- Tailwind only — no inline styles. Use `cn()` helper from `lib/utils.ts` for conditional classes.
- Dark mode: use semantic tokens (`bg-background`, `text-foreground`), not raw colors.
- Accessibility: labels on every input, `aria-*` on interactive elements, keyboard nav for dialogs/menus (Radix handles most).

## Conventions
- Filenames: kebab-case. Components: PascalCase exports.
- Named exports preferred. Avoid default exports except for Next.js `page.tsx` / `layout.tsx`.
- No `any`. Prefer `unknown` + narrowing or generics.
- Server components by default; add `"use client"` only when needed (state, effects, browser APIs).
- Co-locate component-specific types; shared types go in `types/`.

## Multi-tenancy
- Active organization + location come from auth store / cookies. Backend enforces — FE just sends auth header.
- When switching location, invalidate ALL location-scoped queries (inventory, sales, purchases, stock movements, dashboard).

## When asked to "audit a resource"
1. Read `app/(protected)/<resource>/`, `components/<resource>/`, `services/api/modules/<resource>/`.
2. List every field consumed from API responses (grep usage of the response type).
3. Cross-reference backend `<resource>.service.ts` / model.
4. Produce a table: `field | used in component | recommendation (keep / remove from BE / lazy-load)`.
5. Wait for approval before changing types or removing fields.

## When asked to "add tests"
- Framework: **Vitest** + **React Testing Library** + `@testing-library/jest-dom`.
- E2E: **Playwright** for critical flows (login, create sale, stock transfer).
- Mock API via `msw` (Mock Service Worker) — keep handlers in `tests/mocks/`.
- Required coverage per resource: form validation, list rendering (loading/empty/error), mutation success + error toast.

## Things NOT to do
- Don't call `fetch` directly in components — use a TanStack Query hook.
- Don't inline query keys — use the central factory.
- Don't store server data in Zustand.
- Don't bypass the response envelope unwrap helper.
- Don't add new shadcn components by hand — use the CLI (`pnpm dlx shadcn@latest add ...`).
- Don't change the API envelope expectations — backend contract is fixed.
