# Storefront Builder — every SECTION gets the shape controls the Hero just got

**Written:** 2026-09-21 · **Repos:** `inventory-frontend` **and `inventory-backend`** (the spec and the
style box both grow — see §0.5) · **Branch:** see §0.6 — **not** `feat/storefront-builder`, which merged

**Progress: see §0.8. That board is the source of truth for what is done — keep it current.**

---

## 0. Start here

You do not need any prior context on this work. Read §0 in full before opening a file.

### 0.1 Read first

| Document | Why |
|---|---|
| `inventory-frontend/docs/plan/storefront-hero-shape-controls.md` | The plan this one generalizes. The Hero got `frame`, `imageSide`, `mobileFirst` and `mobileCopy`; this plan takes the same argument to the other 33 sections. Its §0.5 deploy rule and §5 ("why not one responsive `imageSide`") are load-bearing here. |
| `inventory-frontend/docs/plan/storefront-builder-conditional-controls.md` | The visibility mechanism (`field-visibility.ts`) every new conditional control in this plan registers with, and its §1 principle: **a control that has no effect in the current configuration is not shown.** Its §5 rollout table is already applied — this plan does not redo it. |
| `inventory-backend/docs/plan/storefront-builder.md` | The master plan every code comment cites ("plan §5.2 `SectionStyle`", "§8 widget library", "§17"). §7 is the responsive system this plan obeys; §15 holds the owner decisions that constrain it. |
| `inventory-frontend/docs/plan/storefront-design-requests.md` | The register. Phase 6's exit criterion was the register read against what shipped; §7 of this plan does the same. |
| `.claude/skills/storefront/SKILL.md` | The storefront reference: image fit and focal rules, preview bridge, cache. |
| `inventory-frontend/CLAUDE.md` | Repo conventions. `// coding-standard: maintained` on line 1 means the file already conforms — make your change and skip the standard review. Every file named here carries the marker. |

### 0.2 Where the code lives

| Directory / file | What it holds |
|---|---|
| `lib/storefront-builder/section-specs.ts` | **The vocabulary.** Every section type and the exact shape of its settings. Plain data, `import type` only (§0.5). |
| `lib/storefront-builder/section-style.ts` | The common **style box** — background, padding, width, align, tone — resolved to CSS custom properties. |
| `lib/storefront-builder/field-specs.ts` | The field vocabulary, shipped **verbatim** into the backend's generated manifest. Import-free. |
| `lib/storefront-builder/style-specs.ts` | **The style box's vocabulary** — `STYLE_BOX_SPEC` and `SPACING_STEPS`. Shipped verbatim into the same manifest, and the allowlist the backend's `checkStyle` enforces. Import-free. Added by Phase 0. |
| `lib/storefront-builder/responsive.ts`, `aspect-ratios.ts` | `responsiveVars` (the `--x` / `--x-m` pair) and the one enum→ratio map. |
| `components/storefront-builder/sections/` | One renderer per section type. |
| `components/storefront-builder/page-sections.tsx` | The common frame: `.sfb-sec`, `data-width`, `data-tone`, `data-hide`, `data-float`. |
| `components/storefront/` | The **live storefront** renderers, shared by the builder *and* the classic pages (§0.3). |
| `components/ecommerce/pages/editor/` | The merchant's editor: `section-inspector.tsx` (Content/Style tabs), `settings-fields.tsx`, `section-style-fields.tsx`, `section-style-edits.ts`, `field-visibility.ts`, `section-catalogue.ts` (labels + hints). |
| `app/(storefront)/storefront-builder.css` | The builder stylesheet. **One breakpoint, `max-width: 679px`.** Do not add a second. |
| `inventory-backend/src/utils/storefront-section-validation.ts` | The save boundary. Refuses any key the manifest does not describe — **and, today, any style key its own hand-written list does not name** (§0.5). |

### 0.3 Shared renderers have two callers — check both

Several pieces this plan touches are shared between the builder and the **classic** pages that every
store not yet migrated still renders:

| Piece | Classic callers |
|---|---|
| `components/storefront/sf-bits.tsx` → `SectionTitle` | `home/sections/product-sections.tsx`, `home/sections/category-banners.tsx`, `product/product-page.tsx`, `product-detail/product-overview.tsx` |
| `home/promise-rows.tsx`, `home/collection-tiles.tsx`, `home/category-tile-row.tsx`, `home/category-banner-row.tsx`, `home/pick-grid.tsx` | the classic home's own sections |
| `collection/`, `product/`, `cart/`, `checkout/`, `account/`, `search/` page views | the classic routes |

**Every change to one of these must be inert for the classic caller.** The technique the Hero plan used
works here too: read a custom property the builder frame sets and the classic page does not — e.g.
`justify-content: var(--sfb-title-justify, space-between)`. A classic caller emits no such variable, so
it keeps today's rendering byte for byte. State that fallback in the commit; do not rely on it silently.

### 0.4 Islands

Builder sections are server components; client code is `<Island name="…" props={…} />`, registered in
`components/storefront-builder/islands/island-map.tsx`. Props cross a server→client boundary and must be
plain serializable data. **A prop that stops at the section renderer and never reaches its island is a
control that silently does nothing** — the exact miss logged in the conditional-controls plan's §11. The
sections in this plan that draw through islands: `product-grid`, `product-carousel`, `campaign-offers`,
`category-*` strips, `related-products`, `order-form`, `offer-pricing`, `single-product`,
`sticky-order-bar`, `video`, `content-body`.

### 0.5 ⚠ Two things grow, and they ship differently — deploy the backend first

**(a) Section settings.** `section-specs.ts` + `field-specs.ts` are the source of the backend's
**generated** manifest (`inventory-backend/src/constants/storefront-section-manifest.ts`), and
`storefront-section-validation.ts` refuses any setting the manifest does not describe.

1. Add the fields to `section-specs.ts`.
2. `pnpm gen:section-manifest` in `inventory-frontend`.
3. Commit the regenerated backend file **in the backend repo**.
4. **Ship the backend before the frontend.**

`pnpm verify` runs `gen:section-manifest --check`, which fails the build while the two drift. It is the
gate, not a reminder.

**(b) The style box is generated too — since Phase 0.** It was not: `checkStyle` hand-named
`["background", "padding", "width", "align", "textTone"]` and carried its **own private copy of
`SPACING_STEPS`**, with the frontend's copy in `section-style.ts` and nothing comparing the two, because
the manifest's `--check` covered sections and never reached the style box.

`lib/storefront-builder/style-specs.ts` now owns that vocabulary, ships into the same generated manifest
and is what `checkStyle` reads, so **a style key follows exactly the same four steps as a section
setting** — add it to `style-specs.ts`, regenerate, commit the backend file, ship the backend first.
`pnpm verify` fails while the two drift.

**Version bumps.** Every field this plan adds is `optional`, so a section saved before it stays valid and
`v` stays where it is. Widening an enum (align gains `right`) is also safe. **Do not bump `v`** — the
backend refuses any other version, so an unnecessary bump turns every saved page carrying that section
into a failed save.

**(c) How a bad deploy comes back — read this before you ship one.** The 2026-09-21 release broke both
live storefronts' home pages and the rollback had two traps of its own (master plan §17, "The day it
went to production"). Both apply to every deploy this plan asks for:

- `docker compose up -d <service>` **does nothing** when the image line is a mutable tag such as
  `:production`, because compose only recreates a container when the *spec* changes — and the broken
  build has already taken that tag. A rollback has to name the old image explicitly.
- The old image is **gone from the box**: the deploy's own `docker image prune -f` removes it the moment
  the new `:production` replaces it. It has to be re-pulled from GHCR **by commit SHA**. Every build is
  SHA-tagged, which is the only reason that rollback was possible.

The compose file was then **pinned to a SHA**, and the pin caught a second incident — the merge of the
fix triggered a deploy while `:production` still resolved to the broken image. **Check whether the pin
is still in place before asking for a deploy**, because a pinned compose will ignore the new build.

### 0.6 Branch

**`feat/storefront-builder` is merged and is no longer where work goes** — frontend PR #454, backend
PR #384. Branch from the current development line instead. As of 2026-09-21 the frontend sits on
`fix/hero-image-only-slides` (merged into `development` at `d3d2fdcd`) and the backend on
`fix/migrate-carry-trust-badges`; check both before you branch rather than trusting this line.

The Hero work this plan generalizes is at `cbd6cedd` and before, which is also the commit §2 was audited
against — see §7 for what has landed since. Per the owner's standing rule, **do not push and do not open
a PR** unless asked for that specific push.

### 0.7 What is blocked

**Phase 1 is unblocked and changes no spec field** — it can go at any time, provided X11 is answered
with `ownsAlign` rather than by removing a field (Phase 1 step 3).
**Phases 2–6 need Phase 0 in production**, because each adds keys the deployed backend would refuse.
**No phase is blocked on a decision**: D1–D7 in §4 are all answered, and the 2026-09-21 re-read (§7)
opened none.
⚠ **Nothing here is blocked on a migration any more.** All 21 production stores are on the builder, so
every phase ships onto live merchants' pages rather than ahead of them.

### 0.8 Recording progress — read this before you write any code

This plan is the handover. Someone will pick it up not knowing what you finished.

**The rule: anything you finish, you mark finished, in the same commit as the code.**

- Tick the step: `1. [ ]` becomes `1. [x]`.
- Update the phase's **Status** line, and the board below.
- A phase becomes ✅ only when its row in §6 is actually true — not when the code is written. Code in but
  unverified is 🟡, and say what is left.
- If you learn something that changes the plan, edit the plan and log it in §7.

**Status vocabulary:** ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked (name the blocker).

#### The board

| Phase | What | Status |
|---|---|---|
| Audit (§2) | 34 sections read against their renderers, the style box and the CSS | ✅ Done 2026-09-21 · re-read against `d3d2fdcd` 2026-09-21 (§7) |
| 0 (§3) | One source for the style box; backend generated and shipped | 🟡 Code in, both repos green — **awaiting the owner's backend deploy** (step 6) |
| 1 (§3) | Controls that exist and do nothing, or do two things — six hardcoded columns, one dead alignment, one doubled, two misnamed | 🟡 Built 2026-09-21; pixel comparison outstanding |
| 2 (§3) | The style box grows: side padding, corners, border, overlay, text colour, right, anchor | 🟡 Built 2026-09-21; backend deploy + pixel comparison outstanding |
| 3 (§3) | `image-text` gets the Hero's per-device treatment | 🟡 Built 2026-09-21; the conversion half of 3b ⛔ blocked on an unmerged backend branch |
| 4 (§3) | The row sections: subheading, columns per device, flow | 🟡 Built 2026-09-21; `arrows` ⛔ deferred (step 5), deploy + pixel outstanding |
| 5 (§3) | Media sections: gallery shape per device, banner position + scrim, video shape | ⬜ Not started |
| 6 (§3) | Conversion + system: sticky bar on desktop, search's empty words, small ones | ⬜ Not started |
| 7 (§3) | Tests, docs, register review, browser QA | ⬜ Not started |
| Deferred (§5) | S1 heading scale · S2 per-section brand colour · S3 lightbox · S4 nested columns · S5 tablet | ⬜ Not planned |

---

## 1. The problem in one paragraph

The Hero can now be shaped: three layouts, a per-device frame, which side the picture takes, which of
the picture and the copy leads the phone. **No other section can.** Thirty-three section types accept the
merchant's words and nothing else — the columns, the card, the crop, the gutter, the corner and the
colour are all in `storefront-builder.css` or in a renderer's inline style. Worse than absent: six
sections hardcode a column width that **silently beats the Style tab's own Width control**, and the
Style tab's **Text alignment does nothing at all** on the eight sections that draw their heading through
`SectionTitle`. Three more sections carry **their own** alignment control beside the Style tab's, so the
merchant gets two controls for one question with no way to tell which won — the Hero's W1 again, on
`call-to-action`, `collections-row` and `category-tiles`. A merchant who moves a control and sees no
change, or watches the wrong thing move, learns that the preview lies — which is the cost the
conditional-controls plan was written to stop paying, and it is being paid on the Style tab now.

## 2. Audit — what a merchant cannot control today

Read against the code on 2026-09-21 (`cbd6cedd`). Two tables: what is wrong everywhere, then what is
wrong per section.

### 2.1 Cross-cutting (every section)

| # | What the merchant cannot control | Where it is nailed down |
|---|---|---|
| **X1** | **Style → Text alignment does nothing for eight sections' headings.** `SectionTitle` is `display:flex; justify-content:space-between`, so `text-align: center` on `.sfb-sec` cannot move a flex item. | `sf-bits.tsx` → `SectionTitle`, the `justifyContent: "space-between"` on its wrapper (cite the symbol, not the line — §7 records the refs drifting); used by `product-grid`, `product-carousel`, `gallery`, `promises-band`, `category-tiles`, `collections-row`, `shop-by-tag`, `category-promo-cards` — and `selected-products` repeats the same flex row inline |
| **X2** | **Six sections hardcode a column width that beats Style → Width.** The same two-controls-one-question defect as the Hero's W1, on six sections at once. | `rich-text.tsx:10` (780), `faq.tsx:15` (780), `selected-products.tsx:30` (980), `collections-row.tsx:36` (980), `order-form.tsx:25` (560), `video.tsx:25` (880/420) |
| **X3** | **No side padding.** The style box is top/bottom only, so a section cannot be inset. | `section-style.ts` `readPadding` |
| **X4** | **No corners, no border.** Store-wide Corners exist; a section cannot round or outline its own band. | `sectionFrame` emits background, padding and align only |
| **X5** | **A background picture has no overlay.** `background-size: cover; background-position: center` fixed, no shade. Dark photo + dark text is unreadable and the only escape is Text tone. | `storefront-builder.css`, the `.sfb-sec` rule |
| **X6** | **Text colour is two hardcoded hexes** (`#ffffff`, `#0f172a`) while the background beside it takes any hex. | `storefront-builder.css`, the `.sfb-sec[data-tone=…]` rules |
| **X7** | **No right alignment** in the style box — though `collections-row` and `category-tiles` both offer `right` in their own settings. | `section-style-fields.tsx` `ALIGNS` |
| **X8** | **No subheading on any row section.** Thirteen sections offer a heading and nothing under it. | `product-grid`, `product-carousel`, `selected-products`, `gallery`, `testimonials`, `benefits`, `faq`, `campaign-offers`, `shop-by-tag`, `collections-row`, `category-tiles`, `related-products`, `promises-band` |
| **X9** | **No anchor on a section**, so a hero button cannot scroll to the order form further down the page — the core move of a landing page. The sticky bar reaches it through a private attribute no merchant can type. | `order-form-anchor.ts`; `isAllowedSectionUrl` (backend) refuses `#order` outright |
| **X10** | **No custom spacing or width value** — five steps, three widths, nothing between. | `SPACING_STEPS`, `WIDTHS` |
| **X13** | **Secondary text does not follow the section's tone**, and never did. Ten call sites draw `color: var(--muted)` on text sitting directly on the section's band, so a section set to `light` for a dark photograph keeps grey secondary text meant for a white page. Widening the tone to a custom colour makes it more visible but does not cause it. ⚠ Not fixed in Phase 2 and deliberately not half-fixed: overriding `--muted` inside the section would also repaint the cards that sit on `var(--card)` and carry their own colour on purpose (`testimonials`, `benefits`, `sticky-order-bar`). Found 2026-09-21 while implementing X6 (§7). | `image-text`, `call-to-action`, `how-to-order`, `order-form`, `offer-pricing` and `offer-price` — `color: "var(--muted)"` |
| **X11** | **`call-to-action` offers two alignment controls for one question.** `SECTIONS_ALIGNING_THEMSELVES` names `hero` and nothing else, so the CTA shows its own Alignment on the Content tab *and* the Style tab's Text alignment. `.sfb-cta` reads `text-align: var(--sfb-cta-align, inherit)`, so the precedence is already right — the section's own wins where given, the Style tab's applies where not — but both being offered means a merchant moving the Style tab's on a CTA that answers for itself sees nothing move. ⚠ Corrected 2026-09-21 from "three sections": see the note below. | `section-style-fields.tsx` → `SECTIONS_ALIGNING_THEMSELVES` (`hero` alone); `call-to-action.tsx` → `responsiveVars("sfb-cta-align", settings.align)` |
| **X12** | **`collections-row` and `category-tiles` ask a different question in the same word.** Their `align` is **not** a duplicate of the Style tab's: a grid already spans the content column, so there is no row left to move and `GRID_ALIGN` places each tile **inside its own column**, while the Style tab's alignment moves the heading above it. Both were labelled "Alignment". Naming them apart is the whole fix; hiding either would take away a control that works. | `collection-tiles.tsx` → `GRID_ALIGN` and the comment above it; `category-tiles.tsx` → `settings.align ?? "left"` |

⚠ **X11 and X12 were one finding until the code was read** (2026-09-21, §7). The audit recorded three
sections offering "two controls for one question". Only one does. The other two ask a genuinely
different question badly named — and treating them as duplicates would have removed the only control
that moves their heading. The lesson is in §7; the general form of it is that two controls sharing a
word are not thereby the same control.

**Already right, do not "fix" these:** per-section device visibility (`visibility.desktop/mobile` →
`data-hide`), the `enabled` switch, `sectionFrame`'s "Section's own" default on every style control, the
`ownsAlign` / `ownsWidth` pair the Hero introduced, and the responsive `{base, mobile}` storage with its
CSS-variable rendering. This plan extends all of them; it changes none.

### 2.2 Per section

Grouped by the phase that answers it. `—` means the section is correct as it stands.

| Section | What it cannot do | Phase |
|---|---|---|
| **hero** | — (the Hero plan is done) | — |
| **category-promo-cards** | — (responsive `shape`/`side`/`split`/`hideText`/`height`/`flow`/`perRow` + ratio, radius, arrows: the benchmark) | — |
| **spacer** | — (responsive height and a line) | — |
| **image-text** | **The phone always leads with the photograph**, no control — the Hero's M6, unfixed. `imageSide` applies past the breakpoint only; `imageRatio` is not responsive; the split is a fixed `1fr 1fr`; there is no phone picture. | 3 |
| **call-to-action** | **Its own responsive `align` sits beside the Style tab's** (X11) and quietly wins wherever it is set. Nothing else: no button style, no second button. | 1 (X11) |
| **benefits** | **A phone is always one column** — `columns` is written into a `min-width: 680px` block, so the control the merchant sets is the only screen it cannot reach. | 4 |
| **how-to-order** | **No column control, and the desktop cannot wrap**: `grid-auto-flow: column` gives eight steps eight columns. | 1 (wrap), 4 (control) |
| **testimonials** | No columns (desktop is a fixed `auto-fill minmax(260px, 1fr)`), no choice about the phone's 85 %-wide swipe row. | 4 |
| **product-carousel** | Nothing but heading, source and limit: no cards in view, no arrows. | 4 |
| **product-grid** | No sort order (`featured / newest / category / tag / manual` only), no per-section card style. | 5 (sort), out of scope (card style) |
| **related-products** | Heading and limit only — no columns, and no card photo shape, which every other product row has. | 4 |
| **campaign-offers** | Heading only — no limit. | 4 |
| **shop-by-tag** | Heading and tags only — the chips cannot wrap or scroll by choice. | 4 |
| **countdown** | Heading, `endsAt` and an optional campaign — **and no answer for what the section does once the clock reaches zero**, which is the one state it is guaranteed to reach. No size and no unit labels either. | 4 (subheading), 6 (expired behaviour) |
| **offer-pricing** | Heading, text and the product. No layout at all, though it draws through an island (§0.4) and sits on a landing page's conversion path. | 4 |
| **promises-band** | Heading, up to six blocks and the store's own promises. Named in X1 and X8 and reached by both; listed here so the audit has no silent row. | 1 (X1), 4 (X8) |
| **selected-products** | Locked to 980 px (X2); capped at six by design. | 1 |
| **faq** | Locked to 780 px (X2); no "open the first one". | 1, 4 |
| **rich-text** | Locked to 780 px (X2) whatever Width says. | 1 |
| **gallery** | `frame` is **not** responsive, though `image-banner`'s is and the Hero's is. | 5 |
| **image-banner** | **`align` decides three things at once** — left means bottom-anchored under a gradient, centre means middle-anchored under a flat 35 % wash. A merchant cannot ask for left copy in the middle of the picture, and cannot touch the scrim. | 5 |
| **video** | Locked to 880 / 420 px (X2); `ratio` is not responsive. | 1, 5 |
| **collections-row**, **category-tiles** | Good column and label controls; their own `align` places each tile inside its column and was labelled like the Style tab's (X12); **no tile shape or height**, which is the size question the design register's row 3 declined and then answered by moving the merchant to another section. | 5 |
| **sticky-order-bar** | **Phones only, by `!important`.** A desktop merchant cannot have it at all. | 6 |
| **order-form** | Locked to 560 px (X2); no label on its own submit button. | 1, 6 |
| **search-results** | **No settings at all** — including no words for an empty result, which is the one thing a merchant would write. | 6 |
| **single-product** | Gallery layout and hide-description only. | out of scope |
| **product-main**, **collection-grid**, **cart-lines**, **checkout-form**, **account-area**, **content-body** | One `layout` enum each. These are page layouts, not compositions. | out of scope (§5) |

---

## 3. The phases

Order is the owner's decision D1: **fix what is dead, then grow the box every section sits in, then take
the sections one family at a time.**

### Phase 0 — one source for the style box

**Status:** 🟡 Steps 1–5 done 2026-09-21 on `feat/storefront-section-controls` (both repos); step 6 is
the owner's deploy and is what phases 2–6 wait on. · **Blocks:** phases 2–6 reaching production.

The style-box vocabulary is hand-copied into two repos with no gate (§0.5b). Phase 2 adds six keys to
it. Generate it first, or the gate that catches section drift will keep missing style drift.

1. [x] New `lib/storefront-builder/style-specs.ts`, under `field-specs.ts`'s rules — **no imports of any
       kind, only erasable TypeScript** — exporting `STYLE_BOX_SPEC`: the allowed keys, the spacing
       steps, the width and tone values, and which are responsive. Move `SPACING_STEPS` here and have
       `section-style.ts` import it, so the frontend has one copy too.
2. [x] `scripts/gen-section-manifest.mjs` emits `STYLE_BOX_SPEC` into the backend manifest beside
       `SECTION_MANIFEST`. Same literal writer, same `--check` behaviour.
3. [x] `checkStyle` reads the emitted spec instead of its hand-written allowlist; delete the backend's
       private `SPACING_STEPS` (line 47).
4. [x] A backend test that a style key absent from the spec is refused, and one that every key in the
       spec is accepted — so the two can never drift silently again.
5. [x] `pnpm gen:section-manifest`, commit the backend file, `pnpm verify` green in both repos.
6. [ ] **Ship the backend.** (Owner's deploy.) Before asking for it, read §0.5(c): confirm whether the
       compose file is still pinned to a SHA, and write down the SHA of the image being replaced — a
       rollback cannot find it afterwards, because the deploy prunes it.

**Nothing merchant-visible changes in this phase.** That is the point: it is the scaffolding the next
five stand on.

### Phase 1 — the controls that already exist and do nothing

**Status:** 🟡 Built 2026-09-21 on `feat/storefront-section-controls`; typecheck and the touched suites
green, every new test mutation-checked. **Left: the pixel comparison** on the live stores (§6). ·
**Changes no spec field** — it can ship before Phase 0 reaches production, and step 3's answer keeps it
that way.

Every item here is the Hero's W1 shape: a merchant moves a control and the page does not move, or the
wrong thing moves.

⚠ **This phase now lands on 21 live storefronts, not one.** Every production store was migrated onto
the builder on 2026-09-21 (master plan §17, "Every production store is on the builder"), so "renders
exactly as today" is a claim about real merchants' home pages. Prove it with the pixel harness, not by
reading the diff — see Phase 7 step 3.

1. [x] **X1 — `SectionTitle` respects the section's alignment.** Give its wrapper
       `justify-content: var(--sfb-title-justify, space-between)` and the builder frame a
       `--sfb-title-justify` derived from the resolved align (`left`→`flex-start`,
       `center`→`center`, `right`→`flex-end`). **The four classic callers emit no such variable and are
       byte-identical** (§0.3) — assert that with a test, not with care.
       - With a heading and no action link, drop the flex row entirely and let `text-align` do the work.
       - `selected-products` repeats the same row inline (`selected-products.tsx:32`); fix it the same
         way rather than leaving a ninth copy.
2. [x] **X2 — the six hardcoded columns stop beating Style → Width.** In each of `rich-text`, `faq`,
       `selected-products`, `collections-row` (plain), `order-form` and `video`, apply the built-in
       column **only where the style box set no width** — the same inverted `??` precedence `ownsWidth`
       uses, and for the same reason. A section nobody has styled keeps its exact column; a merchant who
       picks Wide or Full width now sees it.
       ⚠ Do **not** solve this by hiding the Width control: these sections have a legitimate answer for
       each of the three widths. Hiding is only correct where "no effect" is intended and permanent
       (conditional-controls §1, rule 2).
       ⚠ **Count the live sections that already carry a width before you flip the precedence.** The claim
       "a section nobody has styled keeps its exact column" is safe for the *migration* — the converter
       writes `style: { width: "full" }` on `category-promo-cards` alone
       (`storefront-home-conversion.ts`, the `rowConfig?.fullWidth` branch) and never touches these six
       — but 21 stores have been live and editable since the cutover. Query production for sections of
       those six types with `style.width` set; each hit is a page that moves the moment this ships, and
       it needs a pixel comparison of its own.
3. [x] **X11 — `call-to-action` stops offering two alignments**, and **X12 — the tile rows' own
       alignment is named apart.** Two different answers, because they are two different problems:
       - **X11:** a `field-visibility` rule hides the Style tab's Text alignment on a CTA whose own
         `align` has a **base** value, which is the case where it can have no effect. Nothing else.
       - ⚠ **No `ownsAlign`, and no adding the CTA to `SECTIONS_ALIGNING_THEMSELVES`** — the opposite
         of the hero. The hero ignores the style box's alignment outright, so its stored value had to
         stop applying. `.sfb-cta` *reads* it (`text-align: var(--sfb-cta-align, inherit)`) whenever
         the CTA's own is unset, so emitting nothing would move every CTA centred through the Style
         tab today, on 21 live stores. Hidden is not erased; the value keeps working.
       - ⚠ **Base, not "either screen".** A phone-only `align` leaves the desktop still following the
         Style tab, so the control has to stay. `responsiveBaseSet` exists for exactly this and is the
         one rule in that file that asks about `base` alone.
       - **X12:** `collections-row.align` and `category-tiles.align` become **"Tile position"**, with a
         hint saying the heading follows Style → Text alignment. No visibility rule and no `ownsAlign`:
         hiding either would take away a control that works.
       - ⚠ **Do not answer any of this by deleting a per-section `align` field.** Removing a key from
         the manifest makes the deployed backend refuse it, so every saved page carrying that section
         would fail its next save — the same hazard §0.5 records for a `v` bump.
       - The CTA's own control still offers left and centre only; **widening it to `right` moves to
         Phase 2 step 5**, where the style box gains `right` and the two can widen together. Nothing is
         lost meanwhile, because the style box has no `right` to be inconsistent with yet.
4. [x] **`how-to-order` wraps.** Replace `grid-auto-flow: column` with
       `repeat(auto-fit, minmax(220px, 1fr))` so eight steps make two readable rows instead of eight
       slivers. The control itself is Phase 4; this is the defect underneath it.
5. [x] Tests: alignment reaches each of the nine headings; each of the six sections honours a set width
       and keeps its own when unset; the three X11 sections show one alignment control, and the stored
       value of the one that went away no longer renders.
       ⚠ **Assert the classic callers emit no `--sfb-title-justify` — the ABSENCE, not the appearance.**
       The 2026-09-21 hero incident had a test for exactly its data shape which passed throughout,
       because it asserted what was rendered and never that the empty element was gone (master plan
       §17). A test written from the code's behaviour rather than the merchant's intent defends the
       defect; that happened twice in one day.

### Phase 2 — the style box grows

**Status:** 🟡 Built 2026-09-21 on `feat/storefront-section-controls`; typecheck green and 317 tests
across the touched suites. **Left:** the backend deploy (shared with Phase 0 — this branch carries both
spec changes, so one deploy covers them) and the pixel comparison. · **Needs Phase 0 in production.**

Six keys, added to `style-specs.ts`, `checkStyle` (via the generated spec), `section-style.ts`,
`section-style-fields.tsx` and `storefront-builder.css`. Every one is optional; unset renders exactly as
today.

```ts
// lib/storefront-builder/style-specs.ts — the style box's own settings
padding:  { top, bottom, inline? }   // inline: the same five steps, responsive with the pair
radius:   "none" | "sm" | "md" | "lg"          // unset = the section's own
border:   boolean                               // a 1px line in the theme's border colour
overlay:  number 0–80                           // percent of black over a background PICTURE
textTone: "auto" | "light" | "dark" | "custom"  // widened
textColor: colour                               // shown only when textTone is "custom"
align:    "left" | "center" | "right"           // widened, still responsive
anchor:   string /^[a-z0-9][a-z0-9-]{0,39}$/    // the section's id on the page
```

1. [x] **X3 side padding.** `padding.inline`, responsive like its two neighbours, rendered as
       `--sfb-pi` / `--sfb-pi-m` on `.sfb-inner`. ⚠ It must **compose with** the four
       `[data-width="full"] > .sfb-inner:has(…)` rules that drop the gutter today, not fight them: a
       merchant who sets side padding on a full-width banner is asking for exactly that gutter back.
       ⚠ **`:has()` and `:not()` carry their argument's weight**, so those four rules are heavier than
       they look and a plainer rule written later will still lose. The storefront stylesheet has now
       produced **four** specificity traps of this exact kind (master plan §17, the 2026-09-21
       incident): the `[data-frame-m]` desktop leak, the `:has(> .sf-hero-media)` floor ordering, the
       pictureless-card void column, and `[data-media-side="left"]` outweighing the collapse rule it
       had to lose to. Write the new rule where it can win on weight, not on document order.
2. [x] **X4 corners and border.** `--sfb-radius` and a `data-border` attribute on `.sfb-sec`. A
       full-width section keeps square corners (the banner already does this at
       `storefront-builder.css:259`); hide `radius` there through `field-visibility` rather than
       letting it store a value nothing draws.
3. [x] **X5 overlay.** `--sfb-overlay` painted by a `::before` over the background image, under the
       content. **Visible only when `background.kind === "image"`** — register the rule; do not let it sit
       dead on a colour background.
4. [x] **X6 text colour.** Widen the tone control to four options and show the hex field only on
       `custom`. Reuse `BackgroundColour`'s "keep what is typed until it is a whole `#RRGGBB`" behaviour
       (`section-style-fields.tsx:123`) — the bug it fixes is the same one.
       ⚠ **Sections that draw through an island do not inherit it** (`campaign-offers`, `content-frame`,
       `product-cards`…): CSS `color` inherits, so a section whose island sets its own colour will not
       follow. List the offenders in the commit; fixing them is part of this step, not a follow-up.
5. [x] **X7 right alignment.** Widen the enum in `style-specs.ts`, the editor and `readAlign`, and
       **widen `call-to-action.align` to match in the same change** (Phase 1 deferred it here). Widening
       never invalidates a stored value, so no `v` moves — but it is a spec change in both files, so it
       regenerates the manifest and ships backend-first like any other.
       ⚠ `TITLE_JUSTIFY` in `section-style.ts` is a total `Record<Align, string>` on purpose: adding
       `right` to `SECTION_ALIGNS` fails to compile until it maps to `flex-end`. That is the gate, not a
       reminder.
6. [x] **X9 anchor.** `id` on the `<section>`, plus **both ends of the link path widened to accept
       `#anchor`**: `isAllowedSectionUrl` (backend, line 74) refuses it today, and `merchantLinkHref`
       would treat it as a store path. The editor's hint names the anchors already on the page.
7. [x] Editor: the Style tab keeps its shape — every new control gets "Section's own" as its unset
       choice, a hint that says where the value comes from, and a phone marker where it is responsive.
8. [x] Tests: each key round-trips through `sectionFrame`; an invalid value falls back rather than
       failing the section; `checkStyle` refuses an unknown key and each bad value; a hidden control
       keeps its stored value.

### Phase 3 — `image-text` gets the Hero's per-device treatment

**Status:** 🟡 Built 2026-09-21 — the fields, the renderer, the stylesheet and the tests. **⛔ The
conversion half of step 3b is blocked:** `storefront-home-conversion.ts` on `development` still has
`editorial-split` in `UNMOVABLE_HOME_SECTIONS` returning `null`. The code that builds an `image-text`
from it lives on the unmerged backend branch `fix/migrate-carry-trust-badges` (`acbd2e5`), so there is
nothing here to teach. **Do it, and re-migrate Noor Collection, once that branch reaches
`development`.** · **Needs Phase 0 in production.**

The Hero's M6 in another section: two devices, opposite defaults, one control. Follow the Hero's answer
exactly — **two settings, not one responsive one** (hero plan §5, D4) — because the devices start from
different defaults and a responsive value would inherit the desktop's and move every existing photo.

```ts
// section-specs.ts — "image-text".settings
mobileFirst: { type: "enum", values: ["picture", "text"], optional: true },
split:       { type: "number", min: 20, max: 80, int: true, optional: true },  // NOT responsive — see §7
mobileImage: { type: "image", optional: true },
imageFit:    { type: "enum", values: ["fit", "crop"], optional: true },
// and imageRatio gains `responsive: true`
```

⚠ **`imageFit` is the one the migration is waiting on**, and it is first in this phase rather than last.
`.sfb-split-media` is hardcoded `object-fit: cover`, so `image-text` is the only picture section with no
fit control while the hero, the banner and the product cards all have one. It stopped being a
theoretical gap on 2026-09-21: the classic editorial split draws its photograph **fitted** — the whole
picture inside the 4:5 box, blurred bands filling the rest (`bannerPhoto`'s `canvas` default) — so
Noor Collection's converted band is the only thing on its home page that does not match what it
replaced (master plan §17). The conversion cannot set the field until it exists **and both repos are
deployed**, which is why the store is migrated with the difference recorded rather than held back.

1. [x] `mobileFirst` — which of the picture and the copy leads the phone's single column. Same label and
       hint as the Hero's, so the two sections ask the question in one voice.
2. [x] `split` — the picture's share past the breakpoint, in percent, responsive. Replaces the fixed
       `1fr 1fr` as `grid-template-columns: var(--sfb-split, 1fr) var(--sfb-split-rest, 1fr)`; reuse
       `category-promo-cards`'s own `split` range (20–80) rather than inventing a second one.
3. [x] `imageRatio` responsive, and `mobileImage` — `SfImage` already takes a phone picture
       (`image-banner.tsx:45`), so this is plumbing, not new machinery.
3b. [~] **`imageFit`**, in the store's own two words (`fit` / `crop`), unset keeping today's `cover`.
       Then teach `storefront-home-conversion.ts` to write `imageFit: "fit"` on a converted editorial
       split and **re-migrate Noor Collection's home** with a pixel comparison
       (`PIXEL_STORE=<slug> pnpm pixel:capture` before, `pnpm pixel:compare` after) — the band is the
       one page in that store's set that is not identical to the classic home it replaced, and the
       store is at 21 of 22 pages identical because of it (master plan §17).
       ⚠ **Wait for the storefront's server cache before you compare.** `getStore` holds 300 s and the
       page lookup its own 15 s / 60 s windows, so a comparison run within a few minutes of a migration
       screenshots a half-refreshed store: ZeroDrop failed once and passed on a re-run with nothing
       changed between, and Noor Collection's own second-button fix was invisible for the same reason.
       Confirm any failure by re-running before you act on it.
       ⚠ The Hero deferred a **responsive** `imageFit` (hero plan §7, S1). This one is flat on purpose —
       the two agree, and making it responsive here is a new decision, not a tidy-up.
4. [x] Visibility rules: **neither turned out to be needed**, and the reasons are worth keeping.
       `image-text.image` is a REQUIRED setting, so "only with a picture" is always true — unlike the
       hero, whose slides may carry none. And `split` stopped being responsive (§7), so there is no
       phone tab on which it could be dead. Registering either would have been a rule that is always
       true, which is noise in a table whose value is that every row means something.
5. [ ] Browser QA **phone first**: photo-first and text-first, 20 / 50 / 80 splits, a portrait phone
       picture with a landscape desktop one.

### Phase 4 — the row sections earn their shape

**Status:** 🟡 Built 2026-09-21, except `product-carousel.arrows` — see step 5. **Left:** the backend
deploy and the pixel comparison. · **Needs Phase 0 in production.**

Thirteen sections offer a heading and nothing else about their own arrangement.

1. [x] **X8 subheading.** `subheading: { type: "string", max: 240, optional: true }` on the thirteen
       sections in §2.1. One renderer change: `SectionHeading` and `SectionTitle` grow an optional line
       under the title — **inert for the four classic callers**, which pass none (§0.3).
2. [x] **`benefits.columns` becomes responsive**, and the CSS moves out of the `min-width: 680px` block
       so a phone can take two. Unset keeps today: up to three past the breakpoint, one on a phone.
3. [x] **`how-to-order.columns`**, responsive, over Phase 1's wrap as the unset default.
4. [x] **`testimonials`**: `columns` responsive, and `flow: "wrap" | "scroll"` responsive — the phone's
       swipe row becomes the default rather than the law. Reuse `category-promo-cards`'s `flow`
       vocabulary; do not mint a second word for the same idea.
5. [~] **`product-carousel`**: `perView` responsive — done, and it reaches the island through `--cols`,
       which is what the rail's track already divides itself by.
       ⛔ **`arrows` is NOT built, and the reason is worth reading before someone tries.** The arrows
       that `category-promo-cards` has belong to `CategoryStrip`, which owns the scroll CONTAINER — and
       the rail's scroll container is `ProductRailTrack`, with its own `grid-auto-flow: column` track
       and snap points, shared with the **classic** home's product rail. Giving the carousel arrows
       means moving that container into `CategoryStrip`, which changes a component two storefronts draw,
       and that is a refactor with its own pixel gate rather than a boolean. It needs a step of its own.
6. [x] **`related-products`**: `columns` responsive and `...CARD_PHOTO`, so it matches every other
       product row.
7. [x] **`campaign-offers`**: `limit` (1–12). **`shop-by-tag`**: `flow`. **`faq`**: `openFirst`.
       **`countdown`** and **`offer-pricing`**: the subheading of step 1, which the X8 list did not
       carry because §2.2 had no row for either until the 2026-09-21 re-read (§7).
8. [x] Labels and hints for every new field in `section-catalogue.ts` — a field with no entry falls back
       to its key, which reads like a bug to a merchant.

### Phase 5 — the media sections

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

1. [ ] **`gallery.frame` becomes responsive** — the Hero and `image-banner` both shape per device; the
       gallery is the odd one out. Copy `image-banner`'s **attribute-plus-variable pair**
       (`data-frame` / `data-frame-m` on `image-banner.tsx`, with the two stylesheet blocks that read
       them), because CSS cannot ask whether a custom property was set — the trap the Hero plan's R2
       records. That is now **one of four** specificity/attribute traps this stylesheet has produced;
       the other three are listed in Phase 2 step 1. Before writing the desktop block, check it can win
       on weight against the phone block it must override.
2. [ ] **`image-banner` stops conflating three answers.** Split today's `align` into:
       `align` (left / centre / right, responsive — where the words sit across the picture),
       `verticalAlign` (top / middle / bottom), and `scrim` (0–80, the shade under the words).
       Unset must reproduce today exactly: left → bottom + the gradient, centre → middle + a 35 % wash.
       ⚠ This is the one step in the phase that can change a live banner if the defaults are wrong —
       pixel-check both existing combinations before anything else.
3. [ ] **`video.ratio` becomes responsive**; its hardcoded widths are already gone in Phase 1.
4. [ ] **`collections-row` and `category-tiles` get a tile shape**: `ratio` (and, where the row's layout
       makes height the better question, `height` in px, responsive — the promo row's own pair). This is
       the size request the design register declined in 2026-09-07 for a good reason at the time; the
       owner's 2026-09-14 direction removes that bar. **Log the answer on that row** rather than leaving
       a `declined` that the code now contradicts.
5. [ ] **`product-grid.sort`**: `newest | price-low | price-high | name` over the existing `source`,
       optional, unset keeping the source's own order.

### Phase 6 — conversion and system pages

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

1. [ ] **`sticky-order-bar.screens`**: `phones` (today) or `phones-and-computers`. The
       `display: none !important` in the `min-width: 680px` block becomes conditional on the attribute.
       ⚠ **An `!important` is only beaten by another `!important` of equal-or-greater weight**, so the
       conditional form has to carry it too — and `:not([data-screens="phones-and-computers"])` inherits
       its argument's weight, which is the fourth trap in Phase 2 step 1. Prefer selecting the state
       that hides over negating the state that shows. ⚠ The bar is `data-float` — it takes no room in the flow — so a desktop bar must
       be checked against a sticky header and the cart drawer, not just eyeballed on one page.
2. [ ] **`search-results` gets words**: `emptyHeading` and `emptyText`, shown when a search finds
       nothing. The one merchant-writable thing on the page, and today it has none.
3. [ ] **`order-form.buttonLabel`** — every other buy control in the builder lets the merchant write the
       button.
4. [ ] **`countdown` answers for zero.** `expired: "hide" | "keepZero" | "message"` (with the message
       a merchant-written string), because reaching zero is the one state the section is guaranteed to
       enter and today it has no answer for it. Unset keeps whatever the renderer draws now — read the
       renderer first and write down which it is, so "unset renders as today" is a checked claim and
       not an assumption.
5. [ ] Re-read §2.2's "out of scope" rows and confirm nothing has moved into range.

### Phase 7 — tests, docs, register, browser QA

**Status:** ⬜ Not started.

1. [ ] `pnpm test`, `pnpm lint`, `pnpm verify` green in both repos; the section-manifest and style-box
       checks included.
2. [ ] A test per new visibility rule, plus the standing guarantee that **a hidden control can never make
       a section unsaveable** (conditional-controls §2.4).
       ⚠ **Write each test from what the merchant asked for, not from what the code does.** Two defects
       on 2026-09-21 were held in place by tests that had written the bug down as the expectation — the
       hero's image-only slide test asserted the card rendered and never that the empty copy element was
       absent, and the promo row's fixture set `cardPerRow: 1` on the phone and then asserted `perRow`
       was *discarded*. Both passed for as long as they existed. Where a step here says "unset renders
       as today", the test asserts the property or element is **absent**, not that something looks
       right.
3. [ ] Browser QA, **phone first**, one matrix row per phase; take the Hero plan's discipline of walking
       it rather than spot-checking — its Phase 5 found two defects that every automated check passed.
       **And run the pixel harness against real stores, which is the only gate that has ever caught
       this class of defect.** On 2026-09-21 a hero regression reached both live storefronts and
       neither 2,506 frontend tests, 3,194 backend tests, typecheck, lint nor four doc gates saw it,
       "because every one of them tests the code against itself and none renders a real merchant's
       data" (master plan §17). 34 screenshots taken beforehand turned "something looks off" into a
       measured +39 px shift and a 10.5-minute rollback.
       - `PIXEL_STORE=<slug> pnpm pixel:capture` **before** the change, `pnpm pixel:compare` after.
       - The minimum set: **UriiBaba** and **LunoraBaby** (the two live merchants), plus **Noor
         Collection** for Phase 3 and any store the Phase 1 step 2 pre-check turned up.
       - Every phase that claims "byte-identical" owes a comparison, not an argument. Phases 1, 2, 3
         and 5 all make that claim.
       - Wait out the storefront's server cache first (Phase 3 step 3b), and re-run a failure before
         acting on it.
4. [ ] Docs in the same change: `SKILL.md` (the storefront reference), `inventory-backend/docs/features/
       ecommerce.md`, `ecommerce-qa.md`, `EZYCORE_MASTER_REFERENCE.md` §V.4–V.5, and the help guide.
5. [ ] **Read the design-requests register against what shipped**, as Phase 6 of the master plan did, and
       update the rows this plan answers — in particular the 2026-09-07 `declined` tile-size row (Phase 5
       step 4).
6. [ ] Update the master plan's §8 "Built" column and §17 with what changed and why.

---

## 4. Decisions — all answered

Answered by the product owner on 2026-09-21 unless noted. Do not re-open one without saying so in §7.

| # | Decision | Answer |
|---|---|---|
| **D1** | What ships first: the dead controls, the shared style box, or a section at a time? | ✅ **Defects → style box → sections.** Phase 1 costs least and buys back the merchant's trust in the preview; Phase 2 lifts all 33 at once; the per-family phases follow. |
| **D2** | How far do per-section colour controls go, given the background already takes any hex while the text takes two tones? | ✅ **Text colour and a background overlay — no per-section brand.** Heading, button and border colours stay on the theme, so a store stays recognisably one design. This is Phase 2 steps 3 and 4; anything further is S2 in §5. |
| **D3** | The style box is hand-copied into both repos with no gate. Generate it, or keep two copies and be careful? | ✅ **Generate it (Phase 0).** The section manifest already proves the pattern and `pnpm verify` already runs the check; being careful is what produced two copies of `SPACING_STEPS`. |
| **D4** | `image-text`: one responsive `imageSide`, or `imageSide` + `mobileFirst` like the Hero? | ✅ **Two settings**, and the Hero's own words for them. The reasoning in hero plan §5 applies unchanged: the devices start from opposite defaults, so a responsive value would inherit the desktop's and move every existing photograph below the fold. |
| **D5** | A subheading on thirteen sections, or let merchants stack a Rich text section above a row? | ✅ **A field.** A stacked section has its own padding, its own width and its own place in the tree, so the pair drifts apart the moment either is styled — and the merchant has to discover the trick first. |
| **D6** | Anchors: merchant-typed, or generated from the section id? | ✅ **Merchant-typed and validated** (`^[a-z0-9][a-z0-9-]{0,39}$`). A generated id is unreadable in a link field and changes when a section is duplicated. The editor's hint lists the anchors already on the page. |
| **D7** | Does this plan touch the system pages' core sections (cart, checkout, account, product, collection)? | ✅ **No.** Those are page layouts with one `layout` enum each by design (master plan §6); a merchant composes *around* them. Named in §5 so it is not re-proposed. |

---

## 5. Out of scope — and why

| Item | Why not now |
|---|---|
| **S1 — per-section heading scale** | `--h1` / `--h2` are the theme's, set store-wide under Look → Heading size. A per-section size is a second typography system and the first one has 12 % adoption. Revisit only with a request on the register. |
| **S2 — per-section brand colour** (heading, button, border, gradients) | D2. The freedom to build 33 differently-branded bands is the freedom to stop having a theme. |
| **S3 — gallery lightbox** | Blocked on the owner, not on design: it needs Bangla words for its controls (master plan §14.1). |
| **S4 — nested columns / a layout container** | Deferred in master plan §8 and still the right call: it changes the section tree, the editor's drag model and the page payload, and every section in this plan is useful without it. |
| **S5 — a tablet breakpoint** | Owner decision 6 (master plan §15). One breakpoint, 679 px. |
| **S6 — per-section product-card style** | `product-grid` cards are the store's `ProductCard`; a per-section style would fork the card, which is the piece most shared across the storefront. The section already overrides the photo's shape and fit, which is the part that composes. |
| **S7 — `single-product` add-ons** (hide quantity, trust row) | One merchant has not asked once. The register's bar still applies to anything this plan does not already carry. |
| **S8 — custom CSS** | Owner decision 5. Note that it is also the reason every gap above is a hard stop rather than a workaround — §3.2 of the design-requests register describes how it would be instrumented if it ever ships. |

---

## 6. Definition of done, per phase

**"Byte-identical" means a pixel comparison came back clean, not that the diff looked safe.** All 21
production stores are on the builder, so every such claim below is a claim about live merchants' pages.
The harness and the store set are in §3 Phase 7 step 3.

| Phase | Done when |
|---|---|
| 0 | The style box is generated into the backend, `checkStyle` reads it, the backend's private `SPACING_STEPS` is gone, both repos' `verify` is green, and the backend is shipped. |
| 1 | Text alignment visibly moves all nine headings; each of the six sections honours a set Width and is byte-identical with Width unset; the four classic `SectionTitle` callers emit no `--sfb-title-justify` and are byte-identical; a CTA that answers its own alignment shows one control, and a CTA that does not keeps the Style tab's working; the two tile rows keep both controls under names that tell them apart; eight `how-to-order` steps wrap; UriiBaba and LunoraBaby compare clean. |
| 2 | Every one of the six style keys changes the page, is refused when invalid, keeps its value when hidden, and leaves a section that sets none rendering byte-identically to today. A background picture with an overlay and custom text is readable on a phone. |
| 3 | `image-text` can lead a phone with either the picture or the copy, split 20–80 on each device, take its own phone picture, and fit or crop it; unset renders byte-identically. **Noor Collection's home re-migrated and pixel-identical to the classic home it replaced — 22 of 22, up from 21.** |
| 4 | Thirteen sections take a subheading; `benefits` shows two columns on a phone; eight `how-to-order` steps sit in a chosen number of columns; the carousel's per-view and arrows reach the island and work. |
| 5 | The gallery shapes per device; `image-banner`'s three answers are three controls and both old combinations are pixel-identical; collection tiles take a shape. |
| 6 | The sticky bar can stand on a desktop without breaking the header or the drawer; an empty search shows the merchant's words; a countdown that has reached zero does what the merchant chose. |
| 7 | All checks green, the browser matrix walked phone-first, every doc in §3 Phase 7 step 4 updated in the same change, and the register re-read with its stale row answered. |

---

## 7. Progress log

Anything a fresh reader could not re-derive from the code goes here, as it happens: a decision that
moved, a trap that cost an hour, a step that turned out to be wrong.

- **2026-09-21 — the audit (§2).** All 33 section types read against their renderers, the shared style
  box and `storefront-builder.css`. Two findings were not in any plan: the Style tab's Text alignment is
  dead on eight sections because `SectionTitle` is a flex row (X1), and six sections hardcode a column
  width that beats the Style tab's Width (X2) — the Hero's W1, six more times. Both are Phase 1.
- **2026-09-21 — the migration found the first of these gaps before the plan did.** Moving the classic
  editorial split onto `image-text` (master plan §17) left one visible difference on a production
  store: the classic band **fits** its photograph inside the 4:5 box and `image-text` **crops** it,
  because `.sfb-split-media` is `object-fit: cover` with no control. Phase 3 gained `imageFit` and the
  re-migration that closes it. Worth noting for the rest of this plan: a control gap is cheap to argue
  about and expensive to discover on a live page.
- **2026-09-21 — Phase 4, and a CSS rule that would have broken the desktop.** A column count wants to
  become `grid-template-columns: repeat(var(--cols), …)`, and the obvious way to apply that only when
  the merchant answered is to select on `[style*="--cols"]`. **That selector also matches `--cols-m`**,
  so a phone-only answer would switch the DESKTOP to a track list built from a variable that is not set
  there — `grid-template-columns` computes to invalid and the row collapses. The variable therefore
  carries the whole **track list** (`grid-track.ts`), so the stylesheet's own
  `var(--x, <the row's own layout>)` is the unset case and no second selector is needed. Three rows use
  it: `benefits`, `how-to-order`, `testimonials`.
  - **`testimonials.columns` needs `flow: wrap` on a phone.** The phone's swipe row is a flex track and
    has no columns to count, so the column control there is conditional on the row being a grid — said
    in the field's hint rather than left for a merchant to discover.
  - **A subheading that is unset adds no markup.** `SectionTitle` and the new `SectionLede` both return
    exactly what they returned before when no line is given — the bare `<h2>` with its own margin, or
    the flex row — because the four classic callers pass none and 21 live stores carry sections that
    do not. Each of the five inline sections kept its own bottom margin (16, 18, 16, 14 and 8), which
    is why `SectionLede` takes it as a prop rather than picking one.
  - **`arrows` was dropped from this phase**, with the reason in step 5: it is a refactor of a
    component both storefronts draw, not a boolean.
- **2026-09-21 — Phase 3, and the change that unblocks every later responsive field.** Making a
  setting responsive **refused every value already saved for it**: `checkField` and `readField` both
  required `{ base, mobile }`, so `imageRatio: "4:5"` on a live page would have rendered as the default
  and failed the merchant's next save. Neither a `v` bump nor leaving the field alone is a way out of
  that. Both readers now take a **non-object** bare value as the base.
  - Only non-object. A responsive `focal` or `image` stores an object as its scalar, and a bare one
    cannot be told apart from a malformed wrapper, so those keep the strict rule.
  - This is a deliberate contract change: a backend test that asserted the refusal, and a frontend test
    named "drops a responsive field that is not `{ base, mobile }`", both now assert the opposite. They
    were written from the code's behaviour, and the behaviour was wrong.
  - It matters beyond this phase: `gallery.frame`, `benefits.columns`, `testimonials.columns` and
    `video.ratio` are all responsive-ized later in this plan, all with values already saved.
  - **`image-text.split` is NOT responsive**, against the plan's own snippet. `category-promo-cards`
    keeps its cards side by side on a phone, so a phone split means something there; this section
    stacks into one column, where there is no row left to divide. A responsive value would have been a
    value nothing draws — the thing the conditional-controls plan exists to prevent.
  - ⚠ **Past the breakpoint, `mobileFirst`'s ordering has to be reset explicitly.** `order: 1` set for
    the phone would otherwise survive into the desktop block and flip the row against `imageSide`. The
    reset and the side rule carry the same weight, so their source order is what decides — the fifth
    time this stylesheet's cascade has had to be reasoned about rather than assumed.
- **2026-09-21 — Phase 2 built. Three things the plan did not say:**
  - **`padding.inline` had to be optional inside a required pair.** `top` and `bottom` are stored
    together and every one of them is required once a side is given; `inline` arrived after live pages
    had already saved that pair, so requiring it would have refused every one of them on its next save.
    The spacing spec grew `optionalEdges` for exactly this, and `withPadding` had to stop treating "an
    edge was cleared" as "drop the whole padding".
  - **The overlay is switched by an attribute, not by its variable.** CSS cannot ask whether a custom
    property was set, so a `::before` keyed on `--sfb-overlay` alone would paint a transparent layer —
    and `isolation: isolate` plus a positioned `.sfb-inner` — over every section that has none. The
    frame therefore reports `overlay` as well as emitting the value, and the element carries
    `data-overlay`. Same trap as the hero plan's R2, in a new place.
  - **Three of Phase 2's conditions live in the Style tab, not in `field-visibility`.** Radius at full
    width, the overlay on a picture background, the colour box on the custom tone — all three turn on
    the STYLE box, and `FieldScope` carries only `settings` and `blocks`. Rather than widen that
    contract for three conditions, the tab renders them conditionally the way it already renders the
    background colour and picture fields. ⚠ The radius one is paired with a real CSS override
    (`.sfb-sec[data-width="full"] { border-radius: 0 }`), because hiding a control whose renderer still
    drew something is the lie `field-visibility`'s rule 2 exists to prevent.
  - **X6's warning about islands was half right.** `testimonials`, `benefits` and `sticky-order-bar` do
    set their own `color` — but each sets `background: var(--card)` in the same breath, so a card on a
    dark section must keep the theme's text colour rather than inherit the band's. They are correct as
    they stand. The real gap is X13, and it is older than this plan.
- **2026-09-21 — Phase 1 built, and X11 was two findings, not one.** The audit said three sections
  offered "two controls for one question". Reading the renderers says otherwise, and the difference
  matters enough to record:
  - **`call-to-action` really is one question twice.** `.sfb-cta` is
    `text-align: var(--sfb-cta-align, inherit)`, so the section's own answer wins where it is given and
    the Style tab's applies where it is not. The precedence was never wrong; offering both at once was.
    Hidden, not disabled — **`ownsAlign` would have been a live regression**, because a CTA centred
    through the Style tab today would have jumped left on 21 production stores.
  - **`collections-row` and `category-tiles` are a different question wearing the same word.** A grid
    already spans the content column, so `align` there places each tile *inside its own column*
    (`GRID_ALIGN`), while the Style tab's moves the heading. Had the plan been implemented as written,
    those two would have lost the only control that moves their heading. Recorded as X12, fixed by
    naming: "Tile position", with a hint pointing at the other control.
  - The general lesson, worth carrying into the remaining phases: **two controls sharing a label are
    not thereby the same control** — and an audit row that names a defect in the editor has to be
    confirmed in the renderer before it is acted on.
- **2026-09-21 — X2 is one mechanism, not six.** Each of the six sections passes its own column as
  `--sfb-own-column` and wears `.sfb-own-column`; one stylesheet rule applies it, and one more
  (`.sfb-sec[data-styled-width] .sfb-own-column`) takes it away. That suits `video`, whose column is
  880 or 420 by its shape, and `selected-products`/`collections-row`, whose column is a `calc()` — none
  of which fits a per-type constant in the section registry.
  - ⚠ **`data-styled-width` is not `data-width`.** An unset style box and an explicit "Page column"
    both resolve to `width: "content"`, so the attribute is stamped from whether `style.width` really
    held a valid value — a new `styledWidth` on `SectionFrame`, deliberately separate from `width`. An
    invalid stored width is no answer, the same way `width` itself falls back.
- **2026-09-21 — Phase 0 built, and the style box is copied rather than re-serialized.** Step 2 said the
  generator should emit `STYLE_BOX_SPEC` with the same literal writer that emits `SECTION_MANIFEST`. It
  copies `style-specs.ts` **verbatim** instead, the way `field-specs.ts` is already copied, because that
  file imports nothing and so its source is already valid backend TypeScript. Copying keeps the doc
  comments — where the reasoning behind each value lives — and removes a serialization step that could
  itself drift. `SECTION_SPECS` cannot be copied this way because its module carries an `import type`.
  Two other things worth knowing:
  - **`background`'s sub-keys are in the spec too** (`keys: ["kind", "color", "image"]`), not just its
    `kinds`. Without them the backend would still hand-write one allowlist, which is the whole defect.
  - **`checkResponsiveEnum` is gone.** Its only caller was `checkStyle`'s `align`, and the generic
    responsive wrapper now covers it. The wording of every error is unchanged — deliberately, since
    `padding`'s hand-rolled wrapper already said exactly what `checkField`'s says.
  - **The tests were mutation-checked, not just run green.** Replacing the spec-derived allowlist with a
    hand-written one fails "accepts textTone"; dropping the walk over the spec's fields fails three more.
    A test that passes whichever way the code behaves is the trap this plan's Phase 7 step 2 names.
- **2026-09-21 — the plan re-read against `d3d2fdcd`, after the production release.** Every finding in
  §2 was re-checked in the code and all of X1–X10 still hold exactly as written. Five things had moved
  underneath the plan and are now folded in:
  - **There are 34 section types, not 33.** `call-to-action`, `countdown` and `offer-pricing` had no
    audit row at all — `offer-pricing` was even named in §0.4's island list and then never audited.
    §2.2 now carries them, plus `promises-band`, which X1 and X8 both reach.
  - **X11 is new and is not a variant of X1.** X1 is alignment that does nothing; X11 is alignment that
    does two things. `SECTIONS_ALIGNING_THEMSELVES` names `hero` alone, so `call-to-action`,
    `collections-row` and `category-tiles` each show the Style tab's control beside their own. It moved
    into Phase 1 because it is a live defect, and because answering it the `ownsAlign` way costs no spec
    field; deleting the per-section field instead would make every saved page carrying one unsaveable.
  - **The blast radius changed.** The plan was written as though Noor Collection were the only
    production store on the builder. All 21 are (master plan §17), including two live merchants.
  - **Unit tests are not the gate, and the record now says so.** The 2026-09-21 hero incident reached
    both live storefronts past every automated check; the pixel harness caught it. Phase 7 step 3 names
    the harness, the commands and the store set, and step 2 carries the lesson that a test written from
    the code's behaviour defends the defect.
  - **Line references drift.** Several `file.ts:NN-NN` citations in §2 were already one or two lines off
    a week after they were written. The ones that will keep moving now cite the symbol instead.
- **2026-09-21 — the style box has no gate.** `checkStyle` hand-names its allowed keys and carries its
  own `SPACING_STEPS`; the section manifest's `--check` does not cover it. Phase 0 exists because of
  this, and it is why nothing merchant-visible ships first.
