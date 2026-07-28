# Plan — make the Bangla storefront indexable (`hreflang` + locale URLs)

**Status:** not started. Deferred deliberately on 2026-07-28, at the end of the storefront SEO work
(SSR seeding, robots/sitemap, JSON-LD, canonical host). This is the last item from that audit and the
largest; everything else in it shipped.

**Why deferred, not dropped:** pre-launch there is no traffic to lose, and this change touches every
storefront URL — so it is much cheaper to do while there are still no indexed pages and no inbound
links to preserve. It gets *more* expensive the longer the store is live, which is the argument for
doing it before launch rather than after.

## The problem

The storefront is fully bilingual EN/বাংলা (`lib/storefront-i18n.ts` — every string is a key in the
`Dict` interface plus the `en` object plus the `bn` object). But the language is a **client-side
toggle persisted to `localStorage`** (`ezy-sf-lang`, applied pre-paint by the `NO_FLASH` script in
`app/(storefront)/layout.tsx`).

Consequences:

- **One URL serves both languages.** There is nothing for a crawler to index separately.
- **Google only ever sees English.** The server render is always the default locale; Bangla exists
  only after hydration, in a state a crawler never reaches.
- No `hreflang` annotations are possible, because there is no second URL to point at.

For a Bangladesh-market product this is the single biggest remaining SEO gap: the Bangla-language
queries these merchants would most want to rank for cannot match any indexable page.

## What it would take

This is not a metadata change — it is a routing change.

1. **Locale-scoped URLs.** Pick a scheme and apply it everywhere: `/{locale}/...` path prefix is the
   conventional choice (`acme.com/bn/products/x`, `{slug}.ezycore.com/shop/bn/products/x`). A query
   param (`?lang=bn`) is weaker — search engines treat it as the same page more readily.
2. **`storeHref` must carry the locale.** `lib/storefront-links.ts` already exists precisely so no
   storefront link is hand-built; the locale belongs there, alongside `base`. Every call site then
   gets it for free. **Do not** let any component build a locale path itself.
3. **Server-side locale resolution.** The locale has to reach `generateMetadata` and the server pages,
   so it must come from the URL (and/or `Accept-Language` for the initial redirect), not
   `localStorage`. `getStoreContext()` (`lib/storefront-host.ts`) is the natural place to surface it,
   next to `slug`/`base`/`origin`.
4. **`alternates.languages`** in `storePageMetadata` — each page declares its counterpart, and both
   declare a self-referencing `hreflang` plus `x-default`. An `hreflang` cluster is only valid if the
   annotations are **reciprocal**; a one-way link is ignored.
5. **Canonical interaction.** Each locale URL self-canonicalizes — a Bangla page must NOT canonicalize
   to the English one, or the whole point is lost. This has to compose with `canonicalTarget`
   (`lib/storefront-canonical.ts`), which already rewrites the host for custom domains.
6. **Sitemap.** `app/sitemap.ts` emits one entry per locale per URL, each with its `alternates`
   block — roughly doubling the entry count, which is worth re-checking against the 5,000-product cap
   in the backend's `storefront-sitemap.service.ts`.
7. **The language toggle becomes navigation.** Today it flips React state; it would become a link to
   the counterpart URL, preserving the current path. The `sf-lang` localStorage value survives only as
   a preference for choosing the initial redirect.
8. **Merchant content is not translated.** Product names, descriptions and CMS pages are whatever the
   owner typed, in one language. So a `/bn/` page is UI-translated but content-identical — which is
   legitimate, but means the real payoff needs per-locale merchant content fields eventually. Worth
   deciding up front whether that is in scope or a later phase.

## Watch out for

- **`app/(storefront)/layout.tsx`'s `NO_FLASH` script** sets `lang` from `localStorage` before paint.
  Once the URL owns the locale, that script must not fight it.
- **The proxy** (`proxy.ts`) resolves host → store and rewrites custom-domain paths to `/shop/...`.
  A locale segment has to be threaded through that rewrite, and `isStorePath` updated.
- **`hreflang` must use the canonical host**, not the serving host — same rule as everything else in
  `canonicalTarget`. A cluster pointing at two different hosts for the same store is worse than none.
- Bangla strings live in **three** places (`Dict` + `en` + `bn`) — grep-count to confirm, IDE
  diagnostics lie mid-batch. See the `storefront` skill.

## Related

- Operating map: [`.claude/skills/storefront/SKILL.md`](../../.claude/skills/storefront/SKILL.md) → "SEO",
  where this is listed under "Known gaps".
- Admin-side i18n (a different system — `messages/{en,bn}/*.json`): [`../I18N.md`](../I18N.md),
  glossary [`../I18N-GLOSSARY.md`](../I18N-GLOSSARY.md). Reuse the glossary's terms; don't invent new ones.

## Smaller SEO leftovers (cheap, unrelated to locales)

Recorded here so they aren't lost — none of them needs a plan of its own:

- No `metadataBase`, so a relative OG image URL would resolve wrongly. Works today only because every
  image URL happens to be an absolute CDN URL.
- `og:type` is `website` on the product page; it should be `product`.
- No `twitter:card` anywhere, so X/Twitter link previews are the bare minimum.
- Merchants cannot add a Google Search Console verification token — worth a store setting, since they
  cannot otherwise verify a domain they own except by DNS.
- The "Store unavailable" branch in `app/(storefront)/shop/layout.tsx` answers **HTTP 200**. It carries
  an explicit `noindex` so it cannot be indexed as a soft 404, but a real 404 status needs the owner
  "Sign in" affordance moved out of `shop/page.tsx` first.
- No `SearchAction` sitelinks-searchbox, deliberately: `/search` is `Disallow`ed in `app/robots.ts`,
  so advertising it would contradict the robots rules.
