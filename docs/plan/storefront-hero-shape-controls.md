# Storefront Builder — the Hero's SHAPE belongs to the merchant, per device

**Written:** 2026-09-20 · **Revised:** 2026-09-21 after the code review in §8 · **Repos:**
`inventory-frontend` **and `inventory-backend`** (the spec grows — see §0.5)

**Progress: see §0.8. That board is the source of truth for what is done — keep it current.**

---

## 0. Start here

You do not need any prior context on this work. Read §0 in full before opening a file.

### 0.1 Read first

| Document | Why |
|---|---|
| `inventory-frontend/docs/plan/storefront-builder-conditional-controls.md` | The plan this one continues. It shipped the Hero's content clean-up and the visibility mechanism (`field-visibility.ts`) that five steps here depend on. Its §11 log records the traps. |
| `inventory-frontend/docs/plan/storefront-section-controls.md` | The plan this one is continued by. It takes this plan's argument — a merchant owns the shape, per device — to the other 32 sections, and its §2 audit is the list of what they still cannot control. Read it before adding a control to any section, so the two ask the same question in one voice. |
| `inventory-backend/docs/plan/storefront-builder.md` | The master plan every code comment cites ("plan §17, Phase 5 step 5", "§5.2 `SectionStyle`"). |
| `.claude/skills/storefront/SKILL.md` | The storefront reference: hero branches, image fit and focal rules, and "Every hero rotates in its OWN shape". |
| `inventory-frontend/CLAUDE.md` | Repo conventions. `// coding-standard: maintained` on line 1 means the file already conforms — make your change and skip the standard review. Every file named here carries the marker. |

### 0.2 Where the code lives

| Directory | What it holds |
|---|---|
| `components/storefront/` | The **live storefront** renderers — shared by the classic home page *and* the builder. |
| `components/storefront-builder/` | Builder section wrappers and islands. `sections/hero.tsx` picks a branch and calls the renderers above. |
| `components/ecommerce/pages/editor/` | The **merchant's editor** — inspector, field controls, catalogue, labels, hints, visibility. |
| `lib/storefront-builder/` | Specs, the style box, `responsive.ts`, and (phase 0) `aspect-ratios.ts`. |
| `app/(storefront)/storefront.css` | The storefront stylesheet. **Every hero rule in this plan lives here**, not in `storefront-builder.css` — the hero renderers are shared with the classic home. |

### 0.3 Every hero renderer has two callers

`components/storefront/home/hero-static.tsx`, `…/hero-fullbleed.tsx` and `components/storefront/hero-slides.tsx`
are shared between the builder and the **classic home page**
(`components/storefront/home/sections/hero-sections.tsx`), which every store not yet migrated still renders.

**Check both callers before changing any signature.** Every prop, attribute and custom property this plan
adds falls back to today's rendering when unset, so the classic callers — which pass nothing — are
untouched. **Exactly one change in this plan breaks that promise: D2 in phase 4.** It is isolated, and
§4's D2 says why it is safe here.

### 0.4 Islands

Builder sections are server components; client code is `<Island name="…" props={…} />`, registered in
`components/storefront-builder/islands/island-map.tsx`. Props cross a server→client boundary, so they must
be plain serializable data. The rotating hero (`hero-slides`) and both full-bleed islands take props this
plan adds — **thread them through or the control works on a static hero and silently does nothing on a
rotating one.** A prop that stops at `sections/hero.tsx` is the exact miss logged in the previous plan's
§11; it cost a live browser session to find.

### 0.5 ⚠ This plan DOES change the spec shape — deploy the backend first

Unlike the plan before it, this one adds settings to `lib/storefront-builder/section-specs.ts`.

That file and `field-specs.ts` are the source of the backend's **generated** manifest
(`inventory-backend/src/constants/storefront-section-manifest.ts`), and
`inventory-backend/src/utils/storefront-section-validation.ts` **refuses any setting the manifest does not
describe**.

So, in order, and not negotiable:

1. Add the fields to `section-specs.ts`.
2. `pnpm gen:section-manifest` in `inventory-frontend`.
3. Commit the backend's regenerated manifest **in the backend repo**.
4. **Ship the backend before the frontend.**

Skip step 4 and the editor offers a control whose save is rejected with no useful message. `pnpm verify`
runs `gen:section-manifest --check`, which fails the build when the two drift — it is the gate, not a
reminder.

`v` stays `1` on the hero. Every field added here is `optional`, so an instance saved before them is still
valid; a version bump would refuse every existing hero on the site.

### 0.6 Branch

`feat/storefront-builder` in both repos. The previous plan's work is committed there as `74b98613`, which
also **deleted `components/storefront/hero-carousel.tsx`** and its CSS — if you are holding line numbers
from before that commit, they are ~204 lines out in `storefront.css`.

### 0.7 What is blocked

**Nothing.** D1–D5 in §4 are all answered. Phase 0 must ship to production before phases 1–3 (§0.5);
phase 4 changes no spec field and can go at any time.

### 0.8 Recording progress — read this before you write any code

This plan is the handover. Someone will pick it up not knowing what you finished.

**The rule: anything you finish, you mark finished, in the same commit as the code.**

- Tick the step: `1. [ ]` becomes `1. [x]`.
- Update the phase's **Status** line, and the board below.
- A phase becomes ✅ only when its row in §6 is actually true — not when the code is written. Code in but
  unverified is 🟡, and say what is left.
- If you learn something that changes the plan, edit the plan and log it in §9.

**Status vocabulary:** ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked (name the blocker).

#### The board

| Phase | What | Status |
|---|---|---|
| Audit (§2) | Hero controls reviewed against renderers + CSS | ✅ Done 2026-09-20 |
| Review (§8) | Plan read against the code it describes — 14 items | ✅ Done 2026-09-20 |
| Revision | All 14 applied; phase 2 rewritten, phase 0 grew two steps | ✅ Done 2026-09-21 |
| 0 (§3) | Spec fields, ratio map, stale comment, manifest, backend ship | 🟡 Code done 2026-09-21 — awaiting the backend deploy (step 6) |
| 1 (§3) | Full-bleed stops eating the merchant's phone copy | ✅ Done 2026-09-21 |
| 2 (§3) | `frame` — the hero's shape, per device | ✅ Done 2026-09-21 |
| 3 (§3) | `imageSide` + `mobileFirst` — swap picture and text | ✅ Done 2026-09-21 |
| 4 (§3) | Width collision, field order, badge clamp | ✅ Done 2026-09-21 |
| 5 (§3) | Tests, docs, browser QA | ✅ Done 2026-09-21 — matrix walked phone-first; two defects found and one fixed |
| Deferred (§7) | S1 responsive fit · S2 autoplay · S3 scrim & alt · S4 one breakpoint | ⬜ Not planned |
| S5 (§9) | `hero.imageFit` offered one answer twice | ✅ Fixed 2026-09-21 |
| Review 2 (§9) | Second code review — 3 defects, 2 nits | ✅ All fixed 2026-09-21 |
| Clipping (§3 step 9) | Wide ratio cut the full-width hero's copy | ✅ Fixed 2026-09-21 — `aspect-ratio` replaced by a spacer |

---

## 1. The problem in one paragraph

The Hero's **content** controls are good — nineteen of them, and the last plan taught six to hide when
they do nothing. Its **shape** controls do not exist. A merchant can say what the hero says; they cannot
say how tall it is, what proportion it takes on a phone, or which side the picture sits on. Every one of
those is hardcoded in `storefront.css`. Worse, on the full-bleed layout the phone stylesheet *deletes* two
fields the merchant filled in — badge and subtitle — with no hint and no control. For a product whose
stated focus is mobile first, the most important section on every shop is the one the merchant cannot
shape on a phone.

## 2. Audit — what is fixed today, and where

Line numbers are as of commit `74b98613` (2026-09-21).

| # | What the merchant cannot control | Where it is nailed down |
|---|---|---|
| M1 | **Full-bleed hides the badge and the subtitle below 640px, and clamps the title to 2 lines.** No hint, no control, no note in the editor. | `storefront.css:3182` (the hide), `:3184` (the title clamp) |
| M2 | **No height or shape on any layout.** Card `16/9` phone / `4/3` desktop; Open `4 / 3` always; full-bleed is a `min-height` **floor, not a box** — `clamp(380px,62vh,640px)` desktop, `clamp(260px,72vw,390px)` phone. | `storefront.css:2685`, `:2808`; `hero-static.tsx` `ratio="4 / 3"`; `storefront.css:3133`, `:3159` |
| M3 | **The phone picture has no phone shape.** `mobileImage` exists, the box stays 16:9, so a portrait phone banner is letterboxed over a blurred copy. | same as M2 |
| M4 | **`imageFit` is not responsive, but `focal` is.** Desktop box 4:3, phone box 16:9, one fit value. Half a responsive pair. | `section-specs.ts:96-97` |
| M5 | Card buttons share one stretched phone row; no stack control. Centring happens to fix it, as a side effect. | `storefront.css` `.sf-herocard-copy a { flex: 1 1 auto }` |
| M6 | **The two static heroes lead with different things on a phone** — Card puts the photo first (`order: -1`), Open puts the copy first (DOM order). Same section, two behaviours, no control and no note. | `storefront.css` `.sf-herocard-media`; `hero-static.tsx` `HeroOpenView` child order |
| M7 | Field order splits the button pair: `buttonLabel, link, hideTextOnMobile, secondaryLabel, secondaryLink`. | `section-specs.ts:97-107` |
| M8 | Badge max 60, chip is 11.5px with no clamp — 3 lines above the headline on a phone. The spec's own comment notes home slides allow 40. | `section-specs.ts:98`; `.sf-herocard-badge` |
| W1 | **"Full width" means two things on one section** — Layout → Full width, and Style → Width → Full width. Style still overrides, so Width = "Page column" boxes a full-bleed hero while its layout claims otherwise. | `section-registry.tsx:180` (`heroFullBleed` already declares `width: "full"`) vs `section-style-fields.tsx` |

**Already right, do not "fix" these:** `mobileImage` + responsive `focal` + `hideTextOnMobile` are three
genuinely phone-first controls; Card leading with the photo on a phone is the documented fix for a real
fold defect; Focus point correctly hides unless fit is crop, because `Media`'s canvas branch ignores
`focal`; a shop with no banner renders no placeholder box.

## 3. The phases

### Phase 0 — the spec, the shared ratio map, the manifest, the backend

**Status:** 🟡 Steps 1–5 done 2026-09-21 · step 6 is the owner's deploy · **Blocks:** phases 1–3
reaching **production** — writing them is fine, shipping them before the backend is not.

The fields every later phase writes to, plus two things that belong here because the spec file is already
open (R3, R10).

```ts
// lib/storefront-builder/section-specs.ts — hero.settings
/**
 * The hero's box, and the phone's own where it is set. Unset keeps the shape
 * each layout has always drawn — 16:9 then 4:3 on a card, 4:3 open, and a
 * min-height floor rather than a shape on full-bleed.
 */
frame: {
  type: "enum",
  values: ["21:9", "16:9", "4:3", "1:1", "4:5", "9:16"],
  responsive: true,
  optional: true,
},
/** Which side the picture takes past the breakpoint. Card and open only. */
imageSide: { type: "enum", values: ["left", "right"], optional: true },
/** Which of the picture and the copy leads the phone's single column. */
mobileFirst: { type: "enum", values: ["picture", "text"], optional: true },
/** Full-bleed only. `title-only` is what the phone has always drawn — see D1. */
mobileCopy: { type: "enum", values: ["full", "title-only"], optional: true },
```

`frame` is a **section** setting, not a per-slide one, on purpose: the rotating hero stacks every slide in
one grid cell, so per-slide shapes would make the box as tall as the tallest slide and the merchant's
choice would show only on one of them.

Values run wide to tall and reuse names `VALUE_LABELS` already has ("Cinema 21:9", "Portrait 4:5",
"Tall 9:16"), so no new vocabulary. `4:1` and `3:1` are left out — a strip that thin is the `image-banner`
section's job, not a hero's.

1. [x] Add the four fields to `hero.settings` with the comments above.
2. [x] **R10** — fix the stale comment on `align`. It still says `/** Read by the \`open\` layout only. */`;
       the previous plan made it work on every branch and `hero.tsx:122` now feeds all of them.
3. [x] **R3** — extract the enum→ratio map to `lib/storefront-builder/aspect-ratios.ts`. It lives at
       `image-banner.tsx:14` today and already maps four of the hero's six values. Add `4:5` and `9:16`,
       export one `ASPECT_RATIOS` record, and have `image-banner.tsx` import it. Copying it instead is
       what CLAUDE.md's no-duplicate rule forbids, and it would drift the first time a ratio is added.
       **Not in `field-specs.ts` or `section-specs.ts`** — those two ship verbatim into the backend and
       must stay import-free (§0.5).
       *Done, and bigger than the review knew: there were **four** private copies, not one —
       `image-banner`, `gallery`, `image-text` and `video`. All four now read
       `lib/storefront-builder/aspect-ratios.ts`, whose union covers every shape any of them offers.*
4. [x] `pnpm gen:section-manifest`; confirm the four fields appear under `hero` in the backend file.
5. [x] Manifest regenerated in `inventory-backend`; run its `storefront-section-validation` tests.
6. [ ] **Ship the backend.** Nothing in phases 1–3 may reach production before it.

### Phase 1 — full-bleed stops eating the merchant's phone copy (M1)

**Status:** ✅ Done 2026-09-21 — `pnpm test` 2459 green, `pnpm lint` clean. Ships with phase 0's backend.

The worst defect in the audit and the cheapest to make honest. A merchant types a 160-character subtitle,
watches it render on the desktop preview, and the phone throws it away. It also contradicts the principle
the last plan shipped — *a control that has no effect is not shown* — on the device this product says it
cares about most.

**D1 = (c): a new `mobileCopy` setting, default `title-only`, so no live shop changes.** `full` renders
the badge and the subtitle, tightened for a phone rather than at their desktop size.

1. [x] Replace the blanket hide at `storefront.css:3182` with a gate on a data attribute, of the kind
       `HeroFullBleedView` already carries for `data-align` and `data-hide-mobile-copy`:

       ```css
       @media (max-width: 640px) {
         .sf-hero-fullbleed:not([data-mobile-copy="full"]) .sf-hero-fullbleed-badge,
         .sf-hero-fullbleed:not([data-mobile-copy="full"]) .sf-hero-fullbleed-sub { display: none; }
         /* `full` — shown, but sized for a phone rather than inherited from the desktop. */
         .sf-hero-fullbleed[data-mobile-copy="full"] .sf-hero-fullbleed-sub {
           display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
           font-size: 13.5px !important; margin: 0 0 12px !important;
         }
       }
       ```
       `:not(…)` rather than a second positive rule, so the **classic home** — which passes no attribute —
       keeps today's hide with no change to its markup (§0.3).
2. [x] `mobileCopy` through `HeroFullBleedView` → `data-mobile-copy`, and through **both** full-bleed
       islands (§0.4).
3. [x] `"hero.mobileCopy"` rule in `field-visibility.ts`: full-bleed only. On a card or open hero the
       phone already shows everything, so the control would answer a question that layout never asks.
4. [x] `"hero.mobileCopy": { kind: "value", value: "title-only" }` in `field-empty-choice.ts` — it equals
       what the renderer falls back to, which is that file's stated rule.
5. [x] Label `mobileCopy: "Phone text"`, values "Everything" / "Headline only", and a hint saying the
       headline is two lines on a phone either way.
6. [x] **Leave the title's `-webkit-line-clamp: 2` alone**, and say so in that hint. It is the one rule
       here protecting the fold on a hero whose whole point is the photograph.

### Phase 2 — `frame`: the hero's shape, per device (M2, M3)

**Status:** ✅ Done 2026-09-21 — `pnpm test` 2465 green, `pnpm lint` clean. Ships with phase 0's backend.

**Rewritten 2026-09-21 after R1–R4, R8, R9. The first draft did not work.** The merchant picks a shape;
the phone can have its own; unset renders exactly what today renders on all three layouts.

#### The mechanism (R2, R8)

CSS cannot ask whether a custom property was set, so a bare `aspect-ratio: var(--sfb-hero-frame, auto)`
cannot gate anything else on the answer. `image-banner` solved this already: a `data-frame` /
`data-frame-m` attribute pair beside `--sfb-banner-frame` (`image-banner.tsx:78-83`,
`storefront-builder.css:209`, `:328`). `gallery` uses the same pattern. Three sections agreeing is the
convention — copy it.

So the hero element carries:

- `--sfb-hero-frame` and `--sfb-hero-frame-m` — built with `responsiveVars("sfb-hero-frame", settings.frame,
  (r) => ASPECT_RATIOS[r])` from phase 0's map. `--sfb-*` is the builder's one naming convention (R8).
- `data-frame` when `settings.frame?.base` is set, `data-frame-m` when `settings.frame?.mobile` is —
  two attributes, not one, so a shape chosen on the phone alone does not also crop the desktop.

`--herocard-ratio` **keeps its name**. It is the classic hero's own property, it predates the builder, and
`hero-static.tsx` already reads it — which makes the card the one layout needing no new wiring in the view
at all.

#### The breakpoint (R4, D5)

The hero straddles two numbers today: card and open break at **680**, full-bleed at **640**, and
`Media`/`HeroMedia` swap to `mobileImage` at **640** while the builder's `MOBILE_MAX_WIDTH` is **679**.

**D5 = keep each layout on the breakpoint it already uses** — 680 for card and open, 640 for full-bleed.
Unifying them is a live-shop change on three files for tidiness, and every other step in this plan is
backwards-inert. It is written up as **S4** in §7. The cost, stated so nobody rediscovers it: `-m` means
"≤679" on a card and "≤640" on a full-bleed hero, so between 641 and 679 a phone shape applies to a card
and not to a full-bleed. Say it in the `frame` hint.

#### The rules

```css
/* Card — two vars, because an inline `--herocard-ratio` would beat both
   breakpoints at once and a responsive control that collapses to one value is
   not a responsive control. */
.sf-herocard[data-frame-m] { --herocard-ratio: var(--sfb-hero-frame-m); }
.sf-herocard[data-frame]:not([data-frame-m]) { --herocard-ratio: var(--sfb-hero-frame); }
@media (min-width: 680px) {
  .sf-herocard[data-frame] { --herocard-ratio: var(--sfb-hero-frame); }
}

/* Open — same shape, its own property, read by the `Media` call. */
.sf-heroopen { --heroopen-ratio: 4 / 3; }
.sf-heroopen[data-frame-m] { --heroopen-ratio: var(--sfb-hero-frame-m); }
.sf-heroopen[data-frame]:not([data-frame-m]) { --heroopen-ratio: var(--sfb-hero-frame); }
@media (min-width: 680px) {
  .sf-heroopen[data-frame] { --heroopen-ratio: var(--sfb-hero-frame); }
}

/* Full-bleed — R1. `min-height` is a FLOOR, and a floor beats an aspect-ratio:
   21:9 on a 390px phone computes 167px and is floored straight back to 260px,
   so the merchant sees exactly what they saw before. The floor must go
   wherever a frame is set, and only there. */
.sf-hero-fullbleed[data-frame] { min-height: 0; aspect-ratio: var(--sfb-hero-frame); }
@media (max-width: 640px) {
  .sf-hero-fullbleed[data-frame-m] { min-height: 0; aspect-ratio: var(--sfb-hero-frame-m); }
  /* A desktop-only shape must not leave the phone floorless. */
  .sf-hero-fullbleed[data-frame]:not([data-frame-m]) { min-height: 0; }
}
```

1. [x] `heroFrameVars(settings)` and the two attributes in `sections/hero.tsx`, from phase 0's
       `ASPECT_RATIOS`.
2. [x] The card, open and full-bleed rules above. Give `HeroOpenView`'s `Media` call
       `ratio="var(--heroopen-ratio, 4 / 3)"` — its `4 / 3` is inline today.
3. [x] Thread vars **and both attributes** through all three islands (§0.4). An island renders its own
       root element; a var set on the server wrapper does not reach it.
4. [x] `"hero.frame": { kind: "meaning", label: "The layout decides" }` in `field-empty-choice.ts`. Not
       `value` — unset means two different ratios at two breakpoints on the card, which no listed value
       says. Precedent: `"category-promo-cards.ratio"`.
5. [x] **R9** — key the hint `"hero.frame"`, not bare `frame`. Bare `frame` already exists and says
       *"Default shows each picture whole. A shape crops it to fit."* (`section-catalogue.ts:351`), which
       is true for `image-banner` and false for a hero, which always has a box. Say instead what unset
       draws per layout, and name the 641–679 band from D5.

### Phase 3 — `imageSide` and `mobileFirst`: swap the picture and the text (M6)

**Status:** ✅ Done 2026-09-21 — `pnpm test` 2474 green, `pnpm lint` clean. Ships with phase 0's backend.

**D3 = (a): ship `mobileFirst`, default unchanged, with the hint that names the fold cost.
D4 = two fields**, for the reason in §5.

| Field | Question | Applies |
|---|---|---|
| `imageSide` | Which side the picture sits on **past 680px** | Card, Open |
| `mobileFirst` | Which comes **first in the column** on a phone | Card, Open |

Neither applies to full-bleed, where the picture is the background and there is nothing to swap. Both are
hidden there by `field-visibility.ts` — the mechanism the last plan built for exactly this.

```css
/* Card — desktop swap. Redeclare the areas, do not reorder children: the
   `:has(> .sf-herocard-media)` collapse rule for a shop with no banner has to
   keep working, and an area a template no longer names stops resolving.
   R5: --herocols is 1.1fr 1fr, sized for copy on the LEFT. The wider column
   follows the COPY, not the position, so it is swapped with the areas. */
@media (min-width: 680px) {
  .sf-herocard[data-media-side="left"] {
    grid-template-columns: 1fr 1.1fr;
    grid-template-areas: "media copy" "media trust";
  }
}
/* Card — phone: the photo leads by `order: -1`; text-first is its absence. */
.sf-herocard[data-mobile-first="text"] .sf-herocard-media { order: 0; }
```

Open needs a class on its photo column first (`sf-heroopen-media` — it has none today), then `order: -1`
past the breakpoint for a left picture, and `order: -1` on `.sf-heroopen-copy` for `mobileFirst: "picture"`.

**Note the asymmetry this exposes (M6):** the Card leads with the photo on a phone, the Open hero leads
with the copy, because their DOM orders differ and neither was ever a choice. `mobileFirst` is what makes
that a decision instead of an accident — which is also why its empty choice is
`{ kind: "meaning", label: "The layout decides" }` and not a `value`: unset means "picture" on a card and
"text" on an open hero.

1. [x] `data-media-side` and `data-mobile-first` on `HeroCardView` and `HeroOpenView`, defaulting to
       today's rendering, plus the `sf-heroopen-media` class.
2. [x] CSS above, including R5's column swap.
3. [x] Pass both through `sections/hero.tsx` **and** the `hero-slides` island (§0.4).
4. [x] Labels: `imageSide` is already "Picture side" in `FIELD_LABELS` and has no bare hint to collide
       with. Add `mobileFirst: "First on phones"` and a hint naming the cost — `storefront.css:2669`
       records that copy-first pushed the photograph to ~477px on an iPhone SE and the fold cut it in
       half. A merchant turning that back on should be told, once, in the control.
5. [x] Visibility rules in `field-visibility.ts`, and both keys in `VISIBILITY_RULE_KEYS`:
       - `"hero.imageSide"`, `"hero.mobileFirst"` — layout is not `full-bleed`, **and** at least one slide
         carries a picture (with no picture there is nothing to put on a side).
       - `"hero.mobileFirst"` additionally — not every slide sets `hideTextOnMobile`. With the text hidden
         on every slide, "which comes first" has one thing to order.
6. [x] `"hero.imageSide": { kind: "value", value: "right" }` in `field-empty-choice.ts` — the card and the
       open hero both put the picture right today. It differs from `"image-text.imageSide"`, which is
       `"left"` because that section genuinely draws it left; the pair is that file's stated rule.

### Phase 4 — the three small ones (W1, M7, M8)

**Status:** ✅ Done 2026-09-21 — `pnpm test` 2476 green, `pnpm lint` clean, manifest gate green,
backend validation 58 green.

⚠ **One correction to the plan's own claim:** this phase said it changes no spec field, so it need not
wait on phase 0's backend ship. **Step 2 does touch the spec** — it reorders `hero.blocks.settings`. Key
order is not validated, so the manifest and the frontend cannot disagree in a way that fails a save, but
the manifest is regenerated and the two repos must still be committed together.

1. [x] **D2 = (a): the hero owns its width.** Two halves, and **both or neither** — the comment on
       `SECTIONS_ALIGNING_THEMSELVES` says why: a control removed without its frame flag leaves a stored
       value in force that the merchant can no longer see or clear.

       - *Renderer half:* `ownsWidth?: boolean` on `FrameDefaults`, set on `heroFullBleed` **only**.
         `section-registry.tsx` already resolves the hero's frame per layout (`frame: (settings) => …`),
         so this is automatically per-layout.
         **R7 — this is not mechanically the same as `ownsAlign`.** Align is *omitted from the emitted
         variables* (`section-style.ts:131`). Width is a precedence chain at `:133`:
         `oneOf(…, style.width) ?? defaults?.width ?? "content"`. `ownsWidth` has to **invert** that `??`
         so the frame default wins over the stored value — not skip a var. Copying the `ownsAlign` shape
         here compiles and does nothing.
       - *Editor half:* gate the Style → Width control on the **same visibility table** the Content tab
         uses, key `"hero.style.width"` — false when layout is `full-bleed`. `isFieldVisible` already
         takes `{ settings, blocks }` and `section-style-fields.tsx` holds the whole section, so this is
         a table entry and a call, not a new mechanism. It keeps Width on Card and Open, which have no
         collision.

       Do **not** reach for `SECTIONS_ALIGNING_THEMSELVES`: that set is keyed by section type alone, and
       this question is answered by the hero's *settings*.

       **R6 — this is the one step in the plan that is not backwards-inert**, and it is why D2 has its own
       paragraph in §4. A full-bleed hero a merchant had deliberately set to "Page column" snaps to full
       width on deploy. §4's D2 records why that set is empty.
2. [x] **M7** — move `hideTextOnMobile` in `section-specs.ts` to sit after `secondaryLink`. Spec order is
       render order (`settings-fields.tsx` maps `Object.entries(specs)`), so this is the whole fix. Key
       order is not validated, but regenerate the manifest anyway so the two files match.
3. [x] **M8** — clamp `.sf-herocard-badge` to one line on a phone (`-webkit-line-clamp: 1`, as the
       full-bleed title already does) rather than lowering the 60 limit. Lowering it would invalidate
       badges merchants have already saved.
       *The clamp needs `display: -webkit-box`, which replaces the chip's `inline-block` — so the 680px
       block restores `inline-block`, making the clamp inert on a desktop whose copy column fits 60
       characters on one line. Desktop rendering is unchanged.*

### Phase 5 — tests, docs, browser QA

**Status:** ✅ Done 2026-09-21 — matrix walked phone-first in the real editor; see §9's log for the two
defects it found. (This line said "Not started" while the board said otherwise until 2026-09-21; §0.8
requires both, and the review below caught the drift.)

1. [x] Unit tests: `field-visibility.test.ts` gains every new rule, including the "every slide hides its
       text" and "no slide has a picture" cases.
2. [x] Renderer tests: card and open at `imageSide` left/right × `mobileFirst` picture/text, asserting the
       data attributes; `frame` set / unset / phone-only, asserting the custom properties **and** the
       `data-frame` / `data-frame-m` pair. Assert on attributes and variables, **not** computed layout —
       jsdom does not do grid.
3. [x] `hero-slides.test.tsx`: the same props survive the island boundary. This is the test that catches
       §0.4, and it is the one worth writing first.
4. [x] **R11** — an explicit round-trip test for the style-box key: hide Width on a full-bleed hero, save,
       and the stored `style.width` is still there. `field-visibility.ts` is documented and tested as
       *section settings*, and the "hidden is not erased" guarantee iterates spec fields, so it does not
       cover `"hero.style.width"` on its own.
5. [x] Classic-home regression: `hero-sections.test.tsx` renders with no new props and its markup is
       unchanged.
6. [x] `pnpm gen:section-manifest --check` green (it runs inside `pnpm verify`).
7. [x] `.claude/skills/storefront/SKILL.md` — the hero's shape variables, the attribute pair and §5's
       two-field reasoning, so the next person does not re-derive them.
8. [x] Browser QA in the real editor, **phone first**
9. [x] **Checked in a browser 2026-09-21 — it clipped, and the fix was not the one predicted.**
       Original note kept below for the reasoning it records:
       **Still to check in a browser** (raised by the second review, not yet walked): a wide ratio on a
       full-bleed hero clips its own copy. `overflow: hidden` plus 21:9 on a 390px phone is a 167px box
       against roughly 130px of copy — 18px of padding, a two-line title, the button and 22px below — so
       the margin is nearly nothing and "Phone text: Everything" adds a badge and two more lines on top.
       Walk it beside R14's crop-and-focal column; if it clips, the answer is a `min-height` floor that
       applies only when a shape is set, not the removal of the shape control.: every layout × frame set/unset/phone-only × side
       left/right × mobileFirst picture/text, static and rotating, light and dark — **and R14's column:
       `frame` against `imageFit: "crop"` with a focal point**, which is where the floor, `Media`'s canvas
       branch and `object-position` all meet on one element.

## 4. Decisions — all answered

### D1 — the full-bleed phone copy · **ANSWERED (c)**

Below 640px the full-bleed hero deletes the badge and the subtitle and clamps the title to two lines. The
rule is shared with every classic store, so every answer was visible on live shops.

- (a) Show them, tightened. (b) Keep them hidden, add hints. (c) A `mobileCopy` setting, default
  `title-only`.

**Answered 2026-09-20: (c), with (a)'s tightening as what `full` renders.** (b) was the one answer that
left the defect standing; between (a) and (c), (c) changes nothing until a merchant asks for it, which is
the same promise every other field in this plan makes. Phase 1 carries it.

### D2 — Style → Width on a hero · **ANSWERED (a)**

- (a) Hide it for the hero (`ownsWidth`), letting Layout be the only width control. (b) Leave it, rename
  one of the two "Full width" options.

**Answered 2026-09-20: (a) — hide it.** It is the identical defect Alignment had, the fix is already
written for that case, and `heroFullBleed` already declares `width: "full"`, so the Style control is a
second lever on a decision the layout has made. Phase 4 narrows it to the full-bleed *layout* rather than
the whole section type, so Card and Open keep a width choice they do not collide with.

**R6 — what happens to a hero that already stores `style.width`.** This is the only step in the plan that
changes a live shop with no setting touched. The set is empty: the owner settled the previous plan's own
D2 with "do not have any user, so no migration needed" — the Storefront Builder has no merchants on it
yet, so no hero anywhere carries a `style.width`, and there is nothing to snap. **If that stops being
true before phase 4 ships, count them first and write the answer here.** Do not assume it.

### D3 — should `mobileFirst` exist at all? · **ANSWERED (a)**

Copy-first on a phone is a documented regression: `storefront.css:2669` records that it pushed the
photograph to ~477px on an iPhone SE, below the fold, with no product visible.

**Answered 2026-09-20: (a) — ship it with the hint.** The product already ships "Hide text on phones",
which is a louder version of the same loaded gun, and M6 means the two static heroes already disagree
about phone order with no way to reconcile them. A hint is the right guard, not absence.

### D4 — one responsive field or two? · **ANSWERED: two**

**Answered 2026-09-20: two** (`imageSide` + `mobileFirst`), for the reason in §5. Recorded as a decision
only because a reviewer will reasonably ask why the repo's responsive flag was not used here when the
hero's `focal` and `frame` both carry it.

### D5 — which breakpoint the hero's shape uses · **ANSWERED: each layout keeps its own**

Raised by R4. Card and open break at 680, full-bleed at 640, `Media` and `HeroMedia` swap the phone
picture at 640, and the builder's `MOBILE_MAX_WIDTH` is 679 — four numbers, three of them pre-existing.

**Answered 2026-09-21: keep each layout on the breakpoint it already uses.** Unifying them touches three
files to change live shops in the 641–679px band for tidiness, and every other step in this plan is
backwards-inert. It is written up as **S4** in §7 and should be done on its own, where it can be QA'd as
the visual change it is. The cost is that `-m` means "≤679" on a card and "≤640" on a full-bleed hero;
phase 2 step 5 puts that in the control's hint.

## 5. Why not one responsive `imageSide`

The builder stores a responsive value as `{ base, mobile? }`, and the phone value **inherits the desktop
value until it is set**. That is the whole model — `PhoneNote` and `ResetToDesktop` exist to show it.

The hero's two defaults point opposite ways. On a desktop card the copy is left and the picture right, so
the picture comes **second**. On a phone the picture leads, so it comes **first**. A single responsive
field with `base` unset would have the phone inherit the desktop's "second", and every existing shop's
hero would flip on phones the moment the field shipped — for merchants who never touched it.

The only escapes are worse: special-case the phone's inherit target (breaking the model's one promise for
one field), or change the desktop default (changing every live shop). Two fields, each with a default that
matches what its own device draws today, is the honest shape. `mobileImage`, `mobileFocal` and
`mobileColumns` are the same pattern already in the repo.

**R12 — why `frame` is responsive when `imageSide` is not, given the card has the same asymmetry.** The
card's shape is 16:9 on a phone and 4:3 past the breakpoint, so a merchant who sets only the desktop to
21:9 does get 21:9 on phones. That is accepted here and refused above for one reason: **a ratio inherits
harmlessly, a reordered column does not.** An inherited ratio is a shape the merchant chose, applied
somewhere they did not think about; an inherited order silently moves the photograph below the fold on
the device the fold matters on. Where inheritance is merely surprising, the builder's model wins. Where it
is destructive, it does not.

## 6. Definition of done

| Phase | Done when |
|---|---|
| 0 | The four fields are in the manifest, `ASPECT_RATIOS` has one home and two readers, the backend's validation tests pass, and the backend is shipped. |
| 1 | A full-bleed hero set to "Everything" shows its badge and subtitle on a phone; one left unset renders byte-identically to today, on the builder and on the classic home. |
| 2 | Picture shape is settable on all three layouts **and visibly changes each of them** — including full-bleed, where the `min-height` floor must be gone wherever a frame is set (R1). The phone can differ. A hero with it unset renders byte-identically to today. |
| 3 | Picture and text swap on desktop and on phone, on Card and Open, static and rotating; the copy keeps the wider column either way (R5); both controls are absent on full-bleed and absent with no picture. |
| 4 | Width is gone on a full-bleed hero and still offered on Card and Open; a hidden Width does not erase its stored value (R11); the button pair is contiguous in the panel; a 60-character badge is one line on a phone. |
| 5 | `pnpm test`, `pnpm lint`, `pnpm verify` green, SKILL.md updated, browser matrix walked phone-first including R14's crop-and-focal column. |

## 7. Out of scope — and why

| Item | Why not now |
|---|---|
| **S1 — responsive `imageFit` (M4)** | Cannot be done in CSS. `Media`'s two fits are two different DOM shapes — `canvas` renders a blurred backdrop copy plus `object-fit: contain`, `cover` renders one `<img>` — so a per-device fit means rendering the canvas shape always and toggling the backdrop at the breakpoint. Phase 2 removes most of the need: with a phone shape that suits the picture, the fit matters far less. Revisit after phase 5. |
| **S2 — rotation on/off and speed** | Two more fields, and `useHeroRotation` would need an interval prop on both callers. Not a regression — the classic home never had it. Own pass. |
| **S3 — full-bleed text colour, scrim strength, and `alt` on hero pictures** | The scrim is a *colour* decision on a section whose type is fixed white; it belongs with whatever gives the Style tab's Text colour a route into the islands. `alt` is defensible while the copy is in the DOM, and D1's answer keeps it there. |
| **S4 — one breakpoint for the hero (D5, R4)** | Move the full-bleed phone block from 640 to 679 and `HERO_MOBILE_MEDIA` with it, so the hero stops straddling two numbers. A live-shop visual change in the 641–679px band across three files, which is why it is not folded into a plan whose every other step is inert. Do it alone and QA it as a visual change. |
| **M5 — stacked phone buttons** | One more field for a layout the merchant can already reach by centring. Wait for a merchant to ask. |

## 8. Review — the plan read against the code, 2026-09-20

Every claim in §2 and §3 was checked against the files it names. The plan was sound in shape: the phases
are in the right order, §0.5's deploy rule is real, §5's argument is correct, and the audit's findings are
all genuine. Four things in phase 2 did not work as written, and one thing in phase 4 was not the safe
change the rest of the plan is.

**All fourteen items are applied in the revision of 2026-09-21** — R1–R4 and R8–R9 rewrote phase 2, R3 and
R10 moved into phase 0, R5 added the column swap, R6 and R7 rewrote phase 4 step 1, R11 and R14 added
steps to phase 5, R12 added its paragraph to §5, and R13's renumbering is done (§2's D5/D6 are now M7/M8,
the width row is W1, and §7's rows are S1–S4). The items are kept below in full, because each one names
a trap that is still in the code and will still be there for whoever changes this next.

**Plain errors corrected in place before the revision:** §2's citations for M1 and M2 pointed at
`storefront.css:3337`, `:3363` and `:3386`, which are the **account sidebar** and the **PDP left-rail
gallery** — the full-bleed rules are at `:3131` (base), `:3159` (the phone `min-height`), `:3182` (the
badge/subtitle hide) and `:3184` (the title clamp). The stale numbers came from reading the file before
commit `74b98613`, which deleted `hero-carousel.tsx` and its ~204 lines of CSS. §0.8 pointed at two
sections that do not exist, and the §8 log said ten findings where §2 has nine.

### Blocking — phase 2 does not work as written

**R1 — `min-height` eats `frame` on full-bleed, so the control does nothing on the layout that most
needs it.** `.sf-hero-fullbleed` is a `min-height` floor, not a box: `clamp(380px, 62vh, 640px)` at
`storefront.css:3133`, and `clamp(260px, 72vw, 390px)` on a phone at `:3159`. An `aspect-ratio` loses
to a larger `min-height`, so a merchant picking Cinema 21:9 on a 390px phone computes 167px, is
floored back to 260–390px, and sees **exactly what they saw before**. Wide shapes on a desktop fare
no better against 380px. Phase 2 must take the floor to `0` wherever a frame is set — which is R2 —
or `frame` ships as precisely the dead control this plan family exists to abolish.

**R2 — copy `image-banner`'s attribute-plus-variable pair, not a bare `var()`.** CSS cannot ask
whether a custom property was set, which is why `image-banner` carries `data-frame` / `data-frame-m`
alongside `--sfb-banner-frame` (`image-banner.tsx:78-83`, `storefront-builder.css:209` and `:328`,
whose comment states the reason). The hero needs the same pair for two jobs phase 2's
`aspect-ratio: var(--hero-frame, auto)` cannot do: gate `min-height: 0` (R1), and stop a phone-only
shape from also cropping the desktop. The gallery uses the same pattern. Three sections agreeing is
the convention.

**R3 — the enum→ratio map must be extracted, not copied.** `RATIOS` lives at `image-banner.tsx:14`
and already maps four of the hero's six values. Phase 2 leaves the formatter as
`responsiveVars("hero-frame", settings.frame, …)` with the `…` unfilled, and the shortest road from
there is a second copy — which CLAUDE.md's no-duplicate rule forbids and which will drift the first
time a ratio is added. Move it to `lib/storefront-builder/` (`aspect-ratios.ts`), add `4:5` and
`9:16`, and have both sections read it. **Phase 0, while the spec file is already open**, not phase 2.

**R4 — the hero would have two different "phones".** `responsiveVars` documents its `-m` twin against
`MOBILE_MAX_WIDTH = 679` and every builder section breaks there; the card and open hero rules break at
680; but the **full-bleed block breaks at 640**, and so does `Media`'s own `mobileMedia="(max-width:
640px)"`, which is what swaps to `mobileImage`. So between 641px and 679px a merchant's phone shape
would frame the desktop picture. `responsive.ts` says in as many words that a second breakpoint on one
page is the worst outcome. Pick one number for the hero's shape, write it into phase 2, and say what
happens to the other rules at the other number.

### Before phase 3

**R5 — the card's desktop columns are asymmetric, so swapping the areas moves the wide column to the
picture.** `--herocols` is `1.1fr 1fr` (`storefront.css:813`), sized for copy on the left. Phase 3
redeclares `grid-template-areas` only, which hands the extra 10% to the photograph and squeezes the
headline. Either swap the columns too under `[data-media-side="left"]`, or decide that the wider
column follows the *position* rather than the content — but decide it, because today it is neither.

### Before phase 4

**R6 — D2 is the one change in this plan that is not backwards-inert, and the plan does not say so.**
Every other phase promises "unset renders exactly what today renders". `ownsWidth` makes `sectionFrame`
ignore a **stored** `style.width`, so a full-bleed hero a merchant deliberately set to "Page column"
snaps to full width on their live shop on deploy — no setting changed, no warning, and the control
that explains it is gone in the same commit. The previous plan settled its own D2 with a database
query rather than an assumption; do the same here: count hero sections carrying `style.width` before
phase 4, and if any are full-bleed, say in this document what happens to them.

**R7 — `ownsWidth` is not mechanically "the same as `ownsAlign`".** Align is *omitted from the emitted
variables* (`section-style.ts:131`, `defaults?.ownsAlign ? {} : responsiveVars(…)`). Width is a
precedence chain — `oneOf(…, style.width) ?? defaults?.width ?? "content"` (`:133`) — so `ownsWidth`
has to **invert** that `??`, not skip a var. One line either way, but an implementer copying the
`ownsAlign` shape will write something that compiles and does nothing.

### Editor and naming

**R8 — the variable names break the repo's one convention.** Every responsive custom property in the
builder is `--sfb-*`: `sfb-cols`, `sfb-space`, `sfb-banner-frame`, `sfb-cta-align`, `sfb-align`. Use
`--sfb-hero-frame` and its `-m` twin. `--herocard-ratio` keeps its name — it is the classic hero's
own, it predates the builder, and `hero-static.tsx:190` already reads it, which is the one piece of
phase 2 that needs no new wiring at all.

**R9 — `frame` already carries a hint, and it is the wrong sentence for a hero.** `FIELD_LABELS` and
`HINTS` fall back to the bare field name, and bare `frame` says *"Default shows each picture whole. A
shape crops it to fit."* (`section-catalogue.ts:351`) — true for `image-banner` and `gallery`, false
for a hero, which always has a box. Phase 2 step 5 must key the hint `"hero.frame"`, not add a bare
one. Check `imageSide` for the same collision before reusing its bare "Picture side" label.

**R10 — a stale comment to fix while phase 0 has the spec file open.** `section-specs.ts` still
describes `align` as `/** Read by the \`open\` layout only. */`. The previous plan made Left/Center
work on all four branches; `hero.tsx:122` now feeds every one of them. The comment is a lie that will
mislead exactly the developer this plan is written for.

**R11 — `"hero.style.width"` puts a style-box key in a table of section settings.** It works —
`isFieldVisible("style.width", "hero", scope)` resolves, and `section-style-fields.tsx` already holds
the whole `section`, so the scope is to hand. But `field-visibility.ts` is documented and tested as
*section settings*, and the "hidden is not erased" round-trip guarantee iterates spec fields, so it
will not cover this key. Phase 5 needs an explicit test: hide Width on a full-bleed hero, save, and
the stored `style.width` is still there.

### Consistency of the document itself

**R12 — §5's argument and phase 2's mechanism point opposite ways, and a reviewer will say so.** §5
refuses a single responsive `imageSide` because the card's two devices have opposite defaults. The
card's `frame` has exactly the same asymmetry — 16:9 on a phone (`storefront.css:2685`), 4:3 past the
breakpoint (`:2808`) — and phase 2 accepts inheritance there, so a merchant who sets only the desktop
to 21:9 gets 21:9 on phones too. That is defensible (a ratio inherits harmlessly; a reordered column
does not) and it is the builder's own model, but the plan currently states the principle in §5 and
breaks it in §3 without a word. Add the sentence to §5.

**R13 — `D<n>` means three different things in this document.** §4's decisions are D1 mobile copy, D2
width, D3 `mobileFirst`, D4 one-field-or-two. §2's table also uses D2 (same subject, fine) but adds D5
and D6, which are not decisions and have no §4 entries. §7 then labels three *out of scope* rows D1,
D3 and D4 — autoplay, scrim and alt — which collide head-on with §4's. For a document whose whole
purpose is handover, renumber two of the three sets: §2's D5/D6 to M7/M8, and §7's to S1–S3.

**R14 — one gap in phase 5's matrix.** The browser pass walks layout × frame × side × mobileFirst, but
not `frame` against `imageFit: "crop"` and a focal point, which is where R1's floor, `Media`'s canvas
branch and `object-position` all meet on the same element. Add that column; it is the combination most
likely to letterbox a picture inside its own new shape.
## 9. Progress log

Append here — do not rewrite the phases to hide what happened.

- **2026-09-20** — Audit done against the renderers and `storefront.css`; nine findings in §2. Plan
  written, D1–D4 open.
- **2026-09-20** — Owner answered all four: D1 (c) `mobileCopy`, default `title-only`; D2 (a) hide Width,
  narrowed to the full-bleed layout rather than the section type so Card and Open keep theirs; D3 (a)
  ship `mobileFirst` with the hint; D4 two fields. Phase 0 grew a fourth spec field.
- **2026-09-20** — Plan reviewed against the code (§8). Fourteen items: R1–R4 blocked phase 2 (the
  full-bleed `min-height` floor swallows `frame`; it needs `image-banner`'s `data-frame` attribute pair;
  `RATIOS` must be extracted, not copied; the hero straddles the 640 and 679 breakpoints). R6 flagged D2
  as the one change here that alters live shops with no setting touched. Three plain errors corrected in
  place.
- **2026-09-21** — Revision. All fourteen applied; phase 2 rewritten around the attribute pair and the
  `min-height: 0` gate; phase 0 grew the `ASPECT_RATIOS` extraction (R3) and the stale-comment fix (R10);
  phase 4 step 1 rewritten around R7's inverted `??`; D5 added and answered (each layout keeps its own
  breakpoint, unification deferred as S4); R6 resolved against the owner's own earlier answer that the
  builder has no merchants yet, with an explicit instruction to re-check before phase 4 ships. The
  review's own line numbers were re-verified against `74b98613` before being trusted — they were right
  and the plan's originals were stale.
- **2026-09-21** — Phases 0 (code), 1 and 2 built. `pnpm test` 2465 green, `pnpm lint` clean, `tsc` clean.
  Two things the plan did not predict, both now in the code as comments:
  **(a) R3 was bigger than the review knew** — there were *four* private `RATIOS` maps, not one
  (`image-banner`, `gallery`, `image-text`, `video`). All four now read `lib/storefront-builder/aspect-ratios.ts`.
  **(b) a CSS specificity trap the plan's own snippets would have shipped.** `[data-frame-m]` outranks a
  bare `.sf-herocard`, so a phone-only shape followed the merchant onto the desktop; and inside the 640px
  block `.sf-hero-fullbleed:has(> .sf-hero-media)` ties with `[data-frame-m]`, so the frame rules placed
  *before* it handed the `min-height` floor straight back — the exact defect R1 exists to prevent, arriving
  by a different door. Both fixed with `:not()` pairs and rule ordering, and both commented where they sit.
- **2026-09-21** — Phase 3 built: `imageSide` and `mobileFirst`, both static views and the rotating one.
  `pnpm test` 2474 green, `pnpm lint` clean. Two notes for whoever reads the diff. **The two settings
  became one `HeroPlacement` prop** rather than two, because every view that takes one takes the other and
  a single object crosses the island boundary as plain data; the spec keeps them separate, which is what
  §5 argues for — the pairing is an argument shape, not a merged setting. **Right and "the layout decides"
  both emit no attribute**, so there is exactly one way to draw each default and a stored `"right"` cannot
  drift from an unset one.
- **2026-09-21** — Phase 4 built and verified: `pnpm test` 2476 green, `pnpm lint` clean, manifest gate
  green, backend validation 58 green. **R7 and R11 both fired exactly as the review predicted.** R7:
  `ownsWidth` had to invert `sectionFrame`'s `??` chain rather than omit a variable the way `ownsAlign`
  does — there is now a test that fails if someone copies the align shape. R11: the "only optional fields
  may be hidden" guarantee iterates spec fields, so `"hero.style.width"` failed it outright
  (`names no field in its spec`); `.style.` keys are now skipped with a comment, and the round-trip test
  R11 asked for is its stand-in. **One plan error found and corrected in §3:** phase 4 claimed to change
  no spec field, but step 2 reorders `hero.blocks.settings`. Key order is not validated so no save can
  fail, but the manifest regenerates and both repos must be committed together. Phase 5's unit tests and
  SKILL.md are done; only the browser matrix is left, and it needs the dev app.
- **2026-09-21** — Phase 5 browser QA, phone-first, in the real editor (org `new3`, the Home page), draft
  restored with **Discard changes** afterwards. Every claim in §6 verified in the browser:

  **R1 holds.** Setting Cinema 21:9 on a full-bleed hero visibly shortened it and pulled the sections below
  up — the `min-height` floor really is lifted only where a shape replaces it.
  **The specificity fix holds.** A phone-only Tall 9:16 made the phone hero tall and left the desktop at
  21:9; the editor's note flipped to "Phone value" with "Reset to desktop" beside it.
  **R5 holds.** Picture side = Left swapped the card, and the COPY kept the wider column.
  **M6 is fixed on both layouts.** The card leads with text on request, and the open hero leads with the
  picture — which it could never do before.
  **D2 is per-layout as designed.** Style → Width is absent on a full-bleed hero and present on an open
  one; Text alignment is absent on both.

  **Two defects the unit tests did not catch, both editor-copy:**
  1. **`hero.mobileFirst` had no empty-choice entry**, so the control shipped the generic phantom
     "Default" that `field-empty-choice.ts` exists to abolish — the one hero setting of the four whose
     entry was missed. Fixed, plus a test that now asserts all four of the hero's new settings together,
     precisely because checking them one at a time is how this one got through.
  2. **`hero.imageFit` offers one answer twice** — "Whole picture" and "Show the whole picture". Logged as
     **S5** in §7 rather than fixed: it reverses a decision the previous plan recorded in its own §8.

  Both were found by looking at rendered control labels, which is the same class of seam defect
  `browser-qa-seam-bugs` describes — green unit tests, wrong words on screen.
- **2026-09-21** — **S5 fixed**, on the owner's instruction, so it is no longer deferred.
  `"hero.imageFit"` is now `{ kind: "value", value: "fit" }` instead of `WHOLE_PICTURE`. The previous
  plan's phase 1 step 3 chose `WHOLE_PICTURE` and was half right — dropping the `inherit` claim was
  correct, since no hero calls `useStoreImageFit()`, but `fit` is a **listed value that renders exactly
  what unset renders** (`heroSlidePhoto` maps both to `canvas`), so the list carried "Whole picture" and
  "Show the whole picture" as two choices for one hero. That plan's step is annotated in place and its
  §11 records the reversal, because a reader who finds the old decision must find the correction with it.
  A test now pins it, and says in its comment why no mechanical check exists: whether a `meaning`
  duplicates a value is a question about the renderer, not about the data, so each `meaning` entry
  carries a comment naming the answer no listed value gives.
- **2026-09-21** — **Second code review, three defects and two nits, all verified against the source and
  all fixed.**

  1. 🔴 **A pictureless card with the picture on the left rendered a void column.**
     `.sf-herocard:not(:has(> .sf-herocard-media))` and `.sf-herocard[data-media-side="left"]` both weigh
     (0,2,0) — `:not()` and `:has()` each take their argument's specificity — so the tie went to source
     order and the newer placement rule beat the collapse rule it was written next to. `HeroCardView`
     renders the media child only with a photo but puts the placement attribute on the root regardless,
     so a rotating hero whose second slide has no picture hit it mid-rotation, beside a slide that looked
     right. Fixed by gating the rule on `:has(> .sf-herocard-media)`, which also lifts it to (0,3,0).
     **This is the third specificity trap in this one stylesheet**, after the `[data-frame-m]` desktop
     leak and the `:has(> .sf-hero-media)` floor ordering. The pattern is the same every time: `:not()`
     and `:has()` carry weight, and a hero rule written later than the rule it must not beat is a bug.
  2. 🟡 **`anyPicture` missed the store banner.** It read the blocks only, but `heroSlidePhoto` falls back
     to the banner and `sections/hero.tsx` hands it to the card and open heroes whenever "Use the store
     banner" is on — so a hero of imageless slides drew a photograph and had both placement controls
     hidden. That is a hidden control the renderer honours, which is the one thing this mechanism must
     never do. Now `!!settings.storeBanner || blocks.some(…)`, which over-shows on a shop with the toggle
     on and no banner uploaded; the editor cannot see `context.banner`, and that is the right side to err
     on.
  3. 🟡 **R5 was fixed on the card and not on the open hero.** The card swaps its columns with its areas
     so the copy keeps the wider track; the open hero swapped with `order: -1` alone over a `1.1fr 1fr`
     grid, handing the wider track to the photograph. One section, two answers to one question. The open
     hero's inline `grid-template-columns` now reads `var(--heroopen-cols, var(--herocols))` so a
     stylesheet can reach it at all, and the left rule sets `1fr 1.1fr`.

  Plus two nits: `mobileFirst`'s hint was keyed bare while its neighbours are section-keyed — the shape
  R9 was about, rekeyed to `"hero.mobileFirst"` — and phase 5's Status line still read "Not started"
  while its board row and every step said otherwise, which §0.8 forbids.
- **2026-09-21** — **The clipping the second review predicted is real, and the fix I predicted was wrong.**
  Reproduced in the editor: Cinema 21:9 on a phone with "Phone text: Everything" sliced the badge's
  ascenders clean off on the two-line-subtitle slide.

  My note said the answer was "a `min-height` floor that applies only when a shape is set". It is not.
  Measured against the live hero in Chrome — `0`, `auto`, `fit-content`, `min-content`, `max-content` —
  **every one lost to the ratio**, box stuck at 108px with the copy hanging 243px above it.
  `min-height` is a floor and `aspect-ratio` is a ceiling; a ceiling cannot be raised by a floor.

  So the full-width hero stops using `aspect-ratio` altogether and takes its shape as `padding-top` on a
  zero-width `::before` — the technique that predates `aspect-ratio`. A percentage padding resolves
  against the containing block's WIDTH, so it draws the same shape but ADDS to layout rather than fixing
  the box: the hero is as tall as the shape or as tall as its copy, whichever is more. Measured before
  writing it: 40:3 gave the copy's own height with zero overflow, 21:9 and 9:16 gave the shape's.
  `ASPECT_RATIO_PADDING` derives the percentages from `ASPECT_RATIOS` so the two cannot drift, and the
  card and open heroes keep `aspect-ratio` — their picture is a slot with nothing to overflow.

  Re-verified in the editor on the same slide that clipped: badge, headline, two-line subtitle, button and
  dots all inside the box. Draft discarded, preview reset, tabs closed.
- **2026-09-21** — Final verification after the spacer fix: `pnpm test` **2480 passed**, `pnpm lint`
  0 errors, manifest gate green. One real failure on the way there, and it was the right kind: the
  island test asserts the shape variables by exact equality, so adding `--sfb-hero-pad` broke it
  immediately instead of shipping a half-wired variable. It now asserts both halves *and* that they
  describe the same shape, and `lib/storefront-builder/__tests__/aspect-ratios.test.ts` guards the two
  maps against drifting for every shape, not just the one the hero happened to use.
- **2026-09-21** — Added the guard the open hero was missing. It is inline-styled, and **two** of its
  inline values are written by the stylesheet through a custom property — `--heroopen-cols` for its
  columns and `--heroopen-ratio` for its picture — a coupling across two files with nothing in either
  pointing at the other. Drop the `var()` and the CSS rules still parse, still compute, and simply stop
  reaching anything: no error, no type failure, just a control that quietly does nothing. Three
  assertions now hold the halves together, including the no-photo collapse case, and they are asserted
  on the style ATTRIBUTE because jsdom's CSS parser drops `var()` from the property accessors.
  **Mutation-tested rather than assumed:** removing each `var()` in turn fails exactly its own
  assertion and nothing else, and the file was restored byte-identical afterwards.

