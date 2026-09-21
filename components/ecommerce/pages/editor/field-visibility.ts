// coding-standard: maintained

/**
 * **A control that has no effect in the current configuration is not shown.**
 *
 * A builder-wide rule, not a per-section favour. A merchant must never be
 * offered a setting that does nothing in the configuration they have, that is
 * overridden by another setting they already made, or that only works in a
 * different layout — because a control they change and see no change from is
 * the preview teaching them it cannot be trusted, on the screen they spend the
 * most time on.
 *
 * Two rules make it safe to apply, and neither is optional:
 *
 * 1. **Hidden is not erased.** A control that disappears keeps its stored value.
 *    Restore the configuration and the merchant's earlier choice is there,
 *    untouched — nothing is rewritten on their behalf. `savableSections` sends
 *    `section.settings` as-is, so the value rides through every save.
 * 2. **Hiding describes the renderer; it never replaces a fix.** Where a control
 *    *should* work and does not, the answer is to make it work. Hiding is only
 *    correct where "no effect" is the intended, permanent behaviour.
 *
 * A third follows from the first two: **a hidden control can never make a
 * section unsaveable**, so only `optional` fields may be hidden. A test asserts
 * that rather than leaving it to care.
 *
 * ### Why it lives here and not in the spec
 *
 * `SectionFieldSpec` cannot carry a predicate. `lib/storefront-builder/field-specs.ts`
 * is shipped verbatim into the backend's generated
 * `inventory-backend/src/constants/storefront-section-manifest.ts`, so it must
 * stay import-free, erasable TypeScript — and a predicate is behaviour the
 * backend has no business evaluating. Visibility is editor-side only. The
 * backend keeps validating shape and keeps accepting every stored value, so
 * nothing about the wire format changes and there is no manifest to regenerate.
 *
 * ### The rules are claims about the renderer
 *
 * Each one asserts that a particular branch of the storefront ignores that
 * setting. When the renderer changes, the rule is part of the change — which is
 * why every rule has a test for both of its branches. A rule nobody tested is a
 * rule nobody can trust.
 */

/** What a rule may read: only what the merchant can see on the screen. */
export interface FieldScope {
  /** The section's own settings. */
  settings: Record<string, unknown>;
  /** Its repeatable items, in order. */
  blocks: readonly Record<string, unknown>[];
  /** Set only when the field being drawn belongs to a block. */
  blockIndex?: number;
}

export type VisibilityRule = (scope: FieldScope) => boolean;

const str = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/** The section's layout, for the rules that turn on it. */
const layoutOf = (scope: FieldScope) => str(scope.settings.layout);

/**
 * True where the hero draws a picture at all — which is not the same as a slide
 * carrying one. `heroSlidePhoto` falls back to the **store banner**, and
 * `sections/hero.tsx` hands that banner to the card and open heroes whenever
 * "Use the store banner" is on, so a hero of imageless slides still shows a
 * photograph and still has something to place.
 *
 * The editor cannot see whether a banner has actually been uploaded
 * (`context.banner` is storefront data), so this over-shows on a shop that has
 * the toggle on and no banner yet. That is the right side to err on: an offered
 * control that does nothing on one configuration is a smaller lie than a hidden
 * control for a picture the shopper can see.
 */
const anyPicture = ({ settings, blocks }: FieldScope) =>
  !!settings.storeBanner || blocks.some((block) => !!block.image || !!block.mobileImage);

/**
 * True where a collections row draws TILES rather than plain text links.
 *
 * Unset is `card` — `fieldEmptyChoice` says so and `collections-row.tsx` reads
 * it that way — so the test is "not plain", never "is card".
 */
const tiled = ({ settings }: FieldScope) => str(settings.style) !== "plain";

/**
 * True where a category-tiles row draws a GRID, whose tracks a column count can
 * divide. Its unset layout is `grid`, so the test is "not strip" — the mirror
 * image of `collections-row`, which falls back to `strip`. The two sections
 * name the same setting and mean the opposite by leaving it empty.
 */
const notStrip = ({ settings }: FieldScope) => str(settings.layout) !== "strip";

/**
 * Does a RESPONSIVE enum answer `value` on either screen?
 *
 * ⚠ **Either, not both, and that is the whole decision.** A responsive setting
 * is stored as `{ base, mobile }` and the editor draws ONE control with a
 * device tab over it, so visibility is decided once for both tabs. A row split
 * on a desktop and stacked on a phone genuinely needs its Side control — the
 * renderer asks per screen (`sideOf` in `category-banner-row.tsx`) — and
 * hiding it because the phone is stacked would take away a control that works
 * on the tab the merchant is not looking at.
 *
 * An unset `mobile` inherits the desktop, which this reads for free: if `base`
 * matches, the answer is already true.
 */
const responsiveIs = (field: string, value: string) => ({ settings }: FieldScope) => {
  const responsive = settings[field];
  if (typeof responsive !== "object" || responsive === null) return false;
  const { base, mobile } = responsive as { base?: unknown; mobile?: unknown };
  return base === value || mobile === value;
};

/**
 * Has a RESPONSIVE setting been answered on either screen at all?
 *
 * The twin of `responsiveIs` for a field whose live-ness turns on being set
 * rather than on which value it holds — `image-banner.frame`, where any shape
 * crops the picture and no shape leaves it whole.
 */
const responsiveSet = (field: string) => ({ settings }: FieldScope) => {
  const responsive = settings[field];
  if (typeof responsive !== "object" || responsive === null) return false;
  const { base, mobile } = responsive as { base?: unknown; mobile?: unknown };
  return base !== undefined || mobile !== undefined;
};

/** The block a block-field belongs to. Empty for a section-level field. */
const blockOf = (scope: FieldScope): Record<string, unknown> =>
  (scope.blockIndex === undefined ? undefined : scope.blocks[scope.blockIndex]) ?? {};

/**
 * The three sections that pick their products the same way: a **Source**, and a
 * picker per source that only that source reads (`productSectionRequest` in
 * `lib/storefront-builder/section-data.ts`). Listed rather than matched on the
 * field name, because `shop-by-tag` has its own `tagIds` that means something
 * else and must keep showing.
 */
const PRODUCT_SOURCE_SECTIONS = ["product-grid", "selected-products", "product-carousel"] as const;

/** True where the section's product Source is one of `values`. */
const sourceIs =
  (...values: string[]): VisibilityRule =>
  ({ settings }) =>
    values.includes(str(settings.source) ?? "");

/** True where the Source is anything BUT one of `values`. */
const sourceIsNot =
  (...values: string[]): VisibilityRule =>
  (scope) =>
    !sourceIs(...values)(scope);

/**
 * One picker per source, on each of the three. A grid set to **Newest** reads
 * neither the collection, nor the tags, nor the hand-picked products — it shows
 * all three today, so at least two of them do nothing in every mode the merchant
 * can choose.
 */
const productSourceRules: Record<string, VisibilityRule> = Object.fromEntries(
  PRODUCT_SOURCE_SECTIONS.flatMap((type) => [
    [`${type}.categoryId`, sourceIs("category")],
    [`${type}.tagIds`, sourceIs("tag")],
    [`${type}.productIds`, sourceIs("manual")],
  ]),
);

/**
 * By `"<section type>.<field>"`, falling back to a bare `"<field>"` — the same
 * precedence `fieldLabel`, `fieldHint`, `valueLabel` and `fieldEmptyChoice` use,
 * so the editor has one lookup convention rather than a second one. The key
 * `"<section type>.blocks"` governs the repeatable list itself, not a field in
 * it, for a section whose items are ignored in some configuration.
 *
 * One section at a time, each asking the same two questions before a rule is
 * written: *does this control do anything here?* and *if not, is that intended
 * or is it a defect?* A control that should work and does not belongs in the
 * fix column — see rule 2 at the top.
 */
const RULES: Record<string, VisibilityRule> = {
  ...productSourceRules,

  /* Dropping a short last row is what a catalogue-wide source is for. A
     hand-picked row keeps every pick — `product-grid.tsx` ANDs the flag with
     `source !== "manual"` — so there is nothing for it to drop. */
  "product-grid.wholeRows": sourceIsNot("manual"),

  /* The store's own promises replace the rows entirely, rather than joining
     them: `PromisesBandSection` reads the blocks or the store's badges, never
     both. So the LIST is what goes, not a field inside it. Turning the toggle
     back off brings the merchant's own rows back untouched. */
  "promises-band.blocks": ({ settings }) => !settings.storePromises,

  /* Never. Two or more slides rotate whether or not this is on, and one slide
     has nothing to rotate to — so since the card and open heroes started
     rotating in their own shape, no branch reads it.

     It is the one rule that hides a control everywhere, and it was found in the
     browser rather than in the code: the rule used to show the toggle at
     exactly one slide, which was the single configuration where it did
     nothing. Switching it on there drew the same hero the static branch draws,
     minus its server markup. The field stays in the spec so a hero migrated
     from the classic home keeps its stored value (and so the wire format does
     not change); nothing reads it. See D5 for the full-bleed half. */
  "hero.slideshow": () => false,

  /* Read by the static card and open heroes, by the rotating one, and by the
     full-bleed hero ONLY while it is drawn as the store's banner hero. A plain
     full-bleed hero passes it to nobody. */
  "hero.storeWords": ({ settings, blocks }) =>
    layoutOf({ settings, blocks }) !== "full-bleed" || !!settings.storeBanner,

  /* The running offer reaches the card and open heroes, single-slide and
     rotating alike (decision D6). The full-bleed hero has never drawn it. */
  "hero.campaignBadge": (scope) => layoutOf(scope) !== "full-bleed",

  /* The promises are the card's trust footer. The open hero has no footer to
     put them in and the full-bleed hero has no card at all. */
  "hero.promises": (scope) => layoutOf(scope) === "card",

  /* A second button, on every card or open slide since decision D3. No
     full-bleed branch reads it. */
  "hero.secondaryLabel": (scope) => layoutOf(scope) !== "full-bleed",
  "hero.secondaryLink": (scope) => layoutOf(scope) !== "full-bleed",

  /* Where the picture sits relative to the copy. A full-bleed hero's picture is
     its background — there is nothing to put on a side, and nothing to order —
     and with no picture on any slide there is nothing to place at all. */
  "hero.imageSide": (scope) => layoutOf(scope) !== "full-bleed" && anyPicture(scope),
  "hero.mobileFirst": (scope) =>
    layoutOf(scope) !== "full-bleed" &&
    anyPicture(scope) &&
    /* With the copy hidden on every slide, the phone's column has ONE thing in
       it. "Which comes first" then has nothing to answer — and unlike the rule
       above, this one turns on a block setting rather than the section's. */
    !scope.blocks.every((block) => !!block.hideTextOnMobile),

  /* The one STYLE-BOX key in this table, and it earns its place: "Full width"
     is what the hero's own Layout control calls this layout, and the Style tab
     offered a second control with the same words that won — so Width = "Page
     column" boxed an edge-to-edge hero while its layout still claimed
     otherwise. Card and open heroes have no such collision and keep theirs.

     `heroFullBleed`'s `ownsWidth` is the other half. Neither works alone: hide
     the control without it and the stored width keeps applying invisibly; set
     it without hiding the control and the merchant changes a setting that does
     nothing. */
  "hero.style.width": (scope) => layoutOf(scope) !== "full-bleed",

  /* Full-bleed only. That layout lays its type over the photograph and has
     always shown the headline alone on a phone; the card and open heroes draw
     every word on every device, so there is nothing for this to decide. */
  "hero.mobileCopy": (scope) => layoutOf(scope) === "full-bleed",

  /* A focus point aims a CROP. `canvas` fit shows the whole picture and ignores
     it — and an unset fit *is* canvas, so the control is dead until the
     merchant asks for "Fill and crop". (`SettingsFields` separately hides a
     focus point with no picture to point at; that one is about the control's
     own input, this one is about the renderer, and both apply.) */
  "hero.focal": (scope) => blockOf(scope).imageFit === "crop",

  /* ---- collections-row ----
     Two nested questions, and the outer one hides four controls at once.

     **Plain** takes an early return (`collections-row.tsx`) and draws
     `CollectionLinks`, which accepts `base` and `categories` and nothing else:
     centred text links between hairlines, with the centring written into the
     component rather than read from a setting. So the whole tile vocabulary —
     which layout, how many columns, where they sit, whether names show — is
     answered by a treatment that has no tiles.

     Not a defect. `CollectionLinks`' own docstring makes the centring its
     design ("quiet centred text links"), and "show names" on a row that is
     nothing but names has no second state to offer. Teaching plain links to
     align would be a new setting, not a repair.

     Then **columns**, inside the tile treatments: only the grid divides a width
     into tracks. The strip is a horizontal scroller whose tile width comes from
     `--sf-chip`, so `CollectionsGrid`'s two count props never reach it — the
     island takes `align`, `gap`, `className` and the tiles, and that is all.

     ⚠ `showLabels` has a SECOND dead configuration this table deliberately does
     not claim: `categoryLabelsVisible` is `showLabels || !allPhotographed`, so
     turning names off does nothing unless every chosen collection has a
     picture. That depends on the catalogue, which `FieldScope` cannot see —
     the editor holds settings and blocks, never store data. Over-showing a
     control that works in most configurations beats hiding one that works. */
  "collections-row.layout": tiled,
  "collections-row.align": tiled,
  "collections-row.showLabels": tiled,
  "collections-row.columns": (scope) => tiled(scope) && str(scope.settings.layout) === "grid",
  "collections-row.mobileColumns": (scope) => tiled(scope) && str(scope.settings.layout) === "grid",

  /* ---- category-tiles ----
     Same two column settings as the row above and the SAME reason they die on a
     strip — but ⚠ **the opposite default**, which is why these rules cannot
     share a helper with it. `collections-row` falls back to `strip`; this
     section falls back to `grid` (`category-tiles.tsx` reads
     `settings.layout ?? "grid"`, and `fieldEmptyChoice` says so too). A rule
     written as `=== "grid"` here would hide the columns of every tile row whose
     merchant never touched Layout, which is most of them.

     Worth knowing why the strip really is inert rather than merely unstyled:
     `categoryTileRowLayout` emits `--sf-ct-mcols` on BOTH branches, so the
     variable is on the strip's own element. Nothing reads it there — every rule
     that does is under `.sf-cat-tiles` / `--controlled`, and the strip branch
     returns no className at all. `--sf-ct-cols` is not even emitted.

     `align` stays on both: the grid justifies a tile inside its track, and the
     strip takes `align` as a prop. `layout` stays for the obvious reason. */
  "category-tiles.columns": notStrip,
  "category-tiles.mobileColumns": notStrip,

  /* Pictures-only is a setting about PICTURES, and two of the four modes have
     none to hide behind. `CategoryTileRow` computes
     `compact || disc || circle || categoryLabelsVisible(…)`, so a `disc` row
     always draws names, and a `circle` row does too by either route — with
     photographs `circle` is set, without them `compact` is, and both short-
     circuit the merchant's choice. Dropping the names there would leave a row
     of unexplained initials, which is the component's stated reason.

     ⚠ The same `categoryLabelsVisible` catalogue dependency as the row above
     applies to `tile` and `overlay`, and is deliberately NOT claimed here for
     the same reason: it turns on whether the categories are photographed, and
     the editor cannot see that. */
  "category-tiles.showLabels": ({ settings }) => {
    const mode = str(settings.mode);
    return mode !== "disc" && mode !== "circle";
  },

  /* ---- category-promo-cards ----
     A side and a share of the card are questions about a picture BESIDE the
     words, and the stacked card has the picture above them. The renderer says
     so twice over, per screen: `sideOf` resolves to `"left"` unless that
     screen's shape is split, so no `--right-*` / `--alternate-*` class is
     emitted, and `--sf-bc-split-*` is written only under
     `shape === "split" && split`. A stacked row cannot use either value.

     Unset is `stacked` (`resolveCardShape` — only an explicit `"split"` moves
     the picture), so `responsiveIs` asking for `"split"` gets the default
     right without naming it. */
  "category-promo-cards.side": responsiveIs("shape", "split"),
  "category-promo-cards.split": responsiveIs("shape", "split"),

  /* The arrows belong to a track, and a row that wraps has no track to arrow
     through. `category-banner-row.tsx` returns a plain `<div>` when neither
     screen scrolls — `if (!scrolls) return …` — so `CategoryStrip` is never
     mounted and `cardArrows` reaches nothing at all. Not merely unstyled:
     absent.

     ⚠ Noted, NOT claimed: `ratio` looks dead once an explicit `height` is set
     on both screens ("a height REPLACES the shape"), but `--sf-bc-ratio-set`
     is emitted regardless and the `--fixedh-*` classes are what neutralise it.
     Proving that is a stylesheet audit this pass has not done, and a rule
     written on a guess is the thing this table exists to prevent. */
  "category-promo-cards.arrows": responsiveIs("flow", "scroll"),

  /* ---- image-banner ----
     Alignment moves the copy block, and `image-banner.tsx` draws no copy block
     at all unless there is something to put in it: `hasCopy` is
     `heading || text || button`, and the whole `<div data-align>` is skipped
     when it is false. A banner that is only a photograph has nothing to align.

     ⚠ **The button counts, and the audit note that started this said only
     "heading or text".** A banner whose sole copy is a button still draws the
     block and still aligns it — but only with BOTH a label and a link, because
     `button` is `buttonLabel && settings.link`; a label with no destination is
     never drawn (the section refuses dead buttons). Trimmed here because the
     renderer trims. */
  "image-banner.align": ({ settings }) =>
    !!(str(settings.heading)?.trim() ||
      str(settings.text)?.trim() ||
      (str(settings.buttonLabel)?.trim() && str(settings.link)?.trim())),

  /* A focus point aims a CROP, and this banner only crops when the merchant
     gave it a shape. With no frame the picture keeps its own proportions — the
     section passes the image's real `width`/`height` through to `SfImage`, the
     box takes its height from the picture, and `object-fit: cover` has nothing
     to trim. `object-position` is not even applied: every rule carrying it is
     under `.sfb-banner-box[data-frame]` or its `[data-frame-m]` twin.

     Either screen, for the usual reason — a phone-only shape crops on the
     phone, and `--sfb-banner-focal-m` is read there. Same shape of answer as
     `hero.focal`, which asks about the fit instead because a hero always has a
     box and this banner does not. */
  "image-banner.focal": responsiveSet("frame"),

  /* ---- campaign-offers ----
     The merchant's heading WINS, and when it wins the store's own wording
     reaches nobody: `headingWord` is `heading ? undefined : storeHeading`, and
     the island's `heading ?? (headingWord ? … )` says the same thing a second
     time. So the moment there is a heading, this control answers nothing.

     ⚠ **Section-keyed, and `shop-by-tag` is why.** That section names the same
     two settings and gives the opposite answer: its `storeHeading` chooses the
     whole heading BLOCK — a flex row with an `<h2>` rather than a
     `SectionTitle` — so it still changes the rendering with a heading present.
     A bare `storeHeading` rule would have hidden a live control there. Same
     trap as `shop-by-tag.tagIds` in the first slice, and the same lesson: key
     by section type, always.

     Trimmed to match the renderer, which this pass taught to trim — see the
     note in `campaign-offers.tsx`. */
  "campaign-offers.storeHeading": ({ settings }) => !str(settings.heading)?.trim(),
};

/**
 * Whether to draw `field` of `sectionType` in this configuration. Unknown
 * fields are visible: a control is hidden only where someone has claimed, and
 * tested, that it does nothing.
 */
export function isFieldVisible(field: string, sectionType: string | undefined, scope: FieldScope): boolean {
  const rule = (sectionType ? RULES[`${sectionType}.${field}`] : undefined) ?? RULES[field];
  return rule ? rule(scope) : true;
}

/** The rule keys, for the tests that hold this module to its own guarantees. */
export const VISIBILITY_RULE_KEYS = Object.keys(RULES);
