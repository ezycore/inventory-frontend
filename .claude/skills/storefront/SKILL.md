---
name: storefront
description: Map of the multi-tenant ecommerce storefront ("shop") — architecture, shopper auth, print/invoice engine, CMS pages, OAuth, courier payouts/remittance, conventions and gotchas. Load BEFORE implementing or fixing anything under app/(storefront)/, services/storefront/, components/storefront/, the ecommerce admin pages (orders, courier payouts), or the backend storefront routes.
---

# Storefront (multi-tenant ecommerce)

Every organization publishes a public online store — the product's headline feature, not an add-on
to the back office. One codebase serves every store; **the host picks the store**.

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

> **A merchant asked for a look you cannot give them? Log it.**
> [`docs/plan/storefront-design-requests.md`](../../../docs/plan/storefront-design-requests.md) is the
> register, and the trigger is the sentence *"Customize can't do that"* — write the row in the same
> message that says it. **Three distinct merchants promotes a request to a candidate setting**; the
> trade column says whether the answer is a setting (different trades) or a theme (the same one).
> A request that is not written down at the moment it arrives is lost, and "common across merchants"
> quietly becomes "whoever asked most recently". The one request this product already had — the promo
> cards that became `category-banners` — was built with its merchant, trade and date already gone.

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

## Campaign scopes — five, and the form must offer all five

`campaign.scope` is `storewide | category | subcategory | product | tag`, and
`campaign.service.buildPricer` matches each against a different field. The admin
form offered only three until 2026-08-07, so `subcategory` and `tag` campaigns
were implemented, priced and **unbuildable**.

Two rules, both learned from the same bug:

- **`category` targets TOP-LEVEL ids only** (`parentId: "null"`). The engine
  matches that scope against `product.categoryId`, which always holds the
  parent, so a child id there discounts **nothing** — with no error, on a
  storefront pricing surface. `subcategory` targets children only
  (`parentId: "!null"`) and matches `product.subcategoryId`.
- **One table owns scope → target field**: `CAMPAIGN_TARGET_FIELD`
  (`components/ecommerce/campaigns/form-config.ts`). Four places consume it —
  the field configs, the defaults, `transformEditData` and the submit fold — and
  three of them had silently fallen behind the enum. Adding a scope means adding
  a row there, and `form-config.test.ts` fails if the form and the engine drift.

Sub-category options are labelled `Parent › Child`: a child name is unique only
within its parent, so a flat list can show two identical entries meaning
different things.

### The "Ends" date is one function (2026-09-08)

`campaignEndsLabel(endsAt, langCode)` in `lib/storefront-campaign-date.ts` — used
by `CampaignStrip` and the deal cards in `band-sections.tsx`, the only two
surfaces that print it. Both formatted it inline as day + short month, so a
campaign scheduled into a later year — the two-year kind a merchant sets up for a
permanent outlet section — announced "Ends 3 Jan" for a date two Januaries out.
**The year is added whenever the end date is not in the current one**, and never
when it is: a same-year date is unambiguous without it, and the strip has one
line. Still `toLocaleDateString`, which localizes the numerals as well as the
month — a hand-built "2d 4h" countdown would need Bengali unit abbreviations that
are not in `docs/I18N-GLOSSARY.md`.

Scheduling that long campaign needs the year reachable in the picker too: see the
month/year caption note in the `dynamic-form` skill.

## Frontend layout

**The storefront is its own root layout (since 2026-09-14).** There is no `app/layout.tsx`:
`app/(storefront)/layout.tsx` renders the shop's `<html>`, and the admin trees render
`components/layout/admin-root-layout.tsx`. Two rules keep it that way, one per reason it was split:

- **No admin CSS.** The shop's Tailwind comes from `app/(storefront)/storefront-base.css` — preflight
  plus only utilities found in `components/storefront` and `app/(storefront)` (`source(none)` + two
  `@source` lines). A storefront component outside those paths gets no CSS for its Tailwind classes;
  add the path rather than importing `globals.css`. The admin sheet was 312 KB and render-blocking
  (~920 ms of first paint on a phone, measured 2026-09-14).
- **The root layout never reads the request** — no `headers()`, `cookies()` or next-intl. A root
  layout that does makes every route beneath it dynamic, which rules out the per-store HTML cache the
  Storefront Builder depends on (`inventory-backend/docs/plan/storefront-builder.md` §17).

Only TanStack Query was carried over from the admin providers. There is no admin `<Toaster>` on shop
pages, so a toast that bypasses `lib/storefront-toast.ts` is never shown. Shop hosts no longer run the
workspace gate either; a closed or inactive store 404s through the backend's `resolveStore` instead.

**Storefront Builder section specs (since 2026-09-14).** Builder sections are declared once, as plain
data, in `lib/storefront-builder/section-specs.ts` (field types in `lib/storefront-builder/field-specs.ts`).
The backend validates saved pages against a **generated** copy,
`inventory-backend/src/constants/storefront-section-manifest.ts`:

- After changing either file run `pnpm gen:section-manifest` and commit the backend file in the
  backend repo. `pnpm verify` runs `verify:section-manifest`, which fails while they differ (and skips
  when the backend repo is not checked out beside this one).
- Both files must stay loadable by Node's type stripping: `section-specs.ts` may only `import type`,
  and `field-specs.ts` imports nothing, because its body is copied verbatim into the backend.
- Bump a section's `v` for any change that would make an already-saved instance invalid.
- A **new field type** (as `focal` was) needs a case in the backend's `checkValue`
  (`inventory-backend/src/utils/storefront-section-validation.ts`) and in `readScalar`
  (`lib/storefront-builder/settings.ts`). The backend switch has no default, so an unhandled type is
  accepted unchecked.

**Storefront Builder renderer (since 2026-09-14).** Lives in `components/storefront-builder/`:

- `page-sections.tsx` renders a page in two phases. `prepareSections` drops, without a trace, every
  instance that is disabled, of an unknown type or version, missing a required setting, pointing at
  nothing, or hidden on both breakpoints; `PageSections` draws the rest in `.sfb-sec` frames and leaves
  out any section whose data came back empty (no empty padded bands).
- `section-registry.tsx` binds each spec to its view with `defineSection`, plus an optional
  catalogue `request`, `needs` (store-wide lists the view reads — `categories`, `tags`; the page
  fetches each once, and only when some section asks) and an `isEmpty` that sees the page context. A
  type missing from the registry is skipped on the page. Rendered today: rich text, FAQ, call to
  action, product grid, promises band, image + text, shop by tag, collections row, selected products,
  product carousel, campaign offers, category tiles, category promo cards, hero.
- Views in `sections/` are **pure server components** of `SectionViewProps` — no fetching, no request
  reads, no `"use client"`. **Client code only through `islands/island-map.tsx`**, one
  `next/dynamic(() => import(...))` per island: Spike B showed any island imported into a server
  module is bundled for every page.
- **Home sections share markup with the builder** through directive-free modules in
  `components/storefront/home/`: `promise-rows.tsx`, `tag-chip-links.tsx`, `collection-tiles.tsx`,
  `pick-grid.tsx`, `category-tile-row.tsx`, `category-banner-row.tsx`, `product-rail-track.tsx`,
  `hero-static.tsx`, `hero-links.tsx`, plus the client `deal-strip.tsx` and `hero-fullbleed.tsx` (loaded
  through islands). **A server view must not render a component from `home-shared.tsx`**: that client
  module imports `ProductCard`, and its chunk would ship on every builder page (why the hero links and
  `wrap` moved out; `home-shared.tsx` re-exports them). A shared row takes its scrolling track as
  `renderStrip`: `CategoryStrip` on the home page, the `category-strip` island on a builder page. The
  category-row layout helpers (`category-row-layout.ts`) are directive-free; the Customize-aware hook is
  `use-category-row-layout.ts`. Merchant-typed links resolve through `merchantLinkHref` (`lib/storefront-links.ts`,
  which keeps `tel:` and `mailto:`), via `section-link.tsx` or `hero-links.tsx`; references to tags and
  categories through `lib/storefront-builder/store-lists.ts`. **A function a server view calls must
  not be exported from a `"use client"` module** — it is a client reference there and fails at render,
  which no unit test sees. That is why `categoryLabelsVisible` lives in `lib/storefront-templates.ts`.
- Builder views draw **only the merchant's own text** — no dictionary labels, no fallback headings
  (one language per field). A link beside a heading needs both a label and a destination. Interface
  wording inside an island ("off", "Ends", arrow names) comes from the storefront dictionary: a cached
  server view cannot know the shopper's language, and the island reads it from `useStorefrontUI`.
- Settings are read with `lib/storefront-builder/settings.ts` (the backend's rules; an invalid
  required field → the section is skipped). Responsive values become `--x` / `--x-m` custom
  properties (`responsive.ts`); the style box is `section-style.ts`; the CSS is
  `app/(storefront)/storefront-builder.css`, loaded by the storefront root layout. **Never import a
  CSS file from a component** — vitest cannot load the project's PostCSS config and the whole test
  file fails to import.
- Data: `getStorefrontPage` and `getSectionData` in `lib/storefront-server.ts`. Section data is one
  batched call, split only when the encoded `r` would pass the backend's 4,000-character cap.
  Catalogue-wide product grids ask for in-stock products; hand-picked grids keep every pick.
- `countdown` is specified but **not rendered**: days/hours/minutes/seconds have no Bangla terms in
  `docs/I18N-GLOSSARY.md`, and storefront copy must not invent them.

**Cached store pages — the `/sites` route (since 2026-09-14).** Every `/shop` route reads the request
(host headers, the owner-preview token), so none of them can be HTML-cached. `/pages/<slug>` — builder
pages and content pages alike — is served from `app/(storefront)/sites/[slug]/[mode]/pages/[pageSlug]/`,
which reads only its params:

- `proxy.ts` rewrites a public **GET/HEAD without a preview token, for a page that exists**, there
  (`cachedPageSlug` + `sitesPagePath` in `lib/storefront-sites.ts`): `{slug}.ezycore.com/shop/pages/x` →
  `/sites/{slug}/shop/pages/x`, `mystore.com/pages/x` → `/sites/{slug}/root/pages/x`. Hosts with no store
  and **missing pages** stay on `shop/pages/[pageSlug]`.
- **Owner preview of a page has its own route beside it** (since 2026-09-15):
  `app/(storefront)/sites/[slug]/[mode]/preview/[pageSlug]/`, reached by a GET/HEAD **with** a preview token
  (`sitesPreviewPath`; no existence check — a draft is exactly what the public lookup cannot see). It reads
  the request through `requestStorefront`, so the backend returns the **draft** and an unpublished page is
  reachable, and it draws the page in its **own chrome** — which `shop/pages/[pageSlug]` cannot, because
  `shop/layout.tsx` always wraps `StoreShell`. `publicPathname` maps its `preview` segment back to `pages`,
  and the direct-request block on `/sites` covers it.
- **Why "exists" matters:** a cached (ISR) render that calls `notFound()` gets Next's bare error
  document — a correct 404 status, but no shop and no way back. Next 16.1 never renders a nested
  `not-found.tsx` on that path (tried a client and a server one, 2026-09-14). `lib/storefront-page-lookup.ts`
  asks the public page endpoints and caches only "exists" (60 s per instance; an API failure also answers
  "exists", for 10 s, so cached pages keep serving), so a dead link gets the shop's own 404 and a new page
  is served at once. The route deliberately has no `not-found.tsx`. A direct request for `/sites/…` is a 404, except on a custom domain, where
  that path is rewritten under `/shop` and is an ordinary collection path. **There is no host segment**:
  the proxy matcher skips paths containing a dot, so a host in the path would dodge the block.
- **Nothing under the cached route may read the request** — no `headers()`/`cookies()`, no
  `getStoreContext`, no request-aware fetcher. Use `publicStorefront` and `loadSitePage`
  (`lib/storefront-site-page.ts`). One such read makes the whole route dynamic, with a green build.
- **The server pieces both page routes share take their reads as a parameter** (`StorefrontReads`):
  `PageFrame`, `StorePageBody` and `BuilderPageBody` in `components/storefront-builder/`, and
  `loadStorePage` / `storePageMetadataFor` in `lib/storefront-site-page.ts`. The cached route passes
  `publicStorefront`, the preview route `requestStorefront`. Never import a fetcher set inside one of
  them — that is how the cached route would start reading the request.
- **Storefront client code reads the pathname through `useStorePathname()`**
  (`services/storefront/use-store-pathname.ts`), never `usePathname()`. On a rewritten cached page the
  server renders with the `/sites/…` URL and the browser with the public one, so anything derived from
  a raw pathname (active tab, breadcrumb, strip visibility) fails hydration.
- Both routes' layouts draw `PageFrame` (`components/storefront-builder/page-frame.tsx`). Chrome is the
  builder page's own `chrome`: `full` = `StoreShell`, `minimal` = a logo bar, `none` = nothing; content
  pages get `full`.
  Both frames load through `next/dynamic` in `components/storefront-builder/frames.tsx` so a `none` page
  does not download the shell (Spike B). `BareStoreFrame` still carries the colours
  (`lib/storefront-shell-theme.ts`, shared with `StoreShell`), design attributes, store context and
  seeded store query, cart drawer, contact button and owner bar.
- `StorePageBody` tries the builder page, then its rename redirect (308), then the content page
  (`StoreContentPage` in `components/storefront/content-page-view.tsx`, shared with
  `shop/pages/[pageSlug]`, loaded through `content-page-lazy.tsx` so a landing page does not download
  it), then 404. A noindex landing page emits no canonical and lets crawlers follow its links; a
  preview is never indexed.
- Shared by both routes: `StoreHead` (`components/storefront/store-head.tsx` — favicon link + Meta
  Pixel).
- **`publicStorefront` throws when the API gives no answer** — unreachable, or a 5xx
  (`StorefrontUnavailableError` in `lib/storefront-server.ts`); a 4xx still reads as `null`, and the
  request-aware set keeps returning `null`. A cached render must never turn an outage into
  `notFound()`: ISR stored that bare 404 for five minutes after the API recovered (found 2026-09-14).
- Freshness follows the fetch tags (see "Cache + on-demand revalidation"): `revalidateTag` drops the
  cached HTML of every page built from a flushed fetch (Spike A). `revalidate = 300` is the backstop.

Routes in `app/(storefront)/shop/`: home, `products` (collection+filters), `products/[productSlug]`,
`cart`, `checkout`, `search`, `track`, `pages/[pageSlug]` (CMS — missing pages and hosts with no store,
see above), `account/*` (auth card + account area, `verify-email`, `reset-password`, `oauth`, `orders`,
`orders/[orderNumber]`, `orders/[orderNumber]/invoice`), and the **`[...categoryPath]` catch-all**.
Plus the cached `app/(storefront)/sites/[slug]/[mode]/pages/[pageSlug]` and its owner-preview twin
`app/(storefront)/sites/[slug]/[mode]/preview/[pageSlug]`.

### `[...categoryPath]` — collection pages at real paths (2026-08-06)

`/phones` and `/phones/accessories`. Three things to know before touching it:

- **It is a catch-all, so it loses to every static segment** — `/cart`, `/products`, `/search`,
  `/account`, `/orders`, `/pages`, `/t`, `/checkout` all still win. A category whose slug collides
  with one of those would not break the route, it would be **silently unreachable** — which is why the
  backend refuses such a name (`RESERVED_STOREFRONT_SLUGS`). **Add a static storefront segment ⇒ add
  it to that list**, or the next merchant to name a category after it gets a dead collection.
- **It renders the SAME grid as `/products`** — `products/view.tsx` with an optional `collection`
  prop. Do not fork it; a second copy would drift on pagination mode, filter chips or layout.
- **Depth is capped at 2 and an unknown path is a hard 404.** Not an empty grid: a mistyped
  collection URL must not look like a store with no stock. The service returns zero rows for an
  unresolved path independently of the route guard, so neither alone can leak the whole catalog.

`GET …/categories` is a two-level **tree** (`children[]`, each node carrying `slugPath`), and a
hidden parent takes its children with it. Link to a collection with **`collectionHref(base, cat)`**
(`lib/storefront-links.ts`) — never hand-build `?categoryId=` again.

**A category surface that ignores `children` is a bug, not a simplification** (four of them shipped
this way and were fixed 2026-08-07 — see the work log). The rule: anything that renders the category
list renders the tree. Concretely, `store-header.tsx`'s `CategoryRow` feeds **both** its branches
through `HeaderNav` — the collections branch passes a synthetic one-item `collections` menu and lets
`expandHeaderMenu` nest it, so there is one dropdown implementation, not two. ⚠ Such a row can never
be an **`overflowX: auto`** strip: a scroll container clips on *both* axes, so the absolutely
positioned dropdown gets cut off at the row's bottom edge. `HeaderNav` wraps for exactly that reason.

The `/products` facet form is **`?categoryId=` + `?subcategoryId=` together**, never the child alone
— a child's product carries both ids, so they AND-combine. Both are `noindex` (the path page is the
landing page) and both are stripped by `categoryPath*Params`, since a path already names its level.

**The facet shows the whole tree at once**, children indented under their parents. It was
progressive-disclosure first (children revealed only under the selected parent) and that was wrong:
the panel already sits behind a Filters button inside a drawer, so finding a sub-category took two
hidden steps and merchants reported the feature as missing. If a catalogue ever makes the list
unwieldy, cap or group it — **don't put it back behind a click**. The parent row is lit only when
the whole branch is selected; with children permanently visible, a lit parent under a lit child
reads as two filters at once.

- **Pattern**: `page.tsx` (server; SEO via `storePageMetadata` in `lib/storefront-metadata.ts`)
  + `view.tsx` (`"use client"`). Server data fetches go through `lib/storefront-server.ts`
  (Next `revalidate` + tag `store:{slug}`, flushed on admin save — see "Cache + on-demand
  revalidation" below).
  **The `page.tsx` must also fetch the view's own data and pass it as `initialData`** — see
  "SEO" below; a `page.tsx` that only returns `<View />` ships a spinner as its HTML.
- **Design system**: no Tailwind on the storefront. Inline `CSSProperties` + CSS variables from
  `app/(storefront)/storefront.css` — `--primary/--on-primary/--primary-soft/--card/--border/
  --border-strong/--text/--muted/--faint/--pad/--gap/--maxw/--h2` etc. Dark mode = `data-theme`
  on `.sf-root` (toggle persisted as **`ezy-sf-theme`**, lang as `ezy-sf-lang` — both in
  `services/storefront/ui-context.tsx`; note the storefront's *other* device preferences are
  unprefixed, e.g. `sf-search-view`). The org's `brandColor` overrides `--primary`
  inline, and **may be near-black — never rely on `var(--primary)` being visible on dark cards**
  (use `--muted` or `color-mix(... , var(--text))` for accents that must survive both themes).
- **Design tokens (`theme.design`) — the merchant's typeface, ground + rhythm.** Five axes —
  `font` (**8** curated Latin+Bengali pairs), `surface` (**8** grounds: `--page/--card/--surface/--text/--border`),
  `scale` (`--h1/--h1m/--h2`), `density`
  (`--pad/--gap/--cols`) and `radius` (`--radius-sm/md/lg`) — catalogued with their resolver in `lib/storefront-theme.ts`
  (`DESIGN_FONTS`/`DESIGN_SURFACES`/`DESIGN_SCALES`/`DESIGN_DENSITIES`/`DESIGN_NAV_HOVERS`, `resolveDesign`, `designAttrs`), edited in
  Customize → **Look** (Brand and Design merged into it on 2026-09-06 — see `parts/look-part.tsx`),
  and rendered by `.sf-shell[data-font|data-surface|data-scale|data-density]` blocks in
  `storefront.css`. Six rules, and the first two are the ones that bite:
  - **Never stamp these as inline style vars.** `--pad/--gap/--cols/--h1/--h1m/--h2` are redefined
    at `680px` and `1000px`; an inline var outranks every media query and freezes a themed store at
    its phone spacing. They are `data-*` attributes for exactly this reason — the same mechanism
    `[data-brand]` already used, and `StoreShell` stamps both together.
  - **A scale/density option needs its block in all THREE places** (base + both `@media` blocks) or
    it silently loses its responsive ramp — which typechecks, lints and tests clean.
  - **`designAttrs` omits an axis left at its default**, so `.sf-root` stays the single definition
    of the built-in look and there is no `[data-density="cozy"]` block to drift from it. An
    untouched store renders byte-identical to before the feature existed.
  - **`font-family` is re-declared on the bare `.sf-shell` rule** and must stay there: `.sf-root`
    already computed its own from `--font-storefront`, and descendants inherit that *computed*
    value, so redefining the variable lower down does nothing on its own. Fonts are declared in
    `app/(storefront)/fonts.ts` (all preloaded families off except the default pair) — and every
    option pairs a Latin face with a **Bengali** one, since a Latin-only choice renders half the
    market's copy in the browser fallback and no gate can see it.
  - **`radius` is the one axis with no `@media` repeats** — a corner does not grow with the
    viewport, so `--radius-sm/md/lg` have exactly one definition each. ⚠ **`999px` and `50%` are
    NOT part of that scale and must never be tokenised**: they mean "pill" and "circle", so
    swapping them would turn badges and avatars into squares on the sharp setting — a different
    *shape*, not a different radius. Same for the deliberate `0`s and the chat-bubble tails.
    Migration is partial by design: the look-carrying surfaces (`.sf-hero`, `.sf-herocard`,
    `.sf-account-nav`, `.sf-acct-tab`, `.sf-pdp-zoom`, `.sf-qb-panel`, `.sf-footer-trustbar`,
    `product-card.tsx`, `sfInput`) are on the tokens; the long tail of ~130 inline `borderRadius` values still isn't,
    and moves over file-by-file under the `// coding-standard: maintained` convention. **When you
    touch a storefront file, swap its radii for the tokens** — sm = controls, md = cards/panels,
    lg = big surfaces.
  - **`surface` is the ground, NOT the brand.** It owns `--page`, `--card`, `--surface`,
    `--surface-2`, `--text`, `--muted`, `--faint`, `--border`, `--border-strong`, `--header` and the
    `--discount` pair. It must never set `--primary`, `--primary-hover` or `--primary-soft`: those
    resolve from the merchant's own colour in the `.sf-shell[data-brand]` block, and `--primary-soft`
    is a `color-mix` against `transparent` precisely so it picks up whichever ground sits behind it.
    A surface that set a brand colour would make picking a *paper* silently repaint a shop's *mark*.
    ⚠ **Every surface needs a dark block too** (`.sf-root[data-theme="dark"] .sf-shell[data-surface=…]`).
    Dark is a shopper toggle, not a theme choice, so a surface with no dark variant drops the shopper
    back onto the default near-black mid-session. ⚠ And it needs listing in the `@media print` reset —
    those rules sit on a **descendant** of `.sf-root`, so a themed shop otherwise inherits its tint
    straight past the reset and prints a full-bleed ground on the merchant's paper.
    This axis is why the themes finally read as different shops. Four of them had four brand hues,
    four typefaces and four page skeletons and still looked related, because all four were white
    cards on a near-white page — the first thing a shopper's eye registers, and the last thing any
    other axis could touch.
    ⚠ **A new surface must be distinguishable in its three-colour SWATCH**, which is what the merchant
    actually picks from — `SURFACE_SWATCH` in `lib/storefront-theme.ts`, a hand-copied literal because
    the admin is not inside `.sf-root`. An option whose difference is ink weight or hairline strength
    is invisible there and is not an option. That test is why the catalogue stopped at eight.
    ⚠ **There is no white-cards-on-DARK-ground surface, and it is not an oversight.** `--text` is one
    token spent on both the page and the card, so a dark page under white cards has no readable ink to
    pick; it needs a second ink token before it can be expressed.
    ⚠ **A DARK ground changes four things beyond the twelve tokens** — the brand and the accent must
    take their *lifted* variants (`--sf-brand-dark`, already on the shell), the skeleton shimmer must
    not be a white sweep, and `color-scheme` must go dark. All four were keyed on `[data-theme="dark"]`,
    which is the **shopper's toggle** and the wrong question for a shop that is dark in both themes.
    They hang off one `data-ground="dark"` attribute, stamped by `designAttrs` and **derived from the
    swatch** (`isDarkSurface`) so it cannot disagree with the CSS. Adding another dark palette needs no
    new selector; adding a fifth concern needs exactly one.
    ⚠ **`lib/storefront-surface-css.test.ts` walks the stylesheet** and will fail a surface missing any
    of the above — twelve tokens light and dark, both `body` rules, a swatch matching the CSS — plus a
    `var(--font-*)` the font module never declared. Nothing in the TS build can see any of it.
  - ⚠ **`surface` is the ONE axis declared on `.sf-root`, not `.sf-shell`** — keyed off the shell with
    `:has()` (`.sf-root:has(.sf-shell[data-surface="parchment"])`). Every other axis sets tokens only
    its own descendants read, so the shell is the right home for them. `--page` is different:
    **`.sf-root` paints it too**, and `.sf-root` is a shared route-group div with no store data, so it
    cannot carry an attribute of its own. Declared on the shell, the tokens sat one level too deep and
    `.sf-root` went on painting the default `#f8fafc` behind a cream shop — invisible while the shell
    covers the viewport, and plainly wrong the instant it does not. `.sf-shell` inherits them by
    ordinary cascade, so nothing downstream changed.
  - ⚠ **And `body` needs its own rule per surface, per theme.** The browser takes the OVERSCROLL
    CANVAS colour from `<body>`. Until 2026-09-14 that body belonged to the admin's root layout and
    carried its near-black `bg-background`, so a cream shop flashed black on a rubber-band scroll and
    showed black under any page shorter than the viewport. The storefront now has its own root layout
    (`app/(storefront)/layout.tsx`) whose body has no background at all — which is browser white, so
    a cream or dark shop still needs these rules. `body:has(.sf-shell…)` scopes the fix to shop pages. The
    values there are **literal repeats** of that surface's `--page`, because body sits outside
    `.sf-root` and cannot read its custom properties — a `var(--page)` on body silently resolves to
    the fallback, always. Change the two together. (The plain `body:has(.sf-shell)` pair is not
    new-feature scaffolding: the default surface had the same defect from the start.)
  - **Both of these were found by sampling PAINTED PIXELS, not by reading tokens.** `getComputedStyle`
    on `.sf-shell` reported the correct `--page` the whole time. Walking up from
    `document.elementFromPoint(x, y)` to the first ancestor with a non-transparent background is what
    exposed the layer above it still painting slate-white. When a colour "looks wrong" but the token
  - ⚠ **`hero-card` paints `--card`, so on a themed ground the
    FIRST SCREEN is near-white.** That is the loudest defect a `surface` can have: the ground never
    gets to introduce itself. `hero-open` exists for this — copy on the page, picture in an
    `--accent-soft` panel, no frame at all. **Pick it whenever the page's own colour is meant to be
    seen.**
  - **Probe the middle of the page, not the gutters.** This bug survived four rounds of "the
    background is wrong" because every check sampled `x=20`/`x=40` — the margin *beside* the hero
    card, which was correctly `--page` the whole time. Screenshot the page, draw it into a canvas and
    read `getImageData`; a full-frame histogram plus a horizontal strip across the top would have
    found it in one pass. `getComputedStyle` and `elementFromPoint` both report a DECLARED colour and
    neither can see what is covering it.
  - ⚠ **Every desktop header anatomy MUST render its OWN `<ThemeBtn>`, gated only on
    `ctx.needsTheme`.** The shopper's light/dark choice is persisted to
    `localStorage['ezy-sf-theme']` and re-applied before paint by the script in
    `app/(storefront)/layout.tsx` — so an anatomy without the toggle does not hide a preference, it
    **strands** the shopper in whichever theme they last picked, on every future visit, with no way
    back. `minimal`, `search-first` and `boutique` all shipped that way, and `classic` later lost its
    own toggle to the configurable utility bar — which put the DEFAULT template one merchant switch
    away from the same dead end.
    **"Or via `<UtilityBar>`" is not good enough, and that is the lesson:** the bar is merchant
    configurable now (Customize → Utility bar), so anything drawing its toggle only from there can be
    switched off. `headerNeeds(bar, breakpoint)` (`lib/storefront-utility-bar.ts`) is the single
    arbiter — false ONLY while the bar is on that breakpoint AND still carrying that item. Asked per
    item, not per bar, because the merchant switches the four utility items independently.
    **Three surfaces own these two controls, and every pair of them could collide:**
    | Surface | Reads the arbiter as | Guard |
    |---|---|---|
    | Desktop anatomy | `ctx.needsTheme` / `ctx.needsLang` on `HeaderCtx` | `StoreHeader`, `"desktop"` |
    | Phone bar slots | `keptSlot(ids, needs)` (`lib/storefront-mobile.ts`) | `MobileBar`, `"mobile"` |
    | Menu drawer rows | `!chromeHas(chrome, id) && utilityNeeds.needsX` | `MobileOverlays`, `"mobile"` |

    All three resolve the bar through **`useResolvedUtilityBar()`**
    (`components/storefront/use-utility-bar.ts`) rather than a prop, because they sit in two
    different React trees — `StoreHeader` renders the desktop and phone bars, the drawer comes from
    `StoreShell` via `MobileOverlays`. The moment the trees resolve it differently, the duplicate is
    back. **Never read `store.nav.utilityBar` directly** — that skips the preview draft and the
    Classic legacy default.
    Both collisions were real: `centered`/`clinical` carry their own `LangBtn`, and the `tabs` phone
    template ships `right: ["lang", "theme"]`, so switching the bar on for phones stacked two
    language switches and two theme switches on top of each other.
    `ThemeBtn` takes `compact` for icon-only rows; it is a prop, not a second component, so the two
    cannot drift. `desktop-variants.test.tsx` discovers every exported `*Desktop` from the source and
    fails if one has no exit **or** guards it on anything but `ctx.needsTheme`;
    `storefront-utility-bar.test.ts` sweeps every bar configuration at BOTH breakpoints for "never
    both silent, never both speaking"; `storefront-mobile.test.ts` pins `keptSlot`.
  - **When a colour looks wrong to the owner but right to you, compare PERSISTED STATE before
    anything else.** A fresh QA profile has no `ezy-sf-theme`, so it always renders light; the
    owner's browser had `dark` from an earlier visit and no control to undo it. Four rounds of
    "the background does not match" were two people correctly describing two different renderings.
    `localStorage.getItem('ezy-sf-theme')` is the first thing to print in any storefront colour QA.
    is right, something else is painting — probe the point, don't re-read the variable.
  - **`--font-display` is a second font variable, spent only on `h1`–`h4` and `.sf-display`.** It is
    declared on the bare `.sf-shell` rule as `var(--font-storefront)`, so it equals the body face on
    every option but `market` and the whole mechanism is invisible until a shop asks for it. It has
    to be declared *there* and not on `.sf-root`: a custom property that references another one is
    substituted on the element that declares it, so on `.sf-root` it would resolve against
    `.sf-root`'s own `--font-storefront` and freeze every shop's headings to the default family,
    ignoring `[data-font]` entirely. ⚠ **Never widen it to product names, prices, buttons or form
    labels.** The reason the storefront had no display option before 2026-08-14 is that one variable
    set all of them at once, and a display face drawn for 40px is illegible at 13px.
  - **`--accent` / `--accent-soft` / `--on-accent` are the SECOND colour, and they default to the
    brand.** `theme.accentColor` had been a stored field that rendered nowhere — `--sf-accent` was a
    plain alias of `--primary` — so every shop was single-hued no matter what the merchant picked.
    `StoreShell` now stamps `[data-accent]` beside `[data-brand]`, **only when the accent actually
    differs from the brand** (an accent equal to the brand is not a second colour, and the fallback
    already covers it). Spend it on the QUIET informational tint — hero badge chips, the trust band,
    provenance/promise rows. ⚠ **Never on a call to action:** an accent that competes with the buy
    button is a second primary. Measuring the Fresh Market mockup against the shop is what found
    this — the design painted 6 elements in its brand and 9 in its second colour, while the shop
    painted 26 in the brand, because it had nothing else to paint with.
  - **`radius: "pill"` is the step where `--radius-sm` stops being a radius and becomes a shape**
    (999px controls over 20/28px panels). It is its own option rather than bigger numbers on `round`
    because it is a different decision. ⚠ It does not contradict the "999px is a shape constant"
    rule above: that rule protects avatars and badges, which are circles at *every* setting and
    hardcode their own; here only the controls step moves, so nothing holding a paragraph becomes a
    lozenge.
  - **A hardcoded `borderRadius` on a control is a bug, not a detail.** The card CTA carried a
    literal `7px`, which meant the merchant's Corners setting never reached the single most visible
    button in the shop — invisible to typecheck, lint and tests, and only found by measuring the
    rendered page against a design.
- **Mobile rules — the storefront is phone-first, and inline styles can't hold a media query.**
  Anything that must change at a breakpoint goes in `storefront.css` behind a class (that is why
  `.sf-pdp-*` and `.sf-footer-*` exist), never into a `style={{…}}`. Four standing rules, each
  fixed a real defect (2026-07-31 audit at 320/360/740px):
  - **Text fields are ≥16px.** Use `sfInput` (`components/storefront/field-styles.ts`) for every
    shopper-facing input — one shared object, previously six pasted copies. Below 16px iOS Safari
    zooms the page on focus and, since the viewport meta rightly permits scaling, never zooms back;
    checkout's seven fields meant seven pinch-outs per order. `checkout-bits.tsx` **re-exports**
    `sfInput` as `input` — it used to declare a fourth copy, which had already drifted to its own
    radius, padding and background. Its label partner is `sfFieldLabel` in the same file.
  - **Touch targets are ≥40px.** For icon buttons add `padding` plus a matching negative `margin`
    (see `tapPad` in `store-header.tsx`) so the hit box grows without moving the glyph; for list
    rows add real vertical padding. A bare `padding: 0` icon button is a bug — the hit box equals
    the glyph (the cart's remove `×` was 15×15).
  - **Money never breaks mid-value.** A price row is `flexWrap: "wrap"` with `whiteSpace: "nowrap"`
    on each amount. Cards are ~130px wide in the 2-column mobile grid and clip
    (`overflow: hidden`), so an unwrapped "From + price + struck compare-at" row rendered the
    original price cut off mid-digit.
  - **Fixed heights get a viewport cap.** `.sf-hero` is `min(…, 70svh)` on desktop — a flat
    430px was 76% of an iPhone SE screen and 89% in landscape. Use `svh`, not `vh`, so the
    collapsing mobile URL bar doesn't resize it. Always declare a **non-`svh` fallback first**: the
    hero's slides are `position: absolute`, so a browser without `svh` (pre-Chrome 108 / Safari 15.4)
    drops the declaration and collapses it to nothing.
  - ⚠ **A fixed height is a promise about RATIO you didn't mean to make.** The phone carousel is
    one compact image surface with title + CTA over a strong bottom gradient; badge/subtitle yield.
    Optional `mobileImage`/`mobileFocal` provide art direction without creating a second copy panel
    or demanding one upload ratio serve every viewport.
  - **A desktop sidebar is not a mobile header.** `--acctgrid` / `--colmain` / `--cartgrid` collapse
    to one column below 680px, so anything built as a side column *stacks above the content* there.
    Check what that costs before it ships: the account nav was a 499px list (62% of the screen) and
    also `position: sticky`, so it pinned itself over the content. Pattern for fixing it is
    `.sf-account-nav` — **one** set of markup, `grid-template-areas` re-pointed at the breakpoint, so
    a control can move (logout sits inline with the identity row on mobile, under the list on
    desktop) without a second copy of the nav in the JSX. **`.sf-herocard` is the second instance**
    (2026-08-17): `--herocols` collapsing to `1fr` stacked the Classic hero's copy above its
    photograph, so a phone's whole first screen was text and the photo arrived at ~477px with the
    fold through it. Same markup, `grid-template-areas` on desktop and `order` on mobile — the photo
    leads, the trust badges become the card's footer strip. This is also why `HeroCard` is the one
    static hero styled by class rather than inline: **reordering is not expressible inline.**
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
  - **A page that renders a per-page variant reads it through
    `useStoreTemplate(store, key)`** (`use-sf-preview-store.ts`), never `resolveTemplates(store)`
    directly. The hook overlays the Customize draft on the saved value, which is what makes the
    picker repaint while a merchant is choosing; reading the resolver pins the page to the SAVED
    value and the control looks dead until Save. Covers the four keys only one page each reads —
    `collection`, `product`, `checkout`, `pagination`. The rest (`home`, `header`, `footer`,
    `productCard`, `cardActions`, `hero`, `headerMenu`) reach their consumers through the shell,
    which already reads the preview store. Generalised 2026-08-04 from a pagination-only hook,
    when the other three were found to be unpreviewable.
- **Mobile chrome** (`templates.mobile`, default `tabs`) — its own axis, and a **registry**, not a
  set of components. See *The MOBILE axis* below before adding a phone layout.
- **Card CTA layout** (`templates.cardActions`, default `add-buy`) — **a second axis on the
  product card, orthogonal to `productCard`**, which now means *density only*. Values:
  `add` | `add-buy` | `icons` | `buy-first` | `reveal` | `icon-only`. Folding these into
  `productCard` would need one id per density×layout pair; two keys is 3 + 6.
  Read it through `resolveTemplates(store).cardActions`; the Customize preview streams the **raw**
  kebab id, so `product-card.tsx` calls the exported **`resolveCardActions(raw, density)`** directly
  rather than assuming a camelCase value.
  - **Unset resolves off `productCard`, not off the default.** Before this key existed,
    `productCard: "compact"` hard-coded its own CTA (an inline "+"), so an unset value on a compact
    store must resolve to `iconOnly` — same migration shape as `resolveHeaderMenu`, and tested in
    `storefront-templates.test.ts`. Defaulting everything to `add-buy` would put two text buttons on
    every compact shop's cards without the owner choosing it.
  - That conditional default has **three** call sites, and all three must agree: the resolver, the
    card (which resolves against the *draft* density, or the preview lies), and the Customize
    `tpl` seed — which would otherwise write `add-buy` into a compact store the next time its owner
    saved **any** template, restyling their cards without asking.
  - **The struck compare-at is gated on this axis, not on density** (`product-card.tsx`,
    `pct > 0 && actions !== "iconOnly"`). `iconOnly` is the only layout that *shares* the price row
    with its button — the card passes `priceRow` in as `CardCtaRow`'s `price` prop, leaving ~90px
    beside a fixed 40px "+" on a 2-column mobile grid. Every other layout puts its CTA on its own
    line, so the price row is full width and the "was" fits. This read `!compactLayout` until
    2026-08-11 and that was the orthogonality bug in miniature: a `standard`-density store showed
    the strikethrough on its Classic featured row (`variant="full"`) and dropped it on new arrivals,
    search and the PDP related row (`variant="compact"`) — while the `-N%` badge over the image
    rendered in all of them, since it never had the guard. A discount badge with no anchor beside it
    advertises a saving the shopper cannot check. **When you add a `cardActions` value, decide which
    row its CTA occupies before copying either branch.**
  - **`layoutOwnsImage(actions)` decides where variant options open**, and is the rule to keep:
    a layout that paints its CTA over the product image (`reveal`) has taken the space the
    in-card flyout uses, so those products go to the **quick-buy sheet** instead. The two obvious
    alternatives are both broken — letting the flyout *replace* the CTA strands the shopper with a
    chosen size and no button to commit it, and *stacking* them covers ~55% of a 158px card image.
  - **`reveal` is hidden-on-hover, so its CSS defaults to OPEN** and layers the hiding inside
    `@media (hover: hover) and (pointer: fine)`. Written the other way round, a touch device gets a
    card with no buy button at all — it can never produce the hover that reveals it.
- **Listing pagination** (`templates.pagination`, default `pages`): `pages` = numbered
  `<Pager>`; `infinite` = auto-load `AUTO_LOADS` (2) pages then a button; `load-more` = button
  only. Applies to **both** the collection page and search results, which share
  `components/storefront/{pager,load-more}.tsx`. The pager draws the real page numbers with
  collapsed gaps (`‹ 1 … 9 10 11 … 20 ›`) from the exported, tested `pageItems(page, totalPages,
  siblings?)`; its **slot count is constant at every page**, so the strip never resizes under the
  cursor mid-walk — that invariant is what `pager.test.ts` asserts, so keep it if you touch the
  window logic.
  **The cursor lives in `?page=`, not component state** (`useCatalogFacets` owns it, like every
  facet). History remembers a URL and never a `useState`, so before this a shopper on page 3 who
  opened a product and pressed Back landed on page 1 and had to walk down again. Three consequences
  to keep together: `setParams` **drops `page`** on any facet change (which retired the render-time
  `if (prevKey !== filterKey) setPage(1)` adjust both listing views carried); the server pages
  (`products/page.tsx`, `[...categoryPath]/page.tsx`) seed **that** page via `catalogPage(raw.page)`
  and pass `initialPage`, so the view only consumes the seed while it is still on it; and
  `isIndexableCatalogUrl(sp, page)` makes page 2+ `noindex, follow`, since a real URL now exists for
  it and page 4 is thin duplicate copy of the page-1 landing page. Reads through
  **`useStoreTemplate(store, "pagination")`** — see the rule above. Non-`pages` modes use
  `useStoreProductsInfinite`; see the query-cache note below for why its key is separate.
  `infinite` deliberately stops auto-loading: this footer holds real navigation and the mobile
  bottom nav sits over it, so an endless list makes both unreachable.
- **Client state (zustand, persisted)**: `services/stores/use-shopper-store.ts`
  (`easystock-shopper`: token/shopper/slug, `setAuth/setShopper/logout`),
  `use-cart-store` (slug-scoped items), `use-wishlist-store`. **Any component reading a persisted
  store on first render must gate on `useHydrated()`** or SSR mismatch / redirect races follow
  (checkout had exactly this bug: direct load bounced signed-in shoppers to /account).
- **Cart mirror** — the cart is *also* copied to the server so the merchant can see abandoned carts.
  **`components/storefront/cart-sync.tsx` is the only place that does this**, mounted once in
  `StoreShell`; the handle lives in `services/storefront/cart-identity.ts` under its **own**
  `localStorage` key so `easystock-cart`'s persisted shape is untouched. Backend contract + the
  merchant-side rules: [`abandoned-cart.md`](../../../../inventory-backend/docs/plan/abandoned-cart.md).
  Four rules, each a real defect class: **(1)** it subscribes via `useCartStore.subscribe` inside an
  effect, **never a selector** — a selector re-renders the whole shell on every quantity tap;
  **(2)** it is gated on `persist.onFinishHydration`, or the first push overwrites a real server
  cart with an empty one; **(3)** it is disabled under `?preview=1`, or a merchant theming their
  shop in Customize pollutes their own funnel; **(4)** it flushes on `pagehide`/`visibilitychange`
  with `keepalive`, because the shopper who adds an item and closes the tab inside the 2 s debounce
  is precisely the abandoner worth recording. **Do not add a second sync call site** — new cart CTAs
  are picked up automatically, which is the entire reason it is one subscription and not eight.
  **`claimCart` returns the merged cart and `CartSync` adopts it** (`useCartStore.restore`) whenever
  `mergedCount > 0`: signing in folds in the cart this shopper left on another device, server-side,
  and if the client kept its own items the next debounced sync would push them over the merge and
  undo it. Adoption is what makes cross-device carts actually work — it is not a nicety.
- **API client**: `lib/storefront-client.ts` — `sfFetch` (no auth header unless `token` passed).
  Error payloads carry the message in `json.error`. On **401 with a token that is still the
  current session token, the shopper session is dropped** (self-healing stale sessions).
  TanStack hooks in `services/storefront/hooks.ts` (`useStore`, `useStorePage`, `useShopperAuth`,
  `useShopperAccount`, `useResendVerification`, `usePlaceOrder`, …).

## Cache + on-demand revalidation (why an admin edit used to take 5 minutes)

The shop is served from three caches — the Next Data Cache and, for `/pages/<slug>` only, the Full
Route Cache on the server, and TanStack in the shopper's browser:

| Cache | Set by | Lifetime |
|---|---|---|
| Next **Data Cache** (per fetch) | `next: { revalidate, tags }` in `lib/storefront-server.ts` — every fetch carries `store:{slug}` **plus its scope** (`site` / `catalog` / `content`, `lib/storefront-cache-tags.ts`) | `getStore` 300s; products/campaigns 60s; sitemap 1h |
| Next **Full Route Cache** (rendered HTML) | **Only the cached `/sites` route** (`/pages/<slug>`, see "Cached store pages"). Every `/shop` route reads `headers()` through `getStoreContext()` (`lib/storefront-host.ts`) and renders on every request | `/pages/<slug>`: the shortest fetch `revalidate` on the page (60–300s); other shop routes: none (`cache-control: private, no-cache, no-store`, measured 2026-09-14) |
| TanStack `staleTime` | `services/storefront/hooks.ts` | 5 min, seeded from the SSR value |

Both server caches live **in the Next server and are shared by every visitor**, which is why a
merchant could never clear them by reloading — hard reload tells the *browser* to refetch, and the
server answers from the same stored copy. **Don't debug a "stale storefront" report in the browser.**
A cached page is dropped whenever any fetch it was built from is flushed, so pages need no tag of
their own.

Until 2026-07-31 the `store:{slug}` tag was declared on every fetch and **never called** — no
`revalidateTag` existed anywhere in the workspace, so time expiry was the only flush and a theme
colour took up to five minutes to appear. Now:

- **`POST /api/storefront/revalidate`** (`app/api/storefront/revalidate/route.ts`) flushes the scopes
  named in its body (`{ "scopes": ["catalog"] }` → `catalog:{slug}`), or `store:{slug}` — the whole
  store — when the body names none or does not parse (`tagsToFlush`; flushing too much costs a cold
  render, too little hides a save). Each tag gets `revalidateTag(tag, { expire: 0 })`. The slug comes
  from the caller's session via the backend's `/auth/me` — **never from the request body**, or one
  tenant could strip another's cache. Bearer header only (a cookie would make it CSRF-triggerable).
  `{ expire: 0 }` rather than the `"max"` profile so there is no stale-while-revalidate window: with
  one, the merchant's *next* reload still serves the old copy and they have to reload twice.
- **`lib/revalidate-storefront.ts`** `revalidateStorefront(scopes?)` is the only caller —
  fire-and-forget, silent on failure (the save already succeeded and the timer is still a backstop),
  `keepalive` so navigating away right after saving doesn't cancel it.
- **Wiring**: `services/api/invalidation.ts` maps each event in `PUBLIC_STOREFRONT_EVENTS` to its
  scope — `catalog.changed` and `storefront.catalog.changed` → `catalog`,
  `storefront.content.changed` and `storefront.page.published` → `content` — and flushes the union, so
  catalog/campaign/coupon/CMS and builder-page publishes get it for free. A builder page's draft
  (`storefront.page.drafted`) flushes nothing: shoppers cannot see it. The storefront-settings, media, features, onboarding and organization
  mutations in `services/api/modules/organization/hooks.ts` call `revalidateStorefront()` directly with
  **no scope** (a settings save can reach anything the shop renders); the Meta Pixel save flushes
  `site` only. **A new admin mutation that changes public shop data needs one of those two paths, with
  the narrowest scope that is still true**, or it ships the old bug.
- **`stock.moved` is deliberately excluded** — stock moves on every sale, so flushing per movement
  would keep the cache permanently empty. The 60s catalogue revalidate covers stock freshness.
- **Deployment**: `revalidateTag` only reaches the instance that serves the POST. Multi-replica
  needs a shared `cacheHandler`; single instance (current) is fine.

## Pages — the Storefront Builder's admin screen (Phase 3, since 2026-09-15)

Online Store → **Pages** (`app/(protected)/ecommerce/pages/`) is where landing pages are made and, as
Phase 3 lands, edited. Plan: `../inventory-backend/docs/plan/storefront-builder.md` (§13 the editor,
§17 what changed).

- **Gated on `storefront.design`**, not `storefront.manage` like the rest of Online Store: it is the
  permission every `/ecommerce/pages` route checks, so a role holding only `manage` would open a screen
  whose every request 403s.
- **Landing pages only** (`kind: "landing"` on the list call). Content pages keep the Content screen
  until the Phase 5 store migration (owner decision, 2026-09-15); system pages arrive then too.
- **Orders per landing page** (Phase 4, 2026-09-15). `lib/storefront-attribution.ts` keeps the visit's
  source in `sessionStorage` (`ezy-visit-source`): `utm_*` tags from any URL the shopper arrives on and
  the id of the last landing page they came through, each last-touch on its own, never under
  `?preview=1`. `VisitSourceCapture` is mounted in both shop frames (tags only) and on a landing page
  through the `visit-source` island in `BuilderPageBody` (with the page id) — the capture merges, so
  effect order does not matter. **Owner preview never attributes a page:** with the preview cookie the
  proxy serves the owner-preview route, which draws through `PageDraftPreview` and has no island — so a
  merchant checking their own page in the browser they edit from sees no page id stored (this looked
  like a bug in browser QA; test as a shopper with `?previewEnded=1` first). `useCheckout` sends
  `orderSource()` as `source`; the backend keeps the
  page only when it is this store's landing page, and the shopper never gets it back. The Pages list's
  **Orders** column links to `/ecommerce/orders?pageId=…`, drawn there as `LandingPageFilter`: a chip,
  never a dropdown, because a store can hold hundreds of landing pages.
- **The order form section** (`order-form`, landing pages only; Phase 4). Server view
  `sections/order-form.tsx` asks for its one product by id (manual source, so a sold-out offer still
  draws and says so) and hands it to the `order-form` island (`islands/order-form.tsx`). The island is
  **checkout, not a second checkout**: `useCheckout({ lines })` orders the form's own line with every
  checkout rule, never reads or empties the cart, sends no cart handle, and reports `InitiateCheckout`
  on the first edit (`use-initiate-checkout.ts`) instead of on arrival. Options resolve through
  `resolveProductChoice` / `choiceLine` (`components/storefront/product-choice.ts`) — the product page
  and the quick-buy sheet use the same helper, so price, stock and the default option cannot differ
  between them. A list row has no `variants`; a variable product waits for the detail payload. The
  quantity control is `QtyStepper` (`components/storefront/qty-stepper.tsx`), shared with the sheet.
- **Single product, Offer & pricing, Sticky order bar** (landing pages only; Phase 4). All three ask for
  their one product by id through the registry's `oneProduct` request, like the order form.
  - **Single product** (`islands/single-product.tsx`) is the product page's own top, not a copy: the
    info column is `ProductOverview` + `ProductLongDescription`
    (`components/storefront/product-detail/product-overview.tsx`) and buying is `useProductBuy`
    (`product-detail/use-product-buy.ts`) — picks, quantity, photo, `ViewContent`, add / buy now /
    wishlist. `useProductDetail` wraps that hook with the product page's queries and template, and
    `ProductBuyPanel` takes the hook's `ProductBuy`. **Reuse these for any other surface that sells one
    product.** On a landing page Add to cart opens the cart drawer instead of a toast (there is often no
    header cart to reach).
  - **Offer & pricing** is a server view with an `offer-price` island for the words ("From", "off",
    "Out of stock" — interface language a cached view cannot know). No stock-left line: owner decision,
    no glossary term. `listingSoldOut` (`components/storefront/product-choice.ts`) is the sold-out rule
    for a listing row before any option is chosen.
  - **Sticky order bar** (`islands/sticky-order-bar.tsx`) is phones only (`.sfb-orderbar`), fixed, and
    publishes `--sf-buybar-h` through `useBuybarHeight` so the contact launcher stacks above it. Its
    button scrolls to the first element carrying `ORDER_FORM_ANCHOR`
    (`components/storefront-builder/order-form-anchor.ts`, stamped by the order form section), or opens
    the product page. It hides while a form is on screen, at the page end and when sold out. The
    registry marks it **`floating`**: `PageSections` stamps `data-float` and the frame becomes
    `display: contents`, so it takes no room where it is placed. A floating frame has no box, so the
    editor preview outlines its content instead (`EDITOR_FRAME_CSS`).
- **Testimonials, Benefits, How to order, Video** (Phase 4; How to order is landing-only). Merchant text
  only. **Testimonials are never labelled "verified"** — a review needs a `name` and words or a
  screenshot (`shownTestimonials`), and a new one starts nameless so a placeholder can't be saved; a
  CSS scroll-snap row on phones (`.sfb-cards`), no island. Benefits use `IconDisc`
  (`components/storefront/icon-disc.tsx`, shared with `PromiseRows`) and the section specs' shared
  `ICON` enum. **Video embeds only through `parseVideoEmbed`** (`lib/storefront-builder/video-embed.ts`):
  YouTube (watch, youtu.be, shorts, embed, live) and Facebook (videos, watch, reel, fb.watch), any other
  link draws nothing — never add a raw iframe URL path. The `video` island shows a cover (merchant
  picture, else YouTube's `hqdefault`) and loads `youtube-nocookie.com` / Facebook's plugin only on
  press; its accessible name is the merchant's `label`, since the dictionary has no "play" wording.
- **Spacer** (Phase 6, every page; `sections/spacer.tsx`). `space` is a required responsive px number
  written to `--sfb-space` / `--sfb-space-m` (`.sfb-spacer`), with a zero-padding registry frame so the
  band is exactly that tall; `line` draws a `::before` in `--border`. **Setting labels are shared by key**
  (`FIELD_LABELS`), which is why it is `space` and not `height` ("Picture height (px)" on promo cards) —
  check the table before naming a new setting.
- **Pause online orders** (`settings.checkout.ordersPaused`, `pausedMessage`, `pausedWhatsApp`; admin:
  Checkout settings tab). Every buy surface asks `useOrdersPaused()`
  (`services/storefront/use-orders-paused.ts`, over the pure `ordersPausedOf` in
  `lib/storefront-orders-paused.ts`) and draws `OrdersPausedNotice`
  (`components/storefront/orders-paused-notice.tsx`) — the product buy panel (so Single product too), the
  quick-buy sheet, the cart drawer, the checkout page and the order form; card CTAs and flyout, the
  product sticky bar and the sticky order bar draw nothing. **A new buy surface must ask it too.** The
  message is the merchant's; the chat link reuses `chatOrderInstead`. The API refuses regardless
  (`STORE_ORDERS_PAUSED`, backend `storefront-orders` skill).
- **A landing page as the homepage** (backend `settings.homePageId`, set by `PUT /ecommerce/pages/home`;
  admin: the Pages row actions and `components/ecommerce/pages/homepage-dialog.tsx`). `proxy.ts` rewrites
  the store's front door (`isStoreHomePath`) to `sites/[slug]/[mode]/home`, or `preview-home` under a
  preview token, only when `storeHomePageExists` (`lib/storefront-page-lookup.ts`, over
  `GET /page?path=/`) says so — and never under `?preview=1`, so Customize's frame keeps editing the
  Customize home while `LandingHomeNotice` tells the merchant shoppers don't see it. The front door keeps
  the store's own metadata (`buildStoreHomeMetadata`, shared with `shop/page.tsx`, plus
  `StoreHomeJsonLd`); the page's own address goes noindex while it is home. `storefront.home.changed`
  flushes `site` and `content`, and the revalidate route calls `forgetStoreLookups`, so the proxy's
  remembered answers go with the flush. **A new internal `/sites` segment must map back in
  `publicPathname`**, or pathname-derived chrome mismatches on hydration.
- **API: `services/api/modules/storefront-pages/`.** Every write answers with the whole page, and the
  hooks put it straight into the detail cache (`storePage` in `hooks.ts`). `storefront.page.drafted`
  refreshes the lists only; `storefront.page.published` refreshes everything and flushes the shop's
  `content` scope. **Never let an autosave refetch the page** — the refetch races the merchant's next
  edit and hands the editor a `draftVersion` it did not save. `useSaveStorefrontPageDraft` shows no
  toast and handles no error itself: the editor has to tell a version conflict from a refused section.
- **Creating starts from a template** (`components/ecommerce/pages/new-page-dialog.tsx`): Single
  product COD, Offer or campaign, Product launch, Blank, then the product and a name. Templates live in
  `components/ecommerce/pages/page-templates.ts` as section lists built with `newSection`, so they
  start from the same defaults as the editor; the picked product's id goes into every product section,
  and nothing of the product is copied (its sections draw it live). The page is created with those
  sections as its first draft in ONE request (`POST /ecommerce/pages` `sections`, checked like a draft
  save before anything is written). The backend picks the address, the minimal chrome and `noindex`.
- **Editor copy is English for now** (owner decision, 2026-09-15), like the rest of Online Store; only
  the sidebar label is translated (`পেজ`).
- **A draft is previewed** through the owner-preview page route — see "Cached store pages" above.
  There a builder page draws through `PageDraftPreview`
  (`components/storefront-builder/page-draft-preview.tsx`): under `?preview=1` it takes
  `ezycore-page-draft` messages **from its parent frame only** (`event.source === window.parent`),
  redraws with the shop's own section registry, and answers `ezycore-page-draft-ready` /
  `ezycore-page-draft-applied`. Products are reused **by query** (`requestSignature`), so only a changed
  query is fetched, alone, through `storefrontApi.sectionData`.
- **Section pictures upload through `storefrontPagesApi.uploadImage`** (`POST /ecommerce/pages/images`,
  `storefront.design`); a rich-text field in the page editor uses image scope `"page"`. Never point the
  page editor at the content-page upload — it needs `storefront.manage`.
- **The editor** (`app/(protected)/ecommerce/pages/[id]/`, `components/ecommerce/pages/editor/`).
  `usePageEditor` holds the sections, the selection and the device, above the rail and the preview. The
  rail is `SectionTree`, or with a section open `SectionInspector` → `SettingsFields` → `FieldControl` /
  `ImageField` / `RefField`, all chosen by the `SECTION_SPECS` field type — **a new spec field needs no
  editor code**, only a label in `section-catalogue.ts` (it falls back to a readable form of its key).
  What a new section starts with is `section-defaults.ts`; a test requires every addable default to be
  complete, except Image and text, whose picture cannot be invented.
  - **The editor holds anything; a save sends only `savableSections`.** The backend refuses a whole draft
    over one invalid field, so an unfinished section or item stays local and is marked in the list.
  - **Clearing an optional setting deletes its key** (`withFieldValue`) — the backend refuses `""` where it
    expects a link. A responsive setting is `{ base, mobile? }`; the device switch picks which one is
    edited, and a phone value with no desktop value becomes the base.
  - **The preview stage is shared with Customize** (`components/ecommerce/customize/preview-stage.tsx`:
    the device switch, the phone frame, the desktop `zoom` rule). Never copy it back into either preview.
  - **Click-to-select goes both ways** through `lib/storefront-builder/page-draft-messages.ts`. The owner
    preview stamps `data-section-id` (`PageSections annotate`) and scrolls **its own window only** —
    `scrollIntoView` also scrolled the editor page around the frame. Import the message names from that
    module, never from `page-draft-preview.tsx`, which would pull every section view into the admin
    bundle.
  - **Saving** (`use-page-autosave.ts`): 1.2 s after the last edit, only `savable`, pinned to the
    `draftVersion` the server last returned. One editor per page is assumed (owner decision
    2026-09-15): `STOREFRONT_PAGE_DRAFT_CONFLICT` stops autosave and asks for a reload, and content the
    backend refused is not retried until it changes. **Publish calls `flush()` first** — the backend
    publishes the saved draft. A publish, discard or restore answer goes through `autosave.adopt` **and**
    `editor.reset` together: one without the other pins the next save to a stale version, or shows a
    draft the server no longer has.
  - **Undo/redo** (`history.ts`): whole-section snapshots, 100 steps, edits to one section within a
    second merged into one; `reset` clears it. Ctrl/Cmd+Z is ignored inside text fields
    (`use-undo-shortcuts.ts`), where the field's own undo is what the merchant expects.
- **A product section can set its own card photo shape and fit** (`cardImageRatio` / `cardImageFit`,
  `CARD_PHOTO` in the section specs; owner decision 2026-09-15). `sectionCardMedia`
  (`lib/storefront-builder/card-media.ts`) returns only what the section sets, and `ProductCard`'s
  `imageFit` / `imageRatio` props win over `useStoreImageFit` / `useStoreImageRatio` only when given.
  **Never resolve the store's value into those props** — an unset section must keep following
  Customize → Product cards, including Customize's live draft. Per-product shapes were declined: cards
  in one row would differ in height.

## Live preview (Customize) — how it works, and how to add a field

> **An unpublished shop previews too, since 2026-08-18** — that is what "the real storefront" costs,
> and it needs a token. See "Owner preview" below before touching the iframe URL, `proxy.ts`, or
> either storefront fetch layer.

The right-hand panel of Customize is **the real storefront** in an iframe at `{store}?preview=1`. It
mounts **once**; edits reach it by `postMessage`, never by refetching. An edit therefore costs zero
server requests — do not "optimise" this into a save-then-reload, which would cost a full (and now
cache-missing) SSR render per save.

Four files, in payload order:

1. `components/ecommerce/customize/use-customize-draft.ts` — holds **every** editable value (the
   parts own none, so nothing is lost when one closes), and
   `customize/draft-payloads.ts` `toPreviewPayload()` serializes it. That module also builds the
   save payload, so the two cannot trim differently.
2. `components/storefront/preview-bridge.tsx` — receives it inside the iframe (gated on `?preview=1`)
   and calls `apply`. It announces `ezycore-preview-ready` on mount so the editor pushes immediately.
3. `services/stores/use-sf-preview-store.ts` — the override state.
4. The storefront component reads its override and prefers it over the saved payload.

**A store whose look is published through the Site (Phase 5) saves a draft, not the live look.** When
`settings.siteCutoverAt` is set, the Customize page loads `useStorefrontSite`, the workspace edits
`settingsWithSiteLook(settings, site)` (`customize/site-look.ts` — every look block from the Site's
draft or live look), Save sends the same `toSettingsPatch` blocks to the Site draft, and
`SitePublishBar` publishes, discards and restores. The backend refuses look blocks on the settings PATCH
for such a store (`STOREFRONT_LOOK_ON_SITE`), so never route a look save around this. `SITE_LOOK_KEYS`
mirrors the backend's `STOREFRONT_SITE_LOOK_KEYS`; collections and media stay live-on-save. The preview
path above is unchanged — it streams the client draft either way.

**Any change that moves an existing store's pages gets a pixel diff** (`tests/pixel`):
`PIXEL_STORE=<slug> pnpm pixel:capture` before, `pnpm pixel:compare` after. Wait until the store shows the
change first — cached store HTML lags a publish by minutes locally, and a compare against the old page
passes. Keep the threshold absolute (`maxDiffPixels`): a ratio of a tall full-page image let a changed
footer line pass. Never point it at a live store without `PIXEL_ALLOW_LIVE=1` and the merchant's agreement.

**A home moved onto the builder must draw what the classic home drew** (Phase 5 step 5). Builder sections
print only the merchant's words by default; a converted instance turns on optional settings that bring the
classic behaviour back — `storeHeading`, `viewAll`, `storeWords`, `storeBanner`, `campaignBadge`,
`promises`, `storePromises`, `slideshow`, `wholeRows`. Dictionary words go through the `store-word` island
(`lib/storefront-builder/store-words.ts`), never baked into a cached server view, so a Bangla shopper still
sees Bangla. A section type's classic padding and band is its `frame` in `section-registry.tsx`. The backend's
`convertClassicHome` mirrors `HOME_PRESET_SECTIONS`, `resolveSections`, `sectionRow`/`sectionQuery` and
`resolveHomeCollections` — change a classic home rule and you change that converter too.

**Rules, each of which was a real defect:**

- **Normalize in the payload exactly as `submit()`/`save()` does** — filter blank-titled footer
  groups, blank-titled slides, `cleanHeroBanner`, the public `/categories` shape. A preview that
  shows something the save would drop is worse than no preview.
  - ⚠ **`publicCollections` mirrors `GET /:slug/categories`, and that is a claim needing a test.**
    It silently drifted when categories became a tree — it kept emitting a flat
    `{_id, name, slug}` with no `slugPath`, so the preview's header menu went **empty** the moment
    the source was set to "collections" (the storefront drops a node it cannot link). It now
    nests, carries `slugPath`, and hides an unlisted parent's children — and is exported and
    tested (`draft-payloads.test.ts`) precisely because nothing else can catch that drift: the two
    sides live in different repos and the failure looks like an empty UI, not an error.
    The admin `collectionDto` / `COLLECTION_FIELDS` carry `slugPath` + `parentId` to make it
    possible at all.
- **`?? saved` is the fallback for everything except images.** For `logo`/`banner`, `null` is a real
  draft value meaning "removed", so use **`useSfPreviewImage(field, saved)`** — never re-derive the
  `undefined`-vs-`null` check inline. Getting it wrong makes a deleted logo reappear.
- **`contactButton` follows the IMAGE rule, not the `?? saved` rule.** `null` is a real
  draft meaning "the merchant switched the launcher off", so the store seeds it `undefined` and
  consumers test `draft !== undefined ? draft : saved`. A `??` here leaves the button visible in the
  preview after it is switched off. Its preview builder (`toPreviewContactButton`) also has to mirror
  `resolvePublicContactButton` on the backend — including returning `null` when no number resolves —
  or the merchant judges a button their shoppers will never see. The number itself is not in the
  draft (it lives in Settings → General), so `socialWhatsapp` is threaded in from the workspace.
- **An empty array is a real draft** ("all groups removed"), so `previewGroups ?? saved` — never a
  truthiness check.
- **`homeRows` is the one draft the preview cannot render on its own** — it is config, and a row
  needs products the server never fetched for it. So it streams as config and the row fetches
  client-side when it has no server-rendered products, matched by `rowSignature` rather than by row
  id; see the homepage-product-rows bullet under "Other storefront subsystems" for why both halves
  of that are load-bearing. It is also why this is the one preview path that costs a request.
- **Media (logo/banner) is not a draft** — its PATCH saves on upload, so it streams from `settings`,
  which the mutation has already refreshed in the query cache.
- **Stream the EFFECTIVE logo, not the store's own.** A store with no logo inherits the
  organization's: `getStoreInfo` serves `s.logo ?? org.logo` (BE), so merchants upload once in org
  settings and an upload in Customize is a store-only override (remove ⇒ back to inherited). The
  editor must send `settings.logo ?? orgLogo ?? null` or removing the override blanks the previewed
  header instead of reverting to the org mark.
  - ⚠ **`mobileLogo` is the exception, and streams RAW.** The storefront falls back from it to the
    desktop logo *itself* (`useMobileBrandLogo`), and the backend deliberately does not chain it in
    `getStoreInfo` — the client has to tell "the merchant uploaded a phone mark" apart from "use the
    desktop one". Resolving it in the editor would make removing the phone mark preview as though
    nothing had happened, which is the same class of bug the `useSfPreviewImage` rule above exists
    for, one level up.
- **Everything in Customize streams.** If you add a control there and skip this wiring, you have
  re-created the exact inconsistency that nearly got the whole feature deleted.
- **A control also belongs to the part whose preview DEVICE renders it** (2026-09-06). The same
  argument as the page rule below, one axis over: the Phone bar part's controls change nothing
  against a desktop frame, so opening it nudges the preview to mobile (`previewDeviceForPart` in
  `parts-rail.tsx`, applied during render in `BrowserPreview` so the desktop frame is never painted
  first). A nudge, not a lock — the toggle stays live.
- **A control belongs to the part whose PREVIEW PAGE renders it** (browser QA, 2026-08-18).
  Opening a part points the preview at one page (`PART_PAGE` in `parts-rail.tsx`), so a block whose
  subject lives on a different page can never be judged from the part holding it. Collections points
  at the collection page and used to carry the homepage collections row and the category-tile style;
  both styled the home page, so a merchant changed them while watching a page that does not contain
  either — indistinguishable from a dead control, and read as exactly that in QA. They now live in
  the Home page part (`parts/home-part.tsx`) beside the section list they style. Before adding a
  block to a part, check `PART_PAGE` for that part and confirm the preview will actually show it.
  When a setting moves parts, its `PART_SLICE` entry moves with it, or the save bar names a part the
  merchant never opened.
- **A payload key nothing READS is the same bug as one nothing sends** (browser QA, 2026-08-17).
  `theme.accentColor` was sent by `toPreviewPayload`, mapped by `preview-bridge`, and stored by
  `use-sf-preview-store` — and then read by no component, so the Brand part's accent field repainted
  nothing while the brand control directly above it updated live. `StoreShell` now takes
  `previewAccent ?? store?.theme?.accentColor`, the same shape as its `brandColor` line. When adding
  a preview key, grep for a consumer of `s.<key>` before calling it wired.

### Owner preview — the unpublished shop (2026-08-18)

Because the preview is the **real** storefront, it inherited the real storefront's front door: the
public API refuses a store whose merchant has not published it. So the preview pane was the "this
store isn't published yet" 404 until the shop was already live, and a merchant could only theme their
shop in public. Saving was never blocked — the admin settings endpoints know nothing about
`published` — so this adds a way to *see*, and changes nothing about who may *write*.

`lib/storefront-preview.ts` is the one file that owns the names, and its header comment draws the
whole route. In order:

| Step | File | What it does |
|---|---|---|
| mint | `services/api/modules/storefront-preview/` | `useStorefrontPreviewToken()` — a `useQuery` over a **GET** (nothing is created), enabled only when the shop is unpublished |
| carry | `components/ecommerce/customize/browser-preview.tsx` | `?previewToken=…` beside `preview=1` in the iframe `src` |
| relay | `proxy.ts` | URL param → `x-ezy-store-preview` request header, **and** into the `ezy-store-preview` cookie on the shop's host |
| read (SSR) | `lib/storefront-host.ts` → `lib/storefront-server.ts` | `getStorePreviewToken()`, then `x-storefront-preview` + `cache: "no-store"` |
| read (client) | `lib/storefront-client.ts` | one line in `sfFetch`, reading URL → cookie |

**Five things here are load-bearing, and four of them are invisible in a typecheck:**

- **The token has to travel in the URL.** The preview is a cross-origin iframe, and a frame's own
  navigation is the one request the parent page cannot put a header on. Everything downstream exists
  to get it *off* the URL again.
- **`proxy.ts` moves it to a header because a LAYOUT does the fetching.** `app/(storefront)/shop/layout.tsx`
  is where `getStore` and friends are called, and a layout receives `headers()` but never
  `searchParams`. There is no way to read the param where it is needed.
- **The cookie is what makes the preview survive a click.** One client-side navigation and the query
  param is gone; the RSC request for the next route would arrive anonymous and 404 the shop. It is
  script-readable on purpose — `sfFetch` runs on that origin and needs the same token.
- **A preview SSR fetch must be `cache: "no-store"`.** It is the one case where a storefront URL can
  return a payload the public may not have. Letting it settle into the `store:{slug}` entry would
  serve an unpublished shop to the next anonymous visitor.
- **`setStorefrontPreviewToken` is called during RENDER, above `useStoreProducts`.** That hook queues
  its fetch from its own effect, which runs *before* an effect written lower down — so a token
  published from an effect always arrived one request too late, and the Product tab stayed disabled.
  The same query is gated on the mint settling, because an early 404 is cached and would not re-run.

**A preview is exempt from the canonical 301** (`proxy.ts`). That redirect exists so crawlers index
one host; a preview is read by one person and indexed by nobody. Left in place it would move an owner
previewing a shop that has a custom domain off `{slug}.ezycore.com` — same site as the admin, so the
cookie sticks — and onto `mystore.com`, where the frame is cross-site, a `Lax` cookie is neither set
nor sent, and the preview survives exactly one click. Do not "restore consistency" by removing that
exemption; add a test instead.

The backend half — what the token does and does **not** unlock — is the `storefront-orders` skill's
`resolveStore` note; the spec is `../inventory-backend/docs/features/ecommerce.md` → "Owner preview".
Do not restate the gate table here.

### The homepage is a SECTION LIST, not a template (2026-08-12)

`components/storefront/home/home-sections.tsx` is the id → component registry; `StoreHome` is a loop
over `resolveSections(store, { draft, sectionConfig, isSectionId, presets })`. **`templates.home` now
selects a *default section list* (`HOME_PRESET_SECTIONS`), not a component.**

⚠ **`resolveSections` returns `{ sections, config }` and callers must read that config, not
`store.sectionConfig`** (2026-09-06). A preset entry may be `{ type, config? }` rather than a bare
id, so on a shop with no stored list the effective config is the preset's with the merchant's folded
over it — merchant always wins, `mergeSectionConfig` joins on the key `sectionInstances` minted for
both halves. Reading the stored array directly renders those rows unconfigured, which is how a "New
arrivals" row becomes a second Featured row with nothing on screen to explain it.

`home-classic.tsx`, `home-hero-split.tsx` and `home-minimal.tsx` are **gone** — removed by the owner's
decision on 2026-08-16 after being re-added once (`a7e2553`) and re-deleted. The ids survive as
`HOME_PRESET_SECTIONS` keys, so `templates.home: "classic"` still resolves; it just names a starting
section list now instead of a component.

⚠ **The Customize picker must SEED the list — `api.patchHomeTemplate`, never
`patchTemplate("home", …)`** (browser QA, 2026-08-17). `resolveSections` reads the preset only as the
fallback for an *empty* `homepageSections`, and no store has one (applying any theme fills it via
`sectionInstances(theme.sections)`). So the plain template write marked the part dirty, saved, and
changed nothing a shopper could see — the whole "Starting layout" picker was inert on every theme.
`patchHomeTemplate` writes the key *and* reseeds the list from `HOME_PRESET_SECTIONS`, exactly the
way `applyThemeToDraft` does. It leaves `sectionConfig` alone, for the same reason a theme apply
does.

### Three heroes, one collections row, one tag row (2026-09-06)

Six sections retired in one pass; the bar each merge cleared was **"the setting that replaces it is
a question a merchant can answer."** No migration — no live document used any of these four.

| Retired | Replaced by |
|---|---|
| `hero-split` | nothing. It was the middle of one axis (how framed), and the ends are the decision |
| `hero-manifesto` | `hero-open` + `theme.heroAlign: "center"` |
| `search-hero` | nothing. The `search-first` header carries the search on **every** page |
| `category-links` | `category-chips` + `theme.homeCollections.style: "plain"` |
| `age-chips` | renamed **`tag-chips`** — it always rendered `sectionConfig.tagIds`, not ages |

- ⚠ **`heroAlign` is read by `hero-open` ONLY**, and the Hero panel hides the control unless the page
  composes it. `hero-card` sets copy beside a photo, `hero-fullbleed` lays type over one — neither
  has an alignment worth asking about, and a control that does nothing is worse than none.
- ⚠ **Centring is a type decision, so it needs no mobile variant.** `--herocols` is `1fr` on a phone,
  so the open hero is already one column there. The thing to test is the button row: buttons are
  flex children, so `textAlign` alone leaves them hard left — `heroBtns` takes the alignment and sets
  `justify-content`.
- ⚠ **Retiring `hero-manifesto` un-hid a whole panel.** `HeroPart` gated itself on
  `templates.home !== "minimal"` because Minimal composed a section that ignored slides and banners.
  Minimal composes `hero-open` now, so the gate was hiding working controls. Removed.
- **`plain` hides the row's other controls rather than disabling them** — no pictures means no
  layout, columns or labels to set — but it KEEPS their values, so switching back restores the row
  the merchant built. Swapping sections used to discard them.
- **`tag-chips` takes `config.title`** and still falls back to "Shop by age". The only tag list it
  knows by itself is the age ladder; a generic "Shop by tag" over eight age rungs reads as
  unfinished.

### `category-banners` — promo cards, the thirteenth section (2026-09-06)

The first id added since the vocabulary was cut to twelve, and the only Phase 2 gap with a real
merchant request behind it: one to four departments as promo cards — photo, name, the merchant's own
line, a button.

- ⚠ **Answer this before touching either it or `category-tiles`:** tiles are **wayfinding** (every
  department, small, scannable, sized so a row never outweighs the products), banners are
  **merchandising** (a handful the merchant chose, drawn large enough to sell). That is why the count
  is capped at four and the collections are *picked* — a promo block showing all fourteen departments
  is a tile row with the type turned up. It is also why the description shows here and is suppressed
  on most tile modes.
- **`sectionConfig[].categoryIds`, a NEW field beside `categoryId`.** `categoryId` names the one
  collection a product row draws its products *from*; this names the collections a block *advertises*.
  Merging them would make two different questions one field. `assertSectionCategories` on the backend
  sweeps **both** shapes — the promo row carries no `source`, and the old guard keyed on
  `source === "category"`.
- **On a phone: one card per row, full width** (`.sf-banner-row`, `auto-fit` only past 680px). The
  premise is a card big enough to hold a photograph, a sentence and a button; at half a 375px screen
  it holds none of them. Page length is the cost, and the section's own show-on control is the lever.
- **Unpicked shows the first two collections, not nothing.** A blank section looks broken in the
  preview the merchant is staring at, having just added it — the same reason every product row has a
  built-in source.
- A pick that no longer resolves is **skipped, never pruned**, matching the hand-picked product row.
- ⚠ **`CONFIGURABLE` + `TAG_CONFIGURABLE` are now one `sectionConfigKind` map** (`products` | `tags` |
  `categories`). Two sets were answering "which editor?" and "does this row earn a catalogue fetch?"
  at the same time and agreeing by accident. `isConfigurableSection` is still the fetch predicate, and
  is now derived from the kind.
- ⚠ **A section may be added more than once exactly when its CONFIG can tell two instances apart** —
  so any section with a `sectionConfigKind`, not just a product row. The picker's predicate was
  `isConfigurableSection`, which gave the same answer only while product rows were the only
  configurable ones; `tag-chips` and `category-banners` are repeatable now, and both name themselves
  in the editor list after what they hold rather than after their section type.

#### `cardShape` — photo on top, or photo beside (2026-09-07)

`sectionConfig[].cardShape: "stacked" | "split"`, unset ⇒ `stacked`. Read through
`resolveCardShape` (`lib/storefront-sections.ts`), never compared inline — the storefront card and
the editor's selected pill are one answer shown twice and must not disagree about the fallback.

- ⚠ **The merchant asked for a SIZE and the answer was a SHAPE.** The request arrives as "my two
  categories look tiny, I can't control the size" — and a width control is the wrong answer to it.
  How wide a card is was already decided by how many collections were picked (two fill half the row
  each, three fill a third), which is also how the reference layouts merchants point at work. What
  was missing was where the picture goes. Reach for this distinction before adding a dimension to
  anything here: if the count already sets the size, the gap is a composition.
- ⚠ **A merchant showing this complaint is usually on the wrong section.** `category-tiles` caps its
  track at 148px *by design* — it is wayfinding — so two categories there will always be a small
  centred island under a full-width hero, and no setting on it changes that. Move them to
  `category-banners`; do not widen the tiles. (The tile at that width is a 1:1 photo with the name
  under it, so half a 1200px page would render a 590px square.)
- ⚠ **`split` has TWO compositions, one per breakpoint, both in CSS and neither in JS.** A phone
  (`max-width: 679px`) runs the picture as a thumbnail — `clamp(96px, 30%, 132px)` — with the copy
  taking the rest and the description clamped to one line; past `680px` it is the even
  `0.9fr / 1.1fr` split. There is no viewport read anywhere, which there could not be on a
  server-rendered page: the component sets the class and references `--sf-bc-ratio`, the breakpoint
  owns the value (1:1 phone, 4:3 desktop, 16:9 stacked).
- ⚠ **The phone shape shipped 2026-09-07, after "I choose photo beside on mobile but it appear one
  after another".** Until then split was desktop-only *by design*, and the editor stated so. That was
  the mistake worth remembering: **a hint saying a control is dead does not stop it reading as
  broken**, especially on the device carrying nearly all of this platform's traffic. The original
  reasoning ("half a 390px card is ~170px a column and carries neither the picture nor the sentence")
  was correct about an EVEN split and wrong to conclude the phone had no answer — a thumbnail row is
  the shape phones already use everywhere. Its second job is length: a stacked card is a 16:9
  photograph plus copy plus a button, so two of them are the phone's whole home page.
- ⚠ **A row where NO card has a description is a different shape** (`sf-banner-row--terse`, shipped
  2026-09-07 off "lots of white space, isn't it?"). The split card takes its height from the
  PHOTOGRAPH's aspect box, which is right only while the copy has something to say: with a name and a
  button — ~100px — a 4:3 picture stretched the card to ~180px and the slack read as a broken
  section rather than as an unwritten field. The terse row drops `--sf-bc-ratio` to `5 / 2`, low
  enough that the copy wins the row and the photo stretches into it (`align-self: stretch` +
  `object-fit: cover` were already there). **Not `auto`** — an `<img>` with `aspect-ratio: auto`
  falls back to its INTRINSIC ratio, i.e. the merchant's own 4:3 photograph, and nothing moves.
  Asked once per ROW like `photographed` on the tiles, and scoped to `--split`: a stacked card is a
  full-width photo with copy beneath, so its height was never the copy's to set.
- ⚠⚠ **Card copy is a PRESENTATION OVERRIDE on the section — `sectionConfig.cards` — and never an
  edit to the Category.** This is the feature's hard requirement, stated by the merchant who asked
  for it: *"if a merchant changes the title or description here, it should affect only this specific
  storefront card, not the underlying Collection data or any other place where that collection is
  used."* Each entry is `{ categoryId, title?, description?, image?, buttonLabel?, buttonHref? }`,
  joined on `categoryIds`, read through the shared `sectionCard()`, and every field falls back to the
  collection — so an untouched card renders byte-for-byte as it did before overrides existed.
  **The first cut got this wrong** and put the boxes on Catalog → Collections writing
  `category.description`, which meant styling the home page silently rewrote the collection page, the
  tile row and the header menu. That write path was removed; the collection's own `description` stays
  editable in exactly one place (Products → Categories) and is carried on the collection DTO
  **read-only**, as the placeholder each override box shows.
- **Two writing rules the panel owns, both invisible in the UI.** `cardHasOverrides` drops an entry
  whose every field is blank — typing and clearing must not be storable as "has copy" — and removing
  a pick prunes its entry, or a merchant who re-adds that collection later gets a card they believe
  is blank and is not. Both are pinned in `category-row-config.test.tsx`.
- ⚠ **A card's `buttonHref` is merchant-typed, so it goes through `storeLinkHref` on render and
  `normalizeStoreLink` on save** — the same path every other owner-entered link in the storefront
  takes (hero slides, announcement bar, product-row CTA). It shipped through `storeHref`, which only
  concatenates: a full address became `/shop/https://…`, a path copied from the merchant's own
  address bar became `/shop/shop/products`, and on a custom domain — where `base` is `""` — a
  `//host` value walked the shopper clean off the shop. Never reach for `storeHref` with a string a
  merchant typed; it is for paths this code owns. The panel also carries `StoreLinkHint`, so the
  resolved destination is visible while they type.
- ⚠ **A new `sectionConfig` field must be added to `dtos/organization.dto.ts` in the SAME change**,
  not after. `cardRatio` / `fullWidth` / `cards` shipped on the model, the validator and the editor
  while that list was untouched, so the response answered a configured row with
  `["key", "categoryIds", "cardShape"]` — and because Customize seeds its draft from that response
  and PATCHes the whole array back, the merchant's next save would have written the loss to Mongo.
  This is the third time (`tagIds` was the first). The guard is `organization.dto.test.ts`, which now
  seeds a promo-card row with **every** field and asserts the parsed entry whole — a spot-check is
  how the first two escaped.
- **Row composition: `cardSide`, `cardSplit`, `cardHideText`, `cardRatio`, `fullWidth`, `showCta`.**
  `fullWidth` DROPS the `wrap` container rather than widening it, keeping the side padding.
  `cardRatio` and `cardSplit` are the places the section writes CSS var VALUES inline, against the
  rule at the top of `storefront.css` and for exactly the reason that rule exists: an inline value
  outranks every media query, which is wrong for a default and right for "use this on every screen".
  ⚠ **Unset must stay unset** — the built-in shape and column width vary by composition AND
  breakpoint, so resolving either to a literal anywhere (validator, model, resolver) freezes a phone
  at a desktop value. `resolveCardRatio` / `resolveCardSplit` only validate and clamp.
- **`cardSide` replaced a boolean called `cardAlternate` (2026-09-07), and the rename IS the fix.**
  That switch only ever offered the zebra — left, right, left down the block — while the thing
  merchants actually ask for is the plain swap: *"I wanted a feature that allows me to swap the
  position of the image and text… this toggle does not seem to be doing that."* A control labelled
  "alternate" that cannot put the picture on the right reads as broken rather than as a different
  feature. The swap is now the setting (`left` | `right` | `alternate`) and the zebra is one of its
  values. Both move the picture with `order` plus a mirrored track list, never by reordering the
  markup — the photo stays the first child so the reading order is the same on every card.
- **`cardHideText` drops the copy and gives the picture the whole card**, and pairs with `showCta`,
  which turns the button off on its own. Neither costs the shopper a destination: the whole card has
  always been the anchor and the button was only ever its visible half — the same conclusion
  `HeroSlideLink` reached for a picture-only slide. ⚠ The card's name moves to `aria-label` **only
  when both screens hide the words**; a phone-only hide leaves the heading in the document, where
  `display: none` removes it from the phone's a11y tree but a desktop reader would otherwise hear the
  collection twice.

##### `cardHeight` — the thing a ratio cannot say (2026-09-07)

*"I can't control the height. Let's think I want to show a 20px height category card — not possible
now."* Correct, and the reason is structural: `cardRatio` ties the picture's height to the card's
WIDTH, and the width comes from `auto-fit` — how many collections the merchant picked. Even 16:9
leaves a two-up row ~330px of picture, so a thin strip across the page had no expression at all.

`sectionConfig[].cardHeight`, px, 20–800, **shared across screens** (a 20px strip is 20px on a
phone). ⚠ It **replaces** the aspect box rather than joining it: with a height *and* an
`aspect-ratio`, the box computes a WIDTH from the height and the picture collapses to a column — so
the component emits `--sf-bc-ratio: auto` alongside `--sf-bc-h`. `.sf-banner-card` declares
`--sf-bc-h: auto` as its default so one unconditional `height: var(--sf-bc-h)` on the picture serves
both cases. The floor is deliberately low enough to draw a rule rather than a card; that is a
legitimate thing to want and costs nothing to allow.

##### The upload hint is DERIVED, not a constant (2026-09-07)

`recommendedCardImage()` computes the card picture's wanted size from the row's own shape, picture
width and height, and `CategoryCardFields` prints it under the upload button and feeds it to
`useImageRatioWarning`. **A constant would be wrong for most of the combinations the panel offers** —
a stacked 16:9 card wants a wide landscape, a split card at 25% wants something a quarter as wide and
nearly square, a 20px height wants a banner strip — and a hint that is usually wrong is worse than
none, because merchants learn to skip it and then skip the one that mattered. Sized for the desktop
card at 2×, so the same file serves the phone.

⚠ **Memoise it.** `useImageRatioWarning` compares `recommended` by IDENTITY to reset itself — it was
written for the module-level constants in `RECOMMENDED`, and this panel is the first caller to pass a
computed one. Unmemoised, a fresh object each render made that comparison always true, the hook set
state every render, and React threw *"Too many re-renders"*. Pinned by the panel's size-hint tests,
which render an open card.

##### `cardFlow` / `cardPerRow` / `cardRadius` / `cardArrows` (2026-09-07)

The four that turn this block from one fixed design into something a merchant can shape: *"per row
user want to show all category with scroll or per row particular number need control. scroll can have
arrow button or no arrow… so that i can be a full control to show category with any design."*

- **`cardFlow: "wrap" | "scroll"` and `cardPerRow: 1–4`, both PER SCREEN.** A desktop row that divides
  four cards comfortably is a phone row of four ~90px slivers, and a swipeable track is the phone's
  own answer to the same content. Unset `cardPerRow` keeps each screen's existing rule — `auto-fit` on
  a desktop, one up on a phone.
- ⚠ **The scroll container is mounted when EITHER screen scrolls**, and the other breakpoint turns the
  track back into a grid (`.sf-banner-row--wrap-d/-m`). One DOM node serves both screens, so "a track
  on a phone, a grid on a desktop" cannot be a choice of element. When neither scrolls, none of the
  strip's JS is mounted at all.
- **The scroller is `CategoryStrip`, not a second implementation.** Arrow state is a MEASUREMENT
  (`ResizeObserver` + `onScroll`, since the same four cards overflow or don't depending on the
  window), and a second copy of that is a second set of edge-case bugs. It gained two props for this
  caller: `trackClassName` (a row that is a grid at one breakpoint cannot say so on the wrapper) and
  `arrows`.
- ⚠ **`display` is restated on the track rules, not inherited.** `.sf-banner-row` is a grid and
  `.sf-cat-strip-track` is a flex row; which won came down to their ORDER in `storefront.css`, and a
  browser check caught the card's `flex-basis` computing correctly and sitting inert inside a grid.
  The row's flow must depend on the merchant's setting, not on where someone last inserted a block.
- **`cardArrows` turns arrows OFF, it does not turn them on.** The stylesheet already limits them to
  `hover: hover and pointer: fine` — a phone swipes the track and two 36px buttons would cover the
  cards it can show — so the panel's hint says where they appear rather than implying a phone switch.
- **`cardRadius` is shared and unset by default, and must stay that way.** Corners are a BRAND
  decision made once in Design → Corners and applied to every card, panel and field in the shop. This
  is the override for a row that deliberately differs; defaulting it to any number quietly opts every
  row out of the theme.

##### Per-device composition — `sectionConfig[].mobile` (2026-09-07)

**Half of these settings do not travel, and half of them do.** 65% of a desktop card is a generous
picture; 65% of a 390px phone leaves the words in a gutter. So `cardShape`, `cardSide`, `cardSplit`
and `cardHideText` are asked once per screen, while `cardRatio` and `fullWidth` are asked once for
both — a square photograph is square on a phone, and a setting split across two tabs for no reason is
two places a merchant has to look.

- **Storage is an override block, not four `mobileX` siblings.** `sectionConfig[].mobile` holds only
  the fields the phone answers differently; every unset field inherits the desktop value above it, so
  an untouched row renders exactly as it did before the block existed. The next device-specific
  setting is one key in three files rather than one more prefixed field on an already wide schema.
- **`resolveBannerLayout(config)` returns BOTH screens, and takes no device argument.** ⚠ A
  storefront page is server-rendered, so no component can ask which screen it is on. It emits every
  answer as a `-d` / `-m` class pair plus `--sf-bc-split-d` / `--sf-bc-split-m`, and the stylesheet's
  breakpoint reads the half it wants. A resolver that *could* be asked for one device would be a
  resolver whose callers had to know the viewport.
- **The editor's Phone tab is one switch, not four tri-state controls.** "Phones use the desktop
  layout" is a question a merchant can answer; six chip rows each carrying a hidden "same as desktop"
  value is a puzzle. Turning it off seeds the phone from the desktop's current values, so the first
  thing they see is what they already had.
- ⚠ **Asymmetric default-dropping, deliberately.** The desktop half drops a value equal to the
  default (`stacked`, `left`, words shown) so "never asked" stays distinguishable from "asked and
  agreed". The phone half stores every value explicitly, defaults included — there the block's
  PRESENCE is the "has its own answers" signal, so dropping a default would hand the field back to
  the desktop and un-answer a question the merchant just answered. `mobileCardOverrides` still strips
  an empty block, so opening the tab and changing nothing stores nothing.
- **`DEFAULT_BANNER_COUNT` / `MAX_BANNER_COUNT` live in `lib/storefront-sections.ts`**, imported by
  both the section and the editor panel. They were separate literals in each; the editor's hints have
  to describe the cards actually on screen, and with nothing picked those are the section's own first
  two — two copies of that number is two hints that disagree the moment either moves.
- **Still one card per phone ROW** — split shortens the row, it does not put two cards on it. Add a
  2-up phone row only if merchants ask: a row in `docs/plan/storefront-design-requests.md`, not a
  hunch.
- **The photo's aspect ratio is `--sf-bc-ratio`, set in CSS, referenced inline.** `Media` writes
  `aspect-ratio` inline from its `ratio` prop, so a class could never beat it; passing
  `style={{ aspectRatio: "var(--sf-bc-ratio)" }}` is what lets a breakpoint reach inside. This is
  **not** the banned inline-var pattern — the component writes the *reference*, the stylesheet owns
  the *value*, so media queries still decide (16:9 stacked, 4:3 split).
- **Clearing back to `stacked` drops the field**, and drops the whole config entry when nothing else
  is on the row — same rule the collection picker follows. A stored `"stacked"` would put that row
  outside any future change to what the default means.
- ⚠ **"Nothing else is on the row" is asked by walking the config, never by a hand-written list.**
  It shipped as `chosen.length > 0 || config.title` — true of the two settings that existed when it
  was written — and became silent DATA LOSS as the row grew: a merchant with Full width on and a
  picture shape picked, and no collections chosen, lost both by pressing "Photo on top", because
  neither field was on the list. `configHasSettings` (`lib/storefront-sections.ts`) walks the merged
  object instead, so a setting added next month is protected the day it is added. Every write from
  both panels goes through the one `apply` in `CategoryRowConfig`.
- **The button is a real button in both shapes** (`--primary` fill, `--on-primary` ink), not the
  arrow link a product row ends with. That link is a navigation affordance beside a heading; this is
  the call to action of an advertisement.
- ⚠ **Four layers in one change, `organization.dto.ts` included.** `tagIds` sat on the model and the
  validator for weeks while missing from the DTO — in `API_CONTRACT_MODE=enforce` that deletes the
  field from the response and the editor redraws the row as unconfigured. Verified here by parsing a
  payload through the validator *and* the DTO before shipping.

### Per-section mobile visibility (2026-09-06)

`homepageSections[].showOnDesktop` / `showOnMobile`. **Both unset ⇒ everywhere**, so no existing shop
changes and a shop that never opens this stores nothing.

- Rendered through the **existing** `stripVisibilityClass` — the 680px `sf-desktop-only` /
  `sf-mobile-only` pair the announcement bar and campaign strip already share. Never `matchMedia`:
  the page is server-rendered and a JS check paints the wrong state first.
- ⚠ **The wrapper `<div>` only exists when a section is actually hidden somewhere.** Wrapping every
  section would change the DOM of every shop to express "shown everywhere", which is what no wrapper
  already says.
- **Three chips, not the shared switch pair.** `ResponsiveVisibilityField`'s distinguishing feature is a
  warning for "off on both" — a state a section does not need, because Remove means that. One
  choice, no invalid combination.
- Page length is the problem it solves: a five-entry promises band is a five-row stack on a phone,
  and an editorial split spends most of a screen on a photograph before any product.

### The scrolling announcement (`nav.announcement.marquee`)

For a notice too long to sit on one line. Without it the bar wraps, and a three-line band pushes the
whole shop down on **every page** — the merchant trades their fold for a sentence.

- ⚠ **The duration is computed on the SERVER, from the message length** —
  `marqueeDurationSeconds(text, speed)` in `lib/storefront-strip-display.ts`, published as
  `--sf-marquee-dur`. Measuring the rendered text is the obvious implementation and the wrong one
  twice: nothing can be measured before paint, and measuring after makes the ticker visibly snap to a
  new speed on hydration. The pace is therefore in **characters per second**, the one unit the text
  carries with it.
- ⚠ **Length buys TIME, never speed.** A fixed duration inverts the feature: the longer the notice —
  which is *why* the merchant switched scrolling on — the faster it would travel to finish in the
  same time, so the hardest message to read would be the one moving quickest.
- **Two copies, `translateX(-50%)`.** Half the track is one copy whatever the words are, so the
  seamless loop never needs a measured width. The clone is `aria-hidden` **and `inert`** — it can
  carry the merchant's CTA, and a focusable control inside an aria-hidden subtree is a tab stop a
  screen reader cannot announce.
- **`min-width: 100%` on `.sf-marquee-item` is the short-message guard**, and it is why the duration
  needs a floor: a track narrower than the bar would drag a blank gap across the screen, so a short
  message is held to the bar's width — at which point chars-per-second no longer describes the
  distance travelled and an honest sum would strobe.
- ⚠ **`prefers-reduced-motion` must undo `overflow` and `white-space` too**, not just the animation.
  A long message pinned to one line inside a clipped box is one this shopper never sees the end of;
  it falls back to the wrapping static bar. Pausing on `:hover` **and `:focus-within`** is WCAG 2.2.2
  — hover alone leaves a keyboard shopper chasing a CTA they cannot catch.
- Deliberately **announcement-only** so far. The campaign strip shares this vocabulary
  (`storefront-strip-display.ts`) and could adopt it, but its text is generated from the running
  campaign and is short by construction.

### One product grid, pointed by its source (2026-09-06)

`featured-grid`, `latest-grid` and `picks-grid` were the same component drawing from a different
store-wide fallback list. `sectionConfig.source` answers that per instance, so the three are one
**`featured-grid`** rendered by `ProductGrid`, and `Grid` no longer takes a density — that flag was
only consulted for `productCard: "standard"`, which made it a second, hidden answer to what
Customize → Product cards asks.

- **The stored id stays `featured-grid`.** 28 documents already say it; the merchant-facing label is
  "Product grid". A configured row is named by its source (`SOURCE_LABELS`) in the editor, the theme
  card's running order, and by `sectionTitle` on the shop — one constant, three lists, because two
  lists calling the same row different things is how "campaign strip" went wrong.
- **"Featured products" and "New arrivals" are still two chips in the picker** (`ADD_ENTRIES`). Both
  add the same component with a different `source`. "Product grid, then set its source" is not
  something anyone would find.
- ⚠ **The Sections editor writes BOTH halves on every edit.** `toSettingsPayload` drops any
  `sectionConfig` entry whose key is not in `homepageSections`, so on the 14 shops with no stored
  list, configuring a row was silently discarded at Save. Writing both also means a removal and its
  config drop happen in one commit, so neither call can undo the other.
- Retiring a section id means a **migration**, not just a registry edit:
  `resolveSections` drops an unrenderable type and only falls back when *nothing* survives, so the
  page keeps rendering and is quietly one row shorter. See
  `../inventory-backend/src/migrations/20260906000000-merge-product-grid-sections.ts`.

⚠ **If they reappear in a merge, do not delete them — say so and ask.** Their first deletion was
correct and their second was not, because between the two a colleague had committed them back on
purpose in a commit that also carried unrelated work. A file returning after you removed it is a
signal that someone else has an opinion about it, not that git made a mistake. `git log --follow` on
the path names the author and the date in one command.

**Why it changed, and the rule it leaves behind.** Those three components each hardcoded a sequence
of the same five ingredients, so a theme could pick one of three arrangements and repaint it — which
is exactly why three "completely different" themes still read as one website. `theme.homepageSections`
had been modelled on the backend since the beginning and was **read by nothing**.

> **To make shops look more different, add a SECTION — never a branch inside a component, and never a
> per-theme component.** A section is shared code any theme may compose, so a fix lands once. A
> per-theme component multiplies every future feature by the number of themes, which is the trap the
> whole design exists to avoid. Same rule as the design tokens, applied to structure instead of style.

- Sections take one prop shape (`SectionProps` in `home-shared.tsx`) and get *everything* the page
  fetched — `shop/page.tsx` already loads it all in one parallel batch for exactly this reason.
- **Every section returns `null` when its own data is empty.** A reordered page must not grow holes,
  and this is what lets `deal-strip` (no live campaign) or `trust-band` (no badges written) sit in a
  theme harmlessly.
- ⚠ **Every section owns its own TOP padding.** `StoreHome` stacks them in a bare `<div>` with no
  gap, so a section's own padding is the only thing separating it from whatever the merchant put
  above it — and since the order is theirs, "what is above" is never knowable from inside a section.
  `category-chips` shipped with `padding-top: 0`, which reads fine under a section ending in
  whitespace and broken under one ending in a **ground**: after `search-hero` (a full-bleed
  `--primary-soft` band) its tiles sat flush against the tint, looking like a row the band had
  clipped. Anything with a background is the case to check. `category-links` and `minimal-picks`
  still carry a `0` top for their own editorial reasons — they are quiet, rule-and-text sections, so
  the collision is less visible, but they are the same shape of risk under a tinted hero.
- ⚠ **`resolveSections` falls back when NOTHING survives its id filter.** Not defensive padding: every
  seeded store carried four ids from the pre-registry catalogue (`banner`/`featured`/`categories`/
  `products`) that no section answers to, so a strict filter blanked the homepage of every demo shop
  while stores with an unset value worked perfectly. `DEFAULT_HOMEPAGE_SECTIONS` on the backend was
  corrected in the same change; the two guards are independent on purpose. The frontend's own copy
  of that list (`HOMEPAGE_SECTIONS` / `DEFAULT_HOMEPAGE_SECTIONS` in `lib/storefront-theme.ts`) had
  no callers left and was **deleted** — a second, wrong answer to "what sections exist" is worse
  than none.
- Header anatomies live in `components/storefront/header/desktop-variants.tsx` (extracted from
  `store-header.tsx` when it passed 400 lines). Five: `classic`, `minimal`, `centered`,
  `search-first` and `boutique`. **Mobile deliberately has no per-variant version** — below 680px
  they would all collapse to the same bar, and five copies is five places to fix the next
  touch-target bug.
  - `search-first` is a **white** bar — pill search, a filled brand-coloured cart pill, and an
    optional delivery chip. It was a solid brand-coloured band until 2026-08-13, and that band is
    precisely what made the first grocery theme look cheap: using the brand as a *surface* makes the
    loudest thing on the page a rectangle and flattens the merchant's own logo against it.
  - `clinical` is the **sixth**, added 2026-08-14 for Meridian Care: logo, one wide plain search
    field, icons. No utility bar, no category row, no fill. It exists because `classic` was standing
    in for it and made the pharmacy theme read as Classic-with-teal — a shopper here arrives with a
    name to type, so search must be the widest thing on the bar, but the shop opens on a trust band
    that already does the wayfinding, which makes a category row redundant and a utility strip
    noise. That is its DEFAULT, not a prohibition — since the utility bar became merchant
    configurable a pharmacy that wants its phone number up there can switch one on, and `clinical`
    then drops its own `LangBtn`/`ThemeBtn` rather than showing them twice. Distinct from
    `search-first`, the other search-led bar, by being plainer and taller:
    that one is a pill with a filled cart button and a delivery chip for someone assembling thirty
    lines; this is for someone reading carefully.
  - `boutique` **replaced `editorial`** in the same change. Same anatomy — wordmark, icons, nav on
    its own row — but it carries a real search field, styled as a hairline rule rather than a box.
    Editorial hid search behind an icon because that is the luxury-brand convention; for a BD shop
    with two hundred sarees whose customers type "jamdani" that is a bad trade. **The
    differentiation is the treatment, not the absence of a control someone needs.** Pre-launch, so
    the id was renamed outright rather than kept as an alias.
  - The two shapes are CSS wrappers (`.sf-search-pill`, `.sf-search-rule` in `storefront.css`), not
    a forked search component. They need `!important`: `SearchInput` sets its box geometry inline —
    storefront components style against CSS vars, not classes — and an inline style outranks every
    selector.
- **The `search-first` cart pill carries count AND subtotal** (`2 · BDT 12.00`), not a bare count.
  A shopper filling a weekly basket watches that number. `useCartNav` exposes `cartSubtotal`,
  selected separately from `cartCount` so the five headers that ignore it re-render no more often
  than before. **Subtotal, never total** — shipping needs a district the shopper has not picked, so
  anything larger here is contradicted at checkout.
- **The delivery chip has no field of its own, on purpose.** `search-first` reads
  `trustBadges[0].text`, which is the sentence a merchant already writes ("Delivery inside Dhaka in
  24h"). No new field, no new empty state. It reads the **preview draft first** like everything else
  in `store-header.tsx` — reading only the saved store left the chip frozen while the footer beside
  it repainted.
- `productCard: "editorial"` is unaffected by the header rename — the chrome-less **card** keeps its
  id. Two different axes that happened to share a word.
  It must **not** clip (`overflow: visible`): with no fill there is nothing to clip to, and hiding
  overflow cuts the hover flyout.
- **`category-tiles` has FOUR presentations, chosen by `templates.categoryTiles`, never by theme.**
  `tile` (photo on a `--primary-soft` card, name underneath), `overlay` (a 3:4 photo with the
  name across it behind a scrim), `disc` (a lettered disc per department, photographs refused
  by design) and `circle` (2026-08-29 — that same photograph cropped ROUND, name underneath).
  Which reads better is a question about the merchant.s own
  pictures — product shots vs scenes — so it is a setting they own, and it is the model for how to
  widen a section rather than branching it.
  - `circle` exists because the two photo modes were both rectangles: a soft catalogue (baby,
    gifts, beauty) had no way to lose the corners without also losing the pictures, since `disc`
    refuses them. It degrades to `disc` when NO category has a photo, and an individual
    unphotographed category falls through to the same lettered circle at the same 68px — so a
    half-photographed catalogue stays one consistent row rather than two mixed shapes.
  - The no-image fallback's ground **depends on what it sits on**: `--card` inside `tile` (the card
    is already tinted, so a tinted fallback merged card and photo-slot into one flat blob of brand
    colour), `--primary-soft` in `overlay` (no card behind it).
  - ⚠ **There is a THIRD shape, and it is decided per SECTION, not per tile.** If no category has a
    photo, every tile drops the reserved 1:1 photo slot and becomes a 42px initial disc over the
    name — about a third the height. Reserving space for a photograph that is never coming is what
    made a shop with seven unphotographed departments open on seven ~200px blocks each containing
    one letter, filling the whole first screen. Asked once for the section because a grid mixing
    tall and short tiles stretches every row to the tallest.
  - ⚠ **A FOURTH shape: a described tile is a ROW.** When the merchant has written
    `category.description`, the compact tile turns on its side — disc left, name over the line — and
    the track widens to 210–330px. That is the pharmacy's "shop by concern" card ("Diabetes /
    Strips, meters, insulin"), and it is the same component reading the same field, decided by
    whether the merchant actually wrote anything. `overlay` never draws the line: the name already
    sits on a photograph behind a scrim, and a second line of type over an image we have never seen
    is where legibility runs out.
  - **`description` had to be added to the LIST payload** (`storefront-taxonomy.listCategories` +
    `storefrontCategoryNodeShape`). It was already stored and already served on the collection PAGE;
    the list simply never selected it, so a tile had nothing but a name. The list DTO declares it
    `.optional()` and the service omits it when blank — the resolve DTO keeps `.nullable()` because
    there a null is a meaningful "nothing written".
  - ⚠ **The grid lives in `.sf-cat-tiles` (storefront.css), not inline, because it needs a
    breakpoint** — and the two halves are different rules. Phone: `1fr` as the track max so tiles
    share the row. Desktop: a px cap, or seven departments stretch to ~150px and the wayfinding row
    outweighs the products. **A definite px max is what makes `auto-fit` count tracks at the MAX
    rather than the min**, which is why a 132px cap put only *two* tiles on a 358px phone row. The
    component supplies `--tile-min` / `--tile-max`; the media query is the CSS's.

### The MOBILE axis — a registry, not a set of components (2026-09-06)

**`templates.mobile` picks the phone chrome, and the templates are DATA.** Read this before adding a
mobile layout: there is nothing to add a component for.

Until now the phone bar was one fixed thing shared by all six desktop header anatomies — logo, the
two toggles, a search field, and a Home/Menu/Cart/Account tab bar underneath — on the reasoning that
below 680px the desktop variants all collapse to the same thing anyway. True of those six, and the
wrong conclusion: **what a phone header should be is its own question.** A hamburger with a centred
logo, a search box filling the bar, four tabs under the thumb — none of those follow from the desktop
choice, and the shops these merchants compete with pick them independently.

| Piece | Lives in | Owned by |
|---|---|---|
| Which template | `templates.mobile` | a theme may stamp it |
| The arrangement over it | `theme.mobile` — **only the fields that differ** | a theme resets it |
| The phone artwork | `mobileLogo`, beside `logo`/`banner` | the merchant; a theme never touches media |

**One renderer draws every template.** `lib/storefront-mobile.ts` holds the registry;
`components/storefront/mobile/` draws whatever a `MobileChrome` value says, with **no `switch` on the
template id anywhere**. So:

> **Adding a mobile template is one object in `MOBILE_TEMPLATES` plus one wireframe in
> `template-sketch.tsx`.** Nothing else. Not the preview store, not the validator, not the DTOs, not
> the model, not the Customize picker (`TEMPLATE_OPTIONS.mobile` is *derived* from the registry), and
> not a line of this renderer. `storefront-mobile.test.ts` asserts the derivation and the sketch
> coverage, so a template added without its wireframe fails rather than shipping a blank tile.

Adding a bar ACTION (a wishlist button, say) is the one thing that costs two files — an entry in
`MOBILE_ACTIONS` and a branch in `mobile-actions.tsx` — because an action is *behaviour*, not
arrangement. The Customize slot editor picks it up from the registry with no edit.

The five shipped templates: `tabs` (the chrome the storefront always had, and the default),
`drawer` (hamburger / centred logo / search + cart), `search` (a search box in the bar itself),
`minimal` (logo, cart, menu), `browse` (drawer plus a scrolling category strip).

⚠ **`tabs` must stay byte-for-byte what the storefront rendered before this axis existed.** Every
store with nothing stored resolves to it, so a drift silently re-chromes the whole platform.
`storefront-mobile.test.ts` pins it field by field.

⚠ **Only the DIFF is stored.** The draft holds the resolved chrome (every field concrete, so the slot
editor's inputs stay controlled) and `mobileOverrides` diffs it back on the way out — so a shop that
took a template and left it alone stores *nothing*. At this platform's scale a full config object on
every settings document is a real cost for a value identical to a constant the frontend already has.
Switching template recomputes the diff against the new one, which is what makes the switch a true
reset.

⚠ **Merchant ids are narrowed on read, never trusted.** `resolveMobileChrome` drops unknown actions,
de-duplicates (two of one id would mount two components on one React key), caps the slots at what
390px draws, refuses a glyph the action does not offer, and clamps the logo height. Same rule as
`resolveDesign` and `pick()` in `storefront-templates.ts`, and for the same reason: these are stored
merchant strings.

⚠ **The menu panel is the ONLY category navigation a phone has.** The header's dropdown row and the
rail are both desktop-only, so a chrome with no `menu` anywhere strands a shopper — `canBrowse()` is
that question and a registry test enforces it on every shipped template. It caught `minimal`, which
shipped as "logo and cart, navigation lives on the page" and left phone shoppers with nowhere to go
but the cart. Customize *warns* rather than forbids when a merchant empties the slots themselves.

⚠ **`--sf-bottom-nav-h` is now conditional.** Four of the five templates have no tab bar, and the
sticky buy bar, the WhatsApp launcher and the page's own bottom padding all stack on that var —
so `StoreShell` stamps `data-sf-tabs` and `.sf-shell[data-sf-tabs="1"]` is the only thing that
reserves the 56px. Reserving it unconditionally floats all three above nothing.

⚠ **The panel and the search takeover are mounted ONCE, by the shell** (`ShellMobileOverlays`), and
driven by `useMobileNav`. The hamburger in the bar and the Menu *tab* open the same panel; a copy per
surface is two drawers racing one body-scroll lock. `HeaderSearchMobile` is controlled for the same
reason — search is an action a merchant can place in either slot, in a tab, or on the row under the
brand, and those four entry points open one sheet.

⚠ **Its `onOpenChange` must be memoized by the caller** (`mobile-chrome.tsx`). The sheet declares it
as a dependency of the `close` it builds, and `close` gates the effect holding the sheet's `popstate`
and `keydown` listeners — so an inline arrow tears those down and re-adds them on every render of the
chrome, including while the sheet is open. This was found by the React Compiler, which refuses to
optimize a component whose manual deps it cannot preserve (`react-hooks/preserve-manual-memoization`,
an **error**, not a warning): the callback is a prop, so it is not stable by construction and cannot
be omitted from the deps the way a `useState` setter can.

Opening the Phone bar part in Customize nudges the preview onto its 390px frame
(`previewDeviceForPart`) — its controls change nothing visible against a desktop, which is the same
broken-control problem `PART_PAGE` solves one axis over. A nudge, not a lock: the device toggle stays
live.

⚠ **The nudge is applied during render through STATE, never a ref** (`browser-preview.tsx`). React's
"adjust state when a prop changes" escape hatch re-runs the component before it commits, so the phone
frame is the first thing painted. The two alternatives are both wrong and both were tried: a ref
read during render is a `react-hooks/refs` **error** (it is how a component silently fails to update),
and an effect paints the desktop frame, commits, then swaps — a visible flicker on the panel whose
whole job is to show the phone.

### The SHELL axis — what makes two shops different KINDS of site (2026-08-14)

Read this before adding another header, section or page layout to "make the themes more different".
It probably will not work, and here is why.

Until now every theme shared **one page skeleton**: announcement → header → campaign strip →
breadcrumb → `<main>` → footer. Six header anatomies, eighteen home sections and four layouts each
for cart/checkout/account all varied what sits INSIDE `<main>`. That is why four themes still read as
one kind of website — a full-width bar over a vertical stack of full-width blocks is *a* kind of
ecommerce site, and it was the only one on offer.

`templates.shell` picks the skeleton itself, and it is the only axis that changes every page at once:

| Shell | Shape | Stamped by |
|---|---|---|
| `stacked` | the original — header on top, one column beneath | all four bundled themes |
| `rail` | a persistent department sidebar down the left of **every** page | nothing bundled — see below |

`store-shell.tsx` is now a registry over `shells/`. **A shell owns only where the announcement,
header, rail, content and footer sit relative to one another** — everything it arranges comes from
`shells/shell-parts.tsx`, so a footer fix is not a fix to repeat in each skeleton.

⚠ **A new shell means auditing every section for duplication.** The rail lists departments on every
page, so `category-tiles` drew the same seven names twice on the home screen — the FOURTH time this
storefront has shipped that bug (trust badges twice, the hero photograph twice, the promises twice).
Two guards now exist and both are load-bearing:

- `CategoryRow` returns null when `ctx.hideCategoryRow`, which the `rail` shell sets — the shell is
  the half that knows there is a rail, so the header stays free to be any anatomy.
- `CategoryTiles` returns null under `rail`. Suppressed rather than dropped from the bundle, because
  a merchant can switch back to `stacked` and then the tiles are the home page's only category nav.

The rule this generalises: **a section renders nothing when it has nothing to ADD** — and "nothing to
add" now includes "the shell is already saying it".

⚠ **The rail is `sf-desktop-only`, not a collapsible drawer.** A 218px column on a 390px screen is
not navigation, and the phone chrome (`templates.mobile`) already owns that question — its menu panel
is where a phone's departments live. A second mobile nav competing with the one the merchant chose is
how a shopper ends up with two half-answers.
  - ⚠ **`.sf-rail-grid` must only claim two columns when a rail is actually rendered.**
    `RailShell` returns `null` for the aside when the store has no categories, and a grid whose first
    child is missing puts the CONTENT into the first track — the whole page rendered inside 218px,
    with 44px product cards. `:has(> .sf-rail)` gates both the template and the `--cols` step-down, so
    the layout follows what was rendered rather than what was assumed. Any shop with an empty taxonomy
    hit this, not just the preview.
  - ⚠ **The rail costs 218px, so the content column takes one fewer product column** — cozy 4→3,
    compact 5→4, airy 3→2. `--cols` is resolved from the VIEWPORT (the density axis predates the
    rail), so without the step-down the widest breakpoint fitted five compact columns into 970px and
    drew 172px cards — narrower than the same theme draws on a phone.
  - ⚠ **The rail's breakpoint is 1000px, not 680px.** Between the two it left ~580px of content and
    124px cards. A rail is worth its width only once there is width to spare; below that the header
    search does the job.
  - ⚠ **The content column full-bleeds on the END side only when a rail is present.**
    `.sf-rail-grid > :last-child` is pulled out by `-{--pad}` so its sections keep their normal
    padding, but `--pad` is 28px and the grid gap is 12px — so with a rail the content column started
    16px LEFT of where the rail ends and, being later in the DOM, painted over that strip. A
    department's hover highlight spans the full 218px, so it ran under the hero's tint and looked
    like a highlight bleeding out of the sidebar; the tint was drawn on top of it. `:has(> .sf-rail)`
    resets `margin-inline-start` to 0. The outer edge still bleeds — a tinted band should reach the
    viewport — because only the rail's side has anything to collide with.
  - ⚠ **A caller with no collections query must pass `hasCollections={false}`** to `BrowserPreview` /
    `toPreviewPayload`. `seedDraft` omits collections (in Customize they arrive from their own query),
    so such a caller holds `[]` — which is not "this shop has none" but "I did not look". Sent as a
    draft it emptied the taxonomy, and under `rail` that removed the aside and triggered the collapse
    above. Omitting the key leaves `previewCollections` null and `StoreShell` uses the categories it
    fetched itself.
  - **Measuring a cross-origin iframe needs its OWN CDP target.** The storefront preview runs
    out-of-process (`rmc.localhost` vs `localhost`), so it is absent from `Page.getFrameTree` and
    unreachable via `contentDocument`. It appears in `/json/list` as `type: "iframe"` — attach a second
    WebSocket to it. Measuring the same URL in the top-level tab does NOT reproduce the preview: the
    draft that only exists inside the frame is exactly what broke it.

⚠ **No bundled theme stamps `rail` today** — Fresh Market did for a few hours on 2026-08-14 and was
moved back to `stacked` the same day, when the merchant's own Claude Design mockup answered the
department question differently (a disc strip on the home page, and the left column spent on FILTERS
on the collection page). The shell is still registered, still offered in Customize → **Page layout**,
and its two duplication guards are still live and still correct — do not delete them as dead code on
the strength of "nothing uses it". The moment any theme or merchant picks `rail`, `CategoryRow` and
`CategoryTiles` have to keep quiet or the departments print twice again.

**Adding a shell:** write it in `shells/`, compose it from `shell-parts.tsx`, register it in `SHELLS`,
add the id to the `StoreTemplates["shell"]` union, the `SHELL` map, and `TEMPLATE_OPTIONS.shell` —
then audit every section that could now be saying the same thing twice.

### The `width` axis — and why it can never move `--maxw` alone (2026-08-16)

The sixth design axis: `contained` (1200px, the default and unchanged), `wide` (1600px), `full`
(uncapped). Cheap to add because `--maxw` was already ONE token on `.sf-root`, consumed by every
wrapper — all five header variants, the footer, the content frame, both account layouts, and the
shared home-section wrapper in `home/home-shared.tsx`. No component changed.

⚠ **A width step must always move `--cols` with it.** `--cols` is a fixed count, not a function of
available space — 4 at desktop, 5 compact, 3 airy. So widening the page on its own does not show more
products, it inflates the ones already there: an uncapped page at four columns renders ~600px cards
on a 27" monitor, the opposite of what "full width" is asked for. Each width therefore ships a column
count per density, and `full` gains one more at `min-width: 1600px` where `wide` has already capped.

⚠ **The `[data-width]` blocks must stay BELOW the `[data-density]` blocks.** Both selectors have
identical specificity, so source order is the only thing deciding which owns `--cols`. Move them up
and a wide shop silently reverts to its density's column count, with nothing failing.

**`--maxw-read` is the deliberate exception.** The account area (profile, addresses, order history) is
read and filled in, not browsed, so it caps while the catalogue widens. It is declared as
`--maxw-read: var(--maxw)` on `.sf-root`, and that resolves to 1200px *permanently* — `var()` inside a
custom-property declaration is substituted on the element that declares it, so a `--maxw` override on
`.sf-shell` cannot reach back into it. That is the intended behaviour, written that way to say so.
Content pages need no equivalent: their prose is already capped at fixed 680–860px measures in
`content-frame.tsx`, and their banner strip is meant to span.

**All five themes stay `contained`.** Widening an approved theme is a design decision, not a side
effect of adding the control — and Classic in particular MUST equal the defaults or applying it would
restyle every shop already on it (`apply-theme.test.ts` asserts this field by field).

### Header menu hover — `navHover` / `navChildHover` (2026-09-07)

Two design axes rather than one, both defaulting to `none`: the top row of the header
(`.sf-nav-top`) and the dropdown under it (`.sf-nav-child`) are different objects, and the effect
that suits a 13px bar link rarely suits a padded option row. Four answers each — `none`, `color`,
`underline`, `highlight` — stamped as `data-nav-hover` / `data-nav-child-hover` and read by plain
attribute selectors in `storefront.css`. `none` needs no block: it IS the base rule, and
`designAttrs` stamps nothing for a default axis.

⚠ **A hover state cannot be written until the base style leaves the component.** `topLink` and
`dropLink` were `CSSProperties` objects applied inline on every nav link, and an inline `color`
outranks every rule in the stylesheet — so `:hover { color: … }` could not have worked no matter how
the CSS was written. Both moved out (an untouched header is unchanged) and `NavLink` now takes a
`className`, not a `style`. `header-nav.test.tsx` pins it, including that no link carries an inline
`color`.

⚠ **`HeaderNav` is NOT the only menu row — this is the gap that shipped and was caught only in a
browser.** `classic` and `centered` reach it through `CategoryRow`, but **`minimal` and `boutique`
render their own flat row from `headerLinks(ctx)`** in `header/desktop-variants.tsx`, with their own
typography (Boutique's is uppercase 11.5px with 0.15em tracking — that IS the anatomy). On those two
the setting did nothing, and nothing failed: the header looked right and the control saved.
`search-first` and `clinical` draw no menu row at all.

So `.sf-nav-top` deliberately carries **no geometry** — only the colour every row already shared and
the transition. `.sf-nav-bar` holds what is specific to `HeaderNav`'s row (flex + gap for its
chevron, 13px/500, padding). A variant adds `sf-nav-top` and keeps its own type inline, minus the
colour. `desktop-variants.test.tsx` walks every `*Desktop` export, finds the ones using
`headerLinks(ctx)`, and fails if any lacks the class or still sets `color` inline — with a
non-vacuity assertion so it cannot pass by finding none.

**Verified in a live browser** (2026-09-07, a real store on `boutique`): all four top-level effects
and all three dropdown effects fire on real pointer hover; the row grows 4px choosing `highlight` on
a flat variant row (padding is on the link, not on `:hover`, so it never moves under the pointer) and
is unchanged on `HeaderNav`'s row. ⚠ Reading computed styles right after toggling `data-nav-hover`
**without moving the pointer** reports stale values — Chrome does not re-run `:hover` matching on an
attribute change alone. Move the pointer away and back between measurements or the check lies.

⚠ **The `highlight` pill's padding sits on the LINK, not on `:hover`.** Padding that appears only
under the pointer moves the label as it arrives and shoves every item after it sideways; the row has
to be laid out for the pill either way, with a negative margin giving the space back so choosing the
effect does not widen the header's gaps.

Edited in Customize → **Header** rather than Look, deliberately — a merchant wonders what their menu
does when pointed at while they are looking at the menu. It is still a `theme.design` axis and goes
through the same `patch({ design })`. All four hover ids reach both `CategoryRow` sources, since
`collections` mode renders through the same `HeaderNav`. Every ready-made theme picks its own pair;
**Classic stamps `none`/`none`** because Classic is the reset.

### ⚠ `display: contents` and `> :first-child` — the promo-card side bug (2026-09-07)

`Picture side` on the category promo cards shipped doing nothing, and the shape of the failure is
worth keeping: the card's column widths mirrored correctly while the photograph stayed put, so it
read as "the setting does nothing" rather than as a layout bug.

`Media` wraps its `<img>` in a `<picture style="display: contents">` — in **both** the `cover` and
`canvas` branches. A `display: contents` element generates no box, so `order` and `align-self` on it
do nothing and are **not inherited** by the `<img>` inside. Every rule written as
`.sf-banner-card--split-d > :first-child` was therefore inert, while `grid-template-columns` on the
card itself worked — hence the half-applied result.

**The rule: never select a `Media` by position.** `Media` puts `className` on the real box in either
branch (the `<img>` for `cover`, the wrapper `<div>` for `canvas`), so pass one and select that —
`.sf-banner-media` here. A `category-banners.test.tsx` guard reads `storefront.css` and fails if any
`sf-banner` rule uses `:first-child` again; another asserts the class lands on an element whose
computed `display` is not `contents`, run against **both** fits. Note the `canvas` branch happened to
work throughout, so this was invisible to any shop on that setting.

### Little Steps and the `nursery` surface (2026-08-29)

The fifth theme, for baby/kids. It spends three things nothing else had:

- **`surface: nursery`** — a fourth ground, and the second to use mist's INVERSION (tinted page,
  pure-white card). Warm pink-neutral rather than parchment's yellow-tan. The card must stay pure
  white: half a baby catalogue is a tin or a bottle shot on white, and a cream card behind a white
  tin draws a visible rectangle around every product. Low chroma on purpose — a saturated pink turns
  a shop that also sells ৳8,500 prams into a nursery decal.
- **`font: rounded` + `radius: round`** — both had sat in the catalogue unused since they shipped,
  and the font's own description already said "grocery, food, kids".
- **`categoryTiles: circle`** and the **`age-chips`** section (below).

**Its one structural argument: `trust-band` sits SECOND, above the catalogue.** Every other theme
that composes it closes on it. A parent's objection is whether the formula is genuine and in date,
and an answer below six rows of products is one they never read. That inversion is also what forced
`SEED_TRUST_BADGES_BY_INDUSTRY` in the backend — see the `seeding` skill: the band renders nothing
without badges, and nothing had ever seeded any, so the theme's most distinctive section was a blank
gap on the shop it was drawn for.

### Two heroes rotate, and they are not the same shape (2026-08-29)

`heroSlides` reaches the page two different ways, and picking the wrong section is
how you get a shop that reports "Slides carousel · 3 slides" in Customize and then
shows one still photograph forever:

| Section | Slides render as |
|---|---|
| `hero-card` / `hero-open` | hand off to `HeroCarousel` — a **contained** bordered card inside `--maxw` |
| `hero-fullbleed` | its **own** edge-to-edge rotation, no card, copy laid over the photo |

`HeroFullBleed` used to take only `heroSlides[0]`, on the documented reasoning that
"a carousel inside a full-bleed hero fights a single confident picture". That was
overruled when `little-steps` became the first theme to compose the section: it
seeds three slides, so the promise and the render disagreed. **A still that claims
to be a slideshow is worse than either choice made honestly.**

Both share `useHeroRotation` (`components/storefront/use-hero-rotation.ts`) — one
5s beat, one set of pause/reduced-motion/swipe rules. Put timing changes there,
never in a component.

⚠ **Copy ownership flips with the slide count.** One slide keeps the old
precedence (`heroBanner` first — the merchant's single headline); two or more and
the slides own badge, title, subtitle and CTA. Pinning one `heroBanner` title over
three rotating photographs is a slideshow that says the same thing three times.

### `age-chips` — a facet that is not a category

`AgeChips` (`sections/category-sections.tsx`) renders the store's AGE tags as a chip row, in the
order a child grows (`AGE_BANDS`), each linking to `/products?tags=<slug>`.

**Tag-backed, not variant-backed, and that is the load-bearing decision.** The same ages are also
seeded as the `Size` variant attribute, which is the more "correct" home — but neither the collection
page nor the backend product query has an attribute filter, while `?tags=` is OR-combined and works
end to end today. So a chip is a link to a listing that already exists rather than a new query path
down the stack.

**Configured tag IDS first; name matching is only the fallback** (2026-08-29).
`sectionConfig[].tagIds` holds the merchant's own tags in their own order, and the backend seeds it
at signup for `BABY_KIDS_STORE`, so a real shop is never on the name path. That matters because
matching names failed silently in three ways a merchant actually hits: rename `0-3M` to `0-3 Months`
and the chip vanishes; run the shop in Bangla and the whole row vanishes; add `4-5Y` and it never
appears. An id survives every rename and the chip reads its label off the tag, so the row can never
disagree with Products → Tags. `age-chips.test.tsx` pins all three cases.

The editor is `TagRowConfig` (`customize/tag-row-config.tsx`), reached from the Sections panel and
gated by `isTagConfigurableSection` — **not** `isConfigurableSection`. That second set is what
`configuredSections` walks to build a product QUERY per row, and `age-chips` renders tags the page
already has, so joining it would cost every baby shop a wasted catalogue fetch.

Two more things worth knowing: the section needs `tags` on `SectionProps` (fetched in the homepage's
parallel batch, like everything else, so the Customize preview can add it without a round-trip), and
the storefront's tags endpoint only returns tags that are actually IN USE — so a band with no
products drops out of the row rather than leading to "no results". That is correct behaviour, and it
is why the backend now seeds an age band onto each demo product instead of letting the random tag
pick decide (three of eight rungs came back empty when it did).

### The `mist` surface, and the rail finally being used (2026-08-16)

Meridian Care was rebuilt from the axes nothing else spent. The old bundle was `surface: default`,
`radius: soft`, `shell: stacked`, card grid, teal — which is **Classic with a different hue**, and it
shared its ground with two other themes. Hue was never what separated them.

**`mist` inverts the card/page relationship.** `default` and `parchment` both float a card slightly
lighter than a page that is nearly the same colour; `mist` pushes the page down to `#eef2f5` and the
card up to pure white, so each card reads as a separate physical object. Measured: the home page is
**62.5% card, 22.9% panel** where Fresh Market is **72% page** — the inverse composition, from one
axis. Right for a shop whose unit is a sealed box, and the fastest way to look unlike the others
without touching a hue.

Its other four axes were also unused: `font: grotesk`, `density: compact`, `scale: sm`,
`pagination: load-more`, `checkout: multi-step`, `cartLayout: compact`.

⚠ **`shell: "rail"` — the first bundled theme to stamp it.** It had been registered and offered in
Customize since 2026-08-14 with nothing using it, and its two duplication guards were live but
untested by any theme. They hold: `CategoryRow` returns null on `ctx.hideCategoryRow`, `CategoryTiles`
returns null under `rail`, and the rail is `sf-desktop-only` (verified hidden at 390px).

**The composition rule this theme is built on.** With a rail carrying departments and a `clinical`
header carrying the search, a hero could only repeat one of them — so the theme has **no hero and no
category section**. Its four sections are the ones the shell cannot say: `deal-strip` (a live
campaign), `featured-grid`, `product-rail`, `trust-band` (the promises). Two constraints ride with
that and must not be undone:

- `trust-band` reads `trustBadges`, so **the footer must not be `rich`** — both print the same three
  promises.
- The `clinical` header carries the only search, so nothing in the bundle may print a second one.
  The first draft of this theme paired it with a search hero, which was the fifth time this
  storefront shipped that class of bug. (That section, `search-hero`, retired on 2026-09-06.)

*(This passage named `trust-row` and `promo-tiles` until 2026-09-06 — two ids the registry never
held and no component ever answered to. The bundle above is what the theme actually composes.)*

`TrustRow`'s icon moved from a bare `--primary` glyph to `--accent` on an `--accent-soft` disc.
Reassurance is what a second colour is *for*; a shop whose promises are painted in the same hue as its
buy button has one colour doing two jobs. It falls back to the brand pair when no accent is set.

### The theme store is a picker beside one live preview (2026-08-15)

`app/(protected)/ecommerce/themes/page.tsx` is a two-column page: `ThemeList` (a row per theme) on
the left, `ThemeStage` (the merchant's own shop, rendered in the selected theme) on the right.
Selecting a row swaps the draft streamed into **one** long-lived `BrowserPreview`.

It replaced a grid of four equal cards with the preview behind a modal. Three things were wrong with
that, and the third is the one that could not be patched:

- Nothing marked the theme the shop was actually running — the live one looked like the three it
  was not.
- The only thing that answers *what will my shop look like* took two clicks and could never sit
  beside a second theme to be compared with.
- **The modal mounted a fresh iframe per open**, so every preview server-rendered the merchant's
  SAVED theme, painted it, and only then applied the draft. Opening a preview flashed the
  currently-active theme first, every single time. One frame that never reloads has no such moment.

⚠ **Do not give the list rows a picture of the theme.** A drawn thumbnail beside a live render of
the same theme is the same claim made twice, and the drawing is the one that can be wrong. A row
carries the ground, the panel and the brand as a three-colour chip (`surfaceSwatch` + `brandColor`,
the same values the storefront resolves) and nothing else — enough to tell two rows apart, not enough
to compete with the answer next to it. `theme-sketch.tsx`, which drew each theme's whole section list
in miniature, was deleted for exactly this reason hours after being written: it was the right answer
to a card grid and redundant the moment the real shop was permanently on screen.

⚠ **`ThemeStage` writes nothing.** Apply routes to `/ecommerce/customize?theme=<id>`, the unchanged
staging flow where Save and Discard live. The page has no mutation of its own.

**Selection resolves, it is not seeded.** `picked ?? activeId` — rather than an effect that copies
`activeId` into state once the settings query lands, which would fight a merchant who clicked a row
while the request was still in flight.

### An empty shop must still show what a theme IS (2026-08-16)

A merchant choosing their first theme is, by definition, a merchant with nothing in the shop — and
every section that distinguishes one theme from another hides itself on no data. `RailShell` returns
null without categories; so do `category-tiles`, `-chips` and `-links`. `deal-strip` returns null
with no live campaign, `trust-band` with no `trustBadges`. So the themes rendered as
near-identical empty shells at exactly the moment the choice is made, and Meridian Care lost the
department rail that is the whole reason to pick it.

`lib/storefront-preview-samples.ts` fills those gaps, and `lib/storefront-theme-samples.ts` decides
**with what** — a `ThemeSample` (categories, products, promises, campaign) carried by each bundle, so
Meridian previews as a pharmacy, Fresh Market as a grocery and Little Steps as a baby shop.
Illustrations live in `public/samples/`.
The campaign's `endsAt` is computed at render, never stored: a date baked into a bundle would preview
an offer that expired months ago.

Four rules, none of them optional:

- **Preview only.** Gated on the preview store's `active` flag, which is set only under `?preview=1`.
- **Fills gaps, never replaces.** Real products, categories, campaigns and badges always win, and
  padding is appended AFTER the merchant's own so nothing is displaced or reordered.
- **Only the Themes page sends samples.** `toPreviewPayload` takes them as an option and Customize
  omits it — that page previews a *real* shop being edited, and padding it would show a merchant
  stock they do not have.
- **It is data on a bundle, never a branch on `themeId`.** Samples ride the existing preview bridge
  exactly as `badges` and `collections` do. A fifth theme adds a fifth sample set and changes no
  component.

Sample product names are prefixed "Sample", which is what lets the rest of the content be realistic;
departments and promises are not, because prefixing every rail entry would wreck the layout being
judged. The disclosure is made once, in `ThemeStage`'s admin chrome — **not** as a banner inside the
preview, which would paint over the very thing the merchant is trying to look at.

### ⚠ The preview iframe must be laid out at a REAL desktop width (2026-08-16)

`usePreviewScale` renders the desktop preview at a fixed 1280px and CSS-scales it down to fit the
panel. Two hard-won reasons, both invisible to typecheck, lint and tests:

1. **The panel is not a desktop.** On a 1440px window the frame measures **860px** — under the
   1000px breakpoint where `.sf-rail-grid` reserves its column. Meridian Care therefore previewed
   with *no rail at all* on the most common laptop size: the merchant was comparing a different
   theme from the one they would get. Lowering the breakpoint would have been backwards — that
   changes what real shoppers see to fix an artefact of the admin chrome.
2. **⚠ Scale it with `zoom`, NEVER `transform: scale()`.** The storefront is on its own subdomain,
   so this frame is an OOPIF — and a transformed OOPIF does not repaint. The Customize preview came
   up **blank white** while every measurement looked perfect: right width, right transform,
   `visibility: visible`, 2072px of scroll height and a fully built DOM inside. Proven directly by
   setting `transform: none` on the live element, which made it paint instantly. Neither
   `will-change: transform` nor deferring the mount until the host was measured fixed it — both
   leave it a compositing problem. `zoom` scales through **layout**, so the frame is laid out at its
   final size and paints like anything else. Its height must then be given in the frame's own
   unzoomed pixels (host height ÷ zoom); a percentage resolves in the zoomed space and comes up
   short. **If this preview is ever blank again, check whether something reintroduced a transform.**

Mobile is deliberately unscaled — 390px is a real phone width, so that preview is already honest.

### Per-theme PAGE LAYOUTS (the layout registry, 2026-08-14)

Until now a theme could only vary a page *within* one component. That left the
cart, the account area and checkout looking identical in every theme apart from
colour and radius — roughly half a shopper's session — and the owner rejected it
twice. So some pages now have **four whole layouts**, and the storefront picks
one at runtime.

**Five surfaces now have layout registries**, and they all follow the same shape:

| Surface | Key | Layouts (default first) | Logic lives in |
|---|---|---|---|
| Account area | `accountLayout` | `sidebar` · `tabs` · `panel` · `editorial` | `account/use-account-area.ts` |
| Checkout | `checkout` | `single` · `multi` · `guided` · `editorial` | `checkout/use-checkout.ts` |
| Cart | `cartLayout` | `panel` · `compact` · `cards` · `editorial` | `cart/use-cart-page.ts` |
| CMS pages + order tracking | `contentLayout` | `centered` · `banner` · `panel` · `editorial` | (no state — `ContentFrame` is chrome only) |
| Home page | `theme.homepageSections` | a section LIST, not a registry | — |

`checkout` was **widened from two values to four** rather than gaining a parallel
`checkoutLayout` key: merchants already have `single-page`/`multi-step` saved and
the two new ids are purely additive. Every other surface got a new key.

**The account area was the first, and it is the template for the rest.** Three
files, and the split between them is the whole point:

| File | Owns | Rule |
|---|---|---|
| `account/use-account-area.ts` | every behaviour — session refresh, `?tab=&order=` deep link, logout-and-evict, scroll-into-view | **one implementation, four consumers** |
| `account/account-content.tsx` | which section is on screen | shared; sections are the same job in every shop |
| `account/layouts/*.tsx` | the shell only — nav shape, where identity and logout sit, how many screens there are | may differ without limit |

> **A layout may not own behaviour.** The moment a layout does its own fetching,
> URL writing or session handling, the four drift and the bug the owner was
> warned about arrives. `panel` is allowed its own `drilled` state because no
> other layout has that screen — that is presentation, not behaviour.

**Keyed on a LAYOUT id, never a theme id.** `templates.accountLayout` is an
ordinary template value a theme stamps like any other, so:

- the live preview repaints (the layout reads the preview store first),
- the Customize picker works (Account area part → `PART_TEMPLATE_KEY`),
- Classic's reset restores it,
- and a merchant can keep Muslin's shop with Classic's account area.

Reading `appliedThemeId` in a component breaks all four. Don't.

⚠ **The fallback in `resolveTemplates` is load-bearing here in a way it is not
elsewhere.** An unresolved `productCard` renders a slightly wrong card; an
unresolved `accountLayout` would index the registry with `undefined` and render a
**blank page** to a signed-in shopper. `account-area.tsx` therefore falls back
twice — `resolveTemplates` clamps the value and `?? SidebarAccount` catches a
registry miss — and `storefront-templates.test.ts` pins both.

⚠ **Checkout's gates stay in `view.tsx`, never in a layout.** Hydration, the
email-verification gate, the placed-order card and the empty cart all answer
"should a checkout render at all" — a layout that got one wrong would take an
order it should have refused. Same for the cart's hydration + empty state.

### Checkout blocks + validation (2026-08-18)

`checkout-blocks.tsx` is a **barrel** over `checkout/blocks/`, so the four layouts
have one import site and the blocks can be split by concern without touching a
layout. Add a block to `blocks/`, re-export it there.

| Piece | File | Owns |
|---|---|---|
| Rules | `checkout-validation.ts` | which fields are wrong, and the message for each. **Pure** — no store, cart or shopper |
| Timing | `use-checkout-errors.ts` | when a message may be seen: on blur, and on a refused submit (reveal all + scroll + focus) |
| Chrome | `checkout-field.tsx` | `Field` (message + `data-cofield` focus handle), `FormAlert`, `invalidInput()` |
| Label | `blocks/labeled-field.tsx` | `LabeledField` (label + control + error) and `FieldPair` (two short fields on a row, via `--cofields`) |
| Fields | `blocks/contact-fields.tsx`, `blocks/delivery-fields.tsx` | the two halves `AddressBlock` composes, so `single` can card them separately |
| Items | `blocks/order-lines.tsx` | the ONE cart-line renderer — `thumbs` on for the summary rail, off for `ReviewBlock` |

⚠ **The submit button is never disabled by an incomplete form.** Pressing it is
how a shopper asks what is missing, and a greyed-out button answers nothing —
`submit()`/`tryAdvance()` refuse out loud instead. `canSubmit` and `stepBlocked`
were removed for this; only `placing` disables anything.

⚠ **A payment method says only what the platform can promise; anything more is
the merchant's own words.** `blocks/payment-block.tsx` gives COD a built-in
sub-line because "you pay on delivery" is true of every store — it is the ONLY
method that gets one. Every other method's title and subtitle come from that
store's own `paymentMethods` entry, and its instructions and questions are
checkout fields scoped to its id. Notes:

- The old `StorefrontSettings.bankInstructions` column is **gone**. It served one
  method, so bKash and Nagad would each have needed their own column, DTO field,
  admin box and render branch. Instructions are now a `checkout.customFields`
  entry with `kind: "notice"`, `slot: "after-payment"` and
  `showWhen: { paymentMethods: ["bank"] }` — written in Store Settings →
  Checkout → Extra checkout fields.
- **Payment methods are merchant data.** `cod` is the only one we ship (its
  sub-line is a promise the platform can make for every store); `manual` belongs
  to the ADMIN order path and a shopper never selects it. Both are reserved.
  Everything else is a `store.paymentMethods` entry — bKash, Nagad, a bank
  account — that the merchant names, subtitles, orders and deletes themselves.
- Each method can name a **receiving account** (`paymentAccountMap`, method id →
  `Account._id`), picked in Payments from `useOrderAccountOptions` — the same
  permission-appropriate hook the order money dialogs use, so a role with
  `storefront.orders.manage` but not `accounts.view` still gets a usable picker.
  ⚠ On a WRITE the map **merges**: send only changed keys, and an explicit
  `null` to clear one. Unset is a real choice ("Ask me each time" = the
  per-order account prompt), rendered behind a `NO_ACCOUNT` sentinel because
  Radix treats `value=""` as nothing-selected and would draw a blank control.

- Each method carries an **`icon`** from a closed shipped set (card, bank, phone,
  coins, receipt, bolt), picked from a swatch row in Payments. Resolve it ONLY via
  `storefrontPaymentIcon` — never index a lookup table directly. That is the bug
  it replaced: the render held a map of `cod`/`bank` and drew NOTHING for every
  merchant method. The resolver has no "no icon" answer and falls back to `card`
  three ways over (never picked / value from a shrunk list / id with no
  definition), because a blank space beside a payment row reads as broken.
  It is a closed list, not an upload: brand logos would mean storage, validation
  and trademark calls for a 20px mark.

- ⚠ **An id is frozen; a title is not.** The backend slugs the id from the title
  once, at creation, and never again: it lands on every order and keys
  `paymentAccountMap`. So NEVER resolve a label by id alone. Go through
  `storefrontPaymentMethodLabel` (`lib/storefront-payment-methods.ts`), which
  resolves order snapshot → store definition → translation → raw id. The
  snapshot has to win: a merchant can rename or delete a method long after an
  order was placed, and that invoice still has to say what the shopper chose.
- ⚠ **`cod` and `bank` are deliberately NOT snapshotted onto orders.** Their
  wording is translated (`t.cod`, `t.bankTransfer`), so pinning one language's
  string would replace a correct Bangla invoice label with an English one. That
  is why step 3 of the resolver exists at all.
- `bank` is an ordinary merchant method, not a built-in — a backfill migration
  gave every pre-existing store a `{ id: "bank", title: "Bank Transfer" }`
  definition. Its id never changed, so bank-scoped checkout notices kept matching.
- **The Payments tab is an ACCORDION: a 56px row per method, one open at a
  time.** Every method used to render every control at once, so three methods
  made a page thousands of pixels tall. The row carries what you read — mark,
  title, subtitle, a one-line `summary` (account + what it asks for), the switch
  — and the detail opens two columns wide. Cash on Delivery is a row in the same
  list (`builtIn`), not a checkbox above it; that unification is what lets it
  carry instructions at all. `md:` is the breakpoint: on a phone the row goes
  title-over-summary, the detail stacks, reorder moves into the open row, and
  every target grows past 44px.
- ⚠ **The switch and the reorder chevrons are siblings of the toggle target, not
  children.** Nested inside it, every enable/disable would also expand the row.
- ⚠ **`PaymentsSettingsTab` adopts the server's ids after a save** (render-time
  adjust on a signature of `settings.paymentMethods`). Without it a new row keeps
  the `useState` seed that has no id, so it reads as unsaved forever and the field
  editor stays out of reach. A row open as `__new` reopens under its minted id.
- A method with no id yet gets neither the field editor nor the account picker:
  both are keyed by that id, and it does not exist until the first save.
- The address block's **"Delivery notes"** box is switchable —
  `store.checkout.showOrderNotes`, and **unset reads as ON** so every store that
  predates the toggle is unchanged. Do not treat it as decoration: what shoppers
  type there reaches the COURIER via `composeCourierNote`. The backend strips the
  value when the box is off, so never rely on the client alone to omit it.

- ⚠ **That embedded editor runs in `paymentMode` — a deliberately smaller surface.**
  A method needs a note (how to pay) and a field (what to send back), plus
  `Required` and the note's STYLE. The slot is FORCED to `after-payment`, and
  help text, input type and the option list are hidden. Do not "restore" those:
  the slot picker in particular let a merchant put bKash instructions in the
  address section. Tone/size are the deliberate exception — payment instructions
  have to be noticed, so a new payment note defaults to `tone: "info"`. It hides controls, not
  capability — the stored shape is unchanged, so one validator, one renderer and
  one order snapshot still serve both editors. A
  method with no id yet has never been saved and cannot own fields — the editor
  shows a notice instead of creating entries that name nothing.
- ⚠ **Payments and Checkout split ONE stored array, so each save must carry the
  other's entries through.** Both tabs go through `mergeCheckoutFieldGroup` on
  save — the PATCH replaces `checkout.customFields` wholesale, so saving a bare
  slice deletes the other tab's work. `checkout-field-groups.test.ts`.
- **The split is one visible rule: a Checkout entry is asked on EVERY order, an
  entry under a payment method only for that method.** `isMethodOwnedField` is
  therefore just "has a `showWhen.paymentMethods` condition", and `methodOwnerId`
  is its first id. ⚠ **Do not reintroduce a "Show for payment method" picker.**
  One existed, and because ownership then meant "exactly one method", unticking a
  method in Checkout made the entry silently jump to the Payments tab on the next
  load. An entry wanted on two methods is added twice now — rare, within the
  twelve-entry budget, and an explicit duplicate beats a teleporting entry.
- A condition naming a method the store no longer defines is **carried through,
  not deleted**: no editor can reach it and the storefront never renders it, but
  it is the merchant's words, so the Payments tab re-saves those `orphanFields`
  untouched. They still count against the cap.
- The twelve-entry cap is shared: each editor takes `reservedFieldCount` (what
  the other side owns, orphans included) so the local cap matches the backend's
  whole-array one.
- Enabling a method with no definition is refused by the SERVICE, not the schema
  — `PAYMENT_METHOD_UNDEFINED`. The admin form blocks it first; the resolver
  still degrades to the raw id for any store that predates the rule.
- ⚠ **`showWhen` is a validation concern, not just a rendering one.** A hidden
  field is never required and its answer is never stored — enforced twice, in
  `checkout-validation.ts` and the backend's `utils/checkout-address.ts`. Skip
  either half and a bank-scoped required field makes a COD order impossible to
  place, refused over a control that is not on the page.
- Notice text is capped at **600** (inputs' labels stay at 200) precisely so
  account name / number / branch fit. `whiteSpace: pre-wrap` is preserved, since
  merchants type those on separate lines.
- Nothing about it is translated any more — a notice is the merchant's own text.
  The old `Dict` heading went with the panel.
- **It was dead data for its whole life until 2026-09-08** — saved, served on the
  public payload, typed on the client with a comment claiming it was shown, and
  rendered nowhere. The lesson generalises past this field: a merchant-facing
  setting is not shipped when the PATCH succeeds. Grep the field name across the
  frontend and confirm a render site exists. (Payment instructions are *still*
  absent from the order-placed card, the tracking page and the confirmation
  email.)

⚠ **The trust strip may not assert a policy.** `blocks/trust-strip.tsx` shows COD
only when the merchant offers COD, and a returns line only when the merchant has
published a returns page — using that page's own title, linked. In a white-label
storefront a hard-coded "7-day returns" is a promise made on behalf of every
merchant on the platform. The strip rendering nothing is a correct outcome.

⚠ **Field numbering lives in the layout.** `single` numbers its three cards via
`blocks/section-card.tsx`; `guided` numbers its own four sections. A block that
numbered itself would number itself twice in `guided`.

⚠ **A layout may not compute money.** `useCheckout` owns the shipping zone, the
coupon quote and the total; `useCartPage` owns the "From ৳X" delivery estimate
(the zone is only known at checkout, so the cart quotes the *cheapest* possible
fee — flattening that into one number understates delivery, which is the largest
single cause of abandonment). A layout that recomputed either would be reported
as "the price changed at the last step".

**Adding a layout to an existing surface:** add the file, add it to that
surface's registry map, its `StoreTemplates` union, its map in
`storefront-templates.ts`, and its `TEMPLATE_OPTIONS` entry.

**Rendering a `TEMPLATE_OPTIONS` key in Customize — pick the control, don't
default to tiles.** `parts/template-picker.tsx` exports three, all reading the
same catalogue so an option's id, label and wording exist exactly once:

| Use | Component | For a key whose options are |
|---|---|---|
| Sketch tiles | `TemplatePicker` | **spatial** — `home`, `product`, `header`, `footer`, `shell`, `cartLayout`, `accountLayout`, `contentLayout`, `checkout`, `categoryTiles` |
| One track of steps | `TemplateSegmented` | a **ramp** — `imageRatio`, `imageFit`, `collection`, `pagination` |
| Dropdown, descriptions inside | `TemplateSelect` | a **list of 5–6** told apart by what they do, not their shape — `cardActions` |

⚠ **`TemplatePicker` defaults to `caption` mode** — one line under the grid for
the selected option, not a line under every tile. Do not pass `caption={false}`
to "restore" the old look: a per-tile description is read at ~95px inside the
380px rail and wraps to four lines, which is what made the Design part open to
~1,870px and Product cards to ~1,240px before this split. `SegmentedField` and
`SwatchField` (`ui/components/`) follow the same rule.

The **Look** part's `Type and rhythm` block is the worked example: six axes in
**one** `PartGroup` slot (`PartField`, not six `PartBlock`s — that alone was
192px of block padding), typeface as a described `SimpleSelect`, palette as a
`SwatchField`, the four ramps as `SegmentedField`s with the glyphs in
`parts/design-glyphs.tsx`, and corners + page width folded behind **More
options** — opened automatically when either is already off its default, so the
fold never hides a merchant's own answer.

### The Customize rail (2026-09-06)

`Brand` and `Design` merged into **`look`**, and the rail is grouped.

- **Why they merged:** both sat at 12% adoption while parts named after something a merchant can see
  on their own website sat at 51-67% — and colour lived in *both* (`brandColor`/`accentColor` in one,
  `surface` in the other), so "how do I change my shop's colours?" had two equally abstract answers.
  One panel, one row, **no setting added or removed**.
- **Five groups: Look · Home page · Shop pages · Buying · Site frame.** Group by the *merchant's*
  question; order **inside** a group by the shopper's journey — announcement bar, campaign strip,
  hero, sections is the order they appear down the page. The flat list ordered the whole rail that
  way, which is a good principle serving the wrong reader: a merchant is hunting for one thing.
- ⚠ **`look` sits ABOVE the groups, not in one of its own.** It is the only part that changes every
  other one, and a heading called Look over a row called Look reads as a rendering fault.
- ⚠ **`parts-rail.test.ts` asserts the grouping reaches every `PartId`.** The flat list held them in
  one array where an omission was visible; split across five, a part that is saved by the payload,
  tracked by the save bar and rendered nowhere would not be.
- **`?part=brand` and `?part=design` still resolve** (`RETIRED_PART_IDS` → `look`) — `?part=` is a
  documented deep link.
- **`StartHere`** (`parts/start-here.tsx`) heads the panel with the three moves at 5%/5%/12% reach —
  pick a theme, add a logo, choose a palette — and names the theme drawn for the merchant's trade
  (`recommendedThemeFor`). It deep-links `?part=look&theme=…`, which stages the theme as an *unsaved*
  edit rather than navigating away. The store dashboard carries the same prompt
  (`components/ecommerce/store-look-card.tsx`), because putting the fix behind one more click into the
  panel nobody opens repeats the failure one level down. Both read `lookProgress`
  (`lib/storefront-look-progress.ts`) so they can never disagree about what is still outstanding.

**Adding a whole new surface:** extract a `use<Surface>` hook first, then the
shared blocks, then the layouts — in that order. Writing the layouts first is how
the logic ends up copied four times. Then wire the key through: backend
types/validator/model/`organization.dto`, `StoreTemplatesRaw`, `StoreTemplates`,
`DEFAULT_TEMPLATES`, the `pick()` map, `TEMPLATE_OPTIONS`, `draft-payloads`,
`preview-bridge`, `use-sf-preview-store` (4 places), `PART_SLICE`, the rail's
`RAIL_GROUPS` + `PART_TEMPLATE_KEY`, and all five theme bundles. The backend
stores a loose string, so the OpenAPI contract only changes because the DTO
gained a field.

### Ready-made themes (Online Store → Themes)

**A theme is DATA, never code** — `lib/storefront-themes.ts` is a catalogue of bundles that get
*stamped* into the merchant's own `theme` + `templates`. The storefront renders from their settings
and never learns a theme was involved. That is what keeps one codebase serving every tenant: a new
theme is a row in that file, so a checkout fix is written once, not once per theme.

**Making themes look more different means widening the token vocabulary, not adding branches.** If a
look cannot be expressed by `theme.design` + `templates.*`, add an axis — never special-case a theme
id in a component. `apply-theme.test.ts` fails if a bundle names a template value no picker offers.

**Preview is the merchant's REAL shop, not a drawing** (2026-08-13, moved out of a modal 2026-08-15).
`ThemeStage` renders the same `BrowserPreview` the Customize page does, fed a **throwaway** draft:
`seedDraft(settings)` (exported for this) with `applyThemeToDraft` laid over it. It replaced a
sketch composed from the theme's own `sections` list — structurally honest, and still the wrong
thing, because the question a merchant is asking is "would MY shop look good like this" and a grey
rectangle where their photographs go cannot answer it. Nothing here writes: Apply routes to the same
`?theme=` staging flow. `BrowserPreview` takes a `viewportHeight` prop because its default is derived
from `100vh` and overflows any container that caps its own height.

**The apply flow has no bespoke machinery**, and that is the design:
`/ecommerce/customize?theme=<id>` stages the bundle into the draft as an ordinary unsaved edit, so
the existing live preview *is* the preview, the save bar lists what changed, **Discard is the undo
and Save is the confirm**. There is no snapshot table and no confirmation modal — and therefore no
second code path that could persist something the preview never showed. The param is staged during
render via **state** (the `seededSettings` pattern), not an effect (which would flash the old look
for a frame) and not a ref (`react-hooks` rejects reading a ref during render). It is stripped from
the URL in an effect so a reload after Discard cannot silently re-stage a rejected theme.

**`applyThemeToDraft` is the one place that decides what a theme may write** — it returns only look
fields, and `apply-theme.test.ts` asserts that none of `footerText`/`footerNote`/`badges`/
`heroSlides`/`navHeader`/`footerGroups`/`collections` appear in the patch. `templates` is **spread**,
never replaced: the bundles deliberately omit `hero`, `headerMenu` and `checkout` because those
depend on what content a shop actually has (forcing `hero: "slides"` on a shop with no slides shows
the placeholder hero), and a wholesale replace would blank them.

**The catalogue is four bundles, Classic first** (2026-08-13): **Classic**, **Fresh Market**,
**Meridian Care**, **Muslin**. They replaced Grocery Modern / Pharmacy Lite / Fashion Shine, which
were structurally distinct but visually unrefined.

⚠ **Classic doubles as "reset to default", so its bundle MUST equal the built-in defaults.** That is
five assertions in `apply-theme.test.ts` (design tokens, colour preset, `HOME_PRESET_SECTIONS.classic`,
every key resolving to `DEFAULT_TEMPLATES`, and the same key SET as every other bundle). If it
drifts, applying Classic silently restyles a shop that was already on the stock look — the one
failure mode where the merchant did nothing and the shop changed anyway. The templates comparison
goes through `resolveTemplates`, because bundles store RAW admin ids (`"grid-4"`) and the storefront
consumes resolved names (`"grid4"`); comparing the strings would pass while the vocabularies drifted.

⚠ **Every bundle must open on something.** A homepage whose first block is a grid of category tiles
reads as a directory, not a shop — it was the first thing the owner said on seeing the build. Each
bundle's first section is therefore deliberate and is the theme's "banner": `hero-card` (Classic),
`hero-open` (Fresh Market — the unframed hero is what lets the parchment ground introduce itself on
the first screen), `deal-strip` (Meridian Care — a live offer is what a dispensary leads with, and
the rail already carries the departments), `editorial-split` (Muslin), `hero-fullbleed` (Little
Steps).

⚠ **Two sections can print the same merchant content — compose bundles, don't just stack sections.**
Browser QA (and only browser QA) caught all three:
- Fresh Market paired `footer: "rich"` with the `trust-band` section. Both read `trustBadges`, so
  the merchant's three promises appeared twice, a hundred pixels apart. Now `footer: "columns"`.
- Meridian Care stacked `trust-band` under `search-hero`, which already prints the badges as a tick
  row *inside its own tinted block* — two tinted bands running together, promises written twice.
  `search-hero` is gone; `deal-strip` leads the page, the band closes it, and the `clinical` header
  carries the search.
- Muslin led with `hero-fullbleed` **and** `editorial-split` — both render the same `banner` image,
  so the merchant's one photograph appeared twice, a screen apart.

⚠ **`meridian-care` must keep a header with a REAL search field.** A pharmacy shopper arrives with a
name to type ("Napa", "omeprazole"), and `centered`'s search is an icon. Header uniqueness across the
catalogue is a nice-to-have; hiding the one control a trade needs is not — so don't "fix" it by
switching Meridian to `centered`. (It shared `classic` with the Classic bundle when this was written;
it is on `clinical` now, which is the same requirement met by a header built entirely around the
field.)

⚠ **A theme changes the footer LAYOUT, so check that every layout still draws the merchant's
words.** Muslin (formerly Fashion Shine) selects `footer: "newsletter"`, and that layout used to lead with the bare
brand mark — so `copy.footerText` stayed perfectly intact in the data and was simply never drawn.
"Safe in the payload" is not good enough here: to the person who typed the sentence it reads as data
loss, and the promise a theme has to keep is that their words survive *visibly*. **All five layouts
draw the blurb** — `columns`/`rich`/`contact` via `BrandLead`, `simple` via its own centred `<p>` —
and `newsletter` was the sole exception until it was fixed to lead with `FooterBrand`. **Adding a
footer variant means deciding where the blurb goes**; omitting it is the bug, not the default.

### The settings PATCH REPLACES `theme` and `templates` — and now says so with a 400

`updateSettings` ends in `Object.assign(settings, dto)`, and both are Mongoose **nested paths**:
assigning a POJO rewrites the whole subdocument, so the stored block becomes exactly the keys sent
and every key omitted is **deleted**. That is the intended contract — it is what lets a ready-made
theme stamp a look wholesale — and it is pinned by
`storefront-settings-patch-semantics.test.ts`.

It cost a live tenant its whole visual identity on 2026-08-18: a one-field
`{"theme":{"homeCollections":{…}}}` erased `design`, `brandColor`, `accentColor` and
`homepageSections`, reset `preset` to its default, and returned **200** (QA-094). Since 2026-08-19
the validator refuses that shape:

- **`preset` is required** whenever `theme` is present. It was already non-optional in
  `StorefrontTheme`; the validator was the one place that disagreed.
- **`theme` and `templates` are `.strict()`.** `validate()` REPLACES `req.body`, so an unknown key
  used to be stripped in silence and then deleted by the replace — a typo (`designs`,
  `homeCollection`, `hom`) cost the merchant the field they were trying to save and reported
  success.

**What the schema still cannot do, so you have to:** a *complete* block cannot be demanded, because
`JSON.stringify` drops `undefined` and the Customize editor's own full literal therefore arrives
carrying only the keys the merchant has actually set. **Always send the whole block you touch.**

### The look/content split — what a theme may and may not write

**`theme` + `templates` = the look. `copy` + `nav` + `trustBadges` + `promoTiles` + `heroSlides` +
`heroBanner` = the merchant's.** A ready-made theme stamps the first group wholesale and must never
touch the second.

That is why `footerText` / `footerNote` / `footerContactHeading` / `footerNewsletter` moved out of
`theme` into a sibling **`copy`** block on 2026-08-12. Inside `theme` they sat in the same object a
theme replaces, so applying one would either erase a merchant's own sentences or need a
hand-maintained skip-list that drifts the first time someone adds a field. The split makes the rule
structural instead of remembered.

- Named **`copy`, not `content`** — "Content" is already the CMS-pages section of the admin, and two
  different things called content is how a page body ends up in here.
- The storefront reads **`store.copy.*`**, never `store.theme.*`, for wording (`store-footer.tsx`).
- `draft-payloads.ts` sends `copy` as its own block; `draft-payloads.test.ts` asserts both halves —
  that the words arrive under `copy` **and** that none of them appear under `theme`.
- **Adding a merchant-editable string? It goes in `copy`.** If you find yourself putting a sentence
  next to `brandColor`, that is the bug this split exists to prevent.

### ⚠ `toSettingsPayload` deletes every `theme` field it does not list

The save payload rebuilds `theme` as a **whole object literal**, and the backend applies it with
`Object.assign(settings, dto)` under documented "each provided sub-field replaces the existing one"
semantics (`storefront-settings.service.ts`). So a `theme.*` field the draft does not carry is a
field the **next unrelated Save silently deletes** — no error, no failing test, and the live shop
keeps rendering the old value until the cache lapses.

Two consequences, both load-bearing:

- **A `theme` field that no control edits must still be in the draft and in the payload.**
  `appliedThemeId` is the standing example: nothing in Customize writes it (a ready-made theme
  does), and it is carried purely so that saving an unrelated part cannot erase which theme a store
  is on. `draft-payloads.test.ts` covers it — extend that test, don't just add the line.
- **Adding a `theme` field is four places, not one**: the backend model/validator, the **admin**
  `organization.dto.ts` `storefrontSettingsDto.theme` (the public storefront DTO is
  `theme: z.unknown()` and needs nothing — but omit the admin one and `enforce` strips it from the
  editor's own response, so it saves correctly and reads back as default), `CustomizeDraft` +
  `seedDraft`, and `toSettingsPayload`. This is the `headerMenu` bug wearing a different hat.

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
resolved **per store**, never baked into the build — per request from the host on `/shop` routes, per
cached entry on the `/sites` route (see "Cached store pages").

- **Metadata** — `generateMetadata` in each `page.tsx`. Home reads `store.seo.title/description`
  (falling back to the store name), PDP reads `product.seo.*` then the online title/description,
  og:image = product image ∥ store banner ∥ logo. Everything else goes through `storePageMetadata`
  (`"<Page> · <Store>"`, host-correct canonical, robots directive). Favicon is a raw
  `<link rel="icon">` in `StoreHead` (`components/storefront/store-head.tsx`, rendered by
  `shop/layout.tsx` and the cached route's `PageFrame`), deliberately **not** `metadata.icons` (see the
  note there).
  Its source is `store.favicon` — the **org-level favicon**, pre-resolved by the backend
  `getStoreInfo` — and **not** the store logo: the tab icon never falls back to a logo, so a store
  without a favicon renders no `<link>` at all and the per-host `/favicon.ico` route answers.
  (The store *logo* keeps its own `settings.logo ?? org.logo` fallback; only the favicon is unchained.)
  Always pick the variant with **`faviconHref`** (`lib/storefront-client.ts`), never
  `favicon.thumbnailUrl` directly: it resolves `pngUrl` first, because Google Search cannot read
  webp and the icon beside a search result comes from this exact tag. Emit ONE icon link — offering
  webp alongside the PNG hands the crawler two candidates and no stated preference.
- **`/favicon.ico` is per host** (`app/favicon.ico/route.ts`, `dynamic = "force-dynamic"`). It
  resolves the store with the same `resolveStoreForHost` the proxy and `robots.ts` use, then 307s to
  that store's icon; non-storefront hosts (tenant root, `app.`, `admin.<domain>`) get `/icon.png`.
  This exists because the static `public/favicon.ico` served the EzyCore mark from *every* host,
  merchant custom domains included — and because a crawler reads the icon off the **home page**,
  which on a tenant subdomain is the admin app, not `/shop`. **`public/favicon.ico` must stay
  deleted**: a file in `public/` is served ahead of any route and would shadow this silently.
- **Content must be in the SSR HTML.** `page.tsx` fetches with `lib/storefront-server.ts` and passes
  the result to the client view as query `initialData` (`useStoreProduct` / `useStoreProducts` /
  `useStorePage` / `useStore` / `useStorePages` / `useStoreCampaigns` all take it). This was a real
  defect until 2026-07-27: the PDP, `/products` and CMS pages rendered `<View />` with no seed, so the
  `<head>` was perfect and the `<body>` was a spinner. **Adding a new indexable route means seeding
  it** — a client-only fetch is invisible to every crawler that doesn't run JS.
- **The collection page's params object IS its cache key.** Server and client must build it through
  `catalogQueryParams` (`lib/storefront-catalog-params.ts`); one mismatched key (`""` vs `undefined`)
  silently misses the seed and you're back to an empty body. Only page 1 is seeded.
- **Seed a query at its OUTERMOST consumer.** `useStoreCategories` is seeded in `shop/layout.tsx`
  via `StoreShell`, never by the page that reads it: the shell mounts first, so it creates the
  query, and `initialData` handed in by a deeper component arrives after the entry exists and is
  ignored. Until 2026-08-07 it had no seed at all, which put the header's category row, the
  sub-category strip and the PDP breadcrumb's category rungs outside the SSR HTML. The breadcrumb
  was the sharp case: its JSON-LD twin **is** server-built, so the page server-rendered a visible
  `Store › All products › Product` while its own structured data claimed the real category trail —
  the exact disagreement the shared builder exists to prevent. Found by curling the SSR HTML;
  nothing in typecheck, lint or 374 tests saw it.
- **`noindex` policy.** Transactional routes (cart, checkout, search, `/account/*`, invoices) pass
  `index: false` → `noindex, nofollow`. Filtered collection URLs pass `index: false, follow: true`
  **and no canonical** — `isIndexableCatalogUrl` allows a plain listing or a *single brand* facet
  (which self-canonicalizes via `catalogCanonicalQuery`); price bounds, `inStock`, a sort, or a `tags`
  facet are the same catalogue re-sliced and multiply without limit. Never give a `noindex` page a
  canonical pointing elsewhere — that's two contradictory instructions.
  - **`?categoryId=` is deliberately NOT indexable any more.** A collection's canonical URL is its
    PATH (`/phones`), and two URLs claiming the same page compete. The query form still resolves so
    old links keep working; it just never earns an index slot, and the sitemap emits paths only
    (`collections: {path}` at both levels). Tag facets are excluded from the sitemap entirely.
- **`/robots.txt` + `/sitemap.xml`** — `app/robots.ts` / `app/sitemap.ts`, both
  `dynamic = "force-dynamic"`. ⚠ **They do NOT get the `x-ezy-store-*` headers**: `proxy.ts`'s matcher
  excludes any path containing a dot, so these routes resolve the host themselves via
  **`lib/storefront-host-map.ts`** — the shared rule set the proxy now also uses. Change host→store
  rules there, in one place, or robots/sitemap will describe a different store than the pages do.
  ⚠ **An IP host is not a domain.** `isCustomDomainCandidate` gates on `host.includes(".")`, which
  an IPv4 literal satisfies — so guard with `isIpHost` (`lib/organization-utils.ts`, shared with
  `hostImpliesWorkspace`). Both used to hardcode `192.168.*`, which meant reaching the dev server
  from a phone on any other private range (`10.x`, most hotspots and office wifi) had the admin
  app answer **"Workspace not found"**: the gate read the IP as a merchant custom domain and asked
  the backend to resolve it.
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
  chrome). A missing `/pages/<slug>` never reaches the cached `/sites` route, because a cached render
  cannot draw this page (see "Cached store pages"). ⚠ The guard is `if (store && !product) notFound()` — **not** a bare `!product`: the
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

- **Brand lockup** — `components/storefront/logo-mark.tsx` (`<Brand>` = uploaded logo, else the
  initial chip + store name; header and footer both use it). A merchant's SVG/PNG wordmark usually
  has no backdrop and is drawn in ONE ink colour, so black type disappears on the dark theme and
  white type on the light one — and nothing in the payload says which file you have. **The merchant
  answers it, the storefront does not guess:** `theme.logo` (Customize → Brand → "Logo display")
  carries `background` / `height` / `padding` / `radius`, resolved by `resolveLogoStyle`
  (`lib/storefront-templates.ts`) and read through **`useStoreLogoStyle()`**
  (`services/storefront/use-logo-style.ts`), which applies the live-preview draft first.
  - **`<Brand>` reads the style itself rather than taking it as a prop** — it renders at six call
    sites across the three header variants and the footer, and threading it would be six chances to
    forget one. `useStore` is already cached by the header, so it costs nothing.
  - **Padding is subtracted from the height, never added**, so raising it insets the mark instead of
    growing the header around it. `logo-style-field.tsx` mirrors that arithmetic in its preview.
  - **The admin preview renders both grounds side by side**, and must: the whole failure is a logo
    that reads on one theme and not the other, so a single-ground preview would let an owner "fix"
    dark and ship a mark that has vanished on light.
  - Every field absent ⇒ **byte-identical to the pre-setting rendering** — no backdrop, per-placement
    height, no padding, square corners. Keep it that way; the defaults are what stop this restyling
    every existing shop.
  - A **canvas auto-detection** (a `logo-tone` module plus its hook, 2026-08-08 — both **deleted**,
    which is why you will not find them) was tried and removed the next day. It read the logo's pixels to pick a plate automatically, which
    requires `crossOrigin="anonymous"` — and the R2 bucket behind `*.r2.dev` / `cdn.ezycore.com` has
    no CORS policy, so every sample failed and every logo silently fell back to bare. Do not
    reintroduce it without fixing the bucket policy first; an explicit control is better anyway,
    because a coloured or part-transparent mark has no correct automatic answer.

- **Breadcrumbs** — `lib/storefront-breadcrumb.ts` (pure, tested) builds the trail;
  `components/storefront/breadcrumb.tsx` renders it. **Every page with a trail renders it twice** —
  once as `BreadcrumbList` JSON-LD, once as visible markup — so both MUST come from the same
  builder call. Structured data that disagrees with the visible page is a manual-action risk, and
  the PDP's trail was a hardcoded `Store › Products › Product` until 2026-08-07 while the shop had
  a two-level taxonomy.
  - `categoryCrumbs(tree, categoryId, subcategoryId)` reads the two ids **independently** —
    `categoryId` is the parent even when a child is set. A level is **skipped** when it cannot be
    linked (unlisted, or no `slugPath`): a crumb to a 404 is worse than a shorter trail.
  - `productCrumbs` never collapses to `Store › Product` — an uncategorized product keeps an
    "All products" rung, so there is always one link upward.
  - Crumbs carry **store-relative** paths; the caller decides absolute (JSON-LD, via
    `canonicalTarget`) vs relative (visible, via `storeHref`). The label for the fallback rung is
    passed in because the server-rendered JSON-LD cannot read the client i18n dictionary — it is
    English there on purpose, matching the "only English is indexable" note in SEO above.

- **`?hideSoldOut=1` and `?inStock=1` are NOT the same filter** — they differ on exactly one row of
  the truth table, and that row is why both exist. `inStock` keeps `availableQuantity > 0`;
  `hideSoldOut` also keeps a **`backorder`** product, which sits at zero stock deliberately and is
  still buyable ("Available on backorder"). So `inStock` on a curated row would hide a product the
  shopper can order. Rule of thumb: **`inStock` is the shopper's "In stock only" facet** (they asked
  for stock, so excluding backorder is right); **`hideSoldOut` is for merchandising rows the shop
  chooses** — today the homepage's Featured and New arrivals, where an unbuyable card is dead space.
  Collection and search pages deliberately still list sold-out products, with the sold-out card
  treatment. Both live in `storefront-catalog.service.ts`'s computed path and are covered by
  `storefront-products.test.ts` → `hideSoldOut`, including an assertion that `inStock` still drops
  the backorder product — that test exists to stop the two being folded into one.
  Also note both flags **force the computed path** (in-memory filter + hydrate), because
  availability does not live in the products collection.

- **The catalogue's default sort is `featured` first, not `newest`** —
  `{ "storefront.featured": -1, createdAt: -1 }`, on both the fast path and the in-memory one
  (`../inventory-backend/src/services/storefront-catalog.service.ts`). That is the right relevance
  order for a collection page, and a trap everywhere else: **any "newest / latest / new arrivals"
  query must pass `sort: "newest"` explicitly.** The homepage's New-arrivals row did not, so it
  opened with the merchant's featured products in the same order as the Featured row directly above
  it — the two sections looked identical, and got more identical the more the owner featured (fixed
  2026-08-09; the rule now lives in `homeRowQuery`). Nothing fails when you forget: you get a
  plausible list of the wrong products.

- **Homepage product rows** — `lib/storefront-home-rows.ts` (resolver + query + heading) and
  `components/storefront/home/home-product-row.tsx` (the chrome). `theme.homeRows` is a merchant
  list (Customize → Home page → Product rows), each row `{ id, source, categoryId?, title?, limit?,
  layout? }` with `source ∈ featured | newest | category`, capped at **6** rows of **4–12**
  products. It replaced the two rows the homepage used to hard-code, and the vestigial
  `theme.homepageSections` (declared, seeded, validated on both sides — and rendered by nothing)
  was deleted with it.

  Five rules, each of which fails silently rather than loudly:

  - **Absent ≠ empty.** `homeRows: undefined` is "never opened the panel" ⇒ `DEFAULT_HOME_ROWS`
    (Featured + New arrivals, mirroring the backend seed). `homeRows: []` is "cleared every row" ⇒
    no product rows. Collapsing the two resurrects rows a merchant deliberately deleted.
  - **A category row filters on the LEVEL of its collection.** Products denormalize `categoryId` to
    the top-level category and `subcategoryId` to the child, so a top-level row filters
    `categoryId` (and sweeps in every child's products) while a sub-collection row must filter
    `subcategoryId`. Sending a child's id as `categoryId` matches nothing and renders an empty row.
    `findRowCategory` resolves the level off the category tree the page already fetched.
  - **The store and the tree are fetched BEFORE the rows.** The rows cannot be known until
    `theme.homeRows` is read, and the filter field cannot be chosen until the tree is. Both are
    cached 300s and tag-flushed on save, so the serial hop is a cache read in the normal case.
  - **Classic is the only template that renders the list.** Hero Split and Minimal are single-row
    editorial layouts: they take `rows[0]` through `useHomeRowProducts` and keep their own headings
    ("Weekly picks", "Selected"). The Home part in the editor says so, and marks the other rows
    "not shown", or the merchant reads their absence as a bug.
  - **A stale row must never block an unrelated save.** The backend rejects a `category` row
    naming a collection the workspace does not own (`assertHomeRowCategories`, the only DB read
    in the settings PATCH — feedback, not safety: the storefront already drops what it cannot
    resolve). That check turns a category deleted months ago into a wall in front of every
    future save, so `trimHomeRows` drops a row whose collection is not in the store's current
    list — exactly as it drops one with no collection at all — and the panel says *which* of the
    two happened. **If you add a rule to one side, add it to the other**, or the merchant hits a
    400 for a row they are not editing.
  - **The preview fetches; the shop does not.** Every saved row is server-rendered so the homepage
    stays crawlable HTML. A row the merchant just added has no SSR products, so `HomeRowData.items`
    is absent and `useHomeRowProducts` fetches client-side — preview only. `StoreHome` matches
    draft rows to server-rendered ones by **`rowSignature`** (source + category + limit), never by
    `id`: a re-pointed row keeps its id, and matching on id would go on showing the old row's
    products under the new heading, while matching on the whole row would blank a row over a rename.

- **Homepage category-row layout** — `theme.homeCollections` now controls both catalogue-entry
  sections: Classic's `category-chips` (`home/home-collections.tsx`) and Fresh Market/Muslin's
  `category-tiles` (`home/sections/category-sections.tsx`). `category-row-layout.ts` is the shared
  draft/saved resolver and strip behavior. Until an owner chooses explicitly, chips keep their
  historical `strip` default and tile-led pages keep their historical `grid`; collapsing those to
  one fallback would restyle an existing theme without its owner asking. Grid columns live in CSS
  (`.sf-home-collections` / `.sf-cat-tiles`) so each breakpoint can read its own count: desktop
  honours `--sf-hc-cols` / `--sf-ct-cols` (the owner's 2–6), a phone reads `--sf-hc-mcols` /
  `--sf-ct-mcols` (`mobileColumns`, 2–4, default 2). ⚠ **Two settings, not one scaled** — a phone row
  divides ~336px against a desktop row's 1200px, so a shop with fourteen departments wants four
  across on a phone while a shop with two wants them big; neither is derivable from the other, and
  the phone was hard-pinned to two until 2026-09-07. The default is still two, so an untouched shop
  does not move. One control governs BOTH category grids (they share `theme.homeCollections`), which
  is why the panel's hint names the tile row when it is composed. Tile tracks retain a mode-specific
  max, so choosing two never stretches a department into a half-page product card.
- ⚠ **The collections-row GRID thumb is `--sf-hc-thumb`, not a constant** (fixed 2026-09-07). It was
  `THUMB = 60` / `THUMB_BARE = 76` inline in `home-collections.tsx`, which is right for a desktop
  column and absurd on a phone: two columns of ~179px each holding a 60px picture, i.e. a third of
  its track, reading as images that failed to load beside a tile row that fills its column. Now the
  breakpoint owns the value — full column on a phone, the 60/76px disc above 680px — and the corner
  is `--radius-md` rather than a literal 11px, which was a soft chip at 60px and a slab at 179px. Strip alignment uses
  `safe`, or centred overflowing content makes its first tile unreachable. **The strip itself is
  `home/category-strip.tsx`** — a shared track with arrows in place of the scrollbar `.sf-root`
  otherwise draws under it. Three rules live there: an arrow shows only when that direction can
  actually move (measured with `ResizeObserver` + `onScroll` via the tested `stripEdges`, never from
  a tile count — the same four categories overflow or don't depending on the window); the arrows are
  **pointer-only**, the inverse of `.sf-deals-controls`, because a phone swipes natively and two
  36px buttons would cover the two tiles a 360px screen shows; and one press moves ~80% of the track
  (`stripStep`), not one tile. **The phone gets the carousel instead of the arrows** (2026-08-25):
  the track snaps `x mandatory` so a flick settles flush rather than stopping with a tile cut in half,
  and `.sf-chip-row` widens the chip to `100%/2.5 - gap`, i.e. two whole tiles and half of a third on
  every handset. ⚠ **That width is a FRACTION on purpose** — a fixed px peeks generously on one screen
  and lands flush on the next, and a row with no peek reads as finished. The thumb is a PERCENTAGE of
  the tile (71%, or 90% when pictures-only) so it follows for free, and 71% of the 84px desktop track
  is the 60px the row has always drawn, so desktop does not move. Its corner is `18%` rather than
  `11px` for the same reason: a literal radius that is a soft chip at 60px is a slab at 90px.
  `scroll-snap-stop` stays `normal` — `always` would cap a swipe at one tile and cost eight swipes for
  eight categories. Only the chips need this; the photo tiles already run 132–210px and peek on their
  own. `categoryTileRowLayout` returns the tile variables ALONE for a strip —
  the flex/overflow/alignment belong to the component, so don't put them back on the caller's div or
  the arrows will measure a container that isn't the scroller. **`showLabels: false`** (Customize →
  Collections row → "Picture only") draws the row as pictures with no captions — chips grow their
  thumb to 76px, tiles drop the caption, `overlay` drops its scrim with the name it existed to carry,
  and the `<Link>` takes an `aria-label` so a picture-only link still announces its department. It is
  **conditional**, via the tested `categoryLabelsVisible`: a row keeps its names unless EVERY listed
  category has an image — and because of that the Customize chip is **disabled** whenever any listed
  collection lacks one, with a warn hint counting them ("7 listed categories have no picture"). It
  shipped enabled with a quiet hint first, and that was a bug: the chip highlighted, the preview did
  not move, and a refusing control was indistinguishable from a broken one. The count comes from
  `CollectionRowValue.hasImage`, which is why the admin `Collection` DTO carries `image` at all.
  ⚠ The category picture is stored as **`images` (an array)** and served as singular `image` —
  `select("… image")` silently selects nothing and the DTO drops the key, so every collection reads
  as unphotographed. `catalog.service` and `storefront-taxonomy.service` both map `images?.[0]`, and the `disc`/`compact` letter shapes ignore it outright — a lettered tile
  with no name under it names nothing. Asked once per section, never per tile, for the same reason
  `photographed` is. Applying a ready-made theme resets it (the bundles set no `showLabels`), which is
  the documented "applying a theme resets this look". Customize shows the
  controls only when `category-chips` or `category-tiles` is actually in the effective section list;
  Meridian Care's rail-only page gets an explanation instead of inert controls.
  Ready-made themes stamp this visual setting too: Classic starts as a left strip, while Fresh
  Market and Muslin start as centred adaptive grids with no fixed column count. An explicit 2–6
  choice switches tile grids to exact tracks. This reset is required when applying or previewing a
  theme; otherwise a saved Classic strip leaks into Fresh/Muslin and makes them look like Classic.

- **Sub-category drill-down** — `components/storefront/subcategory-strip.tsx`. A collection page
  shows a chip row of its sub-collections under the `<h1>`; `subcategoriesFor(collection, tree)`
  (exported, tested) decides which: a PARENT page shows its children, a CHILD page shows its
  **siblings** with the current one active. A child has no children of its own (two levels), so
  showing nothing there makes every drill-down a dead end. It reads the **tree**, not the
  collection payload — `GET …/categories/resolve` returns `parent` but not `children`, and the
  tree is already fetched for the nav. Unlike the header's category row this MAY scroll
  horizontally: flat links, no dropdown for the scroll box to clip.

- **Catalog facets** — `components/storefront/use-catalog-facets.ts` is the **one** owner of the
  facet layer (URL state, the facet lists, the active-filter chips, `clearAll`, `setParams`), shared
  by the collection grid and `/search`. It was inline in `products/view.tsx` until search gained
  facets; a second copy would have drifted on the first change to chip behaviour, and those two
  pages are exactly the ones a shopper compares. **A new page that filters the catalogue uses this
  hook** — do not re-read `?tags=`/`?brandId=` off `useSearchParams` by hand.
  - The URL is the single source of truth, so nothing here stages state; `setParams` writes the
    query string and the next render reads it back. `setParams` is `useCallback`-stable so it can
    sit in an effect's deps (the search page syncs `?q=` that way without looping).
  - `categoryPath` blanks the id facets: on a path page the collection is the ROUTE, and a shopper
    must not be able to filter themselves off the page they are standing on.
  - Request params come from `lib/storefront-catalog-params.ts` — `catalog*Params` for the
    collection, `categoryPath*Params` for a path page, **`search*Params` for `/search`** (adds `q`,
    uses `SEARCH_PAGE_SIZE`). Same builders on both pages is what makes a tag mean the same thing on
    each; the params object is also the cache key, so hand-building one re-introduces the
    silently-missed-seed bug.
  - ⚠ **On a results page the filter toolbar and chips must render OUTSIDE the empty-state branch.**
    Filters can produce zero results, and a shopper who over-narrows them needs a way back — if the
    controls live inside the non-empty branch, the only exit is the browser's back button. `/search`
    also swaps its empty-state CTA from "view all products" to "clear all" when chips are active.
- **Product tag chips** — `components/storefront/product-tag-chips.tsx`, the one renderer for
  `CatalogProduct.tags` (the merchant's labels; the backend emits **active** tags only, so a chip
  always points at a facet value the store still serves). Three homes: the PDP badge row beside the
  stock pill, the product card's image, and the search page's list rows. Two **independent** axes —
  - **`tone`** — `soft` (tinted, for a page/card background) or `solid` (full-strength colour +
    `readableTextOn`, for laying over a product photo). Not decoration: a soft tint is invisible
    over an arbitrary photo.
  - **`base` decides `<Link>` vs `<span>`.** Pass it ⇒ chips link to `/products?tags=<slug>`; omit
    it ⇒ inert spans. Omit it whenever the chips sit *inside* another link — the card image and the
    search row's text block are each wrapped in one, and an `<a>` in an `<a>` is invalid markup
    browsers reparent (same rule as `CardVariantFlyout` being a sibling, not a child).
    ⚠ **The check is `base != null`, never truthiness** — a custom-domain store has `base === ""`,
    so a falsy test silently unlinks every chip on exactly the half of the estate you are least
    likely to have open in dev.
  - On the card it is capped at **2** and pinned **top-right**: top-left is the discount badge and
    the image bottom belongs to `CardRevealActions`/`CardVariantFlyout`. Colour follows `StatusPill`
    (`color-mix(… 72%, var(--text))`, never the raw hue) so a merchant colour survives both themes
    with no JS branch. A tag with no `slug` is dropped, not rendered inert.
  - **`?q=` matches more than the product name** (BE `listProducts`): name,
    `storefront.onlineTitle`, `barcode` (there is no `sku` field) and active **tag names**. The
    `storefront.onlineTitle` clause is load-bearing — the shop renders `onlineTitle || name`, so
    without it a merchant who set an online title had a product whose *displayed* name was
    unsearchable. **Any field the catalog overlay can override must be searched next to the field it
    overrides.** This is also why the search list row shows chips: a row whose name contains none of
    the typed words is not a bug, and the chip is the only thing on screen explaining the match. One
    endpoint, so the header typeahead inherits all of it.
  - **`description` is NOT searched, on purpose.** It was, alongside a
    `storefront.onlineDescription` that no longer exists (see the description consolidation below).
    It holds **rich-doc JSON** now, so a regex over it matches the markup: "text" or "type" would
    return every formatted product, and a real word would match with nothing on the card to explain
    it. Searching it needs a denormalized plain-text field — a deliberate future change.
- **One product description, stored as a rich doc.** `Product.description` is the single
  shopper-facing description; `storefront.onlineDescription` and the `onlineDescription || description`
  fallback are **gone**. It holds TipTap JSON for anything saved since the consolidation and **bare
  prose** for anything older (and for every product the CSV importer creates), so:
  - Render it with `components/storefront/product-description-view.tsx`, never a bare `<p>`. It is
    the twin of `content-body-view.tsx` with one deliberate difference — the legacy branch renders
    **plain text, not markdown**, because a POS textarea's `#` and `-` are literal characters.
  - **Placement is adaptive, and it is a conversion decision.** `isLongDescription()` decides: a
    short all-paragraph body stays inline above the buy panel; a long or **structured** one renders
    ONLY in its `#description` section below the purchase block — nothing stands in for it above.
    Structure is the real trigger — a heading plus a size-chart table pushes Add to Cart off a phone
    screen at any length. Don't "simplify" this to always-inline or always-below; both directions
    were regressions. A teaser + jump link above the panel was tried and removed: with the body
    already on the page it just added something else to read before the button.
  - Anywhere plain text is needed (meta description, JSON-LD, CSV export, admin summary cards) call
    **`richDocToPlainText()`** from `lib/storefront-rich-doc.ts`. It passes legacy values through
    untouched, so callers never need an "is this JSON?" branch — `.slice()` on the raw value is the
    bug it replaces. The backend has a mirror in `src/utils/rich-doc.ts`; keep the two in step.
  - The admin product-detail cards render it **flattened**. `RichDocView` *can* run in the admin —
    `ui/components/form/field-view-mode.tsx` bridges `--text`/`--muted`/`--faint` onto the admin
    tokens — but those cards are one-line-fact summaries a full body would dominate.
  - `ContentBodyView` takes the same `legacyFormat` as the editor. **Keep the two in step per
    field**: reading a body back as markdown that was written as plain text eats the merchant's
    `#` and `-`.
- **The page editor (`components/shared/rich-text-editor/`).** Shared by CMS page bodies and product
  descriptions, so a change here reaches every merchant's product form, not just the Content screen.
  - **Undo/redo exists only because `UndoRedo` is registered.** ProseMirror ships no history;
    without it Cmd+Z is inert, not degraded. Same for `Gapcursor` (the caret after a trailing table
    or divider) and `Dropcursor`. Their CSS is **vendored** in `rich-text-editor.css` —
    `prosemirror-gapcursor` is transitive through `@tiptap/pm` and not hoisted under pnpm, so an
    import path into it breaks on a lockfile reshuffle.
  - **These four plus `CharacterCount` are the ONLY exception** to `extensions.ts`'s "an extension
    the renderer does not know makes content vanish" rule: they add no nodes and no marks.
    `extensions.test.ts` asserts that; `rich-doc-parity.test.tsx` asserts every node that IS added
    has a renderer case (mutation-verified — it caught `Image` before its case existed).
  - **The footer's two numbers are different on purpose.** The cap is on the SERIALIZED JSON (a
    payload budget), not visible characters, and rich-doc JSON runs 3-5x its prose. Words/characters
    are what the merchant counts; the size meter tracks what is enforced, and appears past 75%.
    `CharacterCount` has no `limit` — a hard stop would fire at a number that is not the one being
    enforced.
  - **Images are opt-in per field and the field names a SCOPE** — `FormFieldConfig.imageUpload`
    is `"content"`, `"page"` or `"product"`, not a boolean, because the surfaces post to different
    endpoints behind different permissions: `POST /ecommerce/content/images`
    (`storefront.manage`), `POST /ecommerce/pages/images` (`storefront.design`, the Storefront
    Builder) and `POST /products/description-image` (`products.create` OR `products.edit`). A field that can reach neither omits the scope and gets no button rather
    than one that always 403s. `data:` URIs are refused twice — `allowBase64: false` in the
    editor, and `SAFE_RICH_IMAGE_SRC` in the renderer, which is the real boundary because the
    stored tree is writable through the raw API.
  - **Uploads are fire-and-forget.** Both endpoints write to R2 the moment a file is picked,
    before the record is saved (on the product create form, before the product exists), because
    the editor needs a URL to render. An abandoned edit orphans the object; the `org/<id>/` prefix
    is what lets the tenant purge still reach it, which is why the key comes from `orgImageFolder`
    and never from string concatenation. Product description images get their OWN namespace,
    `org/<id>/products/description`, so they are not mistaken for gallery images enumerated
    against `product.images[]`.
  - **Deleting an embedded image is the half that breaks.** It lives as a `src` URL inside a JSON
    string, so `collectImageRefs` (which looks for a `publicId` KEY) cannot see it. Both surfaces
    share `utils/rich-doc-images.ts` — collect-before/delete-after on save, with an org-prefix
    check that is a SECURITY boundary, not tidiness: the body is merchant input and could name
    another tenant's key. `TenantModelEntry.richDocFields` is what keeps `audit:storage` from
    reporting every one of them as an orphan.
- **Draft page preview reuses the SHOP's preview token**, it is not a second mechanism.
  `StoreContext.preview` is computed in `resolveStoreContext` from that verified token and relaxes
  the `published` filter — **and only that filter** — on `getPublished` and `listFooter` (drafts show
  in the footer, or the merchant cannot navigate to one in the iframe). It is never read from
  anything the caller sends, and a bad token degrades to the public view rather than erroring. The
  field is **required** on `StoreContext` so a new construction site has to decide; that is what
  surfaced `adminStoreContext` needing `preview: false`.
- **Image variant per use site** — `lib/storefront-image.ts`, one of **four** helpers, never a
  hand-rolled `img?.a || img?.b` chain: `cardImageUrl` (grid/card/tile, >~100px), `thumbImageUrl`
  (row thumb, avatar, chip, ≤100px), `fullImageUrl` (PDP gallery hero, og:image, JSON-LD), and
  **`logoImageUrl` (any logo, at any size)**. The backend stores
  `url` ≤1600w, `mediumUrl` 800w and `thumbnailUrl` as a **200×200 `fit:"cover"` square crop**
  (`inventory-backend/src/utils/imageUpload.ts`) — only the thumbnail changes aspect ratio, so
  picking it for a card both upscales and crops the product out of frame. That was the bug on the
  shop grid until 2026-07-31. URL-imported images store one URL in all three fields, so every helper
  degrades to it.
  - **`SfImage`** (`components/storefront/sf-image.tsx`, since 2026-09-14) is the one `<img>` for
    uploaded photos: a `srcset` over medium 800w + original 1600w (`responsiveImageSources` — never the
    square thumbnail), a required `sizes`, lazy by default, and **`priority`** for the page's likely LCP
    image (eager, `fetchpriority="high"`, and a preload hint split by the phone media query). Not
    `next/image`: its optimizer would re-encode R2 images on the one VPS. `Media` and `HeroMedia` render
    through it. `priority` is set on the home hero banner (`HeroCard`, `HeroOpen`), the carousel's first
    slide and the product page's main photo — nowhere else. `Media` stays **eager** by default, because a
    collection page's LCP is often a product card; pass `loading="lazy"` only where a slot is known to sit
    below the fold.
  - ⚠ **A URL string has no variants.** `Media`'s `src` takes the stored image *or* a URL, and only the
    image object gives `SfImage` a `srcset` — a string from `fullImageUrl()` renders that one file at every
    width. The product page's main photo passed the string until 2026-09-15, so every phone downloaded the
    1600px original of the page's LCP image (505 KB, against 100 KB for the medium, on a locally generated
    rafi5 upload). It now passes the image with `sizes={\`${SF_MOBILE_MEDIA} 100vw, 1600px\`}`: phones take
    the medium, wider screens keep the original because the hover zoom magnifies 2.4×. A wide slot that
    should shrink on phones passes the image and a `sizes`; a card still gets `cardImageUrl` (a string),
    because there is no variant between the 200px crop and the 800px medium to choose.
  - ⚠ **A logo is a MARK, not a photo, and `logoImageUrl` puts the thumbnail LAST.** A 200×200 centre
    crop of a wide wordmark is not a smaller version of it — it is an unreadable slice of the middle.
    `cardImageUrl` is not a substitute (its *second* choice is that crop), and neither is
    `thumbImageUrl`, however small the logo is drawn: the crop is the problem, not the pixel count.
    This shipped as a live bug until 2026-09-06 — a merchant whose logo read "Uriibaba" saw "riiba"
    in the Customize logo tile, its two-theme preview and the admin sidebar, while the shop itself
    rendered it in full, because the storefront asked for `url` first and the previews asked for
    `thumbnailUrl` first. The helper exists so that ordering is decided once. (The backend learned the
    same rule on the write side: the 96×96 favicon rendition is generated `fit:"contain"`.)
  - ⚠ **That sweep missed a fourth site, found 2026-09-08: Customize → Phone bar → Phone logo.**
    `mobileLogo` is a *second* logo field, so a fix that went call-site by call-site walked straight
    past it. **When you add a logo field, route it through `logoImageUrl` on its first render** —
    and when you fix one of these, grep the FIELD (`mobileLogo`, `logo`, `favicon`) across the repo,
    not just the screen that was reported. The live phone bar (`use-mobile-chrome.ts`) was fixed in
    the same pass: its hand-rolled `url || thumbnailUrl` happened to be *correct*, which is exactly
    why it went unnoticed as a bypass of the helper.
    Debugging note: `MediaField`'s `object-contain` was blamed first and is innocent — measure the
    served variant (`_thumb.webp` is 200×200 whatever the source was) before touching the CSS.
  - **It is used by the ADMIN too** — `app-title.tsx`, `organization-tab.tsx`, `parts/look-part.tsx`,
    `parts/mobile-part.tsx` —
    which is why the module's doc says so. The variants are the backend's, not a storefront concept,
    and a second module answering the same question is how a call site ends up on the wrong one.
  - **`<Media fit>`** (`components/storefront/sf-bits.tsx`) is the shared "don't crop it" box:
    `fit="canvas"` shows the full photo at `object-fit: contain` over a blurred, scaled copy of the
    same `src` filling the frame behind it; `fit="cover"` (default) crops to fill, as before. Which
    one a card-sized-or-larger slot gets is now a **merchant setting**, not hardcoded
    (Customize → Product cards → "Image fit", `templates.imageFit: "fit" | "crop"`, default `"fit"` —
    added 2026-08-12 after 2026-08-11 shipped `fit="canvas"` hardcoded and a merchant reasonably
    preferred the tighter cropped look on their own store). **Never hardcode `fit="canvas"` or
    `fit="cover"` on a card-sized surface again** — read **`useStoreImageFit()`**
    (`services/storefront/use-image-fit.ts`, zero-arg, draft-first, mirrors `useStoreLogoStyle()`) and
    pass its result straight through. Current call sites: `product-card.tsx`'s grid image,
    `home-minimal.tsx`'s product tiles, `HeroCard`'s banner in `home/sections/hero-sections.tsx`
    (`--herocard-ratio`: 4:3 on desktop, 16:9 on a phone),
    `wishlist-section.tsx`'s saved-item grid, and `product-gallery.tsx`'s PDP hero — all read the
    hook independently, so nothing threads it as a prop through `TplProps` or anywhere else.
    ⚠ **No hero is on this list any more, as of 2026-08-17.** The control is rendered inside the
    *Product cards* part, so a hero that inherited it meant re-cropping the shop's biggest picture as
    a side effect of a thumbnail setting. Carousel slides read their own `imageFit`; the static
    banner reads `heroBanner.imageFit`/`.focal` plus optional `.mobileImage`/`.mobileFocal` through
    **`bannerPhoto(hb)`** in `home-shared.tsx`, which returns responsive media props to spread onto
    `<Media>`. Missing mobile artwork/focus falls back to desktop. Every section that CROPS the
    banner spreads it — `HeroCard`, `HeroOpen`, and `EditorialSplit` in `band-sections.tsx` — so the
    answer follows the photo into whichever frame is showing it (4:3, 4:5, `--herocard-ratio`).
    `HeroSplit` needs nothing: `ratio="auto"` means no frame to miss. Unset = `"fit"` everywhere.
    Leave small row thumbs (cart drawer + cart page, search results, tracking, quick-buy sheet,
    header search, the PDP thumbnail rail, `thumbImageUrl` call sites generally) hardcoded on
    `fit="cover"` — a uniform crop reads as intentional at that size and a blurred halo around a
    48–76px thumbnail is visual noise, not a fix; the merchant setting doesn't reach these on purpose.
    **The PDP hero** (`product-gallery.tsx`) also reads `useStoreImageFit()` (added 2026-08-12,
    after initially being held out over its hover-to-magnify transform — the transform lands on
    `<Media>`'s wrapper in canvas mode rather than a bare `<img>`, which is safe because
    `zoomOrigin()` reads its percentage off `.sf-pdp-zoom`'s own bounding rect, not the image
    element, and the wrapper fills that box identically). One deliberate holdout remains:
    `home-hero-split.tsx`'s banner already opts out via `ratio="auto"` (no forced ratio at all, so
    nothing to crop) — don't layer the setting on top of that, the two solve the same problem
    differently on purpose. The hero
    carousel and full-bleed hero share `components/storefront/hero-media.tsx`: it renders the same
    responsive `<picture>` as either a two-layer canvas (`.sf-hero-media-bg`/`-fg`) or a focused
    `.sf-hero-media-cover`, branched on the photo's own `imageFit`. At 640px its optional mobile
    source and focus win; otherwise the desktop source/focus remain the explicit fallback.
    **`templates.imageRatio` is its sibling, and the two are orthogonal** (2026-08-12): ratio is
    the FRAME (`square` default / `portrait` 3:4 / `landscape` 4:3 / `tall` 2:3), fit is what
    happens to a photo that doesn't match it. `mediaRatioFor()` beside `mediaFitFor()` is the only
    id→CSS translation, and `useStoreImageRatio()` (beside `useStoreImageFit()`) is how surfaces
    read it. **Only the product GRIDS and the `side` PDP gallery honour it** — the fixed-px
    thumbnails (cart, search list rows, tracking, quick-buy) and the home banner/hero keep their own
    shapes, because those are sized in px inside horizontal rows and a 3:4 frame would stretch the
    row rather than restyle the shop. `gallery-top` also keeps its 16/11: it runs full-width, where
    a portrait photo would stand taller than the viewport.
    ⚠ When measuring a frame in browser QA, read the element with `aspect-ratio` — **not the
    `<img>`**. In canvas (`fit`) mode `<Media>` paints a blurred backdrop img at `inset: -8%;
    height: 116%`, so measuring the image reports every ratio 16% too tall.
    **Contract wiring, if the field ever needs a third value:** `templates.imageFit` is a plain
    trimmed string at the backend model/validator/DTO layer (no Mongoose/Zod enum — same convention
    as `productCard`/`cardActions`/`headerMenu`); the real validation is `lib/storefront-templates.ts`'s
    `resolveTemplates`/`pick()`, and `mediaFitFor()` right beside it is the **only** place the
    `"fit"→"canvas"` / `"crop"→"cover"` translation happens. Customize plumbing follows the
    `productCard` pattern exactly: `TEMPLATE_OPTIONS.imageFit` (admin picker options — `"fit"` must
    stay first, `seedTemplates` falls back to `options[0].value`), `template-sketch.tsx`'s
    `"imageFit:fit"`/`"imageFit:crop"` wireframes, one more line each in `toPreviewPayload` and
    `preview-bridge.tsx`'s `apply({...})` (both hand-enumerate `templates`, unlike the save payload
    which spreads it wholesale — miss these two and live preview silently never sees the draft even
    though Save works), and `use-sf-preview-store.ts`'s `imageFit` field (state + initial + patch type
    + reducer, four touch points). Backend: adding the field to
    `src/dtos/organization.dto.ts`'s `storefrontSettingsDto.templates` in the **same commit** as the
    model/validator/types is mandatory — omit it and it's silently stripped from the admin response
    under `API_CONTRACT_MODE=enforce`, the exact `headerMenu` bug documented at that file's `templates`
    block.
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
  **Mechanics** (`utils/print.ts`): `printHtml` builds one standalone document and delivers it
  two ways. **Desktop** renders it into a **hidden same-origin iframe** (`#app-print-frame`) and
  calls `print()` when images settle — no popup, no blocker. **Mobile** (Android Chrome, iOS —
  `needsTopLevelPrint`) opens a **top-level tab** instead and prints that, closing it on
  `afterprint`: those browsers route a subframe's `print()` to the top document, so the hidden
  frame printed the app UI instead of the invoice. That tab must be navigated to a **blob: URL** —
  `document.write` into `about:blank` makes Chrome Android fail with "There was a problem printing
  the page" even when the target is Save-as-PDF — and readiness is **polled** for the blob URL,
  because a `load` listener would die with the discarded initial about:blank window and its
  `readyState: "complete"` would otherwise print a blank sheet. That path makes the **synchronous-from-click**
  rule load-bearing — a deferred `printHtml` gets its tab blocked, and callers already toast
  `common.print.popupBlocked` on the `false` return. Only count `!img.complete` images as pending
  (cached images never fire `onload`; that bug used to silently prevent the dialog from opening)
  and keep the grace timeout.
  All print CSS uses **`@page { margin: 0 }`** so the browser cannot paint its default
  title/URL/date header-footer; whitespace lives in body padding (left/right — repeats every
  page) and `.doc` padding (top/bottom — repeats per document in bulk `.inv-page` breaks).
  Don't reintroduce `@page` margins, and don't collapse the two paths back into one.
- **Footer** (rebuilt 2026-08-11 — **five** layouts): `store-footer.tsx` is the slim entry (variant
  resolve + prop build); the bodies live in `components/storefront/footer/` — `footer-pieces.tsx`
  (shell/brand/columns/bottom-bar + the `FooterColumn` model helpers
  `groupColumns`/`contentPagesColumn`/`footerColumns`), `footer-variants.tsx` (the five),
  `footer-contact-card.tsx` and `footer-newsletter.tsx`.

  | `templates.footer` | Layout | Left side | Notes |
  |---|---|---|---|
  | `columns` | Anchored columns (default) | brand + blurb + phone + socials | the repair; every existing store gets it without re-choosing |
  | `simple` | Centered | one centred stack | flat link row, drops group titles; for 0–1 groups |
  | `rich` | Trust bar | same as `columns`, under a tinted badge band | `trustBadges`, per-slot localized fallback |
  | `contact` | Contact-first | brand + a phone/WhatsApp card | **degrades to `columns`** when no number and no channel |
  | `newsletter` | Stay in touch | brand + the sign-up form | posts `POST /:slug/subscribe` |

  **The grid is the point.** Link columns are `auto` tracks in a flex row pinned `flex-end`, sized to
  their own content. They used to be `repeat(auto-fit, minmax(132px, 1fr))` inside a `3fr` track,
  which stretched each column to fill the leftover space while its links stayed ~70px of left-aligned
  text — fine at the three-or-four groups it was designed for, and at **zero** groups (the default)
  it left two ~336px stacks with half the footer empty. Do not reintroduce an `fr` ceiling here.
  Below 680px every layout is one stacked column with tap-to-open accordions (per-column
  `useState(true)` — SSR-safe, desktop heading inert + always-open).

  **Payments moved to the bottom bar.** They are a reassurance, not navigation, and being a column
  is what forced the extra track that left the gap. `BottomBar` is also where `theme.footerNote`
  lands — it replaced a hardcoded `"Bangladesh · <currency>"`, which was a claim about the
  merchant's business the platform had no standing to make; unset ⇒ currency alone.

  **Nothing in a footer body is fixed copy.** Every string arrives on `FooterProps` and is either the
  merchant's (`theme.footerText` / `footerNote` / `footerContactHeading` / `footerNewsletter`,
  `nav.footer`, `trustBadges`, `contact.phone`, `contactButton`, `social`, `allowedPaymentMethods`)
  or a localized default. Contact-first reads the **launcher's** channel config through
  `useContactLink` rather than a footer-only copy of the number — one home per number.

  The auto **content-pages column** ("Information", from CMS pages flagged `showInFooter`) is
  controlled by `nav.footerContentPages { show?, title? }` — absent/`show!==false` shows it (legacy
  default), `title` overrides the heading; Centered honours the toggle too. Edited in Customize →
  **Footer** (`customize/footer-links-field.tsx` + `parts/footer-part.tsx`, whose per-layout blocks
  only render for the layout that shows them). Groups, the content-pages toggle/heading, the variant
  **and all four copy fields** are live-previewed — the copy fields stream **raw**, so `""` reaches
  the preview store as "cleared → localized default" rather than falling back to the saved text. Social links
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
  print), content, customize (one rail of **store parts** in shopper order — Brand, Announcement
  bar, Header, Hero, Home page, Product cards, Collections, Product page, Footer, Checkout — over
  one Save; `/ecommerce/navigation` is a redirect to `customize?part=header` and the sidebar entry
  is gone), catalog (products + collections),
  settings (General incl. social links + fulfillment location, Publish, payments/shipping/checkout
  tabs). Custom domains under app Settings → Custom Domains. List pages come in two shapes:
  CRUD-style (coupons/campaigns/content) are `DataTable` + `filterConfig` pages whose `getAll`
  adapters filter/paginate CLIENT-side over the full backend list; workflow-style
  (orders/customers/catalog) hand-roll their tables but share
  `components/ecommerce/list-search-input.tsx` (debounced 300ms, trimmed commit) and
  `components/ecommerce/list-pagination.tsx` — reuse these, never re-inline a search box or
  pagination row on an ecommerce list page.
  `ListPagination` renders the **same footer as every `DataTable`**: the shared
  `<PaginationControls>` (`ui/components/pagination-controls.tsx`), the same shadcn rows-per-page
  `Select`, the same responsive ordering, and the same `common.table.*` strings. It was a bare
  Previous/Next pair until 2026-08-09, which made reaching page 7 of the catalog five clicks while
  every other list in the app offered a number to click — hand-rolling the rows is a markup
  decision and must not be visible to the shopkeeper. **Pass `total`** so the range readout renders;
  without it the footer silently drops to pager-only.

## Courier remittance — the money screens (2026-09-12)

A BD courier collects COD at the door, holds it 2–7 days, and remits it **net of their charges** in
one transfer covering many parcels. Two admin surfaces exist for that, and the reasoning behind both
is in [`docs/plan/cod-remittance-frontend.md`](../../../docs/plan/cod-remittance-frontend.md) (the
backend half, worth reading first, is `inventory-backend/docs/plan/cod-remittance.md` §12).

**`/ecommerce/payouts`** — `app/(protected)/ecommerce/payouts/page.tsx` +
`components/ecommerce/payouts/`: the list (`payout-list.tsx`, `payout-row.tsx`), the statement form
(`payout-record-dialog.tsx`), the parcel breakdown (`payout-detail-sheet.tsx`), the posting step
(`payout-post-dialog.tsx`), the provider pull (`payout-sync-button.tsx`), and the three summary
panels (`cod-in-transit.tsx`, `charge-variance.tsx`, `payout-history.tsx`). API module:
`services/api/modules/courier-payouts/`.

**On the order page** — `components/ecommerce/orders/order-courier-money.tsx`: quoted vs the
courier's real bill with its provenance, and where this parcel's COD is.

Six things not to re-derive:

1. **The URL decides the feature gate.** `featuresForPath` (`lib/nav-utils.ts`) matches by URL
   **prefix** and accumulates, so `/accounts/payouts` would demand the `accounts` feature — and these
   endpoints are gated on `storefront` precisely so a merchant with the ledger off can still see what
   a courier holds. `/ecommerce/payouts` inherits the right gate for free. Pinned in
   `lib/__tests__/nav-utils.test.ts`.
2. **A nav row is still needed for the permission.** `/ecommerce` alone grants `storefront.view`; the
   endpoints want `storefront.orders.view` / `.manage`. The row in `constants/navItem.ts` is what
   closes that gap.
3. **Posting is the whole feature.** The nightly sweep records payouts `pending` and posts nothing —
   no poller can know which account the money hit. Without `payout-post-dialog`, clearing balances
   only grow and the delivery expense dispatch deferred is never booked at all.
4. **Two events, not one** (`services/api/invalidation.ts`): `payout.recorded` moves no money;
   `payout.posted` carries the whole `MONEY` group. A test pins the difference.
5. **The client computes no money.** `reconciled`, `residual` and `unrecordedGross` are the server's
   answers, derived from clearing balances this app never sees. The record form's net arithmetic is a
   *hint* beside the merchant's typed figure — the server refuses `PAYOUT_UNRECONCILED` and is right to.
6. **Three shapes that look wrong and are not:** a payout line with no matching order (shipped from
   the courier's own panel), a return leg collecting nothing while still charged a delivery fee, and
   `supported: false` from a charge refresh (Steadfast publishes no charge anywhere — an invented
   number would be worse than an unknown one). Absent is never rendered as zero.

The clearing accounts themselves — the fifth `AccountType`, and the rule that `withCourier` is never
summed into cash — are the [`accounting-ledger`](../accounting-ledger/SKILL.md) skill's §2b.

---

## Work log (what was built, newest first — as of 2026-08-26)

- **Sold-out behavior became a STORE setting with a per-product override (FE + BE)** (2026-08-26):
  `outOfStockBehavior` existed only per product, so "backorder everything" meant opening every
  product in the catalogue. Now: `StorefrontSettings.defaultOutOfStockBehavior` (Ecommerce →
  Settings → General, stored default `"show"`) with `Product.storefront.outOfStockBehavior` as the
  override — and the product field's schema `default` was **removed**, because a stored default puts
  an explicit value on every product and makes the store setting unreachable for the whole
  catalogue. Unset = inherit. Backend resolves the pair through
  `resolveOutOfStockBehavior(product, settings)` in `utils/storefront-availability.ts`.
  **What matters on this side:** the product payload carries the **resolved** value, so every
  shopper-facing gate (`soldOut = outOfStock && !canBackorder` in `view.tsx`, `product-card.tsx`,
  `quick-buy-sheet.tsx`, `use-card-quick-buy.ts`, `use-product-detail.ts`, `wishlist-section.tsx`)
  keeps reading one field and needs no knowledge of the store setting.
  **The shopper is told nothing about it** (2026-08-26): the stock badge has TWO states, not three —
  a backorder product reads exactly like an ordinary in-stock one. The old "Available on backorder"
  pill asked a shopper to understand a fulfilment arrangement that is the merchant's to manage; they
  order as usual, the merchant restocks and then confirms. `soldOut` already excludes backorder, so
  both badges (`view.tsx`, `quick-buy-sheet.tsx`) just lost the middle branch and the `backorder`
  i18n key is gone from both locales. Do not reintroduce it. The one place the distinction survives
  is `lib/storefront-jsonld.ts`, which still emits `schema.org/BackOrder` — that is a claim to a
  crawler, not copy for a shopper, and `InStock` there would be a lie about on-hand stock. Merchant side: the online
  editor (`product-online-editor.tsx`) gained a **"Use store default (…)"** option that labels itself
  from `useGetStorefrontSettings` and clears the override via the existing `clearFields` list — it
  seeds from `sf.outOfStockBehavior ?? INHERIT`, and falling back to `"show"` there would stamp an
  override onto every product on every save. The catalog bulk bar
  (`components/products/online-catalog-panel.tsx`) takes the same choice, where `"inherit"` is a
  **request-only sentinel** mapping to `$unset` — never a stored fourth value.
- **The homepage's product rows became merchant-owned (FE + BE)** (2026-08-15): the homepage
  hard-coded exactly two rows — Featured, then New arrivals — so a shop whose selling story is
  "here is the skin care, here are the devices" had nowhere to tell it. `theme.homeRows` is now a
  list of up to 6 rows, each drawing from `featured` / `newest` / a collection, with its own
  heading, product count and card size (Customize → Home page → Product rows, a rail takeover like
  the slides and collections panels). The two built-ins are simply the rows a store is **seeded**
  with (`DEFAULT_HOME_ROWS`, mirrored on both sides), so every existing homepage renders
  identically until its owner touches it.
  No new endpoint: `/storefront/:slug/products` already filtered by `categoryId` / `subcategoryId` /
  `featured` / `sort` / `inStock`. What it did need was for the store and the category tree to be
  fetched **before** the rows, since neither the row list nor the level a category row filters on is
  known until then. Deleted on the way past: `theme.homepageSections`, declared/seeded/validated on
  both sides since E-something and rendered by nothing.
  See the homepage-product-rows bullet above for the five rules; the two that will bite are
  **absent ≠ empty** and **a sub-collection filters `subcategoryId`, not `categoryId`**.
- **Image fit became a merchant setting (FE + BE)** (2026-08-12): the prior day's `fit="canvas"`
  blurred-fill fix (see the `<Media fit>` bullet above) shipped hardcoded — cropped-vs-full-photo
  turned out to be a taste call, not a universally right answer, so it became
  `templates.imageFit: "fit" | "crop"` (Customize → Product cards → "Image fit", default `"fit"` = the
  new behavior, so no existing shop changes silently). Followed the `productCard` pattern exactly at
  every layer (see the `<Media fit>` bullet's "Contract wiring" paragraph for the file list) and added
  one new hook, `useStoreImageFit()`, mirroring `useStoreLogoStyle()` — zero-arg, self-fetching, so all
  consuming surfaces (product card, wishlist grid, Minimal tiles, Classic banner, hero carousel) read
  it independently with no prop threading anywhere. The PDP hero (`product-gallery.tsx`) was held out
  at first over its hover-to-magnify transform, then wired in the same day once re-examined: the zoom
  reads its origin off the outer `.sf-pdp-zoom` box, not the `<img>` itself, so it tracks correctly
  whether `<Media>` renders a bare image (`cover`) or the two-layer canvas wrapper (`fit`).
- **Footer rebuilt: five layouts, no fixed copy (FE + BE)** (2026-08-11): the Columns footer left a
  wide gap on its right and the whole thing read thin. **The cause was the grid, not the styling** —
  see the Footer bullet above for the `auto-fit minmax(132px, 1fr)` diagnosis and the degradation
  table; the short version is that it was written for 3–4 link groups and the default store has 0.
  `columns` / `simple` / `rich` were **repaired in place** (same ids, so every existing store improves
  without its owner choosing again) and two new layouts were added: `contact` (phone/WhatsApp lead,
  degrading back to `columns` when the merchant has published neither) and `newsletter` (a real
  sign-up form).
  Everything the footer prints is now merchant-controlled: three new `theme` fields (`footerNote`,
  `footerContactHeading`, `footerNewsletter{heading,blurb,buttonLabel}`), each with a localized
  fallback, plus the hardcoded `"Bangladesh · <currency>"` bottom-bar string finally gone.
  New backend collection `StorefrontSubscriber` + `POST /api/storefront/:slug/subscribe`
  (unauthenticated, own tighter limiter, idempotent and **silent about it** — telling an anonymous
  caller "already subscribed" makes a public form an address oracle) and
  `GET /api/ecommerce/customers/subscribers` behind `storefront.view`, surfaced as a second tab on
  Ecommerce → Storefront Accounts.
  Four things worth keeping: **(1)** the sign-up is the **one** storefront write that is NOT
  fire-and-forget — the shopper pressed a button and is owed an answer, unlike the cart mirror.
  **(2)** Contact-first reuses `useContactLink`, so the footer can never offer a channel the floating
  launcher has dropped. **(3)** The four copy fields stream **raw** to the live preview; collapsing
  `""` to `undefined` there would make clearing a field show the saved text back. **(4)** A
  subscriber row is a consent record, so nothing in the admin app creates or edits one, and
  unsubscribing sets `status` rather than deleting — a deleted row is re-created by the next
  submission with the opt-out lost.

- **Order-line thumbnails + guest contact on abandoned carts (FE + BE)** (2026-08-11):
  **(1) Neither order-detail view showed a product image.** The merchant sheet drew an initials tile
  and the shopper's tracking view drew an empty `<Media />` — because an order line snapshots
  `productName`/`price` and nothing else. The line now carries an `image` **resolved live from the
  catalogue** by the backend `storefrontOrderImagesService`, on the two DETAIL endpoints only
  (`useStorefrontOrder`, `useShopperOrder`); the two list endpoints render no lines and do not pay
  for the lookup. **Do not "fix" this by snapshotting the URL onto the line** — replacing a product
  photo deletes the old R2 object, so a frozen URL becomes a broken `<img>` the day the merchant
  uploads a better picture, and reading live means the orders that already exist get their pictures
  with no backfill. Both callers keep their placeholder branch: a deleted or image-less product
  legitimately resolves to `undefined`.
  **(2) A guest cart could never be named**, so `/ecommerce/carts` said "Guest — not reachable" on
  every row — including the converted ones, where the order sitting beside it carried the buyer's
  name and phone in full. Two captures now feed a `guest` block on the cart mirror: the checkout form
  posts each field **on blur** (`hooks/use-guest-contact-capture.ts` → `POST /:slug/cart/contact`),
  and a placed guest order backfills its `shippingAddress` name/phone onto the cart it converts. The
  Shopper column is now three-state (`CartShopperCell`) and search matches guest fields too.
  Three things to keep: the capture is **guests only** (a signed-in shopper's account is the better
  identity, and the list hides the guest block once `shopperId` is set); it is **fire-and-forget on a
  money path**, never awaited, exactly like the rest of the cart mirror; and a captured phone is
  **contact detail, not marketing consent** — automated recovery still requires an account, which is
  why `storefront-cart-recovery.service.ts` was left alone.
  `isPreview()` moved out of `cart-sync.tsx` into `services/storefront/cart-identity.ts` as
  `isSfPreview()` — every mirror write needs it, and there are two callers now.

- **Five more shop-owner reports: page cursor, logo controls, sold-out cards, homepage
  collections (FE + BE)** (2026-08-09):
  **(1) Paging was lost on Back.** The cursor was `useState`, so opening a product from page 3 and
  pressing Back restarted at page 1. It is `?page=` now — see the listing-pagination bullet for the
  three parts that move together (facet writes drop it, both server pages seed it, page 2+ is
  `noindex, follow`).
  **(2) The 2026-08-08 logo fix never worked, and merchant controls replaced it.** The canvas
  auto-detection needed CORS that the R2 bucket does not send, so it silently degraded to the old
  behaviour on every store — the failure mode the entry below had already flagged as the risk. New
  `theme.logo` (background / height / padding / radius); the auto-detect files are deleted. See the
  brand-lockup bullet.
  **(3) Sold-out cards showed a greyed-out button**, which still reads as a button: shoppers click
  it and conclude the card is broken rather than the product unavailable. Now a scrim + chip over
  the image (`CardSoldOutOverlay`) plus a flat muted status line where the CTA sits, at `cta()`'s
  40px footprint so the grid stays aligned. The sold-out branch moved **above** the `OVER_IMAGE`
  bail, so `reveal` — which hides its buttons entirely — also states it in the DOM.
  **(4) The homepage collections row had no controls.** New `theme.homeCollections`
  (layout / columns / align) — see its bullet above.
  **(5) The footer blurb needed no code at all**: `theme.footerText` (Customize → Footer) already
  overrides `t.storeInfo`, and the reporter had only ever seen the fallback. Worth checking for an
  existing owner field before adding one.
  **(6) "New arrivals" was showing the Featured row again** — the query omitted `sort`, and the
  catalogue's default is featured-first. One line; see the default-sort bullet above, which is the
  general trap.
  **(7) Sold-out products were filling homepage slots.** New BE `?hideSoldOut=1`, on both homepage
  rows. Deliberately a new flag rather than the existing `?inStock=1` — see the bullet above for the
  backorder row that separates them.
  **(8) The admin catalog page paged with bare Previous/Next.** So did orders, customers and carts —
  they share `ListPagination`, so one fix covered all four. The paging window came out of
  `DataTablePagination` into `utils/page-window.ts` (tested, behaviour-preserving) and the button
  row into `ui/components/pagination-controls.tsx`; both pagers now render the same component. One
  latent inconsistency fell out: the DataTable's **Last page** chevron used `table.getPageCount()`
  while its last *number* button used `pagination.totalPages`, so on a server-paginated table the
  two could jump to different pages. Both go through `totalPages` now — the count the visible
  numbers are drawn from.
  Backend: both theme objects through model / validator / types / admin DTO, then `pnpm docs:all`
  and `pnpm gen:api-types`. Bounds (height 20–80, padding 0–24, radius 0–40, columns 2–6) are
  enforced in the validator **and** re-clamped in `resolveLogoStyle` / `resolveHomeCollections`,
  because the live preview streams half-typed drafts that never reach the backend.

- **Structural split of the two storefront god-files (BE + FE)** (2026-08-09). No behaviour, no API
  output and no route changed. Full module table:
  `../inventory-backend/docs/features/ecommerce-implementation.md` → "Storefront service + product
  page split"; the backend `storefront-orders` skill §5 carries the where-did-it-go table.
  **Backend:** `storefront.service.ts` 2104 lines → eleven modules, each ≤ 402. It only holds
  `getStoreInfo` now; it still re-exports `StoreContext`/`ShopperCtx` so old imports resolve, but
  new code should take them from `storefront-context.ts` — a leaf module with no service imports,
  which is what let `storefront-cart.service.ts` stop hand-redeclaring the type to dodge a cycle.
  **Frontend:** the product page `view.tsx` 427 → 213 lines, over `use-product-detail.ts` (queries,
  selection, derived price/stock, the three actions), `product-buy-panel.tsx` and
  `product-sticky-bar.tsx`.
  ⚠️ **The sticky bar owns its own ref.** It first took `buybarRef` off the shared hook return and
  `react-hooks/refs` rejected it — reading a ref off a shared object during render. It now creates
  the ref and calls `useBuybarHeight` itself, *before* its early return, so the hook order stays
  unconditional and `--sf-buybar-h` resets to 0 on the layouts that render no bar. Do not move that
  back up into the hook.

- **Contact launcher — the floating WhatsApp button (BE + FE)** (2026-08-08). Merchant-controlled,
  off by default, configured at **Ecommerce → Customize → WhatsApp button**. Full spec:
  `../inventory-backend/docs/features/ecommerce.md` → "Contact launcher"; file-by-file log in
  `ecommerce-implementation.md`; 42-step QA in `ecommerce-qa.md`. Four things worth carrying:
  **(1) Presence is enabled.** `resolvePublicContactButton` OMITS the whole block from the public
  payload when the switch is off or nothing resolves — never `enabled: false` — so the storefront
  has no flag to check and an unpublished number cannot reach a visitor. It is also the only place
  the blank-value fallback to `social.whatsapp` happens, so the browser never picks between two
  copies of a phone number.
  **(2) `--sf-buybar-h` is new and load-bearing.** The launcher anchors to
  `calc(var(--sf-bottom-nav-h) + var(--sf-buybar-h) + 14px)` at `z-index: 45`. The product page's
  sticky buy bar was ALREADY at `bottom: var(--sf-bottom-nav-h)`, so a button clearing only the tab
  bar lands squarely on Add-to-cart on every mobile product page — while looking perfect on the home
  page, on desktop, and in every screenshot. `useBuybarHeight` measures it and resets on unmount,
  because the shell survives client-side navigation and a stale offset would follow the shopper
  around the whole site.
  **(3) The schema is plural, the registry has one row.** `contactButton.channels[]` with
  `kind: "whatsapp"` as the only member, because `StorefrontOrder.channel` already enumerates
  messenger/instagram/phone — a WhatsApp-only shape would be the one part of the storefront
  disagreeing with its own data model. Adding a platform = a new enum member + a row in
  `lib/storefront-contact-channels.ts`, whose `prefill` field is the one that actually varies
  (`text` for wa.me/t.me/mailto, `ref` for m.me — webhook-only, invisible to the shopper — `none`
  for ig.me). A launcher assuming every platform behaves like WhatsApp builds URLs Messenger and
  Instagram silently drop.
  **(4) One channel ≠ two.** One enabled channel → the button IS the channel (its colour, its glyph,
  a direct link, one tap). Two or more → a neutral launcher in the merchant's brand colour that fans
  them out. Green means WhatsApp, so only WhatsApp may be green — do not "simplify" this into always
  showing the menu, which taxes the 90% of merchants who will only ever use one number.

- **Three storefront polish fixes: logo contrast, nav dropdown, pagination (FE)** (2026-08-08),
  all reported from a real shop:
  **(1) A transparent logo was invisible on one theme.** Fixed by canvas auto-detection, which
  **did not work in practice and was removed the next day** — see the 2026-08-09 entry above.
  **(2) The category dropdown closed while the pointer was moving into it.** The panel sat
  `marginTop: 6` below its trigger — but an absolutely-positioned panel is outside its parent's
  box, so that 6px strip belonged to **no element**: crossing it fired `mouseleave` on the trigger
  and closed the menu. Hence the intermittency (fast/diagonal moves cleared the gap, slow ones did
  not). The offset is now `paddingTop` on a wrapping anchor, which puts the strip inside the
  dropdown's own hit area, plus a 140ms close grace period for the frames a fast pointer lands in
  neither box. **Never re-introduce a margin gap under a hover-opened panel.**
  **(3) The pager was Prev / `n of N` / Next**, so a 20-page collection could only be walked one
  click at a time. Now numbered with collapsed gaps — see the listing-pagination bullet.
  i18n `pagination` + `pageX` ×2 locales; new `pager.test.ts`.

- **Product tags became visible on the shop (FE + BE)** (2026-08-07): tags were filterable and
  nowhere displayed — `GET …/tags` served the facet, `?tags=` filtered, but no product payload
  carried its own tags, so a merchant labelling a product "Eid sale" saw that label nowhere on their
  own shop. BE `toCatalogProduct` now emits `tags` via a new batched `tagChips(store, rows)` (one
  query per page), wired into **all three** call sites — the fast list path, `listProductsComputed`
  and `getProductBySlug`; `CATALOG_SELECT` already projected `tagIds` for campaign scoping, so only
  the join was missing. FE: new `ProductTagChips` (see the subsystem bullet above) on the PDP badge
  row and the card image. Contract test seeds an **inactive** tag beside two active ones and asserts
  the computed list path too — an untagged fixture cannot fail a payload that drops tags, and a
  change that edits only `toCatalogProduct` passes the fast path while missing the sorted one.
  **`?q=` was `name` regex only** — so the very words a merchant merchandises on ("eid", "organic")
  returned nothing, and neither did descriptions, barcodes, or the online title the shop actually
  displays. It now unions all of them plus active tag ids. **`/search` also gained the full facet
  panel** (`useCatalogFacets`, extracted from the collection view rather than copied), so a tag is
  now reachable from search results, not just from `/products`. The header typeahead shares the
  endpoint and inherited the matching for free.
  Full write-up: [`ecommerce-implementation.md`](../../../../inventory-backend/docs/features/ecommerce-implementation.md).

- **Sub-categories reached the navigation (FE)** (2026-08-07): the taxonomy's P3 shipped the routing
  (`[...categoryPath]`, `collectionHref`, tree endpoint, sitemap, canonical) but left four surfaces
  built for a flat list, so on a default store a child collection had a working URL that **nothing
  linked to**. Fixed: `use-header-search.ts`'s `goCategory` (it still pushed
  `/products?categoryId=`, a URL the *same commit* had made `noindex` — the one link site the P3
  sweep missed); `store-header.tsx`'s `CategoryRow` collections branch (a bare link row, so the
  store whose owner never opened Customize showed **no** sub-categories in the header — now
  `HeaderNav` for both branches); `store-bottom-nav.tsx`'s menu sheet (the *only* category
  navigation on a phone, parents-only); and `filter-panel.tsx`'s category facet.
  `?subcategoryId=` was already accepted by the backend and sent by nothing — now wired through
  `storefront-catalog-params.ts` end to end. Full write-up, including the three things left
  deliberately flat (Minimal header, search chips, home tiles):
  [`ecommerce-implementation.md`](../../../../inventory-backend/docs/features/ecommerce-implementation.md).
  **The lesson:** none of the four failed a build, a test, or `docs:verify` — they all rendered
  fine and simply showed less than they should. A taxonomy is only shipped when every surface that
  lists categories lists the *tree*; grep `children` when adding one.

- **Nested header menu for hand-picked categories + the drill-down strip (FE)** (2026-08-07):
  `expandHeaderMenu` nested sub-categories only inside a `collections` block, so a merchant who
  picked their top links **one by one** — which is what Customize encourages — got a flat menu
  where a category and its children read as peers. A `type: "category"` item now inherits its own
  children as its dropdown, unless the merchant authored a child list explicitly (that is an
  override, not an empty slot). `catMap` also became slug→**node** and indexes every parent before
  any child, so a top-level collection can no longer be shadowed by an earlier parent's same-named
  child. New `subcategory-strip.tsx` puts the children under a collection's `<h1>`. 8 new tests.

- **Breadcrumbs, and the product payload's missing second level (FE + BE)** (2026-08-07): the PDP
  emitted `Store › Products › Product` as JSON-LD and **no visible trail anywhere** — so a shopper
  on `/phones/accessories` had no way back to `/phones`, and the structured data described a
  one-level catalogue the shop no longer had. Blocked on a real gap: the public product payload
  carried `categoryId` (the parent) but **not `subcategoryId`**, so the PDP could not know its own
  child collection. BE `toCatalogProduct` + `storefrontProductDto` now emit it (`CATALOG_SELECT`
  already selected it), with a contract test that seeds a genuine two-level branch — the flat
  fixture could not have failed a DTO that dropped the field. FE: new
  `lib/storefront-breadcrumb.ts` (11 tests) + `components/storefront/breadcrumb.tsx`, wired into
  the PDP (page JSON-LD + view) and the collection page, which passes the **same array** to both.
  `pnpm docs:all` + `gen:api-types` regenerated.

- **Customize re-cut into store parts, one Save** (2026-08-04): the three tabs were named after the
  three settings objects the backend stores (`theme` / `templates` / `nav`), so one visible thing was
  split across all of them — the footer's layout was in Templates, its © line and trust badges in
  Theme, its link groups in Navigation, behind three different save buttons. The rail is now **one
  list of store parts in the order a shopper meets them** (Brand, Announcement bar, Header, Hero, Home
  page, Product cards, Collections, Product page, Footer, Checkout) in
  `components/ecommerce/customize/`, over **one** save bar. Two defects drove it, both found by
  reading rather than by any gate:
  - **Unsaved edits were silently discarded.** The sections were a ternary, so each unmounted on tab
    switch; preview-relevant state had been lifted but the rest was local and re-seeded from the
    *saved* settings on remount. Picking "Hero Split", visiting Theme and coming back showed
    "Classic" selected while the preview still showed Hero Split — and Save wrote Classic. The
    slides panel did the same, and the button that opened it sat *inside* the section it destroyed.
    Everything editable now lives in **`use-customize-draft.ts`**, one level above anything that can
    unmount, with dirty state *derived* per part (`PART_SLICE`) rather than flagged by hand.
  - **Six save models** (theme / templates / navigation / slides / collections + instant media) with
    two dirty indicators between them. Now one PATCH carries theme+templates+nav, collections fold in
    via their own mutations (`useUpdateCollection` gained `silent` so one Save = one toast), and only
    image uploads still persist on their own. `beforeunload` guards the page — there is still no
    route-level guard anywhere in the app.
  - **`draft-payloads.ts` builds the save payload and the preview message together**, because the
    trimming rules (blank footer group dropped, completely empty slide dropped while artwork-only
    slides remain valid) were duplicated and could
    drift — a preview promising a column that never ships is the bug class it prevents.
  - Preview chrome: the decorative traffic-lights + dead URL bar became **Home / Collection / Product**
    page tabs, and opening a part points the preview at a page that shows it. The product slug comes
    from the **public** storefront endpoint — the admin catalog DTO only carries `storefront.slug`
    when an owner typed a custom one, so sourcing it there left the tab permanently disabled.
    **Checkout still has no tab**: an empty cart renders the empty-cart screen, which says nothing
    about the layout just chosen.
  - Shared primitives extracted: `ui/components/color-field.tsx` (two divergent copies) and
    `ui/components/option-card.tsx` (the `border-primary ring-2` treatment had been pasted into five
    files). Every template option now has a wireframe sketch — eight of nine pickers were bare text.
  - `?section=` deep links became `?part=`; the retired `/ecommerce/navigation` route redirects to
    `?part=header`.
  - **Never trade the preview away for rail width.** The removed 380↔560px toggle (2026-07-18) beat
    a hide-preview button for exactly this reason: hiding the preview kills the live edit-see loop
    the page exists for. The rail is now a fixed 380px, widening to 440px at `2xl` on its own.

- **Delivery cost stops lying before checkout (FE)** (2026-08-02): the cart page and drawer both
  called `computeShipping(store, subtotal)` **without a zone** — and that argument defaults to
  `"inside"`. A store with Dhaka zone rates therefore quoted ৳60 as final and charged ৳120 at
  checkout, which is the #1 abandonment cause in its worst form: not an unexpected charge, an
  *understated* one. New **`shippingRange(store, subtotal)`** returns `{min, max, estimated}` by
  computing both zones; `estimated` is true only when they differ, so a flat rule, a
  free-over-threshold rule and a free-shipping store still show one exact number. When estimated,
  both surfaces prefix the fee **and the total** with the existing `fromPrice` idiom and the cart
  page adds `deliveryEstimateNote`. **Any new pre-checkout surface that shows shipping must use
  `shippingRange`, never `computeShipping` — the latter is correct only where the zone is known
  (checkout).** 9 tests in `lib/storefront-shipping.test.ts`.

- **Social sign-in leads the auth card (FE)** (2026-08-02): Phase 4 item 1 of
  [`abandoned-cart.md`](../../../../inventory-backend/docs/plan/abandoned-cart.md).
  `<SocialLoginButtons>` moved **above** the email/password form in `shop/account/view.tsx`, and its
  divider flipped to a trailing "or use your email" (`orUseEmail` ×3). This store requires an account
  before checkout, so sign-in is the biggest drop in the funnel — and an OAuth shopper arrives
  `emailVerified: true`, so one tap clears the **second** wall too. **No auth rule changed.**
  Two things to keep: the component returns `null` **including its divider** when no provider is
  configured, so a store without OAuth renders the exact card it did before; and Facebook is still in
  Meta Development Mode, so this is Google-only in practice.

- **Abandoned-cart recovery — the `?recover=` link (FE + BE)** (2026-08-02): Phase 3 of
  [`abandoned-cart.md`](../../../../inventory-backend/docs/plan/abandoned-cart.md). A shopper who
  left items behind now gets an email with a one-click link back to their cart.
  FE: `services/storefront/use-cart-restore.ts` (called from the cart page), a new `restore()` action
  on `use-cart-store`, the merchant toggle `components/ecommerce/carts/cart-recovery-card.tsx`, and
  4 i18n keys ×3.
  Four things worth keeping: **(1)** the link is usually opened on a **different device**, which is
  the entire reason it exists — so the cart is rebuilt from the server payload, never from local
  storage, and the restore response therefore carries `slug`/`image`/`maxQty` that the mirror does
  not store. **(2)** The token is stripped from the URL *before* the request resolves — it is a
  bearer credential, and leaving it in the address bar puts it in history, in shared links and in
  the `Referer` of every outbound click. **(3)** The effect is `ref`-guarded, not just dep-guarded:
  StrictMode double-invokes effects in dev and the second call would hit an already-consumed token
  and show a spurious error. **(4)** `restore()` is one `set` rather than `clear()` + N `addItem()`s,
  so the cart-sync subscriber sees a single change instead of N.
- **Store Settings split to standard (FE)** (2026-08-02): the page held all seven tabs plus their
  primitives inline at **939 lines** with no `coding-standard: maintained` marker. It is now the tab
  shell only (**102 lines**); each tab lives in `components/ecommerce/settings/` beside
  `settings-primitives.tsx` (`Field` / `ToggleRow` / `SaveBar` / `useSave` / `Option`). Largest file
  is 204 lines. **Add a new tab as a file there — never back into the page.**
  Behaviour-preserving by construction: JSX copied verbatim and verified by diffing every substantive
  line of the pre-split file against the new set **in both directions** — nothing dropped, no markup
  added (the sole removal was a commented-out `<h3>`). Keep `key={tab}` on `<SettingsTab>`: it is
  what re-seeds each tab's local state from `settings`, so without it a tab you switch away from and
  back shows unsaved edits as though they had saved.

## Work log (older)

- **Abandoned carts, the merchant surface (FE + BE)** (2026-08-01): Phase 2 of
  [`abandoned-cart.md`](../../../../inventory-backend/docs/plan/abandoned-cart.md). Phase 1 recorded
  carts; nothing displayed them. New `/ecommerce/carts` — stat row, purchase funnel,
  most-abandoned products, and a 4-tab list (Abandoned / Active now / Ordered / All) with debounced
  search and expandable rows — plus three tiles on the ecommerce dashboard that link to it.
  New API module `storefront-carts` (read-only: no mutation invalidates it, so it declares no
  events), nav item + en/bn labels, and a help page in **both** locales — a new sidebar route with
  no help page **fails `help:verify`**, which is the gate to remember here.
  Four decisions worth keeping: **(1)** the funnel is **single-hue sequential**, not categorical —
  five ordered stages of one measure is a magnitude comparison, so every bar wears `--chart-3` and
  length alone carries the value; a ramp across the stages would double-encode, and `globals.css`
  already reserves `--chart-*` as a monochrome scale "carrying no good/bad meaning" (status colours
  would moralise a funnel step). Single series ⇒ **no legend**. **(2)** Drop-off is measured against
  the **previous** step, not the top: the merchant's question is "which wall lost them", and a
  share-of-total reading hides one brutal step behind a healthy overall number. **(3)** Rates render
  **`—`, never `0%`**, when the backend sends `null` — a zero would tell a brand-new merchant their
  funnel is flawless. **(4)** An unclaimed cart says **"Guest — not reachable"** rather than showing
  a blank name: there is genuinely no contact detail and no consent record, and a blank would imply
  the merchant could chase it. *(Superseded 2026-08-11 — a guest who reaches the checkout form now
  leaves a name/phone, so that label is reserved for a cart that never got that far. See the top of
  the work log.)*
  **Not done:** recovery sends (Phase 3) — this page is read-only, and there is deliberately no
  action on a cart.

- **Server-side cart mirror — the merchant can finally see abandoned carts (FE + BE)** (2026-08-01):
  the cart lived only in `localStorage`, so a merchant saw every order placed and **nothing** about
  the ~70% of carts that never became one — no count, no value, no funnel, and no cross-device cart
  either. Phase 1 of
  [`abandoned-cart.md`](../../../../inventory-backend/docs/plan/abandoned-cart.md): a new
  `StorefrontCart` collection mirrored from the browser, plus `PUT /:slug/cart`,
  `POST /:slug/cart/checkout-started` (both **unauthenticated** — checkout requires an account, so
  nearly all add-to-cart is anonymous and an auth-only mirror would start the funnel *after* the wall
  it exists to measure) and `POST /:slug/cart/claim` (shopper-auth).
  FE is two new files and **one line** in `store-shell.tsx`: `services/storefront/cart-identity.ts`
  and `components/storefront/cart-sync.tsx`, which does all three jobs (mirror, claim, checkout
  stamp) from one transient subscription. Nothing shopper-facing changed — every call is
  fire-and-forget and the shop works identically with the endpoint dead.
  Five things worth keeping: **(1)** the sync is **one subscription, not eight instrumented call
  sites** — `addItem`/`updateQty`/`removeItem`/`clear` are called from seven files and the card
  quick-buy site was added the same day, so a per-site call would silently stop reporting the next
  time a CTA is added. **(2)** It must not use a selector: mounted in `StoreShell`, a reactive
  subscription would re-render the entire storefront chrome on every quantity tap. **(3)** The
  handle gets its **own** `localStorage` key rather than a field on `use-cart-store` — adding a
  field changes that store's persisted shape, which eight components read. **(4)** `?preview=1` is
  excluded, or a merchant clicking "Add to cart" while theming in Customize invents carts they never
  had. **(5)** Prices are **server-resolved and campaign-repriced**, never taken from the request —
  a client-supplied price would make the merchant's "recoverable value" whatever a crafted request
  claimed (there is a test that sends one and asserts it is ignored).
  **Not done:** the merchant-facing surface. Phase 1 records the data; the dashboard tiles, the
  funnel and the abandoned-carts admin page are Phase 2, and recovery sends are Phase 3.

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
  `backorder` ×3 — **that i18n key was deleted on 2026-08-26**, see the newest work-log entry: the
  shopper is no longer told a product is on backorder). **Backorder is capture-only by design** — `resolveItems` lets the order be placed
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
  page** (`useStorePathname` vs `storeHref(base,"/search")`) — otherwise a committed term lingered in
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
  URL-driven — `?brandId=&tags=&minPrice=&maxPrice=&inStock=1&sort=` extends the `?categoryId=`
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

  <!-- The 2026-07-18 "rail width toggle" and "Theme rail redesign" entries were removed on
  2026-08-04: both described the three-tab Customize this repo no longer has, down to the file
  names. Their two durable facts were promoted rather than lost — logo inheritance to the Live
  preview section, and "never trade the preview away for rail width" to the 2026-08-04 entry. -->

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
  it too). Admin: Customize → **Hero** → "Banner headline"
  (`components/ecommerce/customize/banner-hero-fields.tsx`; placeholders = the standard EN
  copy; `cleanHeroBanner` runs on save — blank field ⇒ built-in copy, so custom text replaces
  BOTH languages as-is); preview store + bridge stream `heroBanner`.

- **Explicit header-menu source + Navigation folded into Customize** (2026-07-18): the store
  header's top links used to be an invisible either/or (custom menu wins if non-empty, else raw
  categories). Now `templates.headerMenu: "collections" | "custom"` — resolved via
  `resolveHeaderMenu` (`lib/storefront-templates.ts`, tested): **unset = legacy fallback**
  (non-empty `nav.header` → custom) so old stores' headers don't silently change; never default it
  to "collections" blindly. `nav.header` items support **`type: "collections"`** — a block that
  expands inline to the listed collections via `expandHeaderMenu` (`header-nav.tsx`, tested),
  applied ONCE where `ctx.headerMenu` is built in `store-header.tsx` (covers all variants +
  preview; expanded links are PATH-based since 2026-08-06 — a slugless category is dropped, not
  linked). Admin:
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
- **Hero slides edit-in-place panel**: `components/ecommerce/customize/hero-slides-panel.tsx` —
  a takeover of the Customize LEFT rail (never a modal/right-drawer: those would cover the live
  preview). Collapsed rows (SlideThumb + title, expand one at a time). Opened from the Hero part's
  slide rows; while open, BrowserPreview forces `heroSrc="slides"` so edits always show.
  (2026-08-04: the panel's own Save/Cancel went away with the page's move to one Save — it now
  edits the shared draft and "Done" just returns.) Shared `slide-thumb.tsx` added.
  Design sample: claude.ai/code/artifact/09f51325-0c70-4b4d-9359-569d99895bcd.
- **Hero source switch (`templates.hero`: slides|banner)**: explicit control over what the home
  hero shows — carousel (when slides exist) or the static banner hero — so slides can stay saved
  but hidden. Standard surface-template plumbing (BE model/validator/types, FE `HERO` map in
  `storefront-templates.ts`, default `slides`); `store-home.tsx` withholds `heroSlides` from
  templates when resolved source is `banner`; preview store/bridge carry `heroSrc` (rides
  `templates.hero` in the postMessage payload). Admin: the Hero part's "The hero shows" pair
  (`customize/parts/hero-part.tsx` — zero-slides warning, Minimal note; the wireframe layout tiles
  it once shared a card with now live in the Home page part).
  Banner MediaField now documents its double duty (static hero + og:image, `shop/page.tsx`).
  **`heroBanner.imageFit` + `.focal` (2026-08-17) are the banner photo's own crop controls** — same
  `<PhotoFitField>` the slides use, rendered under the banner MediaField. They live on `heroBanner`
  rather than beside the image because `StorefrontSettings.banner` is a bare image field shared with
  `og:image`, with no shape of its own. ⚠ `cleanHeroBanner` rebuilds the object **field by field**,
  so a new key must be added there or it is silently dropped from the PATCH and the preview — the
  same trap as `trimSlides`. Uploading or removing the banner clears `focal` (coordinates on a
  specific photograph) but keeps `imageFit` (a preference for the slot). `<Media>` gained a `focal`
  prop for this: `object-position` on the **cropped** branch only — `canvas` already shows the whole
  photo, so moving it would just slide it inside its own letterbox.

- **Home hero slides (carousel)**: `StorefrontSettings.heroSlides[]` (max 5; image?/focal?/imageFit?/
  badge?/title/subtitle?/buttonLabel?/link?) → public payload → `components/storefront/hero-carousel.tsx`
  (`.sf-hero-*` in storefront.css; crossfade, 5s autoplay w/ progress dots, hover pause/arrows,
  swipe, reduced-motion; imageless = brand-tinted panel, image = shared `HeroMedia` blurred-canvas
  fit or focused cover crop; CTA has a white border for near-black brands). On phones the carousel
  remains one image surface: compact title + CTA overlay a bottom gradient, badge/subtitle hide, and
  optional mobile artwork/focus protects the subject without duplicating promotional copy.
  **`focal` (2026-08-17) is where a cropping slide is anchored** — `{ x, y }` in percent, unset =
  centre, translated to `background-position` by `lib/storefront-focal.ts`, which is the ONE place
  that translation happens (it sits outside `storefront-templates.ts` only because that file is at
  its size limit). It lands on `.sf-hero-media-cover` and the blurred canvas background, never the
  contained foreground — that layer already shows the whole photo. Admin:
  `customize/focal-point-picker.tsx`, whose click target is the `<img>` itself
  rather than its padded box, so any photo ratio maps its own edges to 0/100%; replacing or
  removing a slide image clears the point, since it was picked on the old photo.
  ⚠ **The carousel does NOT call `useStoreImageFit()` — deliberately** (2026-08-17). Each slide
  carries its own `imageFit`, and `undefined` renders `fit` (whole photo), the answer that can never
  cut a face or a word in half. It arrives as a loose string like the `templates` ids, so it reaches
  `mediaFitFor` through the `isImageFit` guard (beside `isImageRatio`) and an unknown id falls back to
  the same default rather than throwing. **Why the inheritance was cut:** `templates.imageFit` is
  rendered inside the *Product cards* part, so a hero that read it meant changing how product
  thumbnails crop silently re-cropped the shop's biggest picture — a grid of small squares and a wide
  banner are different jobs with no reason to share an answer. The editor hides the focus picker when
  the fit is `fit`; nothing is cropped, so the control would have no effect. The chips are worded
  from `TEMPLATE_OPTIONS.imageFit` so the slide and the store-wide control can't drift apart.
  **The photo is a real responsive image**, not a CSS background: `HeroMedia` publishes the medium
  and original URLs as 800w/1600w `srcset` candidates and the browser chooses for its viewport.
  Renders on
  Classic + Hero Split when slides exist (Minimal keeps its hero;
  empty = static hero). Admin: Customize → Hero → `customize/hero-slides-panel.tsx`; slide image upload =
  `POST /organization/storefront/media/hero-slide` (`useUploadHeroSlideImage`), settings PATCH
  cleans up dropped slides' Cloudinary images; live preview via preview store/bridge `heroSlides`.
  Approved design sample: claude.ai/code/artifact/2ea161da-ea0a-4d15-9c31-00a3110804f1.

- **Slugless seed data fix**: org-signup seeding `insertMany`s categories/brands/customers/suppliers,
  but `slugPlugin` only hooked `pre("save")` → every seeded doc had NO slug. Symptom: admin
  Navigation category select crashed (Radix forbids `<SelectItem value="">`). Fixed: plugin now has
  an `insertMany` hook (+ in-batch dedupe); nav page filters slugless categories from options;
  one-time heal = `npx tsx -r dotenv/config src/scripts/backfill-slugs.ts` (idempotent, must be
  run per environment). Tests: `src/utils/__tests__/slugPlugin.test.ts`.
  **Extended 2026-08-07 to compose `Category.slugPath` too, and it is now DRY RUN by default —
  pass `--apply` to write.** `slugPath` had exactly the same save-hook-only story as `slug` and
  nothing ever backfilled it, which is worse than unlinkable: `listCategories` **drops** a
  category with no `slugPath`, so every pre-feature category was *invisible* on the storefront —
  no home tile, no header entry, no collection page. The dev DB was in exactly that state
  (85/85 categories pathless, 51 of them also slugless) until this ran. **Run it once per
  environment before trusting anything category-shaped on the shop**, and check its output rather
  than the browser — a store with zero collections renders as a store that simply has none.
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
  **A client-only page reserves a screen on its wrapper, in every branch** — checkout's `wrap` has
  `minHeight: "100svh"`. Under a 320px splash the store footer sat inside a phone's viewport and
  hydration moved it: checkout's 0.138 layout shift (budget 0.1) until 2026-09-15. Reserving the
  height on the splash alone made it worse (0.461), because Lighthouse — like any fresh browser — has
  an empty cart, and the two-line empty-cart message pulled the footer up into view. A footer that
  starts and stays below the fold moves for free.
- **`json.error` not `json.message`** is where backend error text lives.
- **The settings PATCH replaces `templates`, `theme` and every provided sub-field WHOLESALE** —
  `updateSettings` is a shallow `Object.assign`. Any admin section saving one key inside
  `templates` must spread the saved object first (`{ ...settings.templates, headerMenu }`), and
  `TemplatesSection` seeds its draft from the full saved object for the same reason. Sending a
  partial `templates` silently wipes the other sections' choices — this nearly shipped twice.
  The validator is no guard: every key in `themeSchema`/`templatesSchema` is `.optional()`, so the
  destructive payload is valid input. A comment in `draft-payloads.ts` claimed the opposite
  ("nested paths MERGE, an omitted key keeps its stored value") until 2026-08-18 — it was wrong in
  both directions, and an explicit `undefined` **does** clear a key, which is what makes clearing a
  brand colour work at all. Pinned backend-side by
  `src/services/__tests__/storefront-settings-patch-semantics.test.ts`.
- **OAuth callback route order** (before `/:slug`), and same-document hash navigation does NOT
  remount the oauth landing page — QA must full-navigate.
- **Store payload is cached** (`getStore` = 300s + 5-min client staleTime). Merchant saves flush it
  on demand; anything else changes it lags by the timer. See "Cache + on-demand revalidation".
  **This is the #1 way a working storefront looks broken during QA** — a theme round in 2026-08-17
  reported "all four themes are identical" while reading one cached render four times. Only a save
  from the admin UI flushes (`revalidateStorefront` runs in the merchant's browser off their token);
  curl, Postman, a script or a direct DB write flush nothing. A hard reload does not help and that
  is the tell. Tester-facing checklist: backend `docs/features/ecommerce-qa.md` → "Testing the
  storefront without fooling yourself".
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

Owner-entered CTA links are store-relative and must go through `normalizeStoreLink`/`storeLinkHref`.
Never persist or render the tenant-only `/shop` prefix as part of the owner route. Shipping marketing
copy must derive from `effectiveFreeShippingThreshold`; delivery windows are merchant-authored and
must fall back to neutral checkout guidance when absent.

## Page controls — Search / Cart page / Account (2026-09-16)

A merchant can switch off three shopper pages (backend `docs/plan/storefront-builder.md` §6, step
7a). The backend resolves them into one block on the store payload, `store.pages { search, cartPage,
accounts }`, and this side reads it through **one** helper.

**`storePages(store)` (`lib/storefront-page-controls.ts`) is the only reader.** Never touch
`store.pages?.search` directly: **absent means ON**, and that is not a stylistic preference — a store
configured before these switches existed carries no block, and neither does any payload cached before
they shipped, so a direct read closes the search, the cart page and the account area of every such
shop. `lib/storefront-page-controls.test.ts` pins the rule.

Where it is enforced, and why each place is the way it is:

| Surface | How |
|---|---|
| Header search | `HeaderSearchBar` / `HeaderSearchIcon` / `HeaderSearchMobile` self-gate, so a new anatomy cannot forget one |
| Search wrappers | `search-first`, `boutique` and `clinical` wrap search in a `flex: 1` decoration — gate the **wrapper**, or it holds the gap open |
| Sign-in | `AccountLink` self-gates on `ctx.showAccount` (set once by `StoreHeader` from `storePages`) |
| Phone chrome | `chromeWithPageControls` filters the RESOLVED chrome — slots, tabs, `searchInline`, a `search` row — never the templates, so a merchant's slot arrangement survives switching a page off and on |
| Phone menu panel | Reads the **store**, not the chrome — see the trap below |
| Cart drawer | "View cart" hidden when the drawer is the whole cart |
| Routes | `/search` 404s, `/cart` redirects to checkout (temporary — the switch is reversible, a 301 would outlive it in browser caches), `shop/account/layout.tsx` 404s the whole account area |

⚠ **The inverted check.** `MobileMenuPanel` offers an account row when the chrome has *no* account
control (`!chromeHas(chrome, "account")`) — it is the last-resort way in for the templates whose bar
carries none. Filtering `account` out of the chrome therefore made that row appear **exactly when the
merchant switched the account area off**. It reads `storePages(store).accounts` for that reason: a
filtered chrome cannot tell "off" from "not on the bar". Any future "the chrome lacks X, so I must
offer X" check has the same hazard.

**Tracking is not part of the account area.** Guest checkout, the cart mirror and both tracking routes
stay open with accounts off, so the utility bar's "Track order" retargets from `/account` to
`/orders/track` rather than disappearing.

## System pages on the builder — core sections (2026-09-16)

The cart, checkout, search and account pages can be **builder pages**. Each route keeps its address,
its metadata and its gates, and asks for its own page through **`SystemPage`**
(`components/storefront-builder/system-page.tsx`): the builder page when the store has one, else the
view directly. A store that has not moved the page hears a 404 from the page read — the normal answer
until its cutover, not an error.

**The core section renders the same view the route renders.** That is what makes a moved page
identical, and it is why the four views live in `components/storefront/{cart,checkout,account,search}/`
rather than in their route folders — a section importing a route file is backwards. Each is exported
by name (`CartPageView`, `CheckoutPageView`, …), and cart and checkout take an optional layout that is
today's `templates.*` choice become a section setting, resolved **under** the Customize draft so the
editor preview still repaints while a merchant drags.

⚠ **Every core section must wrap its view in `.sfb-core`.** The view brings its own column and side
padding; `.sfb-inner` adds another, and the two gutters stack. A wide page hides it inside its
max-width column — on a **phone** the page is visibly narrower (733 px of diff, desktop clean). The CSS
rule lives in `app/(storefront)/storefront-builder.css` beside the identical one `content-body` needs.

**A core section cannot be removed, hidden or duplicated.** `isCoreSection`
(`components/ecommerce/pages/editor/section-catalogue.ts`) is one source with the add library's
`addable: false`, so a section a merchant cannot add is one they cannot delete either; the API refuses
it too (`STOREFRONT_PAGE_CORE_SECTION`).

**The collection and product pages work the other way round.** Their views need the route's own data,
which the section runtime cannot hand them — so the ROUTE fetches as it always did (it owns the URL,
the cache key, the breadcrumb and the JSON-LD) and puts the result in a small client context
(`CollectionDataProvider` / `ProductDataProvider`); the core section reads it (`CollectionFromRoute`,
`ProductFromRoute`) and takes no settings at all.

**One page serves them all.** `/products` and every `/{category}/{sub?}` ask for the same `collection`
page, and every `/products/<slug>` answers with the one `product` page — matched by shape on the
backend, since that slug names a product, not a page. So a section a merchant adds to the product page
appears under the whole catalogue at once. Order tracking and not-found stay classic.

**Proving a move locally:** the frontend serves a cached page read stale for 300 s, so a baseline taken
just before a migration compares against a page that has not changed yet and reads as a regression.
Release the pages, `rm -rf .next/dev/cache`, restart the dev server, capture, migrate, restart, compare.
