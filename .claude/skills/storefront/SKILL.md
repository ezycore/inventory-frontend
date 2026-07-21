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
  (Next `revalidate` + tag `store:{slug}` — **admin edits can take ~60s to show unless revalidated**).
- **Design system**: no Tailwind on the storefront. Inline `CSSProperties` + CSS variables from
  `app/(storefront)/storefront.css` — `--primary/--on-primary/--primary-soft/--card/--border/
  --border-strong/--text/--muted/--faint/--pad/--gap/--maxw/--h2` etc. Dark mode = `data-theme`
  on `.sf-root` (toggle persisted as `sf-theme`). The org's `brandColor` overrides `--primary`
  inline, and **may be near-black — never rely on `var(--primary)` being visible on dark cards**
  (use `--muted` or `color-mix(... , var(--text))` for accents that must survive both themes).
- **Icons**: `components/storefront/sf-icons.tsx` (`<Icon name=… />`, stroke, currentColor).
  Add paths there; do not import lucide into storefront components.
- **Toasts**: import `toast` from `lib/storefront-toast.ts`, never from "sonner" directly —
  storefront toasts render **top-center** (the bottom strip belongs to the cart-drawer
  footer, the mobile bottom nav and the sticky buy bar; the admin's global Toaster default
  is bottom-right). The cart drawer `toast.dismiss()`es on open (the drawer IS the
  add-to-cart confirmation) and the PDP's Buy now doesn't toast at all.
- **i18n**: bilingual EN/বাংলা. `lib/storefront-i18n.ts` — every string is a key in the `Dict`
  interface **plus** the `en` **plus** the `bn` object (3 places, always). Components read
  `const { t } = useStorefrontUI()`. (IDE diagnostics often flag "missing properties" mid-batch
  while editing this file — verify with a grep count, key×3, before believing them.)
- **Templates**: per-page layout variants chosen in the admin (Customize) —
  `lib/storefront-templates.ts` `resolveTemplates(store)` → home/collection/product/checkout
  (+ header/footer/productCard/hero) variant ids consumed by the views. `search` and `cart`
  are retired: shoppers toggle grid/list on the search page, and Buy now always opens the
  cart drawer.
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
  Switch/heading) — **footer is NOT live-previewed** (only the variant is; group/content-pages edits
  need a save + ~60s revalidate). Social links are edited in admin Store Settings → General → Social
  links card; a bare WhatsApp phone number is normalized to `https://wa.me/<digits>` in `social-links.tsx`.
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

## Work log (what was built, newest first — as of 2026-07-21)

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
  `!important`). **Footer still isn't live-previewed** — only the variant streams; group/content-pages
  edits need a save. BE DTO round-trip test extended (`organization.dto.test.ts`). Dead `--footcols` var
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
  `store-shell` prefers the override) — the bar was previously edited blind (footer still is). i18n
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
  `NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN` is baked at BUILD time into `proxy.ts`; if the Docker
  image is built without it, `resolveStore()` returns null for every host and `shop/layout.tsx`
  renders the unavailable card (its `text-gray-500` variant = layout/no-slug branch;
  `store-shell.tsx`'s `text-[var(--muted)]` variant = backend-rejected branch — tells you which
  side failed from the SSR HTML alone). Wired in `Dockerfile` + `.github/workflows/deploy.yml`;
  same applies to `NEXT_PUBLIC_CUSTOM_DOMAIN_MAP`. Prod API is `https://api.ezycore.com/api`
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
