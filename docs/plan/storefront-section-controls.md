# Storefront Builder — every SECTION gets the shape controls the Hero just got

**Written:** 2026-09-21 · **Repos:** `inventory-frontend` **and `inventory-backend`** (the spec and the
style box both grow — see §0.5) · **Branch:** `feat/storefront-builder`

**Progress: see §0.8. That board is the source of truth for what is done — keep it current.**

---

## 0. Start here

You do not need any prior context on this work. Read §0 in full before opening a file.

### 0.1 Read first

| Document | Why |
|---|---|
| `inventory-frontend/docs/plan/storefront-hero-shape-controls.md` | The plan this one generalizes. The Hero got `frame`, `imageSide`, `mobileFirst` and `mobileCopy`; this plan takes the same argument to the other 32 sections. Its §0.5 deploy rule and §5 ("why not one responsive `imageSide`") are load-bearing here. |
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

**(b) The style box is NOT generated — and nothing gates it.** `checkStyle`
(`storefront-section-validation.ts:275-330`) hand-names `["background", "padding", "width", "align",
"textTone"]` and carries its **own private copy of `SPACING_STEPS`** at line 47. The frontend's copy is
in `section-style.ts`. Two hand-kept lists, no check, and this plan's Phase 2 adds six keys to them.

**Phase 0 fixes that before anything else is added**, by generating the style box the same way sections
are generated. Until Phase 0 ships, treat every style key as a two-repo hand edit with a backend-first
deploy and no safety net.

**Version bumps.** Every field this plan adds is `optional`, so a section saved before it stays valid and
`v` stays where it is. Widening an enum (align gains `right`) is also safe. **Do not bump `v`** — the
backend refuses any other version, so an unnecessary bump turns every saved page carrying that section
into a failed save.

### 0.6 Branch

`feat/storefront-builder` in both repos. The Hero work is on it (`cbd6cedd` and before). Per the owner's
standing rule, **do not push and do not open a PR** unless asked for that specific push.

### 0.7 What is blocked

**Phases 1 is unblocked and changes no spec field** — it can go at any time.
**Phases 2–6 need Phase 0 in production**, because each adds keys the deployed backend would refuse.
**No phase is blocked on a decision**: D1–D7 in §4 are all answered.

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
| Audit (§2) | 33 sections read against their renderers, the style box and the CSS | ✅ Done 2026-09-21 |
| 0 (§3) | One source for the style box; backend generated and shipped | ⬜ Not started |
| 1 (§3) | Controls that exist and do nothing — six hardcoded columns, one dead alignment | ⬜ Not started |
| 2 (§3) | The style box grows: side padding, corners, border, overlay, text colour, right, anchor | ⬜ Not started |
| 3 (§3) | `image-text` gets the Hero's per-device treatment | ⬜ Not started |
| 4 (§3) | The row sections: subheading, columns per device, flow | ⬜ Not started |
| 5 (§3) | Media sections: gallery shape per device, banner position + scrim, video shape | ⬜ Not started |
| 6 (§3) | Conversion + system: sticky bar on desktop, search's empty words, small ones | ⬜ Not started |
| 7 (§3) | Tests, docs, register review, browser QA | ⬜ Not started |
| Deferred (§5) | S1 heading scale · S2 per-section brand colour · S3 lightbox · S4 nested columns · S5 tablet | ⬜ Not planned |

---

## 1. The problem in one paragraph

The Hero can now be shaped: three layouts, a per-device frame, which side the picture takes, which of
the picture and the copy leads the phone. **No other section can.** Thirty-two section types accept the
merchant's words and nothing else — the columns, the card, the crop, the gutter, the corner and the
colour are all in `storefront-builder.css` or in a renderer's inline style. Worse than absent: six
sections hardcode a column width that **silently beats the Style tab's own Width control**, and the
Style tab's **Text alignment does nothing at all** on the eight sections that draw their heading through
`SectionTitle`. A merchant who moves a control and sees no change learns that the preview lies — which
is the cost the conditional-controls plan was written to stop paying, and it is being paid on the Style
tab now.

## 2. Audit — what a merchant cannot control today

Read against the code on 2026-09-21 (`cbd6cedd`). Two tables: what is wrong everywhere, then what is
wrong per section.

### 2.1 Cross-cutting (every section)

| # | What the merchant cannot control | Where it is nailed down |
|---|---|---|
| **X1** | **Style → Text alignment does nothing for eight sections' headings.** `SectionTitle` is `display:flex; justify-content:space-between`, so `text-align: center` on `.sfb-sec` cannot move a flex item. | `sf-bits.tsx:279-295` (the `justifyContent: "space-between"` at `:291`); used by `product-grid`, `product-carousel`, `gallery`, `promises-band`, `category-tiles`, `collections-row`, `shop-by-tag`, `category-promo-cards` — and `selected-products` repeats the same flex row inline |
| **X2** | **Six sections hardcode a column width that beats Style → Width.** The same two-controls-one-question defect as the Hero's W1, on six sections at once. | `rich-text.tsx:10` (780), `faq.tsx:15` (780), `selected-products.tsx:30` (980), `collections-row.tsx:36` (980), `order-form.tsx:25` (560), `video.tsx:25` (880/420) |
| **X3** | **No side padding.** The style box is top/bottom only, so a section cannot be inset. | `section-style.ts` `readPadding` |
| **X4** | **No corners, no border.** Store-wide Corners exist; a section cannot round or outline its own band. | `sectionFrame` emits background, padding and align only |
| **X5** | **A background picture has no overlay.** `background-size: cover; background-position: center` fixed, no shade. Dark photo + dark text is unreadable and the only escape is Text tone. | `storefront-builder.css:12-17` |
| **X6** | **Text colour is two hardcoded hexes** (`#ffffff`, `#0f172a`) while the background beside it takes any hex. | `storefront-builder.css:19-26` |
| **X7** | **No right alignment** in the style box — though `collections-row` and `category-tiles` both offer `right` in their own settings. | `section-style-fields.tsx` `ALIGNS` |
| **X8** | **No subheading on any row section.** Thirteen sections offer a heading and nothing under it. | `product-grid`, `product-carousel`, `selected-products`, `gallery`, `testimonials`, `benefits`, `faq`, `campaign-offers`, `shop-by-tag`, `collections-row`, `category-tiles`, `related-products`, `promises-band` |
| **X9** | **No anchor on a section**, so a hero button cannot scroll to the order form further down the page — the core move of a landing page. The sticky bar reaches it through a private attribute no merchant can type. | `order-form-anchor.ts`; `isAllowedSectionUrl` (backend) refuses `#order` outright |
| **X10** | **No custom spacing or width value** — five steps, three widths, nothing between. | `SPACING_STEPS`, `WIDTHS` |

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
| **benefits** | **A phone is always one column** — `columns` is written into a `min-width: 680px` block, so the control the merchant sets is the only screen it cannot reach. | 4 |
| **how-to-order** | **No column control, and the desktop cannot wrap**: `grid-auto-flow: column` gives eight steps eight columns. | 1 (wrap), 4 (control) |
| **testimonials** | No columns (desktop is a fixed `auto-fill minmax(260px, 1fr)`), no choice about the phone's 85 %-wide swipe row. | 4 |
| **product-carousel** | Nothing but heading, source and limit: no cards in view, no arrows. | 4 |
| **product-grid** | No sort order (`featured / newest / category / tag / manual` only), no per-section card style. | 5 (sort), out of scope (card style) |
| **related-products** | Heading and limit only — no columns, and no card photo shape, which every other product row has. | 4 |
| **campaign-offers** | Heading only — no limit. | 4 |
| **shop-by-tag** | Heading and tags only — the chips cannot wrap or scroll by choice. | 4 |
| **selected-products** | Locked to 980 px (X2); capped at six by design. | 1 |
| **faq** | Locked to 780 px (X2); no "open the first one". | 1, 4 |
| **rich-text** | Locked to 780 px (X2) whatever Width says. | 1 |
| **gallery** | `frame` is **not** responsive, though `image-banner`'s is and the Hero's is. | 5 |
| **image-banner** | **`align` decides three things at once** — left means bottom-anchored under a gradient, centre means middle-anchored under a flat 35 % wash. A merchant cannot ask for left copy in the middle of the picture, and cannot touch the scrim. | 5 |
| **video** | Locked to 880 / 420 px (X2); `ratio` is not responsive. | 1, 5 |
| **collections-row**, **category-tiles** | Good column, alignment and label controls; **no tile shape or height**, which is the size question the design register's row 3 declined and then answered by moving the merchant to another section. | 5 |
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

**Status:** ⬜ Not started · **Blocks:** phases 2–6 reaching production.

The style-box vocabulary is hand-copied into two repos with no gate (§0.5b). Phase 2 adds six keys to
it. Generate it first, or the gate that catches section drift will keep missing style drift.

1. [ ] New `lib/storefront-builder/style-specs.ts`, under `field-specs.ts`'s rules — **no imports of any
       kind, only erasable TypeScript** — exporting `STYLE_BOX_SPEC`: the allowed keys, the spacing
       steps, the width and tone values, and which are responsive. Move `SPACING_STEPS` here and have
       `section-style.ts` import it, so the frontend has one copy too.
2. [ ] `scripts/gen-section-manifest.mjs` emits `STYLE_BOX_SPEC` into the backend manifest beside
       `SECTION_MANIFEST`. Same literal writer, same `--check` behaviour.
3. [ ] `checkStyle` reads the emitted spec instead of its hand-written allowlist; delete the backend's
       private `SPACING_STEPS` (line 47).
4. [ ] A backend test that a style key absent from the spec is refused, and one that every key in the
       spec is accepted — so the two can never drift silently again.
5. [ ] `pnpm gen:section-manifest`, commit the backend file, `pnpm verify` green in both repos.
6. [ ] **Ship the backend.** (Owner's deploy.)

**Nothing merchant-visible changes in this phase.** That is the point: it is the scaffolding the next
five stand on.

### Phase 1 — the controls that already exist and do nothing

**Status:** ⬜ Not started · **Changes no spec field** — can ship before Phase 0 reaches production.

Both items here are the Hero's W1 shape: a merchant moves a control and the page does not move.

1. [ ] **X1 — `SectionTitle` respects the section's alignment.** Give its wrapper
       `justify-content: var(--sfb-title-justify, space-between)` and the builder frame a
       `--sfb-title-justify` derived from the resolved align (`left`→`flex-start`,
       `center`→`center`, `right`→`flex-end`). **The four classic callers emit no such variable and are
       byte-identical** (§0.3) — assert that with a test, not with care.
       - With a heading and no action link, drop the flex row entirely and let `text-align` do the work.
       - `selected-products` repeats the same row inline (`selected-products.tsx:32`); fix it the same
         way rather than leaving a ninth copy.
2. [ ] **X2 — the six hardcoded columns stop beating Style → Width.** In each of `rich-text`, `faq`,
       `selected-products`, `collections-row` (plain), `order-form` and `video`, apply the built-in
       column **only where the style box set no width** — the same inverted `??` precedence `ownsWidth`
       uses, and for the same reason. A section nobody has styled keeps its exact column; a merchant who
       picks Wide or Full width now sees it.
       ⚠ Do **not** solve this by hiding the Width control: these sections have a legitimate answer for
       each of the three widths. Hiding is only correct where "no effect" is intended and permanent
       (conditional-controls §1, rule 2).
3. [ ] **`how-to-order` wraps.** Replace `grid-auto-flow: column` with
       `repeat(auto-fit, minmax(220px, 1fr))` so eight steps make two readable rows instead of eight
       slivers. The control itself is Phase 4; this is the defect underneath it.
4. [ ] Tests: alignment reaches each of the nine headings; each of the six sections honours a set width
       and keeps its own when unset; the classic callers are unchanged.

### Phase 2 — the style box grows

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

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

1. [ ] **X3 side padding.** `padding.inline`, responsive like its two neighbours, rendered as
       `--sfb-pi` / `--sfb-pi-m` on `.sfb-inner`. ⚠ It must **compose with** the four
       `[data-width="full"] > .sfb-inner:has(…)` rules that drop the gutter today, not fight them: a
       merchant who sets side padding on a full-width banner is asking for exactly that gutter back.
2. [ ] **X4 corners and border.** `--sfb-radius` and a `data-border` attribute on `.sfb-sec`. A
       full-width section keeps square corners (the banner already does this at
       `storefront-builder.css:259`); hide `radius` there through `field-visibility` rather than
       letting it store a value nothing draws.
3. [ ] **X5 overlay.** `--sfb-overlay` painted by a `::before` over the background image, under the
       content. **Visible only when `background.kind === "image"`** — register the rule; do not let it sit
       dead on a colour background.
4. [ ] **X6 text colour.** Widen the tone control to four options and show the hex field only on
       `custom`. Reuse `BackgroundColour`'s "keep what is typed until it is a whole `#RRGGBB`" behaviour
       (`section-style-fields.tsx:123`) — the bug it fixes is the same one.
       ⚠ **Sections that draw through an island do not inherit it** (`campaign-offers`, `content-frame`,
       `product-cards`…): CSS `color` inherits, so a section whose island sets its own colour will not
       follow. List the offenders in the commit; fixing them is part of this step, not a follow-up.
5. [ ] **X7 right alignment.** Widen the enum in the spec, the editor and `readAlign`. Widening never
       invalidates a stored value, so no `v` moves.
6. [ ] **X9 anchor.** `id` on the `<section>`, plus **both ends of the link path widened to accept
       `#anchor`**: `isAllowedSectionUrl` (backend, line 74) refuses it today, and `merchantLinkHref`
       would treat it as a store path. The editor's hint names the anchors already on the page.
7. [ ] Editor: the Style tab keeps its shape — every new control gets "Section's own" as its unset
       choice, a hint that says where the value comes from, and a phone marker where it is responsive.
8. [ ] Tests: each key round-trips through `sectionFrame`; an invalid value falls back rather than
       failing the section; `checkStyle` refuses an unknown key and each bad value; a hidden control
       keeps its stored value.

### Phase 3 — `image-text` gets the Hero's per-device treatment

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

The Hero's M6 in another section: two devices, opposite defaults, one control. Follow the Hero's answer
exactly — **two settings, not one responsive one** (hero plan §5, D4) — because the devices start from
different defaults and a responsive value would inherit the desktop's and move every existing photo.

```ts
// section-specs.ts — "image-text".settings
mobileFirst: { type: "enum", values: ["picture", "text"], optional: true },
split:       { type: "number", min: 20, max: 80, int: true, responsive: true, optional: true },
mobileImage: { type: "image", optional: true },
// and imageRatio gains `responsive: true`
```

1. [ ] `mobileFirst` — which of the picture and the copy leads the phone's single column. Same label and
       hint as the Hero's, so the two sections ask the question in one voice.
2. [ ] `split` — the picture's share past the breakpoint, in percent, responsive. Replaces the fixed
       `1fr 1fr` as `grid-template-columns: var(--sfb-split, 1fr) var(--sfb-split-rest, 1fr)`; reuse
       `category-promo-cards`'s own `split` range (20–80) rather than inventing a second one.
3. [ ] `imageRatio` responsive, and `mobileImage` — `SfImage` already takes a phone picture
       (`image-banner.tsx:45`), so this is plumbing, not new machinery.
4. [ ] Visibility rules: `mobileFirst` only with a picture; `split` only past the breakpoint's control
       set — register both, and add the test that a hidden field is optional.
5. [ ] Browser QA **phone first**: photo-first and text-first, 20 / 50 / 80 splits, a portrait phone
       picture with a landscape desktop one.

### Phase 4 — the row sections earn their shape

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

Thirteen sections offer a heading and nothing else about their own arrangement.

1. [ ] **X8 subheading.** `subheading: { type: "string", max: 240, optional: true }` on the thirteen
       sections in §2.1. One renderer change: `SectionHeading` and `SectionTitle` grow an optional line
       under the title — **inert for the four classic callers**, which pass none (§0.3).
2. [ ] **`benefits.columns` becomes responsive**, and the CSS moves out of the `min-width: 680px` block
       so a phone can take two. Unset keeps today: up to three past the breakpoint, one on a phone.
3. [ ] **`how-to-order.columns`**, responsive, over Phase 1's wrap as the unset default.
4. [ ] **`testimonials`**: `columns` responsive, and `flow: "wrap" | "scroll"` responsive — the phone's
       swipe row becomes the default rather than the law. Reuse `category-promo-cards`'s `flow`
       vocabulary; do not mint a second word for the same idea.
5. [ ] **`product-carousel`**: `perView` responsive and `arrows` boolean, again in the promo row's
       vocabulary. ⚠ Both must reach the **island** (`product-rail`), not stop at the renderer (§0.4).
6. [ ] **`related-products`**: `columns` responsive and `...CARD_PHOTO`, so it matches every other
       product row.
7. [ ] **`campaign-offers`**: `limit` (1–12). **`shop-by-tag`**: `flow`. **`faq`**: `openFirst`.
8. [ ] Labels and hints for every new field in `section-catalogue.ts` — a field with no entry falls back
       to its key, which reads like a bug to a merchant.

### Phase 5 — the media sections

**Status:** ⬜ Not started · **Needs Phase 0 in production.**

1. [ ] **`gallery.frame` becomes responsive** — the Hero and `image-banner` both shape per device; the
       gallery is the odd one out. Copy `image-banner`'s **attribute-plus-variable pair**
       (`data-frame` / `data-frame-m`, `image-banner.tsx:66-72` with the stylesheet at `:209` and `:329`), because CSS cannot ask whether a custom property was set — the
       trap the Hero plan's R2 records.
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
       `display: none !important` past the breakpoint (`storefront-builder.css:363-364`) becomes conditional
       on the attribute. ⚠ The bar is `data-float` — it takes no room in the flow — so a desktop bar must
       be checked against a sticky header and the cart drawer, not just eyeballed on one page.
2. [ ] **`search-results` gets words**: `emptyHeading` and `emptyText`, shown when a search finds
       nothing. The one merchant-writable thing on the page, and today it has none.
3. [ ] **`order-form.buttonLabel`** — every other buy control in the builder lets the merchant write the
       button.
4. [ ] Re-read §2.2's "out of scope" rows and confirm nothing has moved into range.

### Phase 7 — tests, docs, register, browser QA

**Status:** ⬜ Not started.

1. [ ] `pnpm test`, `pnpm lint`, `pnpm verify` green in both repos; the section-manifest and style-box
       checks included.
2. [ ] A test per new visibility rule, plus the standing guarantee that **a hidden control can never make
       a section unsaveable** (conditional-controls §2.4).
3. [ ] Browser QA, **phone first**, one matrix row per phase; take the Hero plan's discipline of walking
       it rather than spot-checking — its Phase 5 found two defects that every automated check passed.
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

| Phase | Done when |
|---|---|
| 0 | The style box is generated into the backend, `checkStyle` reads it, the backend's private `SPACING_STEPS` is gone, both repos' `verify` is green, and the backend is shipped. |
| 1 | Text alignment visibly moves all nine headings; each of the six sections honours a set Width and is byte-identical with Width unset; the four classic `SectionTitle` callers are byte-identical; eight `how-to-order` steps wrap. |
| 2 | Every one of the six style keys changes the page, is refused when invalid, keeps its value when hidden, and leaves a section that sets none rendering byte-identically to today. A background picture with an overlay and custom text is readable on a phone. |
| 3 | `image-text` can lead a phone with either the picture or the copy, split 20–80 on each device, and take its own phone picture; unset renders byte-identically. |
| 4 | Thirteen sections take a subheading; `benefits` shows two columns on a phone; eight `how-to-order` steps sit in a chosen number of columns; the carousel's per-view and arrows reach the island and work. |
| 5 | The gallery shapes per device; `image-banner`'s three answers are three controls and both old combinations are pixel-identical; collection tiles take a shape. |
| 6 | The sticky bar can stand on a desktop without breaking the header or the drawer; an empty search shows the merchant's words. |
| 7 | All checks green, the browser matrix walked phone-first, every doc in §3 Phase 7 step 4 updated in the same change, and the register re-read with its stale row answered. |

---

## 7. Progress log

Anything a fresh reader could not re-derive from the code goes here, as it happens: a decision that
moved, a trap that cost an hour, a step that turned out to be wrong.

- **2026-09-21 — the audit (§2).** All 33 section types read against their renderers, the shared style
  box and `storefront-builder.css`. Two findings were not in any plan: the Style tab's Text alignment is
  dead on eight sections because `SectionTitle` is a flex row (X1), and six sections hardcode a column
  width that beats the Style tab's Width (X2) — the Hero's W1, six more times. Both are Phase 1.
- **2026-09-21 — the style box has no gate.** `checkStyle` hand-names its allowed keys and carries its
  own `SPACING_STEPS`; the section manifest's `--check` does not cover it. Phase 0 exists because of
  this, and it is why nothing merchant-visible ships first.
