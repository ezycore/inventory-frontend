import { describe, expect, it } from "vitest";
import { READY_MADE_THEMES, getReadyMadeTheme } from "@/lib/storefront-themes";
import {
  applyThemeToDraft,
  isThemeModified,
} from "@/components/ecommerce/customize/use-customize-draft";
import { DEFAULT_DESIGN, resolveThemeColors } from "@/lib/storefront-theme";
import {
  DEFAULT_TEMPLATES,
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
    announcement: {} as CustomizeDraft["announcement"],
    contactButton: {} as CustomizeDraft["contactButton"],
    footerGroups: [{ title: "Help", links: [] }],
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
  it("expresses every theme through the design axes alone", () => {
    for (const theme of READY_MADE_THEMES) {
      expect(Object.keys(theme.design).sort()).toEqual(
        ["density", "font", "radius", "scale", "surface"],
      );
    }
  });

  // A section id the registry does not know would be silently dropped by
  // `resolveSections`, so the theme would quietly render a shorter page than it
  // was designed as — a failure with no error anywhere.
  it("only composes sections the registry can render", () => {
    for (const theme of READY_MADE_THEMES) {
      for (const id of theme.sections) {
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
      expect(theme.sections.length).toBeGreaterThanOrEqual(4);
      expect(theme.templates.header).toBeTruthy();
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
 */
describe("applyThemeToDraft — sectionConfig", () => {
  const theme = getReadyMadeTheme("muslin")!;

  it("does not touch a merchant's per-section config", () => {
    const configured = draft({
      sectionConfig: [
        { key: "r1", source: "category", categoryId: "cat-skin", title: "Skin care", limit: 6 },
      ],
    });
    const patch = applyThemeToDraft(configured, theme);

    // Not "unchanged" by luck — absent from the patch entirely, so there is no
    // value a future edit to this function could accidentally overwrite it with.
    expect(patch).not.toHaveProperty("sectionConfig");
  });

  it("leaves the config intact through three applies in a row", () => {
    // A merchant trying themes must still have every collection they chose.
    let current = draft({
      sectionConfig: [{ key: "r1", source: "category", categoryId: "cat-skin" }],
    });
    for (const id of ["classic", "muslin", "classic"]) {
      current = { ...current, ...applyThemeToDraft(current, getReadyMadeTheme(id)!) };
    }
    expect(current.sectionConfig).toEqual([
      { key: "r1", source: "category", categoryId: "cat-skin" },
    ]);
  });
});
