import { describe, expect, it } from "vitest";
import { READY_MADE_THEMES, getReadyMadeTheme } from "@/lib/storefront-themes";
import {
  applyHomeTemplateToDraft,
  applyThemeToDraft,
  haveCollectionRowsChanged,
  isThemeModified,
  validateCustomizeDraft,
} from "@/components/ecommerce/customize/use-customize-draft";
import { DEFAULT_DESIGN, resolveThemeColors } from "@/lib/storefront-theme";
import {
  DEFAULT_TEMPLATES,
  resolveHomeCollections,
  resolveTemplates,
} from "@/lib/storefront-templates";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import { HOME_PRESET_SECTIONS, SECTION_IDS } from "@/lib/storefront-section-ids";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/** A draft carrying merchant-written content a theme must never reach. */
const draft = (over: Partial<CustomizeDraft> = {}): CustomizeDraft =>
  ({
    preset: "default",
    brandColor: "#111827",
    accentColor: "#2563eb",
    footerText: "Family run since 1998",
    logoStyle: { height: 44 },
    homeCollections: { layout: "grid" },
    design: DEFAULT_DESIGN,
    homepageSections: [],
    sectionConfig: [],
    templates: { hero: "banner", headerMenu: "custom", checkout: "multi-step" },
    badges: [{ text: "Free delivery over ৳1000", icon: "truck" }],
    heroSlides: [{ title: "Eid sale" }],
    heroBanner: { title: "Our banner" },
    navHeader: [{ label: "Offers", type: "url", value: "/offers" }],
    utilityBar: {
      enabled: true,
      showOnDesktop: true,
      showOnMobile: false,
      showPhone: true,
      showTrackOrder: true,
      showLanguage: true,
      showTheme: true,
      trackOrderLabel: "",
    },
    announcement: {} as CustomizeDraft["announcement"],
    // Not an empty cast like the two beside it: `validateCustomizeDraft` reads
    // the two colours, and `seedDraft` guarantees every field is defined (the
    // editor's inputs are controlled), so an empty object is a shape the real
    // draft never has.
    campaignStrip: {
      enabled: true,
      showOn: "all",
      showOnDesktop: true,
      showOnMobile: true,
      bgColor: "",
      textColor: "",
      size: "sm",
      paddingY: "md",
      paddingX: "md",
      dismissible: false,
    },
    contactButton: {} as CustomizeDraft["contactButton"],
    footerGroups: [{ title: "Help", links: [] }],
    footerPaymentMethods: { showOnDesktop: true, showOnMobile: true },
    footerContentPages: { show: true, title: "Info" },
    footerNote: "Dhaka, Bangladesh",
    footerContactHeading: "Order by phone",
    footerNewsletter: { heading: "Stay in touch", blurb: "", buttonLabel: "" },
    collections: [],
    ...over,
  }) as CustomizeDraft;

describe("the theme catalogue", () => {
  it("only offers template values the pickers know about", () => {
    for (const theme of READY_MADE_THEMES) {
      for (const [key, value] of Object.entries(theme.templates)) {
        const allowed = TEMPLATE_OPTIONS[key]?.map((o) => o.value) ?? [];
        expect(allowed, `${theme.id}.${key}`).toContain(value);
      }
    }
  });

  it("has unique ids", () => {
    const ids = READY_MADE_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // A theme is a bundle of DATA. If a look cannot be expressed with the axes the
  // catalogue already has, the fix is a new axis — not a branch in a component.
  //
  // Derived from `DEFAULT_DESIGN` rather than a hardcoded list, so adding an
  // axis does not mean editing this test — it means every theme must declare
  // the new axis, which is the thing actually worth enforcing. A bundle missing
  // one would inherit whatever the merchant last chose instead of stamping the
  // theme's own value, which is precisely how "apply Classic" stops being a
  // reset.
  it("expresses every theme through the design axes alone", () => {
    const axes = Object.keys(DEFAULT_DESIGN).sort();
    for (const theme of READY_MADE_THEMES) {
      expect(Object.keys(theme.design).sort()).toEqual(axes);
    }
  });

  // A section id the registry does not know would be silently dropped by
  // `resolveSections`, so the theme would quietly render a shorter page than it
  // was designed as — a failure with no error anywhere.
  it("only composes sections the registry can render", () => {
    for (const theme of READY_MADE_THEMES) {
      for (const entry of theme.sections) {
        // An entry is a bare id, or an id carrying the config its default
        // composition implies.
        const id = typeof entry === "string" ? entry : entry.type;
        expect(SECTION_IDS, `${theme.id} → ${id}`).toContain(id);
      }
    }
  });

  // The whole point of the rebuild. Three themes that share a page shape are
  // three palettes, which is exactly the complaint this replaced.
  it("gives every theme a structurally different homepage", () => {
    const shapes = READY_MADE_THEMES.map((t) => t.sections.join(">"));
    expect(new Set(shapes).size).toBe(READY_MADE_THEMES.length);
    // …and they must not merely be reorderings of one section set.
    const sets = READY_MADE_THEMES.map((t) => [...t.sections].sort().join(","));
    expect(new Set(sets).size).toBe(READY_MADE_THEMES.length);
  });

  it("gives every theme its own header anatomy or card", () => {
    for (const theme of READY_MADE_THEMES) {
      expect(theme.sections.length).toBeGreaterThanOrEqual(3);
      expect(theme.templates.header).toBeTruthy();
      expect(theme.sections).not.toContain("trust-row");
      expect(theme.sections).not.toContain("promo-tiles");
    }
  });

  /* ------------------------------------------------------------------ reset
     Classic doubles as "reset to default", which is only true if its bundle
     really IS the built-in default. If it drifts, applying Classic silently
     restyles a shop that was already on the stock look — the one failure mode
     where the merchant did nothing and the shop changed anyway. Each assertion
     compares against the value the storefront resolves for a store that has
     never opened Customize. */
  describe("Classic is the built-in default", () => {
    const classic = getReadyMadeTheme("classic")!;

    it("is listed first", () => {
      expect(READY_MADE_THEMES[0].id).toBe("classic");
    });

    it("carries the default design tokens", () => {
      expect(classic.design).toEqual(DEFAULT_DESIGN);
    });

    it("carries the default colour preset", () => {
      expect({
        brandColor: classic.brandColor,
        accentColor: classic.accentColor,
      }).toEqual(resolveThemeColors({ preset: "default" }));
    });

    it("carries the default homepage composition", () => {
      expect(classic.sections).toEqual(HOME_PRESET_SECTIONS.classic);
    });

    it("carries the default category-row layout", () => {
      expect(resolveHomeCollections(classic.homeCollections)).toEqual(
        resolveHomeCollections(undefined),
      );
    });

    /* The bundle stores RAW admin ids ("grid-4"), the storefront consumes
       resolved variant names ("grid4"), so the comparison has to go through
       `resolveTemplates` — comparing the raw strings would pass while the two
       vocabularies drifted. */
    it("resolves to exactly DEFAULT_TEMPLATES", () => {
      const resolved = resolveTemplates({ templates: classic.templates });
      for (const key of Object.keys(classic.templates)) {
        expect(
          resolved[key as keyof typeof resolved],
          `classic.${key}`,
        ).toBe(DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES]);
      }
    });

    /* Every key a theme is allowed to write must be present, or applying
       Classic would leave the previous theme's value in place and the reset
       would be partial — the hardest kind of bug to see, because the shop
       looks *nearly* right. */
    it("writes every key the other themes write", () => {
      for (const theme of READY_MADE_THEMES) {
        expect(Object.keys(classic.templates).sort()).toEqual(
          Object.keys(theme.templates).sort(),
        );
      }
    });
  });
});

describe("applyThemeToDraft", () => {
  const theme = getReadyMadeTheme("muslin")!;
  const patch = applyThemeToDraft(draft(), theme);

  it("stamps the look", () => {
    expect(patch.brandColor).toBe(theme.brandColor);
    expect(patch.accentColor).toBe(theme.accentColor);
    expect(patch.design).toEqual(theme.design);
    expect(patch.homeCollections).toEqual(theme.homeCollections);
    expect(patch.appliedThemeId).toBe("muslin");
    expect(patch.templates).toMatchObject(theme.templates);
    // The bundle stays a list of TYPES; the patch is a list of instances. A
    // theme has no business inventing instance identity — minting is one place.
    expect(patch.homepageSections?.map((s) => s.type)).toEqual(theme.sections);
  });

  // Deterministic minting, and it matters twice over: per-section config joins
  // on `key`, so a re-key detaches a merchant's configured row from its section;
  // and `isThemeModified` compares against a freshly applied patch, so a random
  // key would badge an untouched theme as "Edited" the instant it was applied.
  it("mints the same section keys every time it is applied", () => {
    expect(applyThemeToDraft(draft(), theme).homepageSections).toEqual(
      applyThemeToDraft(draft(), theme).homepageSections,
    );
  });

  // The reason `copy` was split out of `theme` in the first place. Applying a
  // theme must be safe to do three times in a row with nothing to lose.
  it("touches NOTHING the merchant wrote", () => {
    for (const key of [
      "footerText",
      "footerNote",
      "footerContactHeading",
      "footerNewsletter",
      "badges",
      "heroSlides",
      "heroBanner",
      "navHeader",
      "footerGroups",
      "footerContentPages",
      "collections",
    ]) {
      expect(patch, key).not.toHaveProperty(key);
    }
  });

  /* The bundles still omit `hero` and `headerMenu`, because those depend on what
     content a shop HAS — forcing `hero: slides` on a shop with no slides shows
     the placeholder hero, and forcing `headerMenu: collections` hides a menu its
     owner built by hand. Both are content questions wearing a layout key's
     clothes. Spreading (rather than replacing) `templates` is what preserves
     them. */
  it("spreads over templates so hero/headerMenu survive", () => {
    expect(patch.templates?.hero).toBe("banner");
    expect(patch.templates?.headerMenu).toBe("custom");
  });

  /* `checkout` used to be on that list and no longer is. It selects one of four
     whole page components, and leaving it unstamped was most of why four
     "different" themes checked out identically. Every bundle must set it — a
     theme that forgot would inherit the previous theme's checkout. */
  it("stamps a checkout layout in every bundle", () => {
    expect(patch.templates?.checkout).toBe(theme.templates.checkout);
    for (const bundle of READY_MADE_THEMES) {
      expect(bundle.templates.checkout, bundle.id).toBeTruthy();
    }
  });

  it("does not carry Classic's category strip into tile-led themes", () => {
    const classicRow = draft({
      homeCollections: { layout: "strip", columns: 5, align: "left" },
    });
    const fresh = getReadyMadeTheme("fresh-market")!;

    expect(applyThemeToDraft(classicRow, fresh).homeCollections).toEqual({
      layout: "grid",
      align: "center",
    });
  });
});

describe("Customize draft safeguards", () => {
  const validAnnouncement: CustomizeDraft["announcement"] = {
    enabled: true,
    useShippingRule: false,
    text: "Delivery today",
    link: "",
    bgColor: "#2563eb",
    textColor: "",
    icon: "",
    ctaLabel: "",
    dismissible: false,
    size: "sm",
    marquee: false,
    marqueeSpeed: "normal",
    bgImage: null,
    overlay: "",
    overlayOpacity: 40,
    bgFit: "cover",
    showOnDesktop: true,
    showOnMobile: true,
  };
  const row = {
    _id: "c1",
    name: "Skin",
    displayName: "Skin",
    isListed: true,
    hasImage: false,
    description: "",
    seoTitle: "",
    seoDescription: "",
  };

  it("rejects malformed colours while preserving blank auto colours", () => {
    const valid = draft({ announcement: validAnnouncement });
    expect(validateCustomizeDraft(valid)).toEqual([]);
    expect(validateCustomizeDraft({ ...valid, brandColor: "#123" })).toContain(
      "Brand colour is invalid",
    );
  });

  it("does not mistake a collection layout change for edited category rows", () => {
    const baseline = draft({ collections: [row] });
    const themed = {
      ...baseline,
      templates: { ...baseline.templates, collection: "sidebar" },
    };
    expect(haveCollectionRowsChanged(themed, baseline)).toBe(false);
    expect(
      haveCollectionRowsChanged(
        { ...themed, collections: [{ ...row, displayName: "Beauty" }] },
        baseline,
      ),
    ).toBe(true);
  });
});

describe("isThemeModified", () => {
  const theme = getReadyMadeTheme("fresh-market")!;
  const applied = draft({ ...applyThemeToDraft(draft(), theme) });

  it("is false right after applying", () => {
    expect(isThemeModified(applied)).toBe(false);
  });

  it("is false when no theme has been applied", () => {
    expect(isThemeModified(draft())).toBe(false);
  });

  it("is true once a value the theme set is changed", () => {
    expect(isThemeModified({ ...applied, brandColor: "#ff0000" })).toBe(true);
    expect(
      isThemeModified({ ...applied, design: { ...applied.design, font: "serif" } }),
    ).toBe(true);
    expect(
      isThemeModified({
        ...applied,
        homeCollections: { ...applied.homeCollections, columns: 3 },
      }),
    ).toBe(true);
  });

  // Rewriting the footer is not "modifying the theme" — a theme cannot write it,
  // so reporting it would tell the merchant something untrue about their shop.
  it("ignores merchant wording", () => {
    expect(isThemeModified({ ...applied, footerText: "Something else" })).toBe(false);
    expect(isThemeModified({ ...applied, footerNote: "Chittagong" })).toBe(false);
  });
});

/**
 * The regression this whole split exists to prevent.
 *
 * `applyThemeToDraft` replaces `homepageSections` outright — a theme's page is
 * an ordered whole. If per-row config lived inside those entries, applying a
 * theme would delete every collection the merchant pointed a row at. It lives
 * in a sibling block instead, so the rule is structural rather than remembered.
 *
 * The patch DOES carry `sectionConfig` now, because a theme's own rows may
 * arrive configured. So the assertion is the guarantee rather than the
 * mechanism: the merchant's entries come through untouched, and a theme may
 * only ADD to them.
 */
describe("applyThemeToDraft — sectionConfig", () => {
  const theme = getReadyMadeTheme("muslin")!;

  it("does not touch a merchant's per-section config", () => {
    const own = [
      { key: "r1", source: "category" as const, categoryId: "cat-skin", title: "Skin care", limit: 6 },
    ];
    const patch = applyThemeToDraft(draft({ sectionConfig: own }), theme);

    // Byte-identical, and the whole of it: this theme implies no config, so
    // there is nothing for the merchant's entries to sit beside.
    expect(patch.sectionConfig).toEqual(own);
  });

  it("leaves the config intact through three applies in a row", () => {
    // A merchant trying themes must still have every collection they chose.
    const own = { key: "r1", source: "category" as const, categoryId: "cat-skin" };
    let current = draft({ sectionConfig: [own] });
    for (const id of ["classic", "muslin", "classic"]) {
      current = { ...current, ...applyThemeToDraft(current, getReadyMadeTheme(id)!) };
    }
    expect(current.sectionConfig).toContainEqual(own);
    // Classic implies ONE row of its own (its new-arrivals grid) and applying
    // it twice must not stack a second copy — the merge is keyed, not appended.
    expect(current.sectionConfig).toHaveLength(2);
  });
});

/**
 * The Home page → "Starting layout" picker.
 *
 * It was inert until 2026-08-17: it wrote `templates.home` and nothing else, and
 * `resolveSections` only consults the preset when `homepageSections` is EMPTY —
 * which it never is, because applying a theme fills it. So every option marked
 * the part dirty, saved, and left the shop exactly as it was. These tests pin
 * the seeding rather than the template key, because the key alone is the bug.
 */
describe("applyHomeTemplateToDraft — the starting-layout picker", () => {
  it("seeds the section list, not just the template key", () => {
    // A page already composed — the state every real store is in.
    const composed = draft({
      templates: { home: "classic" },
      homepageSections: [{ key: "hero-card-0", type: "hero-card" }],
    });
    const patch = applyHomeTemplateToDraft(composed, "hero-split");

    expect(patch.templates?.home).toBe("hero-split");
    expect(patch.homepageSections?.map((s) => s.type)).toEqual(
      HOME_PRESET_SECTIONS["hero-split"],
    );
  });

  it("gives each preset its own page", () => {
    const types = (value: string) =>
      applyHomeTemplateToDraft(draft(), value).homepageSections?.map((s) => s.type);

    // If two presets ever produced the same list the picker would be back to
    // being a control that changes nothing.
    expect(types("classic")).not.toEqual(types("hero-split"));
    expect(types("hero-split")).not.toEqual(types("minimal"));
    expect(types("classic")).not.toEqual(types("minimal"));
  });

  it("covers every option the picker offers", () => {
    for (const option of TEMPLATE_OPTIONS.home) {
      const patch = applyHomeTemplateToDraft(draft(), option.value);
      expect(
        patch.homepageSections?.length,
        `home template "${option.value}" seeds no sections`,
      ).toBeGreaterThan(0);
    }
  });

  it("mints the same keys twice, so per-section config stays attached", () => {
    const a = applyHomeTemplateToDraft(draft(), "classic").homepageSections;
    const b = applyHomeTemplateToDraft(draft(), "classic").homepageSections;
    expect(a).toEqual(b);
  });

  it("keeps the merchant's other templates and their wording", () => {
    const composed = draft({ templates: { home: "classic", header: "boutique" } });
    const patch = applyHomeTemplateToDraft(composed, "minimal");

    expect(patch.templates?.header).toBe("boutique");
    // Same rule as a theme apply: the config outlives the composition. The
    // patch carries it because a preset's rows may arrive configured — what
    // must hold is that the merchant's own entries are all still there.
    expect(patch.sectionConfig).toEqual(composed.sectionConfig);
    expect(patch).not.toHaveProperty("footerText");
  });

  /**
   * REGRESSION — re-picking the active layout wiped the merchant's page (QA,
   * 2026-08-18). The picker highlights the current tile, so clicking it again is
   * the obvious way to ask "what is this one?" — and it replaced a composed
   * section list with the preset's, silently, with no undo. Seeding is for
   * CHANGING layout.
   */
  it("is a NO-OP when the shop is already on that layout", () => {
    const composed = draft({
      templates: { home: "classic", header: "boutique" },
      homepageSections: [
        { key: "hero-card-0", type: "hero-card" },
        { key: "collections-1", type: "collections" },
      ],
    });
    const patch = applyHomeTemplateToDraft(composed, "classic");

    // Nothing at all — not even a same-value template write, which would still
    // mark the part dirty and offer a Save that changes nothing.
    expect(patch).toEqual({});
    expect(patch).not.toHaveProperty("homepageSections");
  });

  it("still reseeds when the layout genuinely changes from the same base", () => {
    const composed = draft({
      templates: { home: "classic" },
      homepageSections: [{ key: "hero-card-0", type: "hero-card" }],
    });
    const patch = applyHomeTemplateToDraft(composed, "minimal");
    expect(patch.homepageSections?.map((s) => s.type)).toEqual(
      HOME_PRESET_SECTIONS["minimal"],
    );
  });

  // A shop that has never picked one must still get seeded on its first click.
  it("seeds on the first pick, when no home template is set yet", () => {
    const patch = applyHomeTemplateToDraft(draft(), "classic");
    expect(patch.templates?.home).toBe("classic");
    expect(patch.homepageSections?.length).toBeGreaterThan(0);
  });

  it("sets the template but never blanks the page for an unknown id", () => {
    // A retired id, or one from a newer build. An empty list would mean "this
    // shop shows no sections at all" and render a blank homepage.
    const composed = draft({
      homepageSections: [{ key: "hero-card-0", type: "hero-card" }],
    });
    const patch = applyHomeTemplateToDraft(composed, "no-such-layout");

    expect(patch.templates?.home).toBe("no-such-layout");
    expect(patch).not.toHaveProperty("homepageSections");
  });
});
