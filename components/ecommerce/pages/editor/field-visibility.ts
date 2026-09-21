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
