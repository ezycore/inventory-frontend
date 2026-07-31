---
name: storefront
description: Map of the multi-tenant ecommerce storefront ("shop") — architecture, shopper auth, print/invoice engine, CMS pages, OAuth, conventions and gotchas. Load BEFORE implementing or fixing anything under app/(storefront)/, services/storefront/, components/storefront/, the ecommerce admin pages, or the backend storefront routes.
---

# Storefront (multi-tenant ecommerce)

Each organization on the inventory SaaS can publish a public online store. One codebase serves
every store; **the host picks the store**.

- **Tenant hosts**: `{slug}.domain/shop` (dev: `http://rmc41.localhost:3000/shop`). Link base = `/shop`.
- **Custom domains**: store at the domain root; link base = `""`. `proxy.ts` (root) resolves
  host → slug **via `lib/storefront-host-map.ts`** (the shared rules — `app/robots.ts` and
  `app/sitemap.ts` use the same module, since the proxy matcher skips dotted paths) and injects
  headers; `shop/layout.tsx` reads them and provides `{slug, base}` via
  `StoreContextProvider`. **Never hardcode `/shop`** — always `storeHref(base, path)`
  (`lib/storefront-links.ts`). Resolution order: `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP` (manual
  override) → **dynamic lookup** `lib/storefront-domain-lookup.ts` → BE
  `GET /api/public/store-by-host?host=` (resolves the org `domains` array from Settings →
  Domains; active entries only; 60s in-memory cache, errors cached 10s). Merchant flow is
  fully self-serve: add domain in settings → TXT verify → Caddy on-demand cert → live.
  A custom domain serves the SHOP at root — the admin stays on `{slug}.ezycore.com`.

> **Paired backend skills — the server rules are NOT duplicated here.** The shopper→order→confirm→Sale
> pipeline (Shopper ≠ Customer), coupons/campaigns, and the custom-domain lifecycle are owned by the
> backend:
> [`storefront-orders`](../../../../inventory-backend/.claude/skills/storefront-orders/SKILL.md),
> [`promotions-coupons`](../../../../inventory-backend/.claude/skills/promotions-coupons/SKILL.md),
> [`custom-domains`](../../../../inventory-backend/.claude/skills/custom-domains/SKILL.md). This file is
> the frontend + architecture map; read those before changing anything that crosses the wire.

## Dev environment

- Frontend `pnpm dev` on **:3000** (Turbopack). Backend (sibling repo `../inventory-backend`)
  nodemon on **:5800** (was 5500 until 2026-07-11 — check `.env` PORT if refused).
  `NEXT_PUBLIC_API_URL=http://localhost:5800/api`.
- Test store: **rmc41** (seeded "sample data" org; owner `rashidul.karim7+41@gmail.com`).
  Public API: `http://localhost:5500/api/storefront/rmc41`.
- Emails really send in dev (Gmail SMTP in backend `.env`; provider auto-detect resend→smtp→log).
- **nodemon does NOT reload on `.env` changes** — touch `src/server.ts` (mtime) to force a restart.
- QA browsing: headless Chrome, CDP port **9334**, persistent profile + helper scripts
  (`cdp.mjs`, `qa-*.mjs`) in the session scratchpad. `qa-31-set-verify-token.js` plants a known
  email-verification token hash straight into Mongo (`shoppers` collection, URI from backend
  `.env`) so the real `/auth/verify-email` endpoint can be exercised end-to-end.

## Frontend layout

Routes in `app/(storefront)/shop/`: home, `products` (collection+filters), `products/[productSlug]`,
`cart`, `checkout`, `search`, `track`, `pages/[pageSlug]` (CMS), and `account/*` (auth card +
account area, `verify-email`, `reset-password`, `oauth`, `orders`, `orders/[orderNumber]`,
`orders/[orderNumber]/invoice`).

- **Pattern**: `page.tsx` (server; SEO via `storePageMetadata` in `lib/storefront-metadata.ts`)
  + `view.tsx` (`"use client"`). Server data fetches go through `lib/storefront-server.ts`
  (Next `revalidate` + tag `store:{slug}`, flushed on admin save — see "Cache + on-demand
  revalidation" below).
  **The `page.tsx` must also fetch the view's own data and pass it as `initialData`** — see
  "SEO" below; a `page.tsx` that only returns `<View />` ships a spinner as its HTML.
- **Design system**: no Tailwind on the storefront. Inline `CSSProperties` + CSS variables from
  `app/(storefront)/storefront.css` — `--primary/--on-primary/--primary-soft/--card/--border/
  --border-strong/--text/--muted/--faint/--pad/--gap/--maxw/--h2` etc. Dark mode = `data-theme`
  on `.sf-root` (toggle persisted as `sf-theme`). The org's `brandColor` overrides `--primary`
  inline, and **may be near-black — never rely on `var(--primary)` being visible on dark cards**
  (use `--muted` or `color-mix(... , var(--text))` for accents that must survive both themes).
- **Mobile rules — the storefront is phone-first, and inline styles can't hold a media query.**
  Anything that must change at a breakpoint goes in `storefront.css` behind a class (that is why
  `.sf-pdp-*` and `.sf-footer-*` exist), never into a `style={{…}}`. Four standing rules, each
  fixed a real defect (2026-07-31 audit at 320/360/740px):
  - **Text fields are ≥16px.** Use `sfInput` (`components/storefront/field-styles.ts`) for every
    shopper-facing input — one shared object, previously six pasted copies. Below 16px iOS Safari
    zooms the page on focus and, since the viewport meta rightly permits scaling, never zooms back;
    checkout's seven fields meant seven pinch-outs per order. Checkout keeps its own slightly
    padded `input` in `checkout/checkout-bits.tsx`, also ≥16px.
  - **Touch targets are ≥40px.** For icon buttons add `padding` plus a matching negative `margin`
    (see `tapPad` in `store-header.tsx`) so the hit box grows without moving the glyph; for list
    rows add real vertical padding. A bare `padding: 0` icon button is a bug — the hit box equals
    the glyph (the cart's remove `×` was 15×15).
  - **Money never breaks mid-value.** A price row is `flexWrap: "wrap"` with `whiteSpace: "nowrap"`
    on each amount. Cards are ~130px wide in the 2-column mobile grid and clip
    (`overflow: hidden`), so an unwrapped "From + price + struck compare-at" row rendered the
    original price cut off mid-digit.
  - **Fixed heights get a viewport cap.** `.sf-hero` is `min(…, 70svh)` (62svh on mobile) — a flat
    430px was 76% of an iPhone SE screen and 89% in landscape. Use `svh`, not `vh`, so the
    collapsing mobile URL bar doesn't resize it. Always declare a **non-`svh` fallback first**: the
    hero's slides are `position: absolute`, so a browser without `svh` (pre-Chrome 108 / Safari 15.4)
    drops the declaration and collapses it to nothing.
  - **A desktop sidebar is not a mobile header.** `--acctgrid` / `--colmain` / `--cartgrid` collapse
    to one column below 680px, so anything built as a side column *stacks above the content* there.
    Check what that costs before it ships: the account nav was a 499px list (62% of the screen) and
    also `position: sticky`, so it pinned itself over the content. Pattern for fixing it is
    `.sf-account-nav` — **one** set of markup, `grid-template-areas` re-pointed at the breakpoint, so
    a control can move (logout sits inline with the identity row on mobile, under the list on
    desktop) without a second copy of the nav in the JSX.
- **Overlays must lock the page behind them** — `useBodyScrollLock(open)`
  (`hooks/use-body-scroll-lock.ts`), used by `SideDrawer` (cart + filters), the bottom-nav
  `MenuSheet` and the mobile search takeover. It takes `<body>` out of flow (`position: fixed`
  offset by the scroll) and restores the position on close, because `overflow: hidden` alone does
  not hold on iOS Safari. Without it an overscroll inside a drawer scrolls the catalogue behind it.
  A bottom-anchored overlay footer also needs `env(safe-area-inset-bottom)` in its padding or its
  CTA lands under the iPhone home indicator — `SideDrawer` and the bottom nav both do this.
- **Icons**: `components/storefront/sf-icons.tsx` (`<Icon name=… />`, stroke, currentColor).
  Add paths there; do not import lucide into storefront components.
- **Toasts**: import `toast` from `lib/storefront-toast.ts`, never from "sonner" directly —
  storefront toasts render **top-center** (the bottom strip belongs to the cart-drawer
  footer, the mobile bottom nav and the sticky buy bar; the admin's global Toaster default
  is bottom-right). The cart drawer `toast.dismiss()`es on open (the drawer IS the
  add-to-cart confirmation) and **Buy now never toasts** — on the PDP or on a card — because it
  navigates to checkout and the toast would land on a screen the shopper has already left.
- **i18n**: bilingual EN/বাংলা. `lib/storefront-i18n.ts` — every string is a key in the `Dict`
  interface **plus** the `en` **plus** the `bn` object (3 places, always). Components read
  `const { t } = useStorefrontUI()`. (IDE diagnostics often flag "missing properties" mid-batch
  while editing this file — verify with a grep count, key×3, before believing them.)
- **Templates**: per-page layout variants chosen in the admin (Customize) —
  `lib/storefront-templates.ts` `resolveTemplates(store)` → home/collection/product/checkout
  (+ header/footer/productCard/hero/**pagination**) variant ids consumed by the views. `search` and
  `cart` are retired: shoppers toggle grid/list on the search page, and Buy now always goes
  straight to `/checkout`. Note the admin ids are kebab-case and the storefront names are not
  (`load-more` → `loadMore`) — the maps in that file are the only bridge, and a miss silently
  resolves to the default, which reads as "the setting does nothing".
- **Listing pagination** (`templates.pagination`, default `pages`): `pages` = numbered
  `<Pager>`; `infinite` = auto-load `AUTO_LOADS` (2) pages then a button; `load-more` = button
  only. Applies to **both** the collection page and search results, which share
  `components/storefront/{pager,load-more}.tsx`. Reads through
  **`useStorePaginationMode(store)`** (`use-sf-preview-store.ts`), never `resolveTemplates`
  directly, so the Customize draft streams. Non-`pages` modes use
  `useStoreProductsInfinite`; see the query-cache note below for why its key is separate.
  `infinite` deliberately stops auto-loading: this footer holds real navigation and the mobile
  bottom nav sits over it, so an endless list makes both unreachable.
- **Client state (zustand, persisted)**: `services/stores/use-shopper-store.ts`
  (`easystock-shopper`: token/shopper/slug, `setAuth/setShopper/logout`),
  `use-cart-store` (slug-scoped items), `use-wishlist-store`. **Any component reading a persisted
  store on first render must gate on `useHydrated()`** or SSR mismatch / redirect races follow
  (checkout had exactly this bug: direct load bounced signed-in shoppers to /account).
- **API client**: `lib/storefront-client.ts` — `sfFetch` (no auth header unless `token` passed).
  Error payloads carry the message in `json.error`. On **401 with a token that is still the
  current session token, the shopper session is dropped** (self-healing stale sessions).
  TanStack hooks in `services/storefront/hooks.ts` (`useStore`, `useStorePage`, `useShopperAuth`,
  `useShopperAccount`, `useResendVerification`, `usePlaceOrder`, …).

## Cache + on-demand revalidation (why an admin edit used to take 5 minutes)

The shop is served from **three** stacked caches, and only the third is in the shopper's browser:

| Cache | Set by | Lifetime |
|---|---|---|
| Next **Data Cache** (per fetch) | `next: { revalidate, tags: ["store:{slug}"] }` in `lib/storefront-server.ts` | `getStore` 300s; products/campaigns 60s; sitemap 1h |
| Next **Full Route Cache** (rendered HTML) | `export const revalidate` in each shop `page.tsx` | 60s (home/products/PDP), 300s (CMS pages) |
| TanStack `staleTime` | `services/storefront/hooks.ts` | 5 min, seeded from the SSR value |

The first two live **in the Next server and are shared by every visitor**, which is why a merchant
could never clear one by reloading — hard reload tells the *browser* to refetch, and the server
answers from the same stored copy. **Don't debug a "stale storefront" report in the browser.**

Until 2026-07-31 the `store:{slug}` tag was declared on every fetch and **never called** — no
`revalidateTag` existed anywhere in the workspace, so time expiry was the only flush and a theme
colour took up to five minutes to appear. Now:

- **`POST /api/storefront/revalidate`** (`app/api/storefront/revalidate/route.ts`) calls
  `revalidateTag("store:{slug}", { expire: 0 })`. The slug comes from the caller's session via the
  backend's `/auth/me` — **never from the request body**, or one tenant could strip another's cache.
  Bearer header only (a cookie would make it CSRF-triggerable). `{ expire: 0 }` rather than the
  `"max"` profile so there is no stale-while-revalidate window: with one, the merchant's *next*
  reload still serves the old copy and they have to reload twice.
- **`lib/revalidate-storefront.ts`** `revalidateStorefront()` is the only caller — fire-and-forget,
  silent on failure (the save already succeeded and the timer is still a backstop), `keepalive` so
  navigating away right after saving doesn't cancel it.
- **Wiring**: `services/api/invalidation.ts` fires it for every event in `PUBLIC_STOREFRONT_EVENTS`
  (`storefront.catalog.changed`, `catalog.changed`), so catalog/campaign/coupon/CMS mutations get it
  for free. The two storefront-settings mutations in `services/api/modules/organization/hooks.ts`
  call it directly — they write the response into the cache with `setQueryData` and so deliberately
  don't go through `invalidate()`. **A new admin mutation that changes public shop data needs one of
  those two paths**, or it ships the old bug.
- **`stock.moved` is deliberately excluded** — stock moves on every sale, so flushing per movement
  would keep the cache permanently empty. The 60s catalogue revalidate covers stock freshness.
- **Deployment**: `revalidateTag` only reaches the instance that serves the POST. Multi-replica
  needs a shared `cacheHandler`; single instance (current) is fine.

## Live preview (Customize) — how it works, and how to add a field

The right-hand panel of Customize is **the real storefront** in an iframe at `{store}?preview=1`. It
mounts **once**; edits reach it by `postMessage`, never by refetching. An edit therefore costs zero
server requests — do not "optimise" this into a save-then-reload, which would cost a full (and now
cache-missing) SSR render per save.

Four files, in payload order:

1. `app/(protected)/ecommerce/customize/page.tsx` — `CustomizeWorkspace` holds **every**
   preview-relevant draft (sections own none), and `BrowserPreview.post()` serializes it.
2. `components/storefront/preview-bridge.tsx` — receives it inside the iframe (gated on `?preview=1`)
   and calls `apply`. It announces `ezycore-preview-ready` on mount so the editor pushes immediately.
3. `services/stores/use-sf-preview-store.ts` — the override state.
4. The storefront component reads its override and prefers it over the saved payload.

**Rules, each of which was a real defect:**

- **Normalize in the payload exactly as `submit()`/`save()` does** — filter blank-titled footer
  groups, blank-titled slides, `cleanHeroBanner`, the public `/categories` shape. A preview that
  shows something the save would drop is worse than no preview.
- **`?? saved` is the fallback for everything except images.** For `logo`/`banner`, `null` is a real
  draft value meaning "removed", so use **`useSfPreviewImage(field, saved)`** — never re-derive the
  `undefined`-vs-`null` check inline. Getting it wrong makes a deleted logo reappear.
- **An empty array is a real draft** ("all groups removed"), so `previewGroups ?? saved` — never a
  truthiness check.
- **Media (logo/banner) is not a draft** — its PATCH saves on upload, so it streams from `settings`,
  which the mutation has already refreshed in the query cache.
- **Everything in Customize streams.** If you add a control there and skip this wiring, you have
  re-created the exact inconsistency that nearly got the whole feature deleted.

## Backend (../inventory-backend)

- Routes `src/routes/storefront.routes.ts`, mounted at `/api/storefront` **before** staff auth.
  `router.use("/:slug", resolveStore)` gates on a live store (feature on + org active + published).
  `resolveStoreContext(slug)` (same file as the middleware) is the reusable loader.
  ⚠ **Fixed-URL routes (OAuth callback) must be registered BEFORE the `/:slug` gate** or their
  first path segment parses as a slug.
- `storefront.service.ts` (`StoreContext`, `getStoreInfo` = the public store payload), models:
  `shopper.model.ts` (per-org unique email; bcrypt; sha256-hashed verification/reset tokens with
  expiry; linked `Customer` via `createLinkedCustomer`), `storefront-settings`, `storefront-order`,
  `content-page`. Rate limiters: `authLimiter`, `emailVerificationLimiter`, `passwordResetLimiter`.
- `src/utils/storefront-url.ts` `storefrontBaseUrl(slug)` — single source for shopper-facing URLs
  (emails + OAuth bounce). Env: `STOREFRONT_URL_TEMPLATE` ("https://{slug}.x.com/shop") wins,
  else slug is prefixed onto `STOREFRONT_BASE_URL`/`FRONTEND_URL` host.
- Tests: vitest, `src/**/__tests__/*.test.ts`; **mongodb-memory-server makes every run ~80s**.

## Shopper auth — the full picture

| Flow | Backend | Frontend |
|---|---|---|
| Register | `POST /:slug/auth/register` — creates Shopper + linked Customer, emails verification (fire-and-forget), returns session immediately | auth card on `/account`; lands on the **verify-email interstitial** (unless checkout `?next=` wins) |
| Login | `POST /:slug/auth/login` (generic 401, status gate) | same card; forgot-password inline (needs email filled) |
| Verify | `POST /:slug/auth/verify-email` (hashed+24h token) | `/account/verify-email` — two modes: no `?token` = "check your inbox" card (resend + go-to-account); with `?token` = auto-verify → success/error |
| Resend | `POST /:slug/auth/resend-verification` (authed + limiter; no-op if verified) | amber `VerifyEmailBanner` in AccountArea + interstitial + checkout gate |
| Forgot/Reset | limiter, enumeration-safe generic reply; 1h token | `/account/reset-password` |
| **Ordering** | `placeOrder` **403 `VERIFY_EMAIL_TO_ORDER`** until `emailVerified` (also status gate). Browsing/cart stay open — verification is soft everywhere except the order. | `<VerifyEmailGate>` (`components/storefront/verify-email-gate.tsx`) blocks checkout: resend + "I've verified" recheck (refetches `me()` → gate lifts live) |

**Social login (Google + Facebook)** — server-side OAuth code flow, multi-tenant by design:
one fixed callback per provider on the **API host** (`/api/storefront/oauth/:provider/callback`);
the store slug + optional `next` ride in a signed 10-min state JWT. Token handoff back to the
store via **URL fragment** → `/account/oauth` landing (scrubs the hash, `me()` → `setAuth`).
- `src/services/storefront-oauth.service.ts`: env-gated (`GOOGLE_CLIENT_ID/SECRET`,
  `FACEBOOK_APP_ID/SECRET`); `availableProviders()` → `oauthProviders` in the store payload →
  `<SocialLoginButtons>` renders only what's configured. Both providers finish at a userinfo call;
  FB phone-only accounts (no email) get `OAUTH_EMAIL_REQUIRED`. OAuth shoppers arrive
  `emailVerified: true` (random password; email reset flow still works).
- Console setup: redirect URI = `{api-origin}/api/storefront/oauth/{provider}/callback`
  (prod: set `OAUTH_CALLBACK_BASE`). Unit tests: `src/services/__tests__/storefront-oauth.service.test.ts`.
  **`redirect_uri_mismatch` after a deploy** = `OAUTH_CALLBACK_BASE` unset on the server. The fallback
  is `${req.protocol}://${req.get("host")}`, and behind a TLS-terminating proxy `req.protocol` is
  `http` — which Google refuses to register for anything but localhost. Both the start *and* the token
  exchange build the URI, so the two agree only if the env var is set. (`trust proxy` is now on in
  `src/server.ts`, but the env var stays the real fix — the fallback still guesses the host.)
- Status: Google works with any creds; **Facebook app is in Development Mode pending Meta
  Business Verification** (consent screen already round-trips for app admins).

### Query cache + the session boundary (read before touching shopper auth)

Storefront keys live in **`services/storefront/hooks.ts`**, not the admin registry
(`services/api/query-keys.ts`) — different session model, a `slug` dimension no admin key has, and
SSR-seeded `initialData`. Same invariant though: **every key starts with `storefront.all(slug)`**, and
everything private to the signed-in shopper starts with **`storefront.shopper(slug)`**.

That split exists because of a real defect: the orders key carried only the store slug, so signing out
left the previous shopper's order history — numbers, addresses, phones — in cache for the full
`gcTime`, and the next sign-in on the same device read it back before its own fetch landed. Shared
phones and shop counters make that a routine path, not a race.

**Rules:**
- A new shopper-private query goes under `storefront.shopper(slug)`. No exceptions — that prefix is
  what makes eviction one call.
- Every session boundary calls `clearShopperCache(qc, slug)`: `useShopperLogout` (logout),
  `useShopperAuth` (login/register), and the 401 auto-logout in `lib/storefront-client.ts`.
- **Never call `useShopperStore().logout` directly** — use `useShopperLogout(slug)`. The raw store
  action clears the token and leaves the cache.
- Public store data (products, categories, campaigns, pages) is deliberately *not* evicted: identical
  for every visitor, SSR-seeded, so clearing it only causes a flash.
- **`products` and `productsInfinite` are two keys over one endpoint**, both under the
  `["storefront", slug, "products"]` prefix so eviction still takes one call. They are separate
  because the paged key *contains* `page` and the infinite one must not: an infinite query owns its
  cursor, and a `page` in its params gives every page its own cache entry — no accumulation, which
  is the entire mode. Its `initialData` is also reshaped (`{ pages, pageParams }`), not passed
  through; hand it a bare `ProductListResult` and the SSR seed silently misses, putting a spinner
  back in the crawlable body.
- `services/api/__tests__/invalidation.test.ts` covers this file too — a new mutation that invalidates
  nothing fails CI unless it is allowlisted with a reason.

Background: [`docs/plan/query-invalidation.md`](../../../docs/plan/query-invalidation.md) §P4.

## SEO (multi-tenant — every store must rank on its own)

Each store is a separate public site with its own host, name, logo and copy. All of the following is
resolved **per request from the host**, never baked.

- **Metadata** — `generateMetadata` in each `page.tsx`. Home reads `store.seo.title/description`
  (falling back to the store name), PDP reads `product.seo.*` then the online title/description,
  og:image = product image ∥ store banner ∥ logo. Everything else goes through `storePageMetadata`
  (`"<Page> · <Store>"`, host-correct canonical, robots directive). Favicon is a raw
  `<link rel="icon">` in `shop/layout.tsx`, deliberately **not** `metadata.icons` (see the note there).
- **Content must be in the SSR HTML.** `page.tsx` fetches with `lib/storefront-server.ts` and passes
  the result to the client view as query `initialData` (`useStoreProduct` / `useStoreProducts` /
  `useStorePage` / `useStore` / `useStorePages` / `useStoreCampaigns` all take it). This was a real
  defect until 2026-07-27: the PDP, `/products` and CMS pages rendered `<View />` with no seed, so the
  `<head>` was perfect and the `<body>` was a spinner. **Adding a new indexable route means seeding
  it** — a client-only fetch is invisible to every crawler that doesn't run JS.
- **The collection page's params object IS its cache key.** Server and client must build it through
  `catalogQueryParams` (`lib/storefront-catalog-params.ts`); one mismatched key (`""` vs `undefined`)
  silently misses the seed and you're back to an empty body. Only page 1 is seeded.
- **`noindex` policy.** Transactional routes (cart, checkout, search, `/account/*`, invoices) pass
  `index: false` → `noindex, nofollow`. Filtered collection URLs pass `index: false, follow: true`
  **and no canonical** — `isIndexableCatalogUrl` allows a plain listing or a *single* category/brand
  facet (those are real landing pages and self-canonicalize via `catalogCanonicalQuery`); price
  bounds, `inStock`, a sort, or two facets at once are the same catalogue re-sliced and multiply
  without limit. Never give a `noindex` page a canonical pointing elsewhere — that's two contradictory
  instructions.
- **`/robots.txt` + `/sitemap.xml`** — `app/robots.ts` / `app/sitemap.ts`, both
  `dynamic = "force-dynamic"`. ⚠ **They do NOT get the `x-ezy-store-*` headers**: `proxy.ts`'s matcher
  excludes any path containing a dot, so these routes resolve the host themselves via
  **`lib/storefront-host-map.ts`** — the shared rule set the proxy now also uses. Change host→store
  rules there, in one place, or robots/sitemap will describe a different store than the pages do.
  Sitemap data comes from BE `GET /:slug/sitemap` (`lib/storefront-server.ts` `getStoreSitemap`,
  cached 1h) which returns **identifiers**; the URLs are built here because only this side knows
  whether the base is `/shop` or `""`. A non-store host gets a bare `Disallow: /` and an empty sitemap.
- **Structured data (JSON-LD)** — builders in `lib/storefront-jsonld.ts` (pure, tested in
  `storefront-jsonld.test.ts`), rendered by `<JsonLd>` (`components/storefront/json-ld.tsx`, a
  **server** component — the markup must be in the SSR HTML). PDP emits `Product` + `BreadcrumbList`;
  home emits one `Organization` (site-wide node, home only). **Never emit a claim the page doesn't
  make** — structured data that disagrees with the visible page is a manual-action risk. Concretely:
  a null price emits *no* offer rather than a zero, and sku/mpn/brand/ratings are absent because the
  payload has none. Two traps encoded there: **a variable product leaves `product.price` null and
  prices per variant**, so offers read variants first (a one-variant product would otherwise get no
  offer at all), and `backorder` is `schema.org/BackOrder`, not `OutOfStock`.
- **404s are real 404s.** `products/[productSlug]` and `pages/[pageSlug]` call `notFound()` →
  `app/(storefront)/shop/not-found.tsx` (renders inside `StoreShell`, so the shopper keeps the store
  chrome). ⚠ The guard is `if (store && !product) notFound()` — **not** a bare `!product`: the
  `storefront-server.ts` helpers return null for *any* failure, so a backend blip would otherwise tell
  crawlers a live product is permanently gone. A successful store fetch proves the API is reachable.
- **One canonical host per store.** A shop with a custom domain is live on **both** `acme.com` and
  `{slug}.ezycore.com/shop`; if each host canonicalized to itself the catalogue would be indexed twice
  and the ranking signal would split. The BE picks the winner (`store.canonicalHost`); **every absolute
  URL goes through `canonicalTarget` (`lib/storefront-canonical.ts`)** — canonical tag, `og:url`,
  sitemap entries and JSON-LD `url`s. Miss one and the sitemap advertises URLs that disclaim
  themselves. Note it returns `base: ""` for a custom domain (the shop is at the root there), so
  carrying the request's `/shop` over would canonicalize to a URL that 404s. `null` ⇒ serving host ⇒
  unchanged behaviour, which is every store with no custom domain. The BE rule is "active custom domain
  beats the platform subdomain", **not** `isPrimary` — see the `custom-domains` skill §6 for why.
  Tests: `storefront-canonical.test.ts` here, `canonical-store-host.test.ts` + a `getStoreInfo` case
  there. **Not done:** a 301 from subdomain → canonical host (canonical tags are sufficient and
  reversible; a redirect is neither and needs a per-request host lookup in the proxy).
- **Known gaps — all recorded in
  [`docs/plan/storefront-i18n-seo.md`](../../../docs/plan/storefront-i18n-seo.md)**, which is the
  place to look before starting any further SEO work. Headline: Bangla has no `hreflang` and no
  distinct URL (the toggle is `localStorage`), so **only English is indexable** — fixing it is a
  routing change (locale-scoped URLs through `storeHref`), not a metadata one, and it gets more
  expensive the longer the store is live. That doc also carries the cheap leftovers: no
  `metadataBase`, `og:type` is `website` on the PDP, no `twitter:card`, no Search Console
  verification token, and the 200-status "Store unavailable" branch.

## Other storefront subsystems

- **Image variant per use site** — `lib/storefront-image.ts`, one of three helpers, never a hand-rolled
  `img?.a || img?.b` chain: `cardImageUrl` (grid/card/tile, >~100px), `thumbImageUrl` (row thumb,
  avatar, chip, ≤100px), `fullImageUrl` (PDP gallery hero, og:image, JSON-LD). The backend stores
  `url` ≤1600w, `mediumUrl` 800w and `thumbnailUrl` as a **200×200 `fit:"cover"` square crop**
  (`inventory-backend/src/utils/imageUpload.ts`) — only the thumbnail changes aspect ratio, so
  picking it for a card both upscales and crops the product out of frame. That was the bug on the
  shop grid until 2026-07-31. URL-imported images store one URL in all three fields, so every helper
  degrades to it.
- **PDP gallery** — `components/storefront/product-gallery.tsx` owns the thumb rail + hero for both
  product templates (`layout="top" | "side"`) **and** the hover-to-magnify. The page passes raw
  `images` + the selected index; clamping lives in the gallery (a variant switch can swap in a
  shorter list). Zoom = `transform: scale()` with `transform-origin` tracking the pointer inside an
  `overflow: hidden` frame (`.sf-pdp-zoom*`); **only the scale is transitioned** — transition the
  origin too and the tracking swims a quarter-second behind the cursor. Mouse-only by construction
  (`e.pointerType !== "mouse"` bails), because a tap fires pointermove with no matching leave and
  would strand the hero zoomed on a phone. `zoomOrigin()` is exported + tested
  (`product-gallery.test.ts`): an unclamped origin pans past the edge and shows page background
  inside the frame.
- **CMS pages**: admin Ecommerce → Content (title/slug/body/published/showInFooter/sortOrder).
  Bodies are markdown via `lib/storefront-markdown.ts` (dependency-free subset parser → block
  model, React-node rendering = XSS-safe; **consecutive `Q:`/`A:` lines become styled FAQ cards**)
  + `<MarkdownView>`. Extend the parser; never dump raw text or add a markdown dep.
- **Invoices/printing**: order invoices (admin single/bulk + shopper WYSIWYG iframe page) render
  through the shared letterhead print engine `utils/print-documents.ts` via the adapter
  `utils/print-storefront-order.ts`; letterhead = org Receipt & Print settings, shipped to the
  shopper via the store payload's `printable` block. Never hand-roll invoice markup.
  **Mechanics** (`utils/print.ts`): `printHtml` renders into a **hidden same-origin iframe**
  (`#app-print-frame`) and calls `print()` when images settle — no popup window, no popup
  blockers. Only count `!img.complete` images as pending (cached images never fire `onload`;
  that bug used to silently prevent the dialog from opening) and keep the grace timeout.
  All print CSS uses **`@page { margin: 0 }`** so the browser cannot paint its default
  title/URL/date header-footer; whitespace lives in body padding (left/right — repeats every
  page) and `.doc` padding (top/bottom — repeats per document in bulk `.inv-page` breaks).
  Don't reintroduce `@page` margins or `window.open` printing.
- **Footer**: `store-footer.tsx` is the slim entry (variant resolve + prop build); the bodies live in
  `components/storefront/footer/` — `footer-pieces.tsx` (shell/brand/columns/aside/bottom-bar + the
  `FooterColumn` model helpers `groupColumns`/`contentPagesColumn`/`footerColumns`) and
  `footer-variants.tsx` (Columns/Rich/Simple). **Each footer group is its own auto-flowing column**
  (`.sf-footer-*` in storefront.css: grid ≥680px, tap-to-open `<details>`-style accordions below via a
  per-column `useState(true)` — SSR-safe, desktop heading is inert + always-open). The auto
  **content-pages column** ("Information", from CMS pages flagged `showInFooter`) is controlled by
  `nav.footerContentPages { show?, title? }` — absent/`show!==false` shows it (legacy default), `title`
  overrides the heading. Simple is a deliberately flat link row (drops group titles) but still honours
  the show toggle. Edited in Customize → Navigation (`footer-links-card.tsx`, groups + the content-pages
  Switch/heading) — groups, the content-pages toggle/heading **and** the variant are all
  live-previewed (2026-07-31; the groups were the last Customize control that wasn't). Social links
  are edited in admin Store Settings → General → Social
  links card. **All hrefs go through `hrefFor` in `social-links.tsx`** — it forces a scheme
  (a schemeless `facebook.com/x` is a *relative* href, so the button used to 404 on the shop's own
  origin) and turns a phone-shaped WhatsApp value into `https://wa.me/<digits>`. Tested in
  `social-links.test.ts`; never render an owner-supplied URL without it.
- **Checkout**: gates in order — `!shopper` (redirect to `/account?next=/checkout`, hydration-gated),
  `!emailVerified` (VerifyEmailGate), `placed` (OrderPlacedCard), empty cart. Single-page or
  multi-step per template. Coupons validated server-side; shipping = Dhaka inside/outside zones.
  **Merchant checkout rules (`store.checkout`, admin Settings → Checkout) are enforced on BOTH sides**
  — `requiredFields` drive the address gates (name/phone always on; district/area forced when zone
  shipping is on), `minOrderValue` blocks submit below the subtotal floor, `termsRequired` renders the
  agree checkbox (submit sends `termsAccepted`), and `orderPrefix` feeds `generateOrderNumber`. The
  backend `placeOrder` is authoritative (`TERMS_NOT_ACCEPTED` / `BELOW_MIN_ORDER` /
  `MISSING_REQUIRED_FIELDS`); the FE gates are the preview. The delivery-address requirement moved OUT
  of the zod validator INTO `placeOrder` (only there are store settings visible) — the schema now only
  guarantees name/phone shape.
- **Admin ecommerce pages** (`app/(protected)/ecommerce/*`): dashboard, orders (+detail, invoice
  print), content, customize (Theme | Templates | **Navigation** — header/footer/announcement moved
  here 2026-07-18; `/ecommerce/navigation` is now a redirect to
  `customize?section=navigation` and the sidebar entry is gone), catalog (products + collections),
  settings (General incl. social links + fulfillment location, Publish, payments/shipping/checkout
  tabs). Custom domains under app Settings → Custom Domains. List pages come in two shapes:
  CRUD-style (coupons/campaigns/content) are `DataTable` + `filterConfig` pages whose `getAll`
  adapters filter/paginate CLIENT-side over the full backend list; workflow-style
  (orders/customers/catalog) hand-roll their tables but share
  `components/ecommerce/list-search-input.tsx` (debounced 300ms, trimmed commit) and
  `components/ecommerce/list-pagination.tsx` (rows-per-page + Previous/Next footer) — reuse
  these, never re-inline a search box or pagination row on an ecommerce list page.

## Work log (what was built, newest first — as of 2026-08-01)

- **Quick buy from the grid; Buy now means checkout everywhere (FE)** (2026-08-01): a card's only
  CTA was Add to cart, and a *variable* product's said **Select options** and navigated to the PDP —
  so the fastest path from the home grid to a checkout form was 4 taps plus a full page load, and
  **Buy now existed nowhere but the product page**. Cards now carry **Add to cart + Buy now**, and a
  variable product resolves its options in place.
  **Tiered by option complexity** (`optionsFitInline` in `variant-selector.tsx`): one axis of ≤6
  values reveals `CardVariantFlyout` over the card image; multi-axis or a longer axis opens
  `QuickBuySheet` (bottom sheet <680px, centred modal above). Picking one surface for both was the
  thing to avoid — a modal over four size chips is heavy, and a Colour×Size product cannot fit a
  ~150px card in the 2-column mobile grid.
  Four things worth keeping: **(1)** the catalog list payload has `hasVariants` but **not
  `variants`**, so a card cannot render a chip — or even *choose* its surface — without the detail
  payload; `useCardQuickBuy` fetches it on **hover intent (120 ms, mouse only)** or first press,
  against the PDP's own query key, so `""` keeps the query disabled and a 24-card grid does not fire
  24 requests. **(2)** The **first press always reveals, never buys**: a variant is preselected, so
  committing on press one would put a size the shopper never chose in their cart. **(3)** The flyout
  renders only after variants load, so the CSS `:hover` reveal can't expose an empty bar; the tap
  path (`.sf-open`) is the real mechanism and hover is a fine-pointer convenience — `pointerenter`
  fires on tap too, hence the `pointerType !== "mouse"` bail, same as the gallery zoom. **(4)** The
  flyout is a **sibling** of the card's `<Link>`, not a child — buttons inside an anchor are invalid
  markup that browsers silently reparent. **(5)** The card must re-price off the **chosen** variant:
  the first cut kept rendering the catalog "From ৳600" after the shopper picked the ৳780 variant, so
  Buy now charged a price the card never displayed. Found in a browser, not by any gate — nothing
  type-checks "the number on screen matches the number in the cart". Hence `chosen` (explicitly
  picked) is exposed separately from `selected` (which includes `defaultSelection`'s pre-highlight):
  pricing off `selected` would silently rewrite "From ৳600" into a definite price nobody chose.
  **(6)** The card CTA labels are **fixed** — "Add to cart" + "Buy now", never "Select options".
  A cut that swapped the label once a variant became resolvable was really keying off *"the variants
  finished loading"*, and loading is triggered by hover, so the button relabelled itself under the
  cursor with no click. A control that rewrites itself on hover reads as a glitch, and
  "Select options" next to "Buy now" implied two destinations where the first press does the same
  thing for both. "Add to cart" opening a picker is the standard storefront behaviour.
  (`t.selectOptions` survives as the `compact` card's aria-label, where it is static.)
  **`Buy now` now goes to `/checkout` on the PDP too** (it opened the cart drawer until today) —
  the same word had to mean the same thing on both surfaces. The cart icon still opens the drawer.
  Also extracted `hooks/use-overlay-transition.ts` (SideDrawer + the sheet had identical mount/exit
  choreography) and added `compact` to `VariantSelector` so the flyout reuses its chip-disabling
  logic rather than forking it. i18n `fullDetails` + `chooseOption` ×3.
  **Not done:** the `compact` card template keeps its single "+" and has no Buy now — a dense row
  has no width for a second CTA. Approved design sample (4 patterns, tappable):
  claude.ai/code/artifact/7eb91177-5429-440f-bc01-a5db5ea04e4a.

- **Listing pagination is a merchant choice; search finally pages at all (FE + BE)** (2026-07-31):
  new `templates.pagination` — `pages` (the existing numbered pager, still the default) |
  `infinite` | `load-more` — applied to the collection page **and** search. Standard
  surface-template plumbing (BE model/validator/types/admin DTO; FE resolver + `StoreTemplates`;
  Customize → Templates card; preview bridge), plus `useStoreProductsInfinite`.
  **Search had no paging at all**: one `limit: 24` fetch, and the results line printed
  `items.length`, so a store with more matches silently dropped them *and* reported the truncated
  count as the total. That was live and is fixed here regardless of the mode chosen.
  Four things worth keeping: **(1)** the infinite key must exclude `page` and its `initialData`
  must be reshaped, or the SSR seed misses and the crawlable body goes back to a spinner;
  **(2)** `infinite` auto-loads only 2 pages before asking — the footer carries real navigation and
  the mobile bottom nav sits over it, so a truly endless list makes both unreachable, and a
  screen-reader user never reaches an end; **(3)** the IntersectionObserver is rebuilt when
  `loading` settles — an observer only reports *changes* in intersection, so one left mounted
  across a fetch never re-fires while the sentinel stays on screen and the scroll stalls one page
  in; **(4)** switching modes costs **no** crawl path, because the numbered pager was always
  buttons — page 2 has never had a URL on this storefront.
  Also fixed in passing: **the admin DTO omitted `templates.headerMenu`**, so the response stripped
  it, the Customize editor re-derived the legacy fallback on every load, and
  `navigation-section.tsx` could save that derived value back over an explicit choice. The public
  payload was never affected (`storeInfoDto.templates` is a `z.unknown()` passthrough), which is
  why the shop looked right while the editor did not. Locked down in the BE DTO round-trip test.
  New shared `components/storefront/{pager,load-more}.tsx` (the pager was inline in the collection
  view until search needed it); i18n `loadMore` ×3 and `showingOf` repurposed from an unused bare
  "Showing" into a `{n}`/`{total}` template, because Bangla puts the total first.
  OpenAPI + `types/api-generated.ts` regenerated.

- **PDP hover zoom + gallery extracted (FE)** (2026-07-31): the product page had no way to inspect a
  product image — the hero was a flat `<Media>` and the only detail available was whatever the
  1600px source showed at ~600px. Added hover-to-magnify (2.4×, origin tracking the pointer) in a
  new `components/storefront/product-gallery.tsx`, which also took over the thumb rail for **both**
  templates — the two layout branches were duplicated inline in `view.tsx` and each would have needed
  its own copy of the zoom. Three decisions worth keeping: **(1)** only `transform` transitions,
  never `transform-origin` — transitioning both makes the magnified area trail the cursor;
  **(2)** the handler bails on `e.pointerType !== "mouse"`, so a tap can't strand a phone in a zoomed
  state it has no hover-out to leave (this is why the feature needs no touch branch at all);
  **(3)** the "Hover to zoom" hint is a CSS-gated `(hover: hover) and (pointer: fine)` element with
  `pointer-events: none` — inline styles can't express the query, and without the pointer-events reset
  the badge swallows the pointermove that drives the zoom over its own corner. i18n `zoomHint` ×3,
  new `zoomIn` icon, `.sf-pdp-zoom*` in storefront.css, 3 tests on the clamped origin math.
  `view.tsx` 415 → 369 lines. **Still owed** (unchanged by this pass, deliberately): the buy box and
  sticky bar are inline, so that component is ~325 lines and the file carries no
  `// coding-standard: maintained` marker.

- **Social links 404'd on the shop itself (FE)** (2026-07-31): `hrefFor` only normalized WhatsApp and
  assumed "every other platform is stored as a full URL". Owners don't write URLs that way — one had
  saved `facebook.com/rkrashu`, which is a **relative** href, so the storefront's Facebook button
  navigated shoppers to a 404 on the merchant's own store. Found in a dev server log
  (`GET /facebook.com/rkrashu 404`, twice), not by any gate: nothing type-checks an `<a href>`.
  Now every value goes through `absoluteUrl` (schemeless → `https://`, protocol-relative → pick the
  scheme, already-absolute → untouched, including `http` — silently upgrading would break links that
  genuinely have no TLS). WhatsApp's phone branch is now selected by **shape** (`^[\d\s+()-]+$`)
  rather than by "has no scheme", which also stops `wa.me/8801…` being stripped to its digits.
  Fixed at render, not on save, so already-stored values are corrected. 5 tests in
  `social-links.test.ts`.

- **Live preview covers every Customize control (FE)** (2026-07-31): two controls didn't stream, out
  of fourteen that did, and the inconsistency read as a broken editor rather than a limit — the
  proposal on the table was to delete live preview entirely. That would have been the wrong trade:
  the bridge is `postMessage` into an iframe that mounts **once**, so an edit costs **zero** server
  requests, while "reload the preview after save" costs a full SSR render per save — and now a
  cache-missing one, since the save also flushes the tag. Closed the two gaps instead.
  **(1) Footer groups + the content-pages column**: `footer`/`contentPages` moved out of
  `navigation-section.tsx`'s local state up to `CustomizeWorkspace` (the same lift done for the
  announcement bar in July), into `nav.footer`/`nav.footerContentPages` on the payload, and
  `store-footer.tsx` now prefers them. The payload trims blank-titled groups **exactly like
  `submit()` does**, so the preview can't promise a column the save drops.
  **(2) Logo + banner**: these are saved by their own media PATCH the moment they upload, so they
  come straight off `settings` rather than a draft. They needed a **different override rule** from
  every other field: `null` is a real value ("removed"), so `draft ?? saved` would resurrect the old
  logo the instant a merchant deleted it. Hence `undefined` = nothing sent, and one shared
  `useSfPreviewImage(field, saved)` in the preview store rather than that rule re-derived in the
  four places that read an image (header, footer, favicon, home banner). The editor sends the
  **effective** logo (store logo ?? org logo), mirroring what the backend resolves for the public
  payload — sending the raw store logo would blank the header on removal.
  Non-preview rendering is byte-identical: with nothing streamed the helper returns the saved value.
  **Not done:** the bridge still accepts a message from any origin
  (`preview-bridge.tsx` checks `d.type` but never `e.origin`). Cosmetic-only impact, confined to
  whoever embedded the page, but it is two lines whenever this file is next touched.

- **Account nav → section strip on mobile (FE)** (2026-07-31): the account sidebar was a vertical
  list of five labelled rows plus logout — right as a 260px desktop column, but below 680px
  `--acctgrid` collapses and it stacked above the content as a **499px block, 62% of a 360×780
  screen**, so the whole first view was navigation. (It was *also* `position: sticky` inline, so it
  pinned there while the content scrolled underneath — fixed in the same pass.) Mobile is now a
  compact identity row with logout inline, plus a horizontally scrolling strip of icon chips:
  **499px → 149px**, content above the fold. Desktop is byte-for-byte the old sidebar (260px,
  sticky at 88px, 46px avatar, descriptions shown) — verified by measurement, not by eye.
  Implementation note worth keeping: it is **one** set of markup. `.sf-account-nav` is a grid whose
  `grid-template-areas` re-point at the breakpoint (`"identity logout" / "tabs tabs"` → three stacked
  rows), which is what lets the logout button move without a second copy of the nav. The active chip
  is scrolled into view on `activeKey` change, guarded on `scrollWidth > clientWidth` so it no-ops on
  desktop and never scrolls the page. Deep links (`?tab=`, `?tab=tracking&order=`) are untouched —
  the strip renders state the component already had. Approved design sample (3 options, measured):
  claude.ai/code/artifact/41602a8c-6ecf-4f34-a7bf-49d77bceb373.

- **Mobile responsiveness pass (FE)** (2026-07-31): audited every shop route in a real browser at
  320 / 360 / 740px, EN + বাংলা, signed-in and out. No page ever scrolled horizontally and the
  `--cols`/`--pdpgrid`/`--cartgrid` token system held up — the defects were all *inside* the
  breakpoints, which is exactly what a layout-only check misses. Eight fixes, all now standing
  rules under "Mobile rules" and "Overlays" above:
  **(1)** the product card's price row was an unwrapped flex row of up to three items in a ~130px
  card, so each money string broke mid-value and at 320px the struck compare-at was **clipped
  mid-digit** by the card's `overflow: hidden` — now `flexWrap` + per-amount `nowrap`.
  **(2)** touch targets: cart-drawer remove 15×15, cart-page remove 16×16, every drawer/sheet close
  20×20, filter option rows 20px tall, header toggles 18×18, hero dots **7×7** — all now ≥36px, icon
  buttons via `padding` + negative `margin` (new `tapPad`), the hero dot via a transparent 32×36
  button with the dot painted by `::before` (dots therefore sit further apart than before).
  **(3)** the cart drawer, filter drawer and menu sheet never locked body scroll (only the search
  takeover did) — extracted `hooks/use-body-scroll-lock.ts`, upgraded to the `position: fixed`
  recipe that actually holds on iOS, and adopted in all four.
  **(4)** `SideDrawer`'s footer had no `env(safe-area-inset-bottom)`, putting the cart's Checkout CTA
  under the iPhone home indicator.
  **(5)** every shopper input was 14px (12.5px in the filter panel) → iOS zoom-on-focus with no way
  back; six pasted copies of the same style object became `components/storefront/field-styles.ts`
  `sfInput` at 16px.
  **(6)** the `left` PDP template's fixed 62px thumbnail rail had no mobile branch and took 23% of the
  width (hero 254px on a 360px phone) — new `.sf-pdp-*` classes flip it to a scrollable strip under a
  full-width hero below 680px (hero 254→328px). Thumbs are fixed-width, **not** `flex: 1`: the images
  are square, so a single-thumbnail product would have stretched one as large as the hero.
  **(7)** `.sf-hero`'s flat 430px was 76% of an iPhone SE viewport and 89% in landscape (where the
  3-row desktop header ate the rest and no product was visible) — now capped in `svh`.
  **(8)** sub-11.5px text (bottom-nav labels, cart badges, the "Verified" pill).
  Desktop verified unchanged at 1280px: hero 430px, PDP rail still a 62px `row`, footer density
  identical (the footer link padding is mobile-only, reset in the ≥680px block).
  **Not done:** `app/(storefront)/shop/products/[productSlug]/view.tsx` is 412 lines in one ~380-line
  component and breaches the file-size rule — the gallery fix was kept minimal by design, so
  splitting the gallery / buy box / sticky bar into their own components is still owed. *(Gallery
  split done 2026-07-31 with the hover-zoom entry above; buy box + sticky bar still owed.)*

- **One canonical host per store (BE + FE)** (2026-07-28): closed the duplicate-content hole — a shop
  with a custom domain was fully indexable on **both** that domain and `{slug}.ezycore.com/shop`, each
  canonicalizing to itself. BE `getStoreInfo` gained **`canonicalHost`**, picked by new
  `canonicalStoreHost` (`utils/tenant-host.ts`). **`isPrimary` turned out to be unusable as-is**: it is
  seeded `true` on the subdomain at signup and `false` on custom domains and nothing ever flips it, so
  honouring it literally would have canonicalized every branded shop back to `{slug}.ezycore.com` —
  the opposite of the intent. Rule is therefore "active custom domain wins", with `isPrimary` only
  breaking ties between custom domains and oldest-first otherwise. Found mid-change that
  `domain.service.activeCustomDomain` already answered the same question (first doc-order match) for
  shopper-email links — consolidated onto the shared picker rather than shipping a second one, so an
  email and a canonical tag can't name different hosts. FE: new `lib/storefront-canonical.ts`
  `canonicalTarget`, threaded through `storePageMetadata`, the home metadata, the PDP JSON-LD and
  `app/sitemap.ts`.

- **JSON-LD + real 404s (FE)** (2026-07-28): the storefront emitted **zero** structured data, so no
  result could ever carry a price or stock state. Added `lib/storefront-jsonld.ts` (`productJsonLd` /
  `storeJsonLd` / `breadcrumbJsonLd`, 10 tests) + `components/storefront/json-ld.tsx` (server
  component; escapes `<` → `<`, since `JSON.stringify` does not and a merchant description
  containing `</script>` would otherwise break out of the tag). PDP → `Product` + `BreadcrumbList`,
  home → `Organization` (logo/contact/`sameAs`, non-URL socials filtered). Offer logic reads
  **variants first** because a VARIABLE product leaves `product.price` null — caught during live QA:
  the first cut required `>1` variant and so emitted no offer at all for a single-variant product.
  A null price emits no offer rather than a zero. Separately, missing products and CMS pages answered
  **200** with "not found" text (soft 404s); they now `notFound()` into a new
  `shop/not-found.tsx` — gated on `store && !product` so a backend outage can't 404 a live URL. The
  "Store unavailable" layout branch gained an explicit `noindex` (it still answers 200; a layout
  can't set a status).

- **Storefront made crawlable: SSR-seeded pages + robots/sitemap (FE + BE)** (2026-07-27): the
  three indexable route families rendered a **spinner as their SSR HTML** — `products/[productSlug]`,
  `products` and `pages/[pageSlug]` each returned a bare `<View />`, and `useStoreProduct` /
  `useStoreProducts` / `useStorePage` had no `initialData` (unlike `useStore`/`useStorePages`/
  `useStoreCampaigns`, which `shop/layout.tsx` already seeded). Titles and OG tags were correct;
  the body was empty. Each `page.tsx` now fetches server-side and seeds the view — on the PDP and CMS
  page that is the same fetch `generateMetadata` already made, so it's a fetch-cache hit, not a second
  round trip. New `lib/storefront-catalog-params.ts` owns the collection page's URL contract
  (`catalogSearchParams` / `catalogQueryParams` / `catalogCanonicalQuery` / `isIndexableCatalogUrl`)
  because the params object is the query key and the two sides must build it identically.
  **Faceted-URL policy** added at the same time (SSR-seeding filtered URLs would otherwise have made
  the crawl trap *better* indexed): a plain listing or a single category/brand facet self-canonicalizes
  and indexes; price/inStock/sort/multi-facet get `noindex, follow` and **no** canonical.
  `storePageMetadata` gained a `follow` option and now omits the canonical when `path` is absent.
  **New `/robots.txt` + `/sitemap.xml`** (`app/robots.ts`, `app/sitemap.ts`, both force-dynamic) —
  there were none at all. Host→store resolution was extracted out of `proxy.ts` into
  **`lib/storefront-host-map.ts`** (`resolveStoreFromHost` / `isCustomDomainCandidate` /
  `resolveStoreForHost` / `hostnameOf`) because the proxy matcher skips dotted paths, so these two
  routes never see the `x-ezy-store-*` headers and must resolve the host themselves; `proxy.ts` is now
  a consumer of that module rather than the owner of the rules. BE: new
  `GET /api/storefront/:slug/sitemap` (`services/storefront-sitemap.service.ts` + `storefrontSitemapDto`)
  returning identifiers only — it emits `storefront.slug ?? slug`, drops `hide`-behavior products at
  zero stock, and includes **all** published CMS pages (not just footer-flagged ones). Contract test
  seeds those exact awkward states. OpenAPI + `types/api-generated.ts` regenerated.

### Earlier

- **Compare-at precedence → highest-anchor-wins (BE)** (2026-07-22): when a campaign AND a manual
  compare-at both apply, the price is the campaign (lowest) price and the strikethrough is now
  `max(campaign pre-discount price, manual compareAtPrice)` — not "campaign wins, else manual". Owners
  want the biggest legitimate saving shown (e.g. online 80 + manual "was" 120 + 20% campaign → **64 ·
  ~~120~~**, not 64 · ~~80~~). Changed in `storefront.service.ts` `toCatalogProduct` (single; product-level
  manual still gated `!isVariable`) and `priceVariant` (per variant) — both build an `anchors[]` and take
  the max, still never rendering an anchor ≤ the shown price. Price/charged unchanged (still the lowest
  campaign price; `resolveItems` unaffected). No DTO/api-types change (shape identical). Test:
  highest-anchor case in `storefront-products.test.ts`.

- **Per-variant storefront pricing overlay (variable products can discount online) (FE + BE)**
  (2026-07-21): variants had NO storefront overlay — a variant's POS `price` was its only price, so a
  merchant couldn't show "৳80, was ৳100" on a variable product's option (only a Campaign could). Added
  `storefront: { onlinePrice?, compareAtPrice? }` to `VariantProductModel` (+ `Variant` type). Storefront
  read (`storefront.service.ts` `priceVariant`): base = `v.storefront?.onlinePrice ?? v.price`, and a
  manual per-variant `compareAtPrice` anchors the struck "was" (highest-anchor-wins vs any campaign base —
  see the 2026-07-22 entry) — so card ("From ৳X" cheapest) AND PDP variant selector both reflect the override. `resolveItems`
  charges `variant.storefront?.onlinePrice ?? variant.price` (shown == charged); both variant selects gained
  `storefront`. Admin: **`GET /ecommerce/catalog/:id/variants`** (new — `catalogService.listVariantPricing`,
  `catalogVariantDto` array: `_id/label/attributes/price/onlinePrice/compareAtPrice`) feeds the editor, and
  `PATCH /ecommerce/catalog/:id` now accepts a **`variantPricing`** JSON array (parsed in the controller,
  `catalogService.updateVariantPricing` bulk-writes each variant's `storefront.*` — number sets, `null`
  `$unset`s, foreign variant → `VARIANT_NOT_FOUND`). FE: the editor (`product-online-editor.tsx`) lazily
  loads variants for a variable product (`useCatalogVariants`, gated on type) and renders an editable
  per-variant row (online price + compare-at) via the extracted
  `components/ecommerce/catalog/variant-pricing-fields.tsx` — replaces last pass's read-only range. The
  **product-level** compare-at manual fallback stays gated `!isVariable` (variable uses per-variant), so
  nothing double-applies. Tests: variant read (`storefront-products.test.ts`), charged==shown order
  (`storefront-order.service.test.ts`), list/set/clear/foreign-variant (`catalog.service.test.ts`).
  OpenAPI + `types/api-generated.ts` regenerated (new `CatalogVariant` schema + `variantPricing` request).

- **Catalog online-listing editor fields were half-dead → now wired to the storefront (FE + BE)**
  (2026-07-21): the per-product **Online listing** editor (`components/ecommerce/catalog/
  product-online-editor.tsx`, opened from the Catalog → Products table) saved 12 fields but **6 did
  nothing on the storefront** — `toCatalogProduct` returned the POS `name`/`slug`, compare-at came
  only from campaigns, and `outOfStockBehavior`/`seo`/`onlineTitle`/`slug` had zero read consumers.
  Wired end to end in `storefront.service.ts`: **onlineTitle** overrides the card/PDP name,
  **storefront.slug** overrides the URL (`getProductBySlug` matches it via `$or`, base slug still
  resolves — old links keep working), **manual compareAtPrice** renders as the strikethrough "was"
  price when no campaign supplies one and it's genuinely higher, **seo.title/description** ride the
  payload and drive the PDP `<title>`/meta (`app/(storefront)/.../products/[productSlug]/page.tsx`).
  **outOfStockBehavior** is real now: **"hide"** drops a product from listings + 404s its page once
  live stock is 0 (`listProducts` routes hide-stores through `listProductsComputed`, which already
  prices/counts in memory so pagination totals stay correct; `getProductBySlug` 404s), and
  **"backorder"** keeps the buy button live past zero stock (FE `view.tsx` + `product-card.tsx` gate on
  a new `soldOut = outOfStock && !canBackorder`; `maxQty<=0` = uncapped in `use-cart-store`; i18n
  `backorder` ×3). **Backorder is capture-only by design** — `resolveItems` lets the order be placed
  past on-hand stock but the order sits `pending`; confirm→`reserveStock` and commit→`createSale` stay
  the ≥0 guard, so the merchant reserves/ships once restocked (no invariant broken). Also fixed the
  **can't-clear bug**: the editor only ever `$set` fields, so an emptied value never cleared — now it
  sends `clearFields` (JSON) that the catalog service `$unset`s, and a **slug-uniqueness guard**
  (`SLUG_IN_USE`) rejects a storefront slug already used by another product. Contract: `storefront.dto`
  gained `seo` + `outOfStockBehavior` (else `respondFor` strips them); `catalog.validator`/controller
  gained `clearFields`. **Variable products** price PER VARIANT (`VariantProductModel.price` — there is
  NO per-variant storefront overlay; the variant's POS price IS its online price, campaign-adjusted),
  so the product-level **Online price is inert** for them (`cardPrice` never reads `storefront.onlinePrice`
  for VARIABLE) and the manual **compare-at is now gated `!isVariable`** in `toCatalogProduct` (card +
  PDP stay consistent — both per-variant). The catalog editor hides the Online price / Compare-at inputs
  for a variable product and shows the read-only variant price range + a "set prices in the variant
  manager" note (`product-online-editor.tsx`), and `save()` never writes/clears those fields for it.
  The OTHER overlay fields (title/slug/description/SEO/gallery/hide/backorder/weight) are product-level
  and DO apply to variable products (hide uses summed stock; backorder applies to every variant line).
  Tests: `storefront-products.test.ts` (7, new — incl. the variable per-variant pricing case) +
  backorder ×2 in `storefront-order.service.test.ts` + clear/slug ×2 in `catalog.service.test.ts`.
  OpenAPI + `types/api-generated.ts` regenerated.

- **Checkout settings were dead → now enforced (FE + BE)** (2026-07-21): all four admin
  Settings → Checkout controls (`termsRequired`, `requiredFields`, `minOrderValue`, `orderPrefix`)
  saved + round-tripped but were consumed by **nothing** — the checkout view hardcoded its field gates,
  `placeOrder` never checked terms/min/fields, and `generateOrderNumber` hardcoded `ORD-`. Wired end to
  end: FE checkout view (`app/(storefront)/shop/checkout/view.tsx`) now drives `contactComplete`/
  `deliveryComplete` from `store.checkout.requiredFields` (name/phone always required; district+area
  forced when zone shipping is on), blocks submit below `minOrderValue` with a notice, and renders an
  "agree to terms" checkbox when `termsRequired` (submit sends `termsAccepted`). `StoreInfo.checkout`
  gained `requiredFields`; `PlaceOrderInput` gained `termsAccepted` (`lib/storefront-client.ts`); i18n
  +2 keys ×3 (`agreeToTerms`, `minOrderNotice`). Admin locks name/phone as always-required
  (`ecommerce/settings/page.tsx` `CheckoutTab`). BE: `placeOrder` enforces all three rules
  (`TERMS_NOT_ACCEPTED` / `BELOW_MIN_ORDER` / `MISSING_REQUIRED_FIELDS`) and threads `orderPrefix` into
  `generateOrderNumber(orgId, prefix)`; `PlaceOrderDto` + `placeOrderSchema` gained `termsAccepted`; the
  delivery-address requirement moved from the validator's `superRefine` into the service (only there can
  it read per-store `requiredFields`). Tests: 5 new cases in `storefront-order.service.test.ts`.
  **Terms link → a CMS page**: `checkout.termsPageSlug` (new across model/validator/types/organization
  DTO + FE `StoreInfo.checkout`/`StorefrontCheckout`) picks which content page the "terms & conditions"
  link opens. Resolution in the checkout view: explicit `termsPageSlug` (if it still resolves against
  `useStorePages`) → else a published page slugged like `terms` (`/^terms($|-)|^tos$|conditions$/i`) →
  else **plain text, no dead link**. i18n `agreeToTerms` became a `{terms}` template + `termsLinkLabel`
  (so only the terms phrase links, word-order-safe for bn); the `<a>` sits inside the `<label>` — clicking
  an interactive descendant of a label doesn't toggle its checkbox (HTML spec). Admin Checkout tab shows a
  "Terms page" `SimpleSelect` (published pages; `__auto` sentinel = auto-detect) only when the toggle is on.
  **`termsAccepted` (new field on `POST /storefront/{slug}/orders`, generated from the validator) AND the
  admin `checkout.termsPageSlug` DTO change mean backend OpenAPI + FE `api-generated.ts` were regenerated.**

- **Footer → groups-as-columns + controllable content-pages** (2026-07-21): the Columns/Rich footer
  used a fixed `2fr 1fr 1fr` grid that stacked EVERY merchant group inside one middle cell (adding a
  group made that column taller, never wider) and always rendered the auto "Information" block with no
  way to hide it. Rebuilt: each `nav.footer` group is now its own auto-flowing column (`.sf-footer-*`,
  grid ≥680px / accordions below), and a new **`nav.footerContentPages { show?, title? }`** setting hides
  or renames the content-pages column. Absent ⇒ shown with the built-in "Information" heading (legacy
  behaviour preserved). Contract added across BE (types + validator `navSchema` + model `nav` block +
  admin `storefrontSettingsDto.nav`; public `storeInfoDto` keeps `nav: z.unknown()` passthrough, so no
  public-DTO change) and FE (`StorefrontNav`/`StoreNav`). `store-footer.tsx` (was ~330 lines) split into
  `components/storefront/footer/{footer-pieces,footer-variants}.tsx`. Simple footer stays a flat link row
  (drops titles by design) but now honours the show toggle. Admin: Customize → Navigation
  `footer-links-card.tsx` gained the content-pages Switch + heading input, wired through
  `navigation-section.tsx`'s wholesale `nav` save. Mobile groups collapse to `useState`-driven
  accordions (SSR-safe: render open, no hydration flash; desktop heading inert + always-open via CSS
  `!important`). Footer wasn't live-previewed then — only the variant streamed (**superseded
  2026-07-31**: groups and content-pages now stream too).
  BE DTO round-trip test extended (`organization.dto.test.ts`). Dead `--footcols` var
  removed. `verify:api-types` needs a regen (admin DTO changed). Approved design sample:
  claude.ai/code/artifact/49d51fad-2a9d-4302-b686-d298f621f67e.

- **Announcement bar → richer + live-previewed** (2026-07-20): the Customize → Navigation
  announcement bar gained `textColor` (blank ⇒ auto `readableTextOn(bgColor)` — the old sole
  behaviour), `icon` (leading emoji), `ctaLabel` (explicit button vs whole-bar link), `dismissible`,
  `size` (sm|md|lg), **and a background image** — `bgImage` (uploadInfo) + `overlay` colour +
  `overlayOpacity` (0–100) + `bgFit` (`cover` photo | `tile` pattern), for festival/seasonal strips
  (Halloween/Eid/Black Friday). All added across the 5 contract layers (BE model + validator +
  `storefront-settings.types` + admin `storefrontSettingsDto`; the public `storeInfoDto` keeps
  `nav: z.unknown()` so new fields pass through untouched). FE reads the hand-written types
  (`StorefrontAnnouncement` in `types/index.ts`, `StoreAnnouncement` extracted in
  `storefront-client.ts`) — `api-generated.ts` isn't consumed here, but the BE DTO change means
  `verify:api-types` needs a regen. Render extracted from `store-shell.tsx` into
  `components/storefront/announcement-bar.tsx` (icon + CTA + size + auto/explicit fg + bg image with a
  readability overlay layer, fg defaults white over an image; dismiss via the `close` sf-icon,
  persists per-device as `sf-ann-{slug}` keyed to `text|link` so a changed message re-shows, disabled
  while the preview is active). Reuses `HeroCtaLink` — which also **fixed a latent bug**: the old
  inline announcement link ignored `base`, breaking `/products` on `{slug}.domain/shop` hosts.
  Image upload reuses the shared `MediaField` + a new `announcement-bg-field.tsx`, and the
  hero-slide image uploader was **generalised** to `useUploadStorefrontImage` / `uploadStorefrontImage`
  (same `POST …/media/hero-slide` route; the BE validator's `slideImageSchema` → shared
  `storefrontImageSchema`); the settings PATCH now cleans up a dropped/replaced announcement image
  the same way it does dropped hero slides. **Live preview**: the announcement draft was lifted from
  `NavigationSection` up to `CustomizeWorkspace` and streams via the postMessage bridge
  (`nav.announcement` in the payload → `use-sf-preview-store` `announcement` → `preview-bridge` →
  `store-shell` prefers the override) — the bar was previously edited blind, as the footer still was
  at the time (**superseded 2026-07-31**). i18n
  +1 key ×3 (`dismiss`). Both repos typecheck clean.

- **Header search → in-place typeahead** (2026-07-20): the header "search bar" used to be a
  button styled as an input that navigated to `/search` on click (the field never took a
  keystroke). Replaced with a real typeahead: focus shows recent searches (localStorage
  `sf-recent-{slug}`, ≤5, with Clear) + top category chips; typing (debounced 300ms) shows the
  top 6 matches (thumb, highlighted match, campaign-aware price w/ strike, OOS badge, category
  subtitle) with `↑↓`/`Enter`/`Esc` keyboard nav. `Enter`/"Show N results" still land on the
  existing `/search?q=` page (unchanged; it already reads `?q`). One controller hook
  `services/storefront/use-header-search.ts` (query + debounced `useStoreProducts(slug,{q,limit:6})`
  — same hook/cache as the search page, **no backend change** — recents, keyboard) + one panel
  `components/storefront/header-search-panel.tsx`, driving three anchors in
  `components/storefront/header-search.tsx`: `HeaderSearchBar` (classic: focus-opens a popover),
  `HeaderSearchIcon` (minimal/centered: the icon expands a full-width layer under the sticky
  header — anchored via a `display:contents` wrapper so the layer resolves against the header),
  `HeaderSearchMobile` (mobile: full-screen takeover sheet, body-scroll locked). The header never
  unmounts across routes, so the controller **clears the input on any navigation off the /search
  page** (`usePathname` vs `storeHref(base,"/search")`) — otherwise a committed term lingered in
  the box on Home/product/category pages; the /search page keeps the term (matches its own input).
  The typeahead fetch is gated on the panel being `open` (passed into the hook) so a retained term
  never fires a background request. `goSearch`
  retired from `use-cart-nav.ts` (`useCartNav(slug)` now). Styling = new `.sf-search-*` classes in
  `storefront.css` (focus ring, pop-in, sheet fade, row/chip hover; reduced-motion aware). i18n
  +2 keys ×3 (`recentSearches`, `categoriesLabel`); reuses `showResults`/`noResults`/
  `viewAllProducts`/`cancelEdit`/`clearAll`. Approved design sample:
  claude.ai/code/artifact/c3361a6f-2d0c-4cff-a452-5e9f95886e15.

- **Product-list filters + public brand facet** (2026-07-19): the shop `/products` page gained a
  full filter system — Category · Brand · Price range · "In stock only" — plus server-side sort
  (Featured/Newest/Price ↑↓), removable active-filter chips, and a Filters button with an
  active-count badge. One `FilterPanel` (`components/storefront/filter-panel.tsx`), two homes:
  inline aside on the Sidebar collection template (≥680px) and a LEFT `SideDrawer` everywhere
  else (grid templates at all sizes + sidebar mobile). **`SideDrawer`**
  (`components/storefront/side-drawer.tsx`) is the cart drawer's shell extracted (scrim + panel +
  pinned header/footer, Esc closes; cart drawer now renders through it) — never hand-roll a
  storefront drawer. It animates via `.sf-drawer*` classes in storefront.css (slide + scrim fade,
  reduced-motion aware); the component stays mounted through the exit transition, so callers pass
  `open` straight through (no early-return-null around it). Chips/Filters-button live in
  `filter-toolbar.tsx`; sort uses **`SfSelect`** (`components/storefront/sf-select.tsx`) — the
  storefront-native dropdown (button trigger + popover listbox, keyboard + outside-click), sharing
  its menu card/row styles with the checkout Combobox via `menu-styles.ts`. Use it over a bare
  `<select>` (OS picker, unthemed) and over the admin Radix `SimpleSelect` (Tailwind tokens). Everything is
  URL-driven — `?brandId=&minPrice=&maxPrice=&inStock=1&sort=` extends the `?categoryId=`
  pattern; filters apply instantly (no staged Apply) and a brand-only filter makes `/products`
  that brand's landing page (h1 = brand name). BE: public `GET /:slug/brands` (auto-curated:
  active, non-`isDefault`, ≥1 listed active product; productCount, alphabetical) and
  `listProducts` grew the params. **Price bounds / price sorts / inStock take a computed path**
  (`listProductsComputed`): displayed price (campaign-priced; variable = cheapest variant via the
  extracted `cardPrice`) and availability don't live in the products collection, so the service
  prices every match from a skinny projection, filters/sorts in memory, then hydrates just the
  page — pagination totals stay correct. Tests: `storefront-brands.test.ts` (8) + brands in the
  DTO contract test. i18n +11 keys ×3. OpenAPI + `types/api-generated.ts` regenerated. Parked
  (approved design, artifact `fff70e82`): homepage "Shop by brand" strip + PDP brand line —
  both cheap now that `/brands` exists.

- **Ecommerce list-page dedup** (2026-07-19): orders/customers/catalog now share
  `components/ecommerce/list-search-input.tsx` + `list-pagination.tsx` (see Admin ecommerce
  pages above). Catalog gained the previously missing search debounce (it used to fetch per
  keystroke) and dropped its awkward `DataCardPagination` shim. Deleted the never-imported
  DataTable leftovers in the orders component folder (columns / filter-config / barrel index) —
  the orders page ships its own `OrderRow` table, so that wiring was dead code.

- **Storefront toasts → top-center + drawer dedup** (2026-07-19): "Added to cart" used to
  land bottom-right ON TOP of the cart drawer's footer CTAs (global root-layout Sonner).
  New `lib/storefront-toast.ts` wrapper (per-toast `position: "top-center"`, sonner 2.x)
  adopted by all 16 storefront toast call sites; drawer dismisses in-flight toasts on open;
  PDP `add(notify)` flag lets Buy now skip the toast (the drawer is the confirmation).

- **Cart template retired → Buy now always opens the drawer** (2026-07-19): `templates.cart`
  removed end-to-end (same sweep as `templates.search` below: FE resolver/client/types +
  admin card + seed `delete seed.cart`; BE model/validator/types/DTO; OpenAPI +
  `api-generated.ts` regenerated). The only thing it ever controlled was where the PDP's
  Buy now landed (drawer vs /cart page) — the /cart page itself never varied and the header
  cart icon already always opened the drawer. Buy now now opens the drawer unconditionally
  (`products/[productSlug]/view.tsx` `buyNow`); /cart stays reachable via the drawer's
  "View cart". CDP-verified: Buy now keeps the PDP url and the drawer opens with Checkout.

- **Search-results template retired → shopper grid/list toggle** (2026-07-19): the admin
  Templates "Search results" card is gone and `templates.search` was removed end-to-end
  (FE `storefront-templates.ts` / `storefront-client.ts` / `types/index.ts`, admin seed
  `delete seed.search`; BE model + validator + types + organization DTO; OpenAPI and
  `types/api-generated.ts` regenerated). The shop `/search` page now owns the choice: a
  grid ⇄ list segmented toggle on the results row, persisted per device as
  `sf-search-view` (applied post-mount so the first client render matches SSR), new
  `list` icon in `sf-icons.tsx`, `gridView`/`listView` i18n keys ×3. Old saved
  `templates.search` values are harmless — zod strips unknown keys on PATCH.

- **Customize rail width toggle** (2026-07-18): the left rail expands 380↔560px via a
  ⇔ icon button beside the section tabs (lg-only, per-visit state, grid-template-columns
  animated; panels opened while wide inherit the width). Chosen over a drag resizer and a
  hide-preview button after an interactive options mock
  (claude.ai/code/artifact/c994f91d-82e3-4ab5-bc70-775c5ac62d0f) — hide-preview was
  rejected because it kills the live edit-see loop the page exists for.

- **Theme rail redesign (settings-list accordion) + logo inheritance** (2026-07-18):
  Customize → Theme's six stacked cards became ONE surface in `components/ecommerce/theme/`:
  `theme-section.tsx` (container: accordion state, dirty flag, save; slides group inline) +
  `theme-group.tsx` (collapsible row primitive: icon chip / title / live one-line summary) +
  `theme-capsule.tsx` (pinned mini-storefront strip repainting with the brand/accent draft) +
  `preset-group.tsx` (presets as mini storefront previews) + `colors-group.tsx` (pickers +
  light/dark **contrast check** strip) + `media-field.tsx` (`MediaField` moved out of the
  page; uploads still save instantly) + `footer-group.tsx` (footer © text + trust badges,
  icon picker now a Popover; exports `DEFAULT_BADGES`) + `banner-hero-fields.tsx` (ex
  `banner-hero-card.tsx` minus the Card wrapper; still exports `cleanHeroBanner`).
  Groups: Preset · Brand colors · Logo · Hero slides · **Banner hero** (image + copy in one
  group — they compose one storefront card) · Footer. **Store logo inherits the org logo**:
  `getStoreInfo` serves `s.logo ?? org.logo` (BE), so merchants upload once in org settings;
  the Logo group shows the inherited mark ("Using your organization logo") and an upload
  there is a store-only override (remove ⇒ back to inherited). Save payload, props from
  CustomizeWorkspace, and preview streaming unchanged; sticky save bar shows an amber
  "Unsaved changes" dot (media uploads don't trip it). Approved sample:
  claude.ai/code/artifact/8b213c7c-35d0-4ac1-afd6-495c2b3b11b6.

- **Editable banner-hero copy (`heroBanner`)** (2026-07-18): the static banner hero's
  badge/title/subtitle and its two buttons (labels + links) are merchant-editable.
  `StorefrontSettings.heroBanner` (BE model/validator/organization+storefront DTOs +
  `getStoreInfo` payload; all fields optional) → FE `StoreHeroBanner`
  (`lib/storefront-client.ts`) / `StorefrontHeroBanner` (`types/index.ts`). Classic +
  Hero Split fall back **per-field** to the built-in bilingual copy (`hb?.x || t.x`);
  a custom badge also beats the live campaign badge; Hero Split renders the badge as
  its uppercase kicker; Minimal's typographic hero is deliberately untouched. Buttons
  render through the shared `HeroCtaLink` (`home-shared.tsx` — full URL = new tab,
  else `storeHref(base, …)`, empty = `/products`; the carousel's `SlideCta` now uses
  it too). Admin: Customize → Theme → **"Banner hero"** group
  (`components/ecommerce/theme/banner-hero-fields.tsx`; placeholders = the standard EN
  copy; saved by Save theme via `cleanHeroBanner` — blank field ⇒ built-in copy, so custom
  text replaces BOTH languages as-is); preview store + bridge stream `heroBanner`.

- **Explicit header-menu source + Navigation folded into Customize** (2026-07-18): the store
  header's top links used to be an invisible either/or (custom menu wins if non-empty, else raw
  categories). Now `templates.headerMenu: "collections" | "custom"` — resolved via
  `resolveHeaderMenu` (`lib/storefront-templates.ts`, tested): **unset = legacy fallback**
  (non-empty `nav.header` → custom) so old stores' headers don't silently change; never default it
  to "collections" blindly. `nav.header` items support **`type: "collections"`** — a block that
  expands inline to the listed collections via `expandHeaderMenu` (`header-nav.tsx`, tested),
  applied ONCE where `ctx.headerMenu` is built in `store-header.tsx` (covers all variants +
  preview; expanded links are id-based `/products?categoryId=` so slugless cats work). Admin:
  Customize gains a **Navigation** section (`components/ecommerce/navigation/*` — navigation-section,
  header-menu-card w/ source picker, menu-item-fields, announcement-card, footer-links-card) and a
  **CollectionsPanel** rail takeover (`components/ecommerce/collections/*`; HeroSlidesPanel
  pattern — draft + snapshot Cancel, diff-based save; while open the preview forces
  `headerMenuSrc="collections"`). Shared `CollectionRow`+`toRowValue` also drive Catalog →
  Collections (kept, instant-save, with a state-aware banner cross-linking
  `customize?section=navigation`). Preview bridge streams `templates.headerMenu`, `nav.header`,
  and draft `collections` (listed-only, `displayName||name`, real ids — mirror of public
  `GET /:slug/categories`); `store-home.tsx` re-attaches category images to the draft by id.
  Customize reads `?section=` (Suspense-wrapped `useSearchParams`).

- **Dynamic custom-domain → store routing** (2026-07-13): closed the gap between Settings →
  Domains and the storefront proxy. BE: `GET /api/public/store-by-host?host=` in
  `public.routes.ts` (reuses `resolveOrgHost`; active domains only; tests
  `public-store-by-host.test.ts` 5/5). FE: `lib/storefront-domain-lookup.ts` (cached fetch,
  never throws) called from `proxy.ts` when static resolution misses; env map kept as manual
  override. Verified e2e in dev via temporary env flips (BE `ROOT_DOMAIN` set + FE storefront
  root blanked → `Host: rmc41.ezycore.com` rendered the store at root, `/shop` 307'd to `/`,
  unknown hosts fell to the admin gate). Also fixed the prod outage: `Dockerfile` + `deploy.yml`
  now pass `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` (was never baked → every shop "unavailable").

- **Customize left rail = fixed-height sticky column** (lg+): the rail matches the preview's
  height, sections scroll INSIDE it with their Save buttons pinned at the bottom, and the slides
  panel fills the same frame (pinned header/footer, scrolling rows) — eliminates the height-jump
  "blink" when the panel takes over. Mobile keeps natural flow (all `lg:` gated).
- **Hero slides edit-in-place panel**: slide editing moved out of the Theme scroll into
  `components/ecommerce/hero-slides-panel.tsx` — a takeover of the Customize LEFT rail (never a
  modal/right-drawer: those would cover the live preview). Collapsed rows (SlideThumb + title,
  expand one at a time), own footer **Save slides** (PATCHes only `heroSlides`) / Cancel-back-Esc
  (restores an on-open snapshot). Opened from the Home template block's edit/add icon AND the Theme
  section's compact "Hero slides" summary card ("Manage slides"); while open, BrowserPreview forces
  `heroSrc="slides"` so edits always show. Theme's "Save theme" no longer saves slides.
  `hero-slides-editor.tsx` deleted (superseded); shared `slide-thumb.tsx` added.
  Design sample: claude.ai/code/artifact/09f51325-0c70-4b4d-9359-569d99895bcd.
- **Hero source switch (`templates.hero`: slides|banner)**: explicit control over what the home
  hero shows — carousel (when slides exist) or the static banner hero — so slides can stay saved
  but hidden. Standard surface-template plumbing (BE model/validator/types, FE `HERO` map in
  `storefront-templates.ts`, default `slides`); `store-home.tsx` withholds `heroSlides` from
  templates when resolved source is `banner`; preview store/bridge carry `heroSrc` (rides
  `templates.hero` in the postMessage payload). Admin Templates "Home page" card redesigned →
  `components/ecommerce/home-template-block.tsx` (wireframe layout tiles + "Hero area shows"
  segmented control w/ slide-count chip, zero-slides warning + jump-to-Theme, Minimal note).
  Banner MediaField now documents its double duty (static hero + og:image, `shop/page.tsx`).

- **Home hero slides (carousel)**: `StorefrontSettings.heroSlides[]` (max 5; image?/badge?/title/
  subtitle?/buttonLabel?/link?) → public payload → `components/storefront/hero-carousel.tsx`
  (`.sf-hero-*` in storefront.css; crossfade, 5s autoplay w/ progress dots, hover pause/arrows,
  swipe, reduced-motion; imageless = brand-tinted panel, image = scrim; CTA has a white border for
  near-black brands). Renders on Classic + Hero Split when slides exist (Minimal keeps its hero;
  empty = static hero). Admin: Customize → Theme → `hero-slides-editor.tsx`; slide image upload =
  `POST /organization/storefront/media/hero-slide` (`useUploadHeroSlideImage`), settings PATCH
  cleans up dropped slides' Cloudinary images; live preview via preview store/bridge `heroSlides`.
  Approved design sample: claude.ai/code/artifact/2ea161da-ea0a-4d15-9c31-00a3110804f1.

- **Slugless seed data fix**: org-signup seeding `insertMany`s categories/brands/customers/suppliers,
  but `slugPlugin` only hooked `pre("save")` → every seeded doc had NO slug. Symptom: admin
  Navigation category select crashed (Radix forbids `<SelectItem value="">`). Fixed: plugin now has
  an `insertMany` hook (+ in-batch dedupe); nav page filters slugless categories from options;
  one-time heal = `npx tsx -r dotenv/config src/scripts/backfill-slugs.ts` (idempotent, must be
  run per environment). Tests: `src/utils/__tests__/slugPlugin.test.ts`.
- **Collections overlay now live on the shop (BE fix)**: public `GET /:slug/categories` previously
  ignored `Category.storefront` — the admin Catalog → Collections tab (display name, Listed,
  reorder) saved settings no shopper saw. `listCategories` now filters `isListed`, serves
  `displayName || name`, and sorts via the shared `src/utils/collection-order.ts`
  `compareCollections` (also used by admin `listCollections`, so orders match). Response shape
  unchanged (`_id`/`name`/`slug`) — no FE change. Tests: `storefront-categories.test.ts`.

- **Verification gates ordering**: backend 403 `VERIFY_EMAIL_TO_ORDER` + checkout `VerifyEmailGate`;
  fixed pre-existing checkout hydration bounce. Proven end-to-end incl. the real emailed-token path.
- **Post-signup verify screen**: manual signup lands on the two-mode `/account/verify-email`
  interstitial instead of the profile (checkout `?next=` still wins).
- **Social login**: Google/Facebook OAuth code flow (above) + resend-verification endpoint +
  account verify banner + 401 session self-cleanup.
- **Shopper auth audit**: register/login/verify/forgot/reset all live-tested; fixed `sfFetch`
  swallowing API error messages ("Request failed (N)" → real text).
- **Footer social links admin UI** (Store Settings → General) + WhatsApp wa.me normalization.
- **CMS content pages**: markdown parser/renderer + FAQ `Q:`/`A:` cards + page template redesign;
  admin body field documents the syntax.
- **Invoice unification + A4 redesign**: storefront/admin order invoices moved onto the shared
  letterhead print engine (`print-storefront-order.ts` adapter); engine's A4 output redesigned
  (two-column head, ruled table, right-aligned totals). Committed: FE `90f8988`, BE `e4d97fe`.
- Earlier phases (committed via dev merge): surface templates, product variants on the PDP,
  account area redesign (Rashid's Mart design), shopper-auth fixes, checkout steps/zones/coupons,
  custom domains, storefront SEO metadata, bilingual i18n, dark mode.

## Gotchas that have bitten before

- **Prod "Store unavailable" on every shop = missing build-arg** (bit us 2026-07-12):
  `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is baked at BUILD time into `lib/storefront-host-map.ts`
  (it lived in `proxy.ts` until 2026-07-27); if the Docker image is built without it,
  `resolveStoreFromHost()` returns null for every host and `shop/layout.tsx`
  renders the unavailable card (its `text-gray-500` variant = layout/no-slug branch;
  `store-shell.tsx`'s `text-[var(--muted)]` variant = backend-rejected branch — tells you which
  side failed from the SSR HTML alone). Wired in `Dockerfile` + `.github/workflows/deploy.yml`;
  same applies to `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP`.
  ⚠ **`deploy.yml` bakes an EMPTY value on every branch except `main`** — so a staging/branch deploy
  hits this by construction. Beyond the unavailable card, an empty root domain makes every tenant
  subdomain resolve as a custom-domain candidate with `base: ""`, i.e. "store at the root" when it is
  really at `/shop`: pages still render (the proxy rewrites) but a sitemap built on that base is a
  list of 404s and robots would guard `/cart` instead of `/shop/cart`. `robots.ts` / `sitemap.ts`
  therefore check `isTenantRoutingConfigured()` and emit their **neutral** answer (allow-all / empty)
  rather than a confident wrong one. If a deployed store serves an empty `/sitemap.xml`, check that
  build-arg first. Prod API is `https://api.ezycore.com/api`
  (NOT the onrender.com URL in `.env.example`); sanity-check with
  `curl https://api.ezycore.com/api/storefront/{slug}`.

- **Shopper notification prefs are consent flags only** (account → Notifications;
  `shopper.model.ts` `prefs`, `PUT /:slug/auth/me/prefs` — verified e2e 2026-07-11): no backend
  pipeline sends promo email/SMS/price-drop/newsletter yet, and `StorefrontNotifications`
  (storefront-settings) is an unshipped SMS config shape ("dispatch is a separate backend job").
  Any future sender MUST filter on `prefs.*`; shopper transactional email (verify/reset) ignores prefs.
- **i18n keys go in 3 places** (Dict + en + bn) — grep-count to confirm, IDE diagnostics lie mid-batch.
- **Persisted-store reads need `useHydrated()`** before redirect/branch logic — and the
  pre-hydration render must be **neutral** — page-level waits use `<LoadingSplash>`
  (`components/storefront/loading-splash.tsx`, centered `.sf-spin` spinner, twin of the admin
  layout's Loader2 splash); inline spots use a `.sf-skeleton` chip — never the guest state: rendering "Sign in"/auth-card while the session is unknown flashes at signed-in shoppers
  on every reload (fixed 2026-07-11 in header account chip, /account, checkout, invoice page).
  QA: detect flashes with a rAF frame-scanner injected via `Page.addScriptToEvaluateOnNewDocument`
  (MutationObserver misses them) + a guest control run to prove the detector fires.
- **`json.error` not `json.message`** is where backend error text lives.
- **The settings PATCH replaces `templates` (and every provided sub-field) WHOLESALE** —
  `updateSettings` is a shallow `Object.assign`. Any admin section saving one key inside
  `templates` must spread the saved object first (`{ ...settings.templates, headerMenu }`), and
  `TemplatesSection` seeds its draft from the full saved object for the same reason. Sending a
  partial `templates` silently wipes the other sections' choices — this nearly shipped twice.
- **OAuth callback route order** (before `/:slug`), and same-document hash navigation does NOT
  remount the oauth landing page — QA must full-navigate.
- **Store payload is cached** (`getStore` = 300s + 5-min client staleTime). Merchant saves flush it
  on demand; anything else changes it lags by the timer. See "Cache + on-demand revalidation".
- **Turbopack can panic per-route persistently** ("Panic in async function" 500) — restart the
  frontend dev server; it purges the corrupted FS cache itself.
- Known pre-existing type errors (NOT ours; don't chase): frontend `image-gallery-upload.tsx` ×3
  and stale `.next/types/validator.ts` route stubs; backend `product.model.ts`,
  `sale-utils.service.ts`, `storefront-order-admin.service.ts` (user's combo-feature merge).
- Backend error responses include `stack` in dev — fine.
- Test orders: products may require `variantId` ("Please select an option…"); rmc41's
  `drill-bit-set` has variants.

## House rules (CLAUDE.md applies everywhere)

Check the `// coding-standard: maintained` marker before editing; one file = one responsibility
(components ≲250 lines — extract to `components/storefront/...`); reuse before writing
(shared inputs, tables, print engine, markdown, tax utils per CLAUDE.md); backend is authoritative,
frontend numbers are previews; verify changes live (CDP) before calling them done.
