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

  describe("collections-row", () => {
    const row = (settings: Record<string, unknown>) => (field: string) =>
      isFieldVisible(field, "collections-row", scope(settings, []));
    const TILE_FIELDS = ["layout", "align", "showLabels", "columns", "mobileColumns"];

    it("drops the whole tile vocabulary for plain text links", () => {
      // `CollectionLinks` takes `base` and `categories` and nothing else, so
      // every one of these answers a question that treatment never asks.
      const plain = row({ style: "plain", layout: "grid" });
      for (const field of TILE_FIELDS) expect(plain(field)).toBe(false);
      // The two that survive: which collections, and what the row is called.
      expect(plain("categoryIds")).toBe(true);
      expect(plain("heading")).toBe(true);
    });

    it("offers columns to the grid alone — a strip has no tracks to divide", () => {
      const grid = row({ style: "card", layout: "grid" });
      const strip = row({ style: "card", layout: "strip" });
      // Unset style IS card and unset layout IS strip, so the bare case has to
      // behave like the explicit one or the empty choices are lying.
      const unset = row({});

      for (const field of ["columns", "mobileColumns"]) {
        expect(grid(field)).toBe(true);
        expect(strip(field)).toBe(false);
        expect(unset(field)).toBe(false);
      }
      // Alignment reaches both: the grid positions a tile in its column, the
      // strip island takes `align` as a prop.
      for (const at of [grid, strip, unset]) {
        expect(at("align")).toBe(true);
        expect(at("layout")).toBe(true);
        expect(at("showLabels")).toBe(true);
      }
    });

    it("keeps showing names even where the catalogue would override them", () => {
      /* `categoryLabelsVisible` is `showLabels || !allPhotographed`, so the
         toggle also does nothing when a chosen collection has no picture. That
         is NOT claimed here: it depends on store data the editor cannot see,
         and over-showing a control that works in most configurations beats
         hiding one that works. Pinned so nobody "completes" the rule later. */
      expect(row({ style: "card" })("showLabels")).toBe(true);
    });

    it("keeps every hidden value through a save", () => {
      // Hidden is not erased: switch to plain, save, switch back, and the
      // merchant's grid is exactly as they left it.
      const section: EditorSection = {
        id: "row",
        type: "collections-row",
        v: 1,
        enabled: true,
        settings: { style: "plain", layout: "grid", columns: 5, mobileColumns: 3, align: "center", showLabels: false },
      };
      const [saved] = savableSections([section]);
      expect(saved.settings).toEqual(section.settings);
    });
  });

  describe("category-tiles", () => {
    const tiles = (settings: Record<string, unknown>) => (field: string) =>
      isFieldVisible(field, "category-tiles", scope(settings, []));

    it("offers columns to the grid, and reads the OPPOSITE default from collections-row", () => {
      /* The trap this test exists for: this section falls back to `grid`,
         `collections-row` falls back to `strip`. One helper for both would hide
         the columns of every untouched tile row. */
      for (const field of ["columns", "mobileColumns"]) {
        expect(tiles({ layout: "grid" })(field)).toBe(true);
        expect(tiles({})(field)).toBe(true); // unset IS grid here…
        expect(isFieldVisible(field, "collections-row", scope({}, []))).toBe(false); // …and strip there
        expect(tiles({ layout: "strip" })(field)).toBe(false);
      }
      // Alignment survives a strip on both sections: the island takes it.
      expect(tiles({ layout: "strip" })("align")).toBe(true);
    });

    it("drops pictures-only for the two modes that have no picture to hide behind", () => {
      // `disc` always draws names; `circle` does too by either route — with
      // photographs it is `circle`, without them `compact`, and both win.
      expect(tiles({ mode: "disc" })("showLabels")).toBe(false);
      expect(tiles({ mode: "circle" })("showLabels")).toBe(false);
      expect(tiles({ mode: "tile" })("showLabels")).toBe(true);
      expect(tiles({ mode: "overlay" })("showLabels")).toBe(true);
      // Unset IS tile, so it must behave like the explicit one.
      expect(tiles({})("showLabels")).toBe(true);
    });

    it("keeps every hidden value through a save", () => {
      const section: EditorSection = {
        id: "tiles",
        type: "category-tiles",
        v: 1,
        enabled: true,
        settings: { mode: "disc", layout: "strip", columns: 6, mobileColumns: 4, showLabels: false },
      };
      const [saved] = savableSections([section]);
      expect(saved.settings).toEqual(section.settings);
    });
  });

  describe("category-promo-cards", () => {
    const promo = (settings: Record<string, unknown>) => (field: string) =>
      isFieldVisible(field, "category-promo-cards", scope(settings, []));

    it("offers a side and a share only where the picture is beside the words", () => {
      for (const field of ["side", "split"]) {
        expect(promo({ shape: { base: "split" } })(field)).toBe(true);
        expect(promo({ shape: { base: "stacked" } })(field)).toBe(false);
        // Unset IS stacked — `resolveCardShape` moves the picture only on an
        // explicit "split", so an untouched row must not offer either.
        expect(promo({})(field)).toBe(false);
        expect(promo({ shape: {} })(field)).toBe(false);
      }
    });

    it("keeps the side control for a row split on ONE screen only", () => {
      /* The point of "either, not both": one control serves two device tabs,
         and `sideOf` is asked per screen. A desktop-split row still needs it
         even though its phone is stacked, and vice versa. */
      expect(promo({ shape: { base: "stacked", mobile: "split" } })("side")).toBe(true);
      expect(promo({ shape: { base: "split", mobile: "stacked" } })("side")).toBe(true);
      expect(promo({ shape: { base: "stacked", mobile: "stacked" } })("side")).toBe(false);
    });

    it("offers arrows only to a row that actually scrolls", () => {
      // Not merely unstyled: with neither screen scrolling the renderer returns
      // a plain div and `CategoryStrip` is never mounted.
      expect(promo({ flow: { base: "scroll" } })("arrows")).toBe(true);
      expect(promo({ flow: { mobile: "scroll" } })("arrows")).toBe(true);
      expect(promo({ flow: { base: "wrap" } })("arrows")).toBe(false);
      expect(promo({})("arrows")).toBe(false);
    });

    it("keeps every hidden value through a save", () => {
      const section: EditorSection = {
        id: "promo",
        type: "category-promo-cards",
        v: 1,
        enabled: true,
        settings: { shape: { base: "stacked" }, side: { base: "right" }, split: { base: 40 }, flow: { base: "wrap" }, arrows: false },
      };
      const [saved] = savableSections([section]);
      expect(saved.settings).toEqual(section.settings);
    });
  });

  describe("image-banner", () => {
    const banner = (settings: Record<string, unknown>) => (field: string) =>
      isFieldVisible(field, "image-banner", scope(settings, []));

    it("offers alignment only where a copy block is drawn — and a BUTTON is copy", () => {
      expect(banner({ heading: "Eid" })("align")).toBe(true);
      expect(banner({ text: "Free delivery" })("align")).toBe(true);
      /* The audit note said "a heading or text"; the renderer's `hasCopy` also
         counts the button, so a banner whose only copy is a button still
         aligns. But only with BOTH halves — `buttonLabel && link` — because a
         label with no destination is never drawn. */
      expect(banner({ buttonLabel: "Shop", link: "/products" })("align")).toBe(true);
      expect(banner({ buttonLabel: "Shop" })("align")).toBe(false);
      expect(banner({ link: "/products" })("align")).toBe(false);
      // A photograph on its own has nothing to align.
      expect(banner({})("align")).toBe(false);
      // Whitespace is not copy: the renderer trims, so this must too.
      expect(banner({ heading: "   " })("align")).toBe(false);
    });

    it("offers a focus point only once a shape crops the picture", () => {
      // No frame ⇒ the picture keeps its own proportions and nothing applies
      // `object-position` at all — every rule carrying it is under [data-frame].
      expect(banner({})("focal")).toBe(false);
      expect(banner({ frame: {} })("focal")).toBe(false);
      expect(banner({ frame: { base: "16:9" } })("focal")).toBe(true);
      // A phone-only shape crops on the phone, and reads `--sfb-banner-focal-m`.
      expect(banner({ frame: { mobile: "1:1" } })("focal")).toBe(true);
    });

    it("keeps every hidden value through a save", () => {
      const section: EditorSection = {
        id: "banner",
        type: "image-banner",
        v: 1,
        enabled: true,
        settings: {
          image: { url: "https://cdn.example.com/banner.jpg" },
          align: "center",
          focal: { base: { x: 30, y: 70 } },
        },
      };
      const [saved] = savableSections([section]);
      expect(saved.settings).toEqual(section.settings);
    });
  });

  describe("campaign-offers", () => {
    const offers = (settings: Record<string, unknown>) =>
      isFieldVisible("storeHeading", "campaign-offers", scope(settings, []));

    it("drops the store's wording once the merchant has written a heading", () => {
      // `headingWord: heading ? undefined : storeHeading` — with a heading the
      // store's word reaches nobody.
      expect(offers({})).toBe(true);
      expect(offers({ heading: "" })).toBe(true);
      expect(offers({ heading: "Current offers" })).toBe(false);
      // Trimmed, because the renderer now trims: spaces are not a heading.
      expect(offers({ heading: "   " })).toBe(true);
    });

    it("leaves shop-by-tag's identical setting alone", () => {
      /* The same trap as `shop-by-tag.tagIds` in the first slice. That section
         names `heading` and `storeHeading` too, and answers the opposite: its
         `storeHeading` picks the whole heading BLOCK, so it still changes the
         rendering with a heading present. A bare rule would have hidden it. */
      expect(isFieldVisible("storeHeading", "shop-by-tag", scope({ heading: "Shop by age" }, []))).toBe(true);
      expect(isFieldVisible("storeHeading", "shop-by-tag", scope({}, []))).toBe(true);
    });

    it("keeps the hidden wording through a save", () => {
      const section: EditorSection = {
        id: "offers",
        type: "campaign-offers",
        v: 1,
        enabled: true,
        settings: { heading: "Eid deals", storeHeading: "campaignOffers" },
      };
      const [saved] = savableSections([section]);
      expect(saved.settings).toEqual(section.settings);
    });
  });

  /**
   * Three controls the rollout audit listed as candidates and the RENDERER
   * refused. Pinned as assertions rather than deleted from the list, because a
   * plausible-sounding candidate that was investigated and rejected is worth
   * more written down than forgotten — the next audit would propose all three
   * again from the same surface reading.
   */
  describe("candidates the renderer rejected", () => {
    it("keeps the gallery's phone columns at every desktop count", () => {
      /* Proposed as "phones only matter above one column". They do not:
         `galleryVars` is `columns?.mobile ?? Math.min(desktop, 2)`, so the
         `min` is only the DEFAULT — an explicit phone value is emitted as
         `--sfb-gallery-cols-m` and read by the phone grid whatever the desktop
         holds. It is also one responsive control with a device tab, not the
         two separate fields the other two sections have. */
      for (const columns of [{ base: 1 }, { base: 3 }, { base: 6 }]) {
        expect(isFieldVisible("columns", "gallery", scope({ columns }, []))).toBe(true);
      }
    });

    it("keeps the order form's coupon box in every configuration", () => {
      // `OrderFormSection` passes `coupon` straight to the island, which reads
      // it unconditionally (`{coupon ? <CouponRow/> : null}`). No setting on
      // this section can make it dead.
      expect(isFieldVisible("coupon", "order-form", scope({}, []))).toBe(true);
      expect(isFieldVisible("coupon", "order-form", scope({ productId: "p1" }, []))).toBe(true);
    });

    it("keeps the video's cover picture on a YouTube link — the candidate was backwards", () => {
      /* Proposed as "hide it for YouTube, which brings its own". The merchant's
         cover WINS: `poster ?? videoPosterUrl(embed)`. Hiding it would take
         away a working override, and for Facebook — where `videoPosterUrl`
         returns undefined — it is the only cover there is. The existing hint
         ("A YouTube video uses its own cover when this is empty") is the
         correct treatment and already ships. */
      expect(isFieldVisible("poster", "video", scope({ url: "https://youtu.be/abc" }, []))).toBe(true);
      expect(isFieldVisible("poster", "video", scope({ url: "https://facebook.com/x/videos/1" }, []))).toBe(true);
    });
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
        "collections-row.align",
        "collections-row.columns",
        "collections-row.layout",
        "collections-row.mobileColumns",
        "collections-row.showLabels",
        "category-tiles.columns",
        "category-tiles.mobileColumns",
        "category-tiles.showLabels",
        "category-promo-cards.arrows",
        "category-promo-cards.side",
        "category-promo-cards.split",
        "campaign-offers.storeHeading",
        "image-banner.align",
        "image-banner.focal",
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
