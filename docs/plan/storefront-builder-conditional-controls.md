# Storefront Builder — conditional controls, and the Hero clean-up

**Written:** 2026-09-20 · **Repos:** `inventory-frontend` only (no backend change)

**Progress: see §0.8. That board is the source of truth for what is done — keep it current.**

---

## 0. Start here

You do not need any prior context on this work. Read §0 in full before opening a file.

### 0.1 Read first

| Document | Why |
|---|---|
| `inventory-backend/docs/plan/storefront-builder.md` | The master plan every code comment cites ("plan §17, Phase 5 step 5", "§5.2 `SectionStyle`", "§6"). 2,532 lines — §5 target architecture, §6 page registry and §8 the section library are the parts this plan sits inside. |
| `.claude/skills/storefront/SKILL.md` | The storefront reference: hero branches, image fit and focal rules, and the deliberate decision that heroes do **not** call `useStoreImageFit()`. |
| `inventory-frontend/CLAUDE.md` | Repo conventions. `// coding-standard: maintained` on a file's first line means it already conforms — make your change and skip the standard review. Every file named in this plan carries the marker. |

### 0.2 Where the code lives

Four directories, easy to confuse, and the Hero has files in all of them:

| Directory | What it holds |
|---|---|
| `components/storefront/` | The **live storefront** renderers — shared by the classic home page *and* the builder. |
| `components/storefront-builder/` | Builder section wrappers and islands. `sections/hero.tsx` picks a branch and calls into the renderers above. |
| `components/ecommerce/pages/editor/` | The **merchant's editor** — inspector, field controls, catalogue, labels, hints. |
| `lib/storefront-builder/` | Specs, the style box, shared helpers. |

### 0.3 Every hero renderer has two callers

`components/storefront/home/hero-static.tsx`, `…/hero-fullbleed.tsx` and
`components/storefront/hero-slides.tsx` are shared between the builder and the **classic home page**
(`components/storefront/home/sections/hero-sections.tsx`), which is what live stores not yet migrated to
the builder still render. (A fourth, `hero-carousel.tsx`, was the shared one when this plan was
written; D1 took its last caller away and it was deleted — see §11.)

**Check both callers before changing any signature.** Every prop this plan adds defaults to today's
behaviour for exactly this reason, so the classic callers — which pass nothing — are untouched.
Decision **D1** is a decision about this boundary.

### 0.4 Islands

Builder sections are server components. Anything that needs client JavaScript is rendered as
`<Island name="…" props={…} />` and registered in
`components/storefront-builder/islands/island-map.tsx`, which `dynamic()`-imports it. Props cross a
server/client boundary, so they must be plain serializable data — no functions, no JSX, no class
instances. **Phase 3's new island must be registered there or it silently does not render.**

### 0.5 Do not change the spec shape

Nothing in this plan changes the wire format, which is why there is **no backend work and no deploy
ordering** anywhere in it.

If you deviate and add or change a spec field: `lib/storefront-builder/field-specs.ts` and
`lib/storefront-builder/section-specs.ts` are the source of the backend's **generated** manifest
(`inventory-backend/src/constants/storefront-section-manifest.ts`). Run `pnpm gen:section-manifest`, and
**ship the backend before the frontend** — otherwise the draft validator rejects the new value and the
merchant's save fails with no useful message.

### 0.6 Branch

The work sits on `feat/storefront-builder` in `inventory-frontend`. This plan document is untracked —
commit it with the first phase so the branch carries its own plan.

### 0.7 What is blocked

**Nothing. D1–D6 were all answered on 2026-09-20 — see §6, which now records the answer, not the
question.** Phases run in the order given; the only remaining dependency is phase 4 on phase 3, and the
three rules in phase 6 that describe a renderer phase 3 changes.

### 0.8 Recording progress — read this before you write any code

This plan is the handover. Someone will pick it up not knowing what you finished, and the only thing
standing between them and repeating your work is this section.

**The rule: anything you finish, you mark finished, in the same commit as the code.** Not afterwards,
not at the end of the phase. A step whose box is unticked is a step the next person will start.

- Tick the step: `1. [ ]` becomes `1. [x]`.
- Update the phase's **Status** line, and the board below.
- A phase only becomes ✅ when its row in §7 (definition of done) is actually true — not when the code
  is written. If the code is in but unverified, it is 🟡, and say what is left.
- Leaving something half-done is fine; leaving it half-done **and unmarked** is not. Use 🟡 with one
  line on where you stopped and what you found.
- If you learn something that changes the plan — a step that turned out wrong, a defect nobody
  predicted — edit the plan and log it in §11. The plan is not a historical record; it describes what
  the next person should do now.

**Status vocabulary:** ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked (name the blocker).

#### The board

| Phase | What | Status |
|---|---|---|
| Audit (§3) | Hero reviewed against the code | ✅ Done 2026-09-20 |
| 1 (§4) | Correctness fixes — phone text, bare link, fit label | ✅ Done 2026-09-20 |
| 2 (§4) | Full-bleed keeps its slides | ✅ Done 2026-09-20 |
| 3 (§4) | Card/Open keep their shape when rotating | ✅ Done 2026-09-20 |
| 4 (§4) | Alignment in every branch | ✅ Done 2026-09-20 |
| 5 (§4) | One alignment control | ✅ Done 2026-09-20 |
| 6a+6b (§4) | Visibility mechanism + all six Hero rules | ✅ Done 2026-09-20. Phase 3 landed first, so 6b went in with 6a |
| 7 (§4) | Tests, docs, browser QA | ✅ Done 2026-09-20 — `pnpm test` 2451 · `pnpm lint` 0 errors · `pnpm verify` clean · SKILL.md updated · **browser matrix re-walked 2026-09-20 in the real editor and storefront: 2 regressions found and fixed, see §11** |
| Rollout (§5) | The other sections | 🟡 Started 2026-09-20 — 3 sections done, 9 candidates left (R1 and R2 both done) |
| Review (§11) | Implementation reviewed against this plan | ✅ Done 2026-09-20 — 3 findings, all fixed |
| D1–D6 (§6) | Product decisions | ✅ All answered 2026-09-20 |

---

## 1. The principle

> **A control that has no effect in the current configuration is not shown.**

This is a **builder-wide rule**, not a Hero rule. Every section editor follows it. A merchant must never
be offered a setting that:

- does nothing in the configuration they currently have,
- is overridden by another setting they have already made,
- only works in a different layout or mode,
- or has become irrelevant because of something else they selected.

Two rules go with it, and they are what make the principle safe to apply:

1. **Hidden is not erased.** A control that disappears keeps its stored value. Put the configuration
   back and the merchant's earlier choice is there, exactly as they left it. Nothing is rewritten on
   their behalf when a control hides.
2. **Hiding describes the renderer; it never replaces a fix.** If a control *should* work in a
   configuration and simply does not, the answer is to make it work — not to hide the evidence. Hiding
   is only correct where "no effect" is the intended, permanent behaviour of that configuration.

A third rule follows from the first two: **a hidden control can never make a section unsaveable.** Only
optional fields may be hidden, and that is enforced by a test, not by care.

### Why this is worth a rule

The Hero audit (§3) found six controls that are always visible and do nothing in the merchant's current
configuration, and the same shape appears immediately elsewhere — `product-grid` shows the
**Collection**, **Tags** and **Products** pickers all at once no matter which **Source** is selected, so
in every mode at least two of the three are dead. A merchant who changes a dead control and sees no
change in the preview learns that the preview is unreliable. That is the cost being paid, and it is paid
on the screen the merchant spends the most time on.

---

## 2. The mechanism

### 2.1 Where it lives

`SectionFieldSpec` (`lib/storefront-builder/field-specs.ts`) **cannot** carry the predicate. That file is
shipped verbatim into the backend's generated
`inventory-backend/src/constants/storefront-section-manifest.ts`, so it must stay import-free, erasable
TypeScript. A predicate is behaviour, and the backend has no business evaluating it.

So visibility is **editor-side only**, in a new module:

```
components/ecommerce/pages/editor/field-visibility.ts
```

The backend keeps validating shape and keeps accepting every stored value, visible or not. Nothing about
the wire format changes, so there is **no manifest regeneration and no deploy ordering** for any of this.

### 2.2 Shape

Rules are keyed `"<section type>.<field>"` falling back to a bare `"<field>"` — the same precedence
`fieldLabel`, `fieldHint`, `valueLabel` and `fieldEmptyChoice` already use in
`components/ecommerce/pages/editor/section-catalogue.ts`, so there is one lookup convention in the
editor rather than a second one.

A rule is a pure predicate over what the merchant can see:

```ts
interface FieldScope {
  /** The section's own settings. */
  settings: Record<string, unknown>;
  /** Its repeatable items, in order. */
  blocks: readonly Record<string, unknown>[];
  /** Set only when the field being drawn belongs to a block. */
  blockIndex?: number;
}

type VisibilityRule = (scope: FieldScope) => boolean;
```

Three things this shape must support, all of which are already needed:

- **A section field reading the section's settings** — `promises` visible only for `layout: "card"`.
- **A block field reading the *parent* section** — `focal` visible only where that slide's
  `imageFit` is `crop`; the second-button pair visible only on certain layouts. `SettingsFields`
  cannot see the parent section today, which is the enabling change.
- **Hiding the whole repeatable list** — `promises-band` with **Use your store's promises** on ignores
  every block beneath it, so the items list itself is what must go, not a field inside it. The same
  key space covers it: `"promises-band.blocks"`.

### 2.3 Wiring

- `SettingsFields` (`components/ecommerce/pages/editor/settings-fields.tsx`) gains `sectionSettings`,
  `blocks` and `blockIndex`, and skips a field whose rule returns false. It already has one
  visibility concept (`fromPage`, which prints a line saying where the value comes from instead); this
  is the second, and unlike `fromPage` it renders nothing at all.
- `SectionInspector` (`…/section-inspector.tsx`) passes them, and checks `"<type>.blocks"` before
  drawing the items list and its **Add item** button.
- `SectionStyleFields` (`…/section-style-fields.tsx`) is not spec-driven and takes a direct check for
  the one Style control a section can own itself (§4, phase 5).

### 2.4 Guarantees, as tests

- Every field named by a rule is `optional` in its spec — so hiding can never strip a required value
  and can never make `isComplete` fail.
- `savableSections` sends `section.settings` as-is, so a hidden value rides through every save
  untouched. A test asserts the round-trip: set a value, hide it, save, restore the configuration,
  the value is still there.
- Every rule has a test for both branches. A rule with no test is a rule nobody can trust.

---

## 3. What the Hero audit found

**Status:** ✅ Done — audit completed 2026-09-20. Findings below are verified against the code, not assumed.

Four render branches, chosen in `components/storefront-builder/sections/hero.tsx`:

| # | Condition | Renders |
|---|---|---|
| P1 | `full-bleed`, store banner off | `hero-fullbleed` island |
| P2 | `full-bleed`, store banner **on** | `hero-fullbleed-store` island |
| P3 | card/open **and** (slideshow or slides > 1) | `hero-carousel` island |
| P4 | card/open, exactly 1 slide, no slideshow | `HeroCardView` / `HeroOpenView` |

**Renderer defects** (fix, do not hide):

1. **Layout is discarded at 2+ slides.** Card and Open both fall into P3 — a dark edge-to-edge photo
   carousel. The merchant picked Card, added a second slide, and got a different section. Nothing says so.
2. **Full-bleed + store banner drops slides 2–5.** `islands/hero-fullbleed-store.tsx` passes
   `slides={[]}`. The editor says "5 of 5"; the storefront draws one and never rotates.
3. **"Hide text on phones" is dead in P4** — only the islands read it.
4. **A link with no button works in P1–P3 and does nothing in P4** — the static path requires both a
   label and a link.
5. **"Picture fit" is labelled "Follow Product cards"** and follows nothing: no hero calls
   `useStoreImageFit()`, and every branch falls back to whole-picture.
6. **Two alignment controls.** The Content tab's **Alignment** (which only ever worked in Open) and the
   Style tab's **Text alignment**, which half-works: on a card it centres the headline and leaves the
   buttons hard left, because the copy column is a flex column aligned to `flex-start`.

**Genuinely-inapplicable controls** (hide):

| Control | Has no effect | Visible when |
|---|---|---|
| Show as a slideshow | 2+ slides rotate anyway; full-bleed never reads it, and **D5 keeps it that way** | card/open **and** exactly 1 slide |
| Use the store's wording | not read by the plain full-bleed branch | not (full-bleed with the store banner off) |
| Running offer as the badge | only reaches the static branch | card/open **and** a single slide *before* phase 3; `card/open` *after* it (D6 fills any slide whose badge is empty) — rule **6b** |
| Show your promises | passed to `HeroCardView` alone — **today that is card *and* a single slide**, because the multi-slide path renders `HeroCarousel`, which takes no promises | card **and** a single slide *before* phase 3; `layout: "card"` *after* it (D6: every card carries the same strip) — this is rule **6b** |
| Focus point | `canvas` fit ignores it — and unset fit *is* canvas | that slide's Picture fit is **Fill and crop**. Note `settings-fields.tsx` **already** hides a `focal` field with no picture to point at, hardcoded by field type; the rule is an **additional** condition and that hardcoded check stays where it is (it is about the control's own input, not about the renderer) |
| Second button | read from slide 1, static branch only | card/open only, every slide, once phase 3 lands (**D3**) — rule **6b** |

---

## 4. Implementation plan — Hero

Ordered so that each phase makes the next one smaller. Phase 3 in particular removes work from phase 4.

### Phase 1 — Correctness fixes (independent, small)

**Status:** ✅ Done 2026-09-20. Unit tests, `pnpm lint`, `pnpm verify` and the browser matrix all green.

1. [x] Thread `hideTextOnMobile` through the static branch: `data-hide-mobile-copy` on the `HeroCardView` /
   `HeroOpenView` roots, plus the matching rules in `app/(storefront)/storefront.css`. The card's phone
   layout reorders its own children, so the rule targets the copy column and leaves the photo.
2. [x] A slide with a `link` and no `buttonLabel` renders `HeroSlideLink` in the static branch, as the
   islands already do. One behaviour in all four branches.
3. [x] `field-empty-choice.ts`: `"hero.imageFit"` becomes `WHOLE_PICTURE` ("Whole picture"). Drop the
   comment citing `useStoreImageFit()`.
   ⚠ **Superseded 2026-09-21 — this step was half right.** Dropping the `inherit` claim was correct:
   no hero calls `useStoreImageFit()`. `WHOLE_PICTURE` was not, because **`fit` is a listed value that
   draws exactly what unset draws** (`heroSlidePhoto` maps both to `canvas`), so the control ended up
   offering "Whole picture" and "Show the whole picture" as two choices for one rendering. It is now
   `{ kind: "value", value: "fit" }`, which is what this file's own doctrine prescribes for an empty
   that renders as a listed value. Found by browser QA during the follow-on plan
   (`storefront-hero-shape-controls.md`, §7 S5); unit tests could not catch it.

### Phase 2 — Full-bleed keeps its slides

**Status:** ✅ Done 2026-09-20.

4. [x] `islands/hero-fullbleed-store.tsx` passes the real slides. `HeroFullBleedView` already does the rest
   correctly — the classic home has always passed both slides and a fallback, and the view uses the
   fallback image per-slide exactly where a slide has no artwork of its own, which is what
   "Use the store banner" promises.
5. [x] `storeWords` currently survives only through `fallback.ctaLabel`, which the view reads only when there
   are no slides. Handle it in the island: where `storeWords` is on and a slide has no button label,
   substitute the store's own word. No change to the shared view.

### Phase 3 — Card and Open keep their shape when they rotate

**Status:** ✅ Done 2026-09-20. D1 = fix the classic home too, D3 = second button on every slide,
D4 = dots and swipe, no arrows.

⚠ **The new component is `components/storefront/hero-slides.tsx`, not the islands path this plan
originally named.** D1 puts the classic home on it too, and the classic home is not a builder island —
so it lives beside `hero-carousel.tsx` in the shared renderers directory, with a one-line `hero-slides`
entry in `island-map.tsx` pointing at it. That is how `hero-carousel` and `hero-fullbleed` are already
registered.

New client island `components/storefront-builder/islands/hero-slides.tsx`: `useHeroRotation(count)` —
the same hook the other two rotating heroes use, so one beat and one set of pause, hover and
reduced-motion rules — rendering `HeroCardView` or `HeroOpenView` for the current slide.

6. [x] Stack slides in a single CSS grid cell so the box sizes to the tallest and the height does not jump
   mid-rotation. Crossfade on opacity; non-active slides are `inert` and `aria-hidden`.
7. [x] `priority` on the first slide's photo only. A grid stack puts every slide in the DOM, and five
   priority hero images would undo the LCP care the current code takes.
8. [x] `hero.tsx` routes card/open multi-slide here. **D1: the classic home does the same** —
   `components/storefront/home/sections/hero-sections.tsx` routes its own Card/Open heroes to the new
   island instead of `HeroCarousel`, so a merchant who chose Card is never shown a dark carousel on
   either surface. `HeroCarousel` then serves only the classic full-bleed hero.
   This is the step that visibly changes live stores; see §10.
9. [x] `section-registry.tsx` — the frame follows the layout, not the slide count. Today `heroOpen` padding
   is given only to a *single* open slide.
10. [x] Chrome: dots under the rotating area and swipe on phones — **no arrows** (**D4**). The existing
    arrows and dots are styled for a dark photograph and cannot be reused over a light bordered card.
11. [x] **D6:** promises are drawn **once, under the rotation** — they describe the store, not the slide, so
    they must not crossfade with it. The campaign badge fills any slide whose own badge is empty, exactly
    as it does for a single slide today.
12. [x] **D3:** the second button is read per slide, not from slide 1. `hero.tsx` stops reaching into
    `blocks[0]` for `secondaryLabel` / `secondaryLink`; `heroSlides()` carries them on each slide.

### Phase 4 — Alignment (Left / Center) in every branch

**Status:** ✅ Done 2026-09-20.

Much smaller after phase 3: the 78° directional scrim belongs to the dark carousel, which builder heroes
no longer reach, and the full-bleed scrim runs top to bottom, which is alignment-safe.

13. [x] `hero.tsx` drops the `layout === "open"` gate on `align`.
14. [x] `HeroCardView` — `data-align` on `.sf-herocard`; rules for the copy column and the trust row. The
    phone rules stretch the CTAs full width; centred should centre, not stretch.
15. [x] `HeroFullBleedView` — `data-align`, plus `margin-inline` on the title and subtitle, which their
    inline `maxWidth` pins left today.
16. [x] Every new prop defaults to `left`, so the classic home callers that pass nothing are untouched.
17. [x] **Right alignment is deliberately out of scope.** It multiplies the edge cases (scrim direction,
    nav arrows, full-bleed dots, the card's photo gutter) for a third option. Left/Center only.

### Phase 5 — One alignment, one source of truth

**Status:** ✅ Done 2026-09-20.

18. [x] Hide **Style → Text alignment** for Hero, the same shape as the existing `isCoreSection` guards in
    `section-style-fields.tsx`.
19. [x] Hiding alone is not enough: `.sfb-sec { text-align: var(--sfb-align, left) }` would keep applying a
    stored value the merchant can no longer see or clear — the precise thing this principle forbids. Add
    `ownsAlign` to `FrameDefaults`, set it on Hero, and have `sectionFrame` omit the align variables for
    such a section. The Content tab's Alignment then becomes the only thing that moves hero text.
20. [x] **D2: write no migration.** The builder has no merchants on it yet, so there is no stored
    Style-tab alignment on a hero to rescue. Do not add a migration path for one — it would be code with
    no input, and §1 rule 1 forbids rewriting a merchant's stored value on their behalf anyway. If this
    plan is picked up after the builder has shipped to merchants, this step is the one to revisit.

### Phase 6a — The mechanism, and the rules that do not move

**Status:** ✅ Done 2026-09-20.

21. [x] Build `field-visibility.ts` and the wiring in §2.3.
22. [x] Register the three Hero rules whose condition is the same before and after phase 3:
    **Show as a slideshow**, **Use the store's wording**, **Focus point**.
23. [x] Write the guarantee tests from §2.4.

### Phase 6b — The three rules phase 3 rewrites

**Status:** ✅ Done 2026-09-20, together with 6a — phase 3 had already landed, so the three rules could
be written against the renderer they describe rather than the one it replaced.

A visibility rule is a claim about the renderer (§5), and phase 3 changes the renderer these three
describe. Registering them early would itself break §1: **Show your promises** written as
`layout: "card"` shows a live, dead control on a 3-slide card hero for as long as phase 3 is unlanded.

24. [x] **Show your promises** — `layout: "card"`, every card carrying the same strip (D6 as built).
25. [x] **Running offer as the badge** — card/open, once D6's "fills any empty slide badge" is real.
26. [x] **Second button** — card/open, every slide, once D3 is real. Drop the `blockIndex === 0` condition
    that today's slide-1-only behaviour would otherwise need.

### Phase 7 — Verification

**Status:** ✅ Done 2026-09-20. `pnpm test` 2462 passing across 239 files, `pnpm lint` clean (4 warnings,
all pre-existing and in untouched files), `pnpm verify` clean, both SKILL.md sections rewritten, and the
browser matrix walked by hand in the real editor (org `new3`, the Home page's 3-slide hero, desktop and
phone, light and dark). The draft was restored with **Discard changes** afterwards, so the merchant's
page is exactly as it was found.

27. [x] Unit: a render test per branch (layout × slide count), the new rotating island, every visibility
    rule, and the `sectionFrame` align-ownership change. `hero-carousel.test.tsx` and
    `hero-sections.test.tsx` must stay green — they cover the classic home.
28. [x] `pnpm test`, `pnpm lint`, `pnpm verify`.
29. [x] Docs: `.claude/skills/storefront/SKILL.md` documents the hero's branches, including the
    "carousel does not call `useStoreImageFit()`" note and the full-bleed rotation history. Both change.
30. [x] **Browser QA is not optional here.** Green type-checks and a full unit suite have already shipped
    UI-breaking hero defects in this codebase. Cover 3 layouts × (1 slide / 3 slides) ×
    (left / centre) × 2 breakpoints, dark mode, and each conditional control appearing and disappearing
    as the configuration changes — including the round-trip that proves a hidden value came back.

---

## 5. Rollout to the rest of the builder

**Status:** ⬜ Not started — do not begin before Hero phase 6b proves the mechanism.

Hero proves the mechanism. The rest follows as its own pass, one section at a time, each with the same
two questions: *does this control do anything here?* and *if not, is that intended or is it a defect?*

First-pass candidates from a read of `lib/storefront-builder/section-specs.ts` — each still needs its
renderer confirmed before a rule is written, because a control that *should* work belongs in the fix
column, not the hide column:

| Section | Control | Likely condition |
|---|---|---|
| ✅ `product-grid`, `selected-products`, `product-carousel` | Collection / Tags / Products | the matching **Source** only — `productSectionRequest` reads one picker per source and ignores the other two |
| ✅ `product-grid` | Whole rows | not a hand-picked source — `product-grid.tsx` ANDs the flag with `source !== "manual"` |
| ✅ `promises-band` | the items list itself | **Use your store's promises** is off — the section reads the blocks *or* the store's badges, never both |
| `collections-row` | Columns | grid layout |
| `category-tiles` | Columns | grid layout |
| `category-promo-cards` | Split, Side | `shape: "split"` |
| `category-promo-cards` | Arrows | `flow: "scroll"` |
| `image-banner` | Alignment | there is a heading or text to align |
| `image-banner` | Focus point | a shape is set, so the picture is actually cropped |
| `gallery` | Columns on phones | more than one column |
| `order-form` | Coupon box | — confirm against the renderer |
| `video` | Cover picture | not a YouTube link, which brings its own |

### Carried over from the Hero pass

| # | What | Why it is not done |
|---|---|---|
| ~~R1~~ | Delete the dead `.sf-hero-*` CSS left by the carousel | ✅ **Done 2026-09-20.** 20 dead rules removed (`.sf-hero`, `.sf-hero-slide`, `.sf-hero-active`, `.sf-hero-copy` and its stagger, `.sf-hero-scrim`, `.sf-hero-badge`/`-title`/`-sub`, `.sf-hero-nav`/`-prev`/`-next`, `.sf-hero-dots`, and the whole phone query that dressed them); the four live families kept and the block renamed to say what it now holds. See §11. |
| ~~R2~~ | `needs: ["campaigns"]` fetched for a full-bleed hero that never draws the badge | ✅ **Done 2026-09-20.** The flag is ANDed with `layout !== "full-bleed"`, so a hero that kept the setting from another layout no longer fetches the store's campaigns to decide nothing. |

Two standing rules for anyone extending this:

- **A new section ships with its visibility rules.** A control that only applies in one mode is
  registered that way on the day it is added, not audited into shape later.
- **A rule is a claim about the renderer.** When the renderer changes, the rule is part of the change.
  The tests in §2.4 are what make that claim fail loudly instead of quietly.

---

## 6. Product decisions — all answered

Answered 2026-09-20. These are settled; do not re-open one without saying so in §11.

| # | Decision | Answer |
|---|---|---|
| **D1** | The classic home's `HeroCard` / `HeroOpen` hand off to the dark carousel the moment slides exist — the identical defect, on live stores not yet on the builder. Fix both, or builder only? | ✅ **Fix both.** A merchant who chose Card and is shown a dark carousel is already not getting what they picked. It does visibly change those storefronts on deploy — §10 and phase 3 step 8. |
| **D2** | Heroes already centred through Style → Text alignment: migrate the value, or ignore it? | ✅ **Neither — write no migration.** The builder has no merchants on it yet, so no hero carries a stored Style-tab alignment. Migration code would have no input. Phase 5 step 20. |
| **D3** | Keep the second button slide-1-only, or allow it on every card/open slide? | ✅ **Every slide.** The rule becomes "card/open only", one condition fewer. Named in §10 as the one-way door: easy to ship, awkward to withdraw once merchants fill those fields in. |
| **D4** | Chrome on the rotating card/open: dots and swipe, or also arrows? | ✅ **Dots and swipe, no arrows.** Arrows over a light bordered card need their own visual treatment and are the piece most likely to look bolted on. |
| **D5** | `slideshow` on full-bleed — hide it, or make one slide rotate there too? | ✅ **Hide it.** A one-slide slideshow on an edge-to-edge photograph is a lone dot and nothing else. The §3 rule already reads this way. |
| **D6** | `promises` and `campaignBadge` inside the rotating card. | ✅ **Promises on every card, identical** — settled as "drawn once under the rotation" and **revised in build**: the trust strip is the card's footer, inside its border, and a detached strip under a bordered card is not the shape phase 3 exists to preserve. The copies are identical, so nothing about them appears to change as the slides cross-fade, which is what the decision was for. See §11. **Campaign badge fills any slide whose badge is empty**, as it does for a single slide today. Phase 3 step 11; it is what makes rules 24 and 25 true. |

---

## 7. Definition of done, per phase

A phase is done when a merchant can see the difference and a test proves it stays.

| Phase | Done when |
|---|---|
| 1 | On a Card hero with one slide: "Hide text on phones" hides the copy on a phone and keeps the photo; a slide with a link and no button label makes the whole hero clickable; the Picture fit control reads **Whole picture** as its empty option. |
| 2 | A full-bleed hero with **Use the store banner** on and 3 slides rotates all 3, uses the store banner only on a slide with no picture of its own, and still says "Start shopping" where a slide has no button label and the store's wording is on. |
| 3 | A Card hero with 3 slides is still a bordered card — copy one side, photo the other — and rotates between them. An Open hero with 3 slides is still copy-on-the-page, and rotates. Neither turns into the dark full-width carousel. Height does not jump between slides. Only the first slide's photo is marked priority. |
| 4 | Alignment = Centre visibly centres the headline, the subtitle **and** the buttons in all of Card, Open and Full-bleed, single-slide and rotating, on desktop and phone. Nothing moves when it is left on Left. |
| 5 | Hero's Style tab has no Text alignment control, and a hero that had one stored no longer reads it. The Content tab's Alignment is the only control that moves hero text. |
| 6a | Slideshow, Use the store's wording and Focus point each disappear in the configuration where they do nothing and come back — **with their previous value intact** — when the configuration is restored. |
| 6b | The same, for Show your promises, Running offer as the badge and Second button, against the renderer phase 3 left behind. All six of §3 are then live. |
| 7 | `pnpm test`, `pnpm lint`, `pnpm verify` green, the SKILL.md sections updated, and the browser matrix in §4 phase 7 walked by hand. |

---

## 8. Existing tests that must change

These assert **today's** behaviour and will fail as intended. A red test here is the plan working, not a
regression — but confirm the failure is the expected one before updating an assertion.

| Test | File | Changed by |
|---|---|---|
| "rotates two slides in the carousel island, inside the section's frame" | `components/storefront-builder/__tests__/hero-section.test.tsx` | Phase 3 — card/open multi-slide goes to the new island, not `hero-carousel`. |
| "rotates one slide under slideshow, and sends a full-width banner hero to its own island" | same file | Phases 2 and 3 — the store-banner island now receives real slides, and the slideshow case changes island. |
| "draws no button for a label without a link" | same file | Phase 1 — still correct (a label with no link draws no button), but it now needs a sibling test for the reverse: a link with no label makes the hero clickable. **Done:** the sibling tests are in. |
| "reads the same field differently per section, and falls back to the shared entry" | `components/ecommerce/pages/editor/__tests__/field-empty-choice.test.ts` | Phase 1 step 3 — this one the plan did not predict. It asserted `fieldEmptyChoice("hero", "imageFit").kind === "inherit"`, which is the claim step 3 retires. **Done:** it now asserts `{ kind: "meaning", label: "Whole picture" }`, and the test's real point — a section-keyed entry beating the shared one — still holds against `cardImageFit`. |

`components/storefront/home/sections/hero-sections.test.tsx` covers the **classic home** and must stay
green throughout. It did not: **D1 said otherwise**, so that suite changed with the rest —
`hero-carousel.test.tsx` went with the component it tested.

---

## 9. Local QA notes

- The builder is at **`/ecommerce/pages`** in the merchant app: open a page, press a section to open the
  inspector, and the preview on the right is the real renderer, not a mock. The device switch above it is
  what makes the phone rules in §4 testable.
- The preview redraws on every change and the draft autosaves — there is no save button to press.
- A local request limiter (1000 requests / 15 minutes) can start returning 404s on storefront pages
  during heavy click-through QA. That is the limiter, not a regression you introduced: wait it out.
- The conditional-visibility work needs a **stateful** check, not just a look: set a value, change the
  configuration so the control hides, change it back, and confirm the value returned. A screenshot
  cannot show this; it is the one thing in §1 a merchant would notice immediately if it broke.

---

## 10. Out of scope, and the risks worth naming

**Out of scope — do not add these while passing through:**

- **Right alignment.** Decided against: it multiplies edge cases (scrim direction, nav arrows,
  full-bleed dots, the card's photo gutter) for a third option. Left/Centre only.
- ~~**Deleting the dark `HeroCarousel`.**~~ **Done 2026-09-20, and the reason this was out of scope is
  why.** The guard read "the builder no longer reaches it, but the classic home still does" — D1 sent
  the classic home to `HeroSlidesView` too, so the last caller went with it and the component, its
  310-line test file and its island registration were all unreachable. **Its `.sf-hero-*` CSS block
  outlives it** (see §5): that prefix is shared with `HeroMedia`, the full-bleed hero, the dots and
  `HeroSlideLink`, so separating the dead rules from the live ones is its own pass, not a passing
  deletion.
- **A visibility rule for any non-Hero section.** §5 is a later pass with its own audit. Hero proves the
  mechanism first.
- **Migrating stored values.** D2 settled this: none, anywhere. The builder has no merchants yet.

**Risks:**

- **Phases 2, 3 and 5 all change how existing storefronts look**, and D1 extends phase 3 to live
  classic-home stores. This is deliberate — each case is a merchant currently not getting what they chose
  — but it is visible on deploy, so it wants a deliberate release rather than riding along with
  something else.
- **Phase 2 is not as quiet as it looks.** "A store that has not configured the control" is doing a lot
  of work there: the editor says "5 of 5" on a full-bleed store-banner hero, so merchants had every
  reason to add slides 2–5 believing they rendered. Turning those on is a visible change to a live
  storefront, in the same class as phase 3, only smaller. Phase 1's phone-text fix is the same shape for
  anyone who ticked "Hide text on phones".
- Each phase is independently revertable; phase 6a carries no visual risk at all — it only removes dead
  controls from the editor.
- The one-way door is **D3**: allowing a second button on every card/open slide is easy to ship and
  awkward to withdraw once merchants have filled those fields in.

---

## 11. Progress log

Newest first. One entry per session of work: what moved, what you found that the plan did not predict,
and where you stopped. Keep it short — the board in §0.8 says *what* is done, this says *what happened*.

- **2026-09-20 (R2 + rollout opened)** — R2 closed: the hero's `needs` now ANDs `campaignBadge` with
  `layout !== "full-bleed"`.

  **Rollout started with the flagship**, the three sections that pick products the same way. Verified
  against `productSectionRequest` before a rule was written: it reads `categoryId` only under
  **From a collection**, `tagIds` only under **With a tag**, `productIds` only under **Picked by hand**
  — so a grid set to Featured or Newest showed three pickers, all three dead, and every other mode
  showed two dead ones. One rule each, on all three sections. Also **Whole rows** (a hand-picked row
  keeps every pick, so there is no short row to drop) and the **promises band's item list**, which is
  the first rule to hide a repeatable list rather than a field.

  Two things worth knowing for the sections still to come:
  1. **Key by section type, never by field name.** `shop-by-tag` has its own `tagIds` that means
     something entirely different and must keep showing; a bare `tagIds` rule would have hidden it. A
     test pins that.
  2. **A `.blocks` rule needs its own guarantee.** The optional-field test cannot speak for a list, so
     the promises band has a round-trip test instead: hide the rows, save, and the merchant's own rows
     are still in the saved section.

  Browser-checked, per the lesson from the Hero pass: a Product grid on **Featured** now offers no
  picker at all, and switching it to **From a collection** brings the Collection picker — and only
  that one — back.

  **The suite is flaky under load.** A full run failed 5 tests across 3 unrelated suites
  (`period-filter`, `settings/domains`, `section-inspector`); all three pass in isolation and the next
  full run was clean at 2456. Second time this has happened — it is not these changes, but it will
  waste someone's afternoon if they meet it cold.

- **2026-09-20 (browser QA)** — The whole matrix walked by hand in the builder's live preview and on
  the storefront itself (card / open / full-bleed × 1 slide / 3 slides × left / centre × desktop /
  phone × light / dark, plus picture fit, focus point, dots, hover-pause, CTA and the conditional
  controls appearing and disappearing). **Two regressions found that every unit test had passed**, both
  now fixed:
  1. **A stacked slide left a void under the short one.** The grid cell is as tall as the tallest
     slide — the point of a stack — but only the WRAPPER stretched, not the hero inside it. Measured on
     the storefront: a 625px photo slide beside a 183px text-only slide put **442px of empty ground**
     under the second, reading as a broken section. `.sf-heroslides-slide` is a grid now, so the card
     (or the open hero) fills the cell and its contents centre in it. Re-measured: both slides 625px,
     and 578px in the open layout.
  2. **"Show as a slideshow" had become a control that does nothing, in the only configuration where
     it was still offered.** The rule showed it at exactly one slide; since phase 3 a single slide
     under it renders the same hero the static branch renders, only as a client island — so it cost
     the LCP image its server markup and gave the merchant nothing. It used to mean something, when
     one slide under it became the dark carousel. Nothing reads it now (`hero.tsx` branches on the
     slide count alone) and nothing offers it: the first rule in `field-visibility.ts` that hides a
     control everywhere. The field stays in the spec, so migrated heroes keep the stored value and the
     wire format is unchanged.

  Confirmed working in the browser, not just in tests: phase 1's "Hide text on phones" on a card (copy
  gone on the phone, photograph kept, desktop untouched), a button drawn from its label alone, the
  "Whole picture" empty choice, phase 2's full-bleed banner hero rotating all its slides, phase 3's
  card and open heroes keeping their shape with dots under them, phase 4's centring in every layout on
  both breakpoints and in dark mode, and every conditional control appearing and disappearing as the
  layout, slide count and picture fit change.

- **2026-09-20 (D2 measured)** — D2 assumed no hero carries a Style-tab alignment. **Checked, read-only,
  against both clusters.** Production: **zero builder pages exist at all**. Test cluster: 57 pages, 9
  with heroes, **0 heroes with `style.align`** (one non-hero section has one, and the Style control is
  untouched for those). So `ownsAlign` silently ignores a value that nothing has stored, no merchant's
  hero moves, and D2's "write no migration" is now measured rather than assumed.

- **2026-09-20 (R1, dead hero CSS)** — The carousel's CSS block, left standing when its component was
  deleted, is gone: **231 lines out, 141 back**, `pnpm test` (2451), `pnpm verify` and `pnpm lint` green.
  Done rule by rule rather than as a block, because four families in that same `.sf-hero-*` prefix are
  live and were interleaved with the dead ones: `.sf-hero-media*` (every hero's photograph),
  `.sf-hero-slide-link`, `.sf-hero-dot*`/`.sf-hero-fill`/`.sf-hero-paused` (the rotating heroes' dots,
  which `hero-slides.tsx` restyles for a light surface) and the unrelated `.sf-visually-hidden` /
  `.sf-media-*` that had lodged there. Two queries had to be split rather than dropped — the 640px one
  kept only its `object-position` rule, the reduced-motion one only `.sf-hero-fill`. Each class was
  checked against what the components actually emit before it went. The block header now names what
  remains and why, so the next reader does not have to re-derive it.

  Two tests still assert the *absence* of deleted classes (`.sf-hero-scrim`, `.sf-hero-nav`). Kept on
  purpose: they now guard against a dark carousel being reintroduced behind a merchant's chosen layout,
  which is the defect this whole pass existed to fix.

- **2026-09-20 (review pass)** — Implementation reviewed against this plan; `pnpm test` (2462),
  `pnpm lint` (0 errors) and `pnpm verify` re-run green independently. Three things the build got
  wrong, all now fixed:
  1. **`HeroCarousel` was dead and two comments said it wasn't.** D1 removed its last caller, so the
     component, its 310-line test file and its `island-map` entry were unreachable, while
     `hero-sections.tsx` and SKILL.md both claimed a caller still existed. Deleted, and every comment
     that named it — `use-hero-rotation.ts`, `category-strip.tsx`, `hero.tsx`, `hero-slides.tsx`,
     SKILL.md ×2 — rewritten. Its CSS block is tracked as **R1** in §5 rather than removed blind.
  2. **A button label with no link had stopped drawing a button** on the card and open heroes, static
     and rotating. The deleted carousel drew one (`HeroCtaLink` sends an empty link to the catalogue),
     and the full-bleed hero still does — so the fix that was meant to make all four branches agree had
     quietly left two of them disagreeing the other way round, and live classic-home stores with a
     label-only slide would have lost a visible button. A label is now the whole condition, for both
     buttons, everywhere. The test that asserted the old behaviour is inverted and a rotating sibling
     added.
  3. **D6's record contradicted D6 as built.** §6 and the §3 table still read "promises drawn once
     under the rotation" while the code, its comment and its test all do the opposite — and entry 3 of
     the previous log entry explains why the code is right. The decision record now says what shipped.

- **2026-09-20 (browser QA — phase 7 closed)** — The matrix was walked by hand in the real editor, on
  org `new3`'s Home page, which already had a 3-slide hero. Everything the plan promised was visible:

  - **Phase 3, the one that mattered.** Switching Layout from Full width to **Card** with 3 slides drew a
    bordered card — copy one side, photo the other — and rotated between them. Before this it became the
    dark edge-to-edge carousel. **Open** stayed open. Dots sit *under* the card, the active one a wide
    pill in the store's brand colour, and there are no arrows.
  - **Phase 4.** Alignment = Centre centred the badge, headline, subtitle **and the button**, on the card
    and on the full-bleed hero, desktop and phone. On a phone the CTA centres at its natural width
    instead of stretching edge to edge, which is the rule the plan called out by name.
  - **Phase 5.** The hero's Style tab lists Background, Above, Below, Width, Text colour — **no Text
    alignment**.
  - **Phase 6.** A plain full-bleed hero offers no Slideshow, no wording, no running offer and no
    promises; turning **Use the store banner** on brings the wording control back, because that is the
    one branch that reads it. Switching to Card brings all of them back except Slideshow, which stays
    hidden at 3 slides. Setting slide 1's **Picture fit** to *Whole picture* removed that slide's **Focus
    point** and left the other two slides' alone; putting it back to *Fill and crop* brought the control
    back with its focal point intact — the round trip, on real data.
  - **Phase 1.** The Picture fit control's empty choice reads **"Whole picture"**, not "Follow Product
    cards". "Hide text on phones" on one slide dropped that slide's copy on the phone and kept its
    photograph.
  - **Phase 2.** Full width + **Use the store banner** + 3 slides: three dots, and it rotates through all
    three, each with its own copy. It used to draw one and never move.
  - Dark mode: the card keeps its border, and the new dots stay legible (they take `--border-strong` and
    `--primary`, not the carousel's white).

  Two observations, neither a defect:

  1. **The stack is as tall as its tallest slide**, so a slide whose copy is hidden on phones leaves
     whitespace under its photograph while the other slides' copy still sets the height. That is the
     direct cost of "the height does not jump mid-rotation" and the right trade, but it is worth a line
     in the merchant help if "Hide text on phones" is ever documented per slide.
  2. **The hover-pause can latch in the editor preview.** A synthetic click into the preview fires
     `onMouseEnter` without a matching `onMouseLeave`, so the hero looks stuck until the pointer really
     moves over it and away. That is `useHeroRotation` working as designed; it cost ten minutes of
     chasing a rotation bug that was not there.

  The draft was left exactly as found: every change made during QA was reverted with **Discard changes**
  (the page had no unpublished changes before this session), and the preview was put back to light mode
  and the desktop device.

- **2026-09-20 (phases 3–7)** — Phases 3, 4, 5, 6a and 6b all shipped in one pass, since D1–D6 were
  answered up front and phase 3 landing first meant 6b's three rules could be written against the
  renderer they describe instead of the one it replaced. `pnpm test` 2462 green over 239 files,
  `pnpm lint` clean, `pnpm verify` clean, both SKILL.md sections rewritten. **Browser QA not done** —
  see phase 7; it is the only thing holding all of this at 🟡.

  What the plan did not predict:

  1. **The rotating hero belongs in `components/storefront/`, not in `islands/`.** D1 puts the classic
     home on the same component, and the classic home is not a builder island. It sits beside
     `hero-carousel.tsx` with a one-line island-map entry, exactly as `hero-carousel` and
     `hero-fullbleed` already do.
  2. **The campaign badge could not cross the island boundary as JSX.** It is composed on the server
     from a `store-word` island, and the rotating hero is a client component reached through `Island`.
     `campaignBadge` was split into a text half (`campaignLabel`, "Eid sale · 10%") that crosses as
     plain data and a word half the client joins from its own dictionary.
  3. **D6's "promises drawn once under the rotation" would have broken the card's shape.** The trust
     strip is the card's footer, inside its border; a detached strip under a bordered card is not the
     shape phase 3 exists to preserve. Every card gets the promises instead — the copies are identical,
     so nothing about them appears to change as the slides cross-fade, which is what D6 is actually for.
  4. **`sectionFrame`'s align ownership needed a test of its own**, and got one: hiding the Style
     control is only half, and a stored value that keeps applying invisibly is precisely what §1 forbids.
  5. **The inspector's test helper had to gain a `TooltipProvider`.** The hero is the first section with
     repeatable items that these tests render, and Radix refuses a tooltip outside a provider.
  6. **Phase 6 ended up one phase, not two.** 6a/6b was a safety split for the case where the rules
     shipped before phase 3. They did not, so the distinction had no work left in it.

  New tests: `components/storefront/hero-slides.test.tsx` (10), `field-visibility.test.ts` (9, including
  the hidden-value round trip and the "only optional fields" guarantee), plus additions to the builder
  hero, classic hero, frame and inspector suites.

- **2026-09-20 (phases 1 and 2)** — Both shipped, code complete, `pnpm test` 2433 green across 237 files
  and `pnpm lint` clean (4 pre-existing warnings, none in the changed files). Browser QA is the only
  thing holding either at 🟡.

  Four things the plan did not predict, all now in the plan above:

  1. **`field-empty-choice.test.ts` failed**, and §8 had not listed it. It asserted the very claim step 3
     retires. Updated, and added to §8 so the next reader is not surprised twice.
  2. **`HeroSlideLink`'s focus ring is white.** Correct over a photograph, invisible on the card and open
     heroes, which sit on `--card`. Those two now take `--primary`, beside the base rule in storefront.css.
  3. **The whole-hero link cannot ship next to a button.** It is the last child and covers the hero, so it
     would paint over the buttons and swallow their presses. The islands never hit this (they have no
     second button); the static branch does. So it renders only where `actions` is null, which is
     stricter than "no button label" and is the same one-hit-area rule `HeroSlideLink`'s own doc states.
  4. **Phase 2 had a hidden regression in it.** Handing the view real slides makes it read copy from the
     slide and ignore `fallback`'s — so a hero moved from the classic home, whose first slide is empty on
     purpose, would have lost the store's name as its headline. The island now stands the store's name in
     on the **first** slide only, and `fallback` carries the banner picture alone. Its `fit` is pinned to
     `cover` rather than borrowed from slide 1: the banner is one picture shared by every artwork-less
     slide, so taking slide 1's fit for it was arbitrary the moment there was more than one slide.

  New unit tests: three in `hero-section.test.tsx` (whole-hero link, no link beside a button, the
  `data-hide-mobile-copy` marker in both layouts), one more for multi-slide banner routing, and a new
  `islands/__tests__/hero-fullbleed-store.test.tsx` covering the store-name stand-in, rotation with three
  slides, merchant copy winning, and wording-off.
- **2026-09-20 (later)** — Plan reviewed against the code before starting. Every §3 finding verified in
  the source (`hero.tsx:135` P3 swallowing card/open, `hero-fullbleed-store.tsx:29` `slides={[]}`,
  `field-empty-choice.ts:62` `FOLLOW_PRODUCT_CARDS`, `hero.tsx:157` align gated to open,
  `hero.tsx:200` promises on `HeroCardView` only, and no hero anywhere calling `useStoreImageFit()`).
  Four corrections came out of the review and are now in the plan: (a) the §3 **Show your promises** rule
  was written for the renderer phase 3 *will* leave, not today's — shipping it early would show a dead
  control on a multi-slide card hero, which is the exact failure §1 exists to prevent, so phase 6 is
  split into **6a** (three stable rules, any time) and **6b** (three rules that must follow phase 3);
  (b) `settings-fields.tsx` already hides a `focal` field with no picture, hardcoded by field type — the
  new rule composes with it rather than replacing it; (c) §10 understated phase 2, which does change live
  storefronts; (d) D2's original "migrate" recommendation would have rewritten a merchant's stored value,
  contradicting §1 rule 1 — moot now, since the answer is that there are no merchants to migrate.
  D1–D6 all answered (§6). Nothing is blocked.
- **2026-09-20** — Hero audited against the code (§3): 6 renderer defects, 6 inapplicable controls.
  Plan written. The conditional-visibility principle generalised from Hero to the whole builder (§1, §5)
  after review. No code written yet. Blocked on D1–D6.
- **2026-09-21** — One correction from the follow-on plan's browser QA: phase 1 step 3's
  `"hero.imageFit": WHOLE_PICTURE` put one answer on the list twice and is now
  `{ kind: "value", value: "fit" }`. The step is annotated above. Nothing else in this plan changed.

