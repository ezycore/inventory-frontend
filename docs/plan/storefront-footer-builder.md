# Storefront footer — review + improvement plan

Status: **Phases 0–5 BUILT 2026-09-25, uncommitted** (FE + BE). Owner approved every recommendation
in §4 the same day, and decided C: the merchant gets a switch to hide "Powered by EzyCore", **shown
by default**, no plan gate. Browser QA not yet done — checklist in backend
`docs/features/ecommerce-qa.md` → "Footer builder".

**What implementation changed from this plan**

- Style and blocks live on **`nav`** (`nav.footerStyle`, `nav.footerBlocks`), not `theme`: applying a
  ready-made theme replaces `theme` wholesale and would erase a merchant's uploaded footer logo.
- Two renderers, chosen by data rather than a migration: no `footerBlocks` ⇒ the fixed layout,
  byte-for-byte as before (so no pixel risk for untouched shops); the editor shows the layout as
  blocks and the **first block edit** saves the list. Picking a layout again clears it (confirm).
- Payment / partner logos are a **Logo strip block**, not a bottom-bar mode; the bottom bar keeps its
  payment chips with their existing phone/desktop switch.
- Pictures upload through `useUploadStorefrontImage` (the announcement background's uploader), not
  the page builder's upload; the backend deletes a picture a save dropped.
- "Centre the blocks" (`footerStyle.align`) applies to composed footers only.
- ~~Store promises stay edited in their own section~~ — superseded 2026-09-27 (panel regroup, below).
  The promises block draws them in an `iconStyle` (disc / plain / none, unset ⇒ plain) that
  matches the promises band's setting of the same name (2026-09-25).
- **Panel regroup (2026-09-27): what one block shows is edited inside that block.** The Footer panel
  is four sections — Start from a layout, Blocks, Bottom line, Look. The brand block carries a
  **Logo & shop name** switch (`showLogo`, unset ⇒ shown; backend field added the same day) plus the
  footer-logo upload and the about text under their switches; the promises block carries the
  promises editor. With no promises block, `FooterPromisesNotice` sits at the top of Blocks — **Add
  to footer**, or **Edit promises** in place, because page promise bands and the hero read the same
  list and a shop may want them there only. **Bottom line** gathers the right-side note, payment
  badges, the credit switch and alignment (they were in Wording, Look and Payment methods). The
  background photo joined **Look**; the two phone overrides (spacing, bottom-line alignment) fold
  under **Phone adjustments**. The switches write the block (so the first one moves a fixed layout
  onto blocks); the about text, footer logo and promises are shop-wide copy and never do. A brand
  block with all four parts off renders nothing on the shop and warns in the editor.
- **Same day, after owner review:** the promises block gained **Arrange** (`arrange`: row / column,
  unset ⇒ row; backend field added). Column is one grid track on every screen
  (`.sf-footer-trustbar[data-arrange="column"]`); choosing it on a block with no width set also sets
  `width: "narrow"`, because a single stack in a full row leaves the row empty. The about text is a
  textarea and the storefront draws its line breaks (`footerBlurb`, `white-space: pre-line`) — the
  backend already kept them.
- Phase 5 per-landing-page "hide footer" and social icon styles: **not built** (the landing page's
  existing header/footer switch already covers hiding).

Scope: the storefront footer on **phone first, desktop second** — its five layouts, the Customize →
Footer panel that drives them, and the data behind it. Goal: a merchant can build their own footer
(blocks, order, pictures, colours, links) without asking us, and every shop that never touches it
keeps looking exactly as it does today.

---

## 1. What exists today

### 1.1 Data

| Field | Where it lives | Edited in |
|---|---|---|
| Layout (`columns` / `simple` / `rich` / `contact` / `newsletter`) | `templates.footer` | Customize → Footer → Layout |
| Link groups `{ title, links: [{ label, url }] }` (max 10 groups) | `nav.footer` | Customize → Footer |
| Auto content-pages column `{ show, title }` | `nav.footerContentPages` | Customize → Footer |
| Payment badges visibility `{ showOnDesktop, showOnMobile }` | `nav.footerPaymentMethods` | Customize → Footer |
| About text (280), bottom note (80), contact heading (60), newsletter copy | `copy.footer*` | Customize → Footer |
| Store promises (max 4, text + icon) | `trustBadges` | Customize → Footer |
| Logo | store `logo` (shared with header) | Customize → Look |
| Phone, social links | Settings → General | **Not** in Customize |

Backend: `storefront-settings.model.ts` (`footerGroupSchema`, `copy.footer*`, `trustBadges`),
`storefront-settings.validator.ts` (`footerGroupSchema` ~l.811, `copy` ~l.701), DTO in
`organization.dto.ts`. Frontend: `components/ecommerce/customize/parts/footer-part.tsx`,
`footer-links-field.tsx`, `trust-badges-field.tsx`; renderer `components/storefront/store-footer.tsx`
→ `footer/footer-variants.tsx` + `footer/footer-pieces.tsx`; CSS `app/(storefront)/storefront.css`
(`/* ---- Footer (all five layouts) ---- */`).

### 1.2 Phone (primary)

Every layout collapses to one stack. Link groups become accordions, which **all start open**
(`FooterCol`, `useState(true)`), so a shop with 3 groups + pages shows one long list. Payment badges
are the only thing with a phone/desktop switch. There's nothing else phone-specific.

### 1.3 Desktop

The brand block sits on the left, and the link columns are content-sized and anchored right. Contact
uses a 3-track grid, and Simple is a centred stack. The bottom bar shows ©, "Powered by EzyCore",
payment chips and the note.

---

## 2. Findings

Severity: **B** = bug on live shops, **G** = merchant can't do something reasonable, **P** = polish.

| # | Finding | Sev |
|---|---|---|
| F1 | Footer links bypass `storeLinkHref`/`normalizeStoreLink` (`groupColumns`, `footer-pieces.tsx`): `href: lk.url \|\| "#"`, `external: true`. A schemeless `facebook.com/x` becomes a relative link that 404s on the merchant's own shop (the same bug `social-links.tsx` already fixed). `/shop/...` paths aren't normalized. Internal links reload the full page. | B |
| F2 | Links with a label but no URL are saved and render as `href="#"` (`trimFooterGroups` keeps them). | B |
| F3 | Promise strip: the base `--trustcols: 1fr` makes `repeat(1fr, …)` invalid CSS. Phones stack only by fallback. Desktop is fixed at 3, so 4 promises wrap 3 + 1. | B |
| F4 | No image anywhere in the footer: no footer logo, no background, no payment/partner/courier logo strip, no picture block. | G |
| F5 | Payment methods are text chips only. BD shoppers look for bKash/Nagad/card marks. | G |
| F6 | The layout is one of 5 fixed templates. Blocks can't be reordered, combined (contact **and** newsletter) or added (text, image, map, hours). | G |
| F7 | Store promises render only in the Rich layout. | G |
| F8 | No styling: background is hardcoded to `var(--card)`, and the border, padding, text colour and alignment are all fixed. | G |
| F9 | Phone: accordions all open, with no "collapsed" or "first open" option and no per-block phone/desktop visibility. | G |
| F10 | The link editor is a plain URL text box. The header menu has typed links (category / page / url) and reorder arrows; the footer has neither for links **or** groups. There's no "open in new tab". | G |
| F11 | The about text is plain text only, with no line breaks, links, address or opening hours. | G |
| F12 | Social links and phone are edited only in Settings → General, and the Footer panel doesn't point there. | P |
| F13 | "Powered by EzyCore" can't be removed (see decision C). | P |
| F14 | `footer-part.tsx` (171 lines) will pass the 250-line component limit once any of this lands, so it has to be split by block. | P |

---

## 3. Target design

**A footer is an ordered list of blocks inside a styled frame, plus a bottom bar.** Today's 5 layouts
become **presets**: a preset writes a block list and a frame style, and the merchant edits from
there. This is the same model the Storefront Builder uses for page sections, scaled down: blocks are
footer-specific, and there are no per-page footers (the footer is site frame, like the menu; see
`storefront-menu-controls.md` §1).

```
Frame (style: ground, text tone, spacing, alignment, divider, top border)
 ├─ Row 1: blocks[]  — on desktop laid out as tracks, on phone stacked in order
 │    brand | links | pages | contact | newsletter | promises | text | image | logos | social
 └─ Bottom bar: © line, powered-by, payment chips/logos, note
```

Each block carries `visibility: { desktop, mobile }` and a `width` hint (`auto` / `narrow` / `wide`)
for desktop. On phone, order = stack order, and link-type blocks follow the frame's accordion
setting.

---

## 4. Decisions for the owner

| # | Question | Recommendation |
|---|---|---|
| A | Keep 5 fixed layouts and bolt on options, **or** move to blocks + presets? | **Blocks + presets.** Bolting on gives 5 × N option combinations that each need QA, and still can't combine contact + newsletter. |
| B | Footer colours: palette tokens only, or free colour too? | **Tokens first** (Card / Surface / Brand / Dark / Inverse), plus **Custom** with the existing contrast warning. Text tone is auto-picked from the ground. |
| C | Is "Powered by EzyCore" removable? | **Decided:** a merchant switch in Customize → Footer, on (shown) by default, available on every plan. |
| D | Payment/partner logos: merchant uploads only, or a built-in logo set? | **Merchant uploads only** for Phase 3. A built-in set means shipping third-party brand marks, which is the merchant's and vendor's matter, not ours. Revisit if merchants ask. |
| E | Phone accordion default | **All closed**, first group optional-open. Merchant control: `open` / `first-open` / `closed`. Default for existing shops = `open` (today's behaviour) so nothing moves until they choose. |

---

## 5. Phases

Tests follow the owner's rule: targeted test files during a phase, and full suites + `pnpm verify`
once at the end.

### Phase 0 — bug fixes (no schema change)

- **F1:** `groupColumns` resolves each link through `storeLinkHref(base, url)`. `external` becomes
  true only for an absolute `http(s)` URL, and internal links render `<Link>`. Normalize on the way
  out in `draft-payloads.ts` too, like `cleanSectionConfig` does for card links, so the saved value
  is clean.
- **F2:** `trimFooterGroups` drops a link missing a label **or** a URL. Apply the same rule in the
  preview (the file's own rule: preview and PATCH trim identically). The renderer also skips blanks,
  so rows already saved stop rendering `#`.
- **F3:** base `--trustcols: 1`, and the footer trust bar gets its own ramp: 1 on phone, 2 at 480px,
  `min(count, 4)` on desktop via an inline `--trustcols` set from the badge count.
- Tests: `footer-pieces.test.tsx` (href resolution, blank skip), `draft-payloads.test.ts`.

### Phase 1 — link editor parity (F10, F12)

- Footer link shape widens to the menu child's: `{ label, type: "category" | "page" | "url", value,
  newTab? }`. **Read both shapes:** a legacy `{ label, url }` is read as `type: "url", value: url`.
  The backend validator accepts both and the model keeps `url` for old rows. No data migration: rows
  convert when the merchant next saves. (Live product, so a rename is a migration; see CLAUDE.md.)
- Reuse `menu-item-fields.tsx` for the row editor (the type `SimpleSelect` + category/page picker).
  Don't fork it. If its props are menu-specific, extract the shared row into one component used by
  both.
- Reorder arrows for groups and links, matching `trust-badges-field.tsx`.
- `newTab` → `target="_blank" rel="noopener"` only for absolute URLs.
- Add a "Phone number and social links are set in Settings → General" hint with a link in the Footer
  panel.
- Backend: `footerGroupSchema` (model + validator + DTO) gains `type`, `value`, `newTab`. Regenerate
  `pnpm gen:api-types`.

### Phase 2 — frame style + phone behaviour (F8, F9) — needs B, E

New `theme.footerStyle` (a theme sibling, so a ready-made theme can set it and presets can too):

| Setting | Control | Values | Responsive |
|---|---|---|---|
| Ground | `SwatchField` | card (default) / surface / brand / dark / custom colour | no |
| Text tone | auto from ground; override `SegmentedField` | auto / light / dark | no |
| Spacing | `SegmentedField` | compact / regular (default) / roomy | **yes** `{ base, mobile? }` |
| Alignment | `SegmentedField` | start (default) / centre | **yes** |
| Top border | `PartSwitch` | on (default) | no |
| Phone link groups | `SegmentedField` | open (default for existing) / first open / closed | phone only |
| Bottom bar | `SegmentedField` | spread (default) / centred / stacked | **yes** |

- Rendered as CSS variables on `FooterShell` (`--ft-bg`, `--ft-text`, `--ft-muted`, `--ft-pad`), so
  all variants pick it up without per-variant code. Mobile-first CSS: base = phone, `@media
  (min-width: 680px)` restores desktop.
- `FooterCol` initial state comes from the phone setting. It stays **open on SSR and on desktop**,
  and collapses after hydration only below 680px (read via `matchMedia` in an effect), so there's no
  hydration mismatch and no flash on desktop.
- Contrast: reuse the existing brand-colour contrast helper for the custom ground and warn in the
  panel, like the Look part does.

### Phase 3 — pictures (F4, F5) — needs D

All uploads go through the builder's existing `storefrontPagesApi.uploadImage` (`POST
/storefront-pages/images`, `storefront.design`) and the `ImageField` wrapper
(`components/ecommerce/pages/editor/image-field.tsx`). The image is stored **inline in the draft** as
`storefrontImageSchema` and saved with the panel's Save, like hero slides. No new upload endpoint.
Counts toward `storageGb`: show `<StorageNotice>`.

| Picture | Shape | Notes |
|---|---|---|
| **Footer logo** override | `theme.footerStyle.logo` + `logoHeight` (18–60) | Unset ⇒ store logo (today). Needed for a light logo on a dark footer. |
| **Logo strip** (payment / courier / partner) | `nav.footerLogos: [{ image, alt, url?, }]`, max 12, reorderable | Its own block and/or bottom-bar placement. Visibility `{ desktop, mobile }`. `alt` required: it's the only text a screen reader gets. Height-capped, width auto, never cropped. |
| **Background image** | `theme.footerStyle.bgImage` + focal point + overlay strength | Reuse `focal-point-picker.tsx`. Overlay forces the text tone for legibility. On phone, `background-size: cover` on a tall stack, so show the focal point preview at phone ratio first. |
| **Image block** | block `{ type: "image", image, alt, url?, maxWidth }` | For app-store badges, a map screenshot, a certificate, etc. |

Payment chips stay as today when there's no logo strip, and the merchant chooses "chips / logos /
both / none" for the bottom bar. Open item: check whether section images that are removed from a
draft get cleaned out of R2. If not, footer images inherit the same orphan behaviour; list it rather
than fix it here.

### Phase 4 — blocks + presets (F6, F7, F11, F14) — needs A

- New `nav.footerBlocks: FooterBlock[]` (max 12). Block types:
  `brand` (logo + about text), `links` (one group, inline, so groups become blocks), `pages` (the
  auto content-pages column), `contact` (card), `newsletter`, `promises` (reads `trustBadges`),
  `text` (rich text via the existing rich-doc editor + `RichDocView`, which covers F11: address,
  hours, links), `image`, `logos`, `social`.
- Each block has `id` (stable, for React keys and the editor), `visibility {desktop, mobile}` and
  `width` (desktop only).
- **Backward compatibility:** the renderer reads `footerBlocks ?? blocksFromLegacy(templates.footer,
  nav.footer, nav.footerContentPages, …)`. `blocksFromLegacy` is a pure function that reproduces each
  current layout exactly. The DB isn't written until the merchant saves in the new editor. Prove "no
  visual change" with `PIXEL_STORE=<slug> pnpm pixel:capture` before and `pixel:compare` after, on
  one store per layout, **at phone width first**.
- Presets: "Layout" picker stays at the top of the panel, now labelled as a starting point. Picking
  one replaces the block list after a confirm ("This replaces your footer blocks"). Theme presets
  that set `templates.footer` today (e.g. Fashion Shine → newsletter) map to the same recipes.
- Editor: the Footer panel becomes a block list (add / reorder / hide-on-phone / remove), each block
  opening its own small inspector. Split files: `footer-part.tsx` (frame + list), `footer-blocks/*`
  (one inspector per block type), shared row with the menu editor from Phase 1.
- Desktop layout: blocks flow as a flex row. `wide` blocks take 1fr, `auto` blocks size to content,
  and anything past the row wraps. This replaces the per-variant grids, and the right-anchored
  content-sized columns fix (`FooterColumns`) becomes the `auto` width.
- Phone: blocks stack in order, link-type blocks use the Phase 2 accordion setting, and blocks with
  `mobile: false` are hidden with the existing `stripVisibilityClass`.

### Phase 5 — extras (optional)

- **Powered-by switch** (decision C): `theme.footerStyle.showPoweredBy`, unset ⇒ shown. Built with
  Phase 2 since it lives in the same style block.
- **Per-landing-page "hide footer"** switch, mirroring menu Phase 5, for distraction-free campaign
  pages.
- Social icon style (outline / filled / brand colour) and size.

---

## 6. Cross-cutting

- **Preview parity:** every new field goes through `draft-payloads.ts` (PATCH **and** preview
  message) and `use-sf-preview-store`, so the live preview repaints as the merchant edits.
  `store-footer.tsx` already follows the `??`-not-`||` draft rule. Keep it.
- **Cache:** saves already call `revalidateStorefront()` through the settings mutation. Confirm the
  footer is in the SSR payload that flush covers.
- **i18n:** new shopper-visible defaults (block headings, "Follow us", "Opening hours") go in the
  storefront dictionary in **en + bn** via `docs/I18N-GLOSSARY.md`.
- **Accessibility:** logos need `alt`, accordion keeps `aria-expanded`/`aria-controls`, and a
  custom ground must pass contrast or warn.
- **Docs in the same change:** `.claude/skills/storefront/SKILL.md` (footer section),
  `docs/help/en|bn` pages covering Customize → Footer (`ui_labels`),
  `mission-control/docs/EZYCORE_MASTER_REFERENCE.md` if it lists footer layouts, and the backend
  `storefront-orders`/settings docs for the schema.
- **Coding standard:** every touched file keeps or gains the `// coding-standard: maintained`
  marker. Ask before rewriting any file that lacks it.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Existing footers shift after Phase 4 | Read-time `blocksFromLegacy` + pixel diff on each layout, phone and desktop |
| Old link rows `{label,url}` break after Phase 1 | Validator + renderer accept both shapes. Covered by a test with a legacy fixture |
| Background image makes text unreadable | Forced overlay + text tone, preview shown at phone width |
| Footer grows past the rail's usefulness | Block inspectors open one at a time. Summary line in `part-summaries.ts` |
| Storage cost from logo strips | 12-logo cap, sharp webp variants, `<StorageNotice>` |

## 8. Order of work and size

| Phase | Needs | Repos | Rough size |
|---|---|---|---|
| 0 Bug fixes | — | FE | small |
| 1 Link parity | — | FE + BE | medium |
| 2 Style + phone | B, E | FE + BE | medium |
| 3 Pictures | D | FE + BE | medium |
| 4 Blocks + presets | A | FE + BE | large |
| 5 Extras | C | FE + BE | small each |
