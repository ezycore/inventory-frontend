// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { savableSections, type EditorSection } from "../section-instances";
import { isFieldVisible, VISIBILITY_RULE_KEYS } from "../field-visibility";

const scope = (settings: Record<string, unknown>, blocks: Record<string, unknown>[] = [{}], blockIndex?: number) => ({
  settings,
  blocks,
  blockIndex,
});

const shown = (field: string, settings: Record<string, unknown>, blocks?: Record<string, unknown>[], i?: number) =>
  isFieldVisible(field, "hero", scope(settings, blocks, i));

describe("field visibility", () => {
  it("never offers the slideshow: no hero branch reads it any more", () => {
    // Found in the browser, not the code: the rule used to show it at exactly
    // one slide, which is the one configuration where it changed nothing.
    expect(shown("slideshow", { layout: "card" }, [{}])).toBe(false);
    expect(shown("slideshow", { layout: "card" }, [{}, {}])).toBe(false);
    expect(shown("slideshow", { layout: "open" }, [{}])).toBe(false);
    expect(shown("slideshow", { layout: "full-bleed" }, [{}])).toBe(false);
  });

  it("offers the store's wording everywhere but a plain full-bleed hero", () => {
    expect(shown("storeWords", { layout: "open" })).toBe(true);
    expect(shown("storeWords", { layout: "full-bleed", storeBanner: true })).toBe(true);
    expect(shown("storeWords", { layout: "full-bleed" })).toBe(false);
  });

  it("offers the running offer and the second button to the card and open heroes only", () => {
    for (const field of ["campaignBadge", "secondaryLabel", "secondaryLink"]) {
      expect(shown(field, { layout: "card" })).toBe(true);
      expect(shown(field, { layout: "open" })).toBe(true);
      expect(shown(field, { layout: "full-bleed" })).toBe(false);
    }
  });

  it("offers the promises to the card alone, which is the only hero with a footer", () => {
    expect(shown("promises", { layout: "card" })).toBe(true);
    expect(shown("promises", { layout: "open" })).toBe(false);
    expect(shown("promises", { layout: "full-bleed" })).toBe(false);
  });

  it("hides the Style tab's Width on a full-bleed hero, and keeps the stored value", () => {
    // R11: this is the one key here that names the style box rather than a
    // setting, so the spec-field guarantee above skips it and this stands in.
    const styled = (layout: string): EditorSection => ({
      id: "hero",
      type: "hero",
      v: 1,
      enabled: true,
      settings: { layout },
      style: { width: "content" },
    });
    const scopeOf = (section: EditorSection) => ({ settings: section.settings ?? {}, blocks: [] });

    // "Full width" is what the Layout control already calls this layout.
    expect(isFieldVisible("style.width", "hero", scopeOf(styled("full-bleed")))).toBe(false);
    // Card and open have no collision and keep the control.
    expect(isFieldVisible("style.width", "hero", scopeOf(styled("card")))).toBe(true);
    expect(isFieldVisible("style.width", "hero", scopeOf(styled("open")))).toBe(true);

    // Hidden is not erased: the stored width rides through the save untouched,
    // and switching the layout back hands the merchant their choice again.
    const [saved] = savableSections([styled("full-bleed")]);
    expect(saved.style).toEqual({ width: "content" });
  });

  it("offers the picture's placement only where there is a picture to place", () => {
    const withPhoto = [{ image: { url: "/a.jpg" } }];
    const phoneOnly = [{ mobileImage: { url: "/a.jpg" } }];
    for (const field of ["imageSide", "mobileFirst"]) {
      expect(shown(field, { layout: "card" }, withPhoto)).toBe(true);
      expect(shown(field, { layout: "open" }, withPhoto)).toBe(true);
      // A phone picture is still a picture.
      expect(shown(field, { layout: "card" }, phoneOnly)).toBe(true);
      // A full-bleed hero's picture is its background: nothing to place.
      expect(shown(field, { layout: "full-bleed" }, withPhoto)).toBe(false);
      // Text-only slides have nothing to put on a side.
      expect(shown(field, { layout: "card" }, [{ title: "Eid" }])).toBe(false);
      /* …unless the STORE BANNER is standing in for one. `heroSlidePhoto` falls
         back to it and `sections/hero.tsx` hands it to both these layouts, so a
         picture is drawn and there is something to place after all. Hiding here
         would hide a control the renderer honours, which is the one thing
         `field-visibility.ts` must never do. */
      expect(shown(field, { layout: "card", storeBanner: true }, [{ title: "Eid" }])).toBe(true);
      expect(shown(field, { layout: "open", storeBanner: true }, [{ title: "Eid" }])).toBe(true);
      // The banner never reaches a full-bleed hero's placement — it has none.
      expect(shown(field, { layout: "full-bleed", storeBanner: true }, [{ title: "Eid" }])).toBe(false);
    }
  });

  it("drops the phone order once every slide hides its text", () => {
    // One thing left in the column, so "which comes first" answers nothing.
    // The side control is unaffected — it is a desktop question.
    const hidden = [{ image: { url: "/a.jpg" }, hideTextOnMobile: true }];
    expect(shown("mobileFirst", { layout: "card" }, hidden)).toBe(false);
    expect(shown("imageSide", { layout: "card" }, hidden)).toBe(true);
    // One slide still showing its text is enough to keep the question real.
    const mixed = [...hidden, { image: { url: "/b.jpg" }, title: "Second" }];
    expect(shown("mobileFirst", { layout: "card" }, mixed)).toBe(true);
  });

  it("offers the phone-text choice to the full-bleed hero alone", () => {
    // It is the only layout that lays its type over the photograph, and the
    // only one whose phone rendering ever dropped a word the merchant typed.
    expect(shown("mobileCopy", { layout: "full-bleed" })).toBe(true);
    expect(shown("mobileCopy", { layout: "full-bleed", storeBanner: true })).toBe(true);
    expect(shown("mobileCopy", { layout: "card" })).toBe(false);
    expect(shown("mobileCopy", { layout: "open" })).toBe(false);
  });

  it("offers a focus point only where the picture is actually cropped", () => {
    // Unset fit IS canvas, which shows the whole picture and ignores the anchor.
    expect(shown("focal", { layout: "card" }, [{ imageFit: "crop" }], 0)).toBe(true);
    expect(shown("focal", { layout: "card" }, [{ imageFit: "fit" }], 0)).toBe(false);
    expect(shown("focal", { layout: "card" }, [{}], 0)).toBe(false);
    // A rule reads the slide being drawn, not the first one.
    expect(shown("focal", { layout: "card" }, [{ imageFit: "crop" }, {}], 1)).toBe(false);
  });

  it("shows a field nobody has claimed is dead", () => {
    expect(shown("title", { layout: "card" })).toBe(true);
    expect(isFieldVisible("promises", "promises-band", scope({}))).toBe(true);
  });

  /**
   * The guarantee that makes hiding safe: only an OPTIONAL field may be hidden,
   * so a hidden control can never strip a required value or make `isComplete`
   * fail. Enforced here rather than left to care.
   */
  it("names only optional fields, so hiding can never make a section unsaveable", () => {
    for (const key of VISIBILITY_RULE_KEYS) {
      // A `style.*` key governs the STYLE BOX, not a spec field, so there is no
      // spec entry to check and this guarantee does not reach it. Its own is
      // the round-trip test below: hide the control, save, and the stored style
      // is still there. `savableSections` sends `section.style` whole, exactly
      // as it sends `section.settings`.
      if (key.includes(".style.")) continue;
      const [type, field] = key.split(".");
      const spec = SECTION_SPECS[type as keyof typeof SECTION_SPECS] as {
        settings: Record<string, { optional?: boolean }>;
        blocks?: { settings: Record<string, { optional?: boolean }> };
      };
      // `blocks` names the repeatable list, not a field — its own guarantee is
      // the round-trip below: the rows survive being hidden.
      if (field === "blocks") continue;
      const found = spec.settings[field] ?? spec.blocks?.settings[field];
      expect(found, `${key} names no field in its spec`).toBeDefined();
      expect(found!.optional, `${key} is required, so it must never be hidden`).toBe(true);
    }
  });

  /**
   * The promise a merchant would notice within seconds if it broke: a control
   * that disappears keeps its value, and putting the configuration back brings
   * the choice they made back with it. Nothing is rewritten on their behalf.
   */
  it("keeps a hidden value through a save, and gives it back when the configuration returns", () => {
    const hero = (settings: Record<string, unknown>): EditorSection => ({
      id: "hero-00000000000000000000000a",
      type: "hero",
      v: SECTION_SPECS.hero.v,
      enabled: true,
      settings,
      blocks: [{ id: "s1", settings: { title: "Eid edit" } }],
    });

    // Chosen while the control was on screen…
    const chosen = hero({ layout: "card", promises: true });
    expect(shown("promises", chosen.settings)).toBe(true);

    // …then the merchant switches to a layout that has no footer to draw it in.
    const hidden = hero({ ...chosen.settings, layout: "open" });
    expect(shown("promises", hidden.settings)).toBe(false);

    const [saved] = savableSections([hidden]);
    expect(saved.settings.promises).toBe(true);

    const restored = hero({ ...saved.settings, layout: "card" });
    expect(shown("promises", restored.settings)).toBe(true);
    expect(restored.settings.promises).toBe(true);
  });

  it("picks the product source's own picker, and only that one", () => {
    for (const type of ["product-grid", "selected-products", "product-carousel"]) {
      const shownFor = (field: string, source: string) =>
        isFieldVisible(field, type, { settings: { source }, blocks: [] });

      expect(shownFor("categoryId", "category")).toBe(true);
      expect(shownFor("tagIds", "category")).toBe(false);
      expect(shownFor("productIds", "category")).toBe(false);

      expect(shownFor("tagIds", "tag")).toBe(true);
      expect(shownFor("categoryId", "tag")).toBe(false);

      expect(shownFor("productIds", "manual")).toBe(true);
      expect(shownFor("categoryId", "manual")).toBe(false);

      // A catalogue-wide source reads none of the three.
      for (const source of ["featured", "newest"]) {
        for (const field of ["categoryId", "tagIds", "productIds"]) {
          expect(shownFor(field, source)).toBe(false);
        }
      }
    }
  });

  it("leaves shop-by-tag's own tags alone: the same field name, a different job", () => {
    expect(isFieldVisible("tagIds", "shop-by-tag", { settings: {}, blocks: [] })).toBe(true);
  });

  it("offers whole rows to every source but the hand-picked one", () => {
    const wholeRows = (source: string) =>
      isFieldVisible("wholeRows", "product-grid", { settings: { source }, blocks: [] });
    expect(wholeRows("newest")).toBe(true);
    expect(wholeRows("category")).toBe(true);
    // A hand-picked row keeps every pick, so there is no short row to drop.
    expect(wholeRows("manual")).toBe(false);
  });

  it("drops the promises band's own rows when the store's promises replace them", () => {
    const rows = (storePromises?: boolean) =>
      isFieldVisible("blocks", "promises-band", { settings: { storePromises }, blocks: [{}, {}] });
    expect(rows(false)).toBe(true);
    expect(rows(undefined)).toBe(true);
    // The section reads one or the other, never both.
    expect(rows(true)).toBe(false);
  });

  it("keeps a promises band's own rows through a save while the store's replace them", () => {
    const band = (storePromises: boolean) => ({
      id: "promises-band-1",
      type: "promises-band" as const,
      v: 1,
      enabled: true,
      settings: { storePromises },
      blocks: [
        { id: "p1", settings: { text: "Cash on delivery" } },
        { id: "p2", settings: { text: "Easy returns" } },
      ],
    });

    const hidden = band(true);
    expect(isFieldVisible("blocks", "promises-band", { settings: hidden.settings, blocks: [] })).toBe(false);

    // Hidden, not erased: the rows ride through the save and come back the
    // moment the toggle does.
    const [saved] = savableSections([hidden]);
    expect(saved.blocks?.map((b) => b.settings.text)).toEqual(["Cash on delivery", "Easy returns"]);
    expect(isFieldVisible("blocks", "promises-band", { settings: { storePromises: false }, blocks: [] })).toBe(true);
  });

  it("has a rule for every control an audit found dead", () => {
    // The inventory, so a rule cannot arrive without someone saying so here.
    expect(VISIBILITY_RULE_KEYS.sort()).toEqual(
      [
        "hero.campaignBadge",
        "hero.focal",
        "hero.imageSide",
        "hero.mobileCopy",
        "hero.mobileFirst",
        "hero.promises",
        "hero.secondaryLabel",
        "hero.secondaryLink",
        "hero.slideshow",
        "hero.storeWords",
        "hero.style.width",
        "product-carousel.categoryId",
        "product-carousel.productIds",
        "product-carousel.tagIds",
        "product-grid.categoryId",
        "product-grid.productIds",
        "product-grid.tagIds",
        "product-grid.wholeRows",
        "promises-band.blocks",
        "selected-products.categoryId",
        "selected-products.productIds",
        "selected-products.tagIds",
      ].sort(),
    );
  });
});
