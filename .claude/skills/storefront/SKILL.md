---
name: storefront
description: Map of the multi-tenant ecommerce storefront ("shop") — architecture, shopper auth, print/invoice engine, CMS pages, OAuth, conventions and gotchas. Load BEFORE implementing or fixing anything under app/(storefront)/, services/storefront/, components/storefront/, the ecommerce admin pages, or the backend storefront routes.
---

# Storefront (multi-tenant ecommerce)

Each organization on the inventory SaaS can publish a public online store. One codebase serves
every store; **the host picks the store**.

- **Tenant hosts**: `{slug}.domain/shop` (dev: `http://rmc41.localhost:3000/shop`). Link base = `/shop`.
- **Custom domains**: store at the domain root; link base = `""`. `proxy.ts` (root) resolves
  host → slug and injects headers; `shop/layout.tsx` reads them and provides `{slug, base}` via
  `StoreContextProvider`. **Never hardcode `/shop`** — always `storeHref(base, path)`
  (`lib/storefront-links.ts`).

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
  (Next `revalidate` + tag `store:{slug}` — **admin edits can take ~60s to show unless revalidated**).
- **Design system**: no Tailwind on the storefront. Inline `CSSProperties` + CSS variables from
  `app/(storefront)/storefront.css` — `--primary/--on-primary/--primary-soft/--card/--border/
  --border-strong/--text/--muted/--faint/--pad/--gap/--maxw/--h2` etc. Dark mode = `data-theme`
  on `.sf-root` (toggle persisted as `sf-theme`). The org's `brandColor` overrides `--primary`
  inline, and **may be near-black — never rely on `var(--primary)` being visible on dark cards**
  (use `--muted` or `color-mix(... , var(--text))` for accents that must survive both themes).
- **Icons**: `components/storefront/sf-icons.tsx` (`<Icon name=… />`, stroke, currentColor).
  Add paths there; do not import lucide into storefront components.
- **i18n**: bilingual EN/বাংলা. `lib/storefront-i18n.ts` — every string is a key in the `Dict`
  interface **plus** the `en` **plus** the `bn` object (3 places, always). Components read
  `const { t } = useStorefrontUI()`. (IDE diagnostics often flag "missing properties" mid-batch
  while editing this file — verify with a grep count, key×3, before believing them.)
- **Templates**: per-page layout variants chosen in the admin (Customize) —
  `lib/storefront-templates.ts` `resolveTemplates(store)` → home/collection/product/cart/checkout
  variant ids consumed by the views.
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
- Status: Google works with any creds; **Facebook app is in Development Mode pending Meta
  Business Verification** (consent screen already round-trips for app admins).

## Other storefront subsystems

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
- **Footer**: variants incl. Rich (trust badges + "Follow us"). Social links are edited in
  admin Store Settings → General → Social links card; a bare WhatsApp phone number is normalized
  to `https://wa.me/<digits>` in `store-footer.tsx`.
- **Checkout**: gates in order — `!shopper` (redirect to `/account?next=/checkout`, hydration-gated),
  `!emailVerified` (VerifyEmailGate), `placed` (OrderPlacedCard), empty cart. Single-page or
  multi-step per template. Coupons validated server-side; shipping = Dhaka inside/outside zones.
- **Admin ecommerce pages** (`app/(protected)/ecommerce/*`): dashboard, orders (+detail, invoice
  print), content, customize (theme/trust badges/templates/nav), settings (General incl. social
  links + fulfillment location, Publish, payments/shipping/checkout tabs). Custom domains under
  app Settings → Custom Domains.

## Work log (what was built, newest first — as of 2026-07-11)

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
- **OAuth callback route order** (before `/:slug`), and same-document hash navigation does NOT
  remount the oauth landing page — QA must full-navigate.
- **Store payload is cached** (~60s revalidate + 5-min client staleTime) — settings changes lag.
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
