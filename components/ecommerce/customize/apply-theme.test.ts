import { describe, expect, it } from "vitest";
import {
  READY_MADE_THEMES,
  getReadyMadeTheme,
} from "@/lib/storefront-themes";
import {
  applyThemeToDraft,
  haveCollectionRowsChanged,
  isThemeModified,
  validateCustomizeDraft,
} from "@/components/ecommerce/customize/use-customize-draft";
import { DEFAULT_DESIGN, resolveThemeColors } from "@/lib/storefront-theme";
import {
  DEFAULT_TEMPLATES,
  resolveTemplates,
} from "@/lib/storefront-templates";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/** A draft carrying merchant-written content a theme must never reach. */
const draft = (over: Partial<CustomizeDraft> = {}): CustomizeDraft =>
  ({
    preset: "default",
    brandColor: "#111827",
    accentColor: "#2563eb",
    footerText: "Family run since 1998",
    logoStyle: { height: 44 },
    design: DEFAULT_DESIGN,
    templates: { headerMenu: "custom", checkout: "multi-step" },
    badges: [{ text: "Free delivery over ৳1000", icon: "truck" }],
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
    footerStyle: {},
    footerBlocks: null,
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

  it("gives every theme a header anatomy", () => {
    for (const theme of READY_MADE_THEMES) {
      expect(theme.templates.header).toBeTruthy();
    }
  });

  /* ---------------------------------------------------------------- default
     The Default (the Showroom look, 2026-10-28) is listed first and is the
     reset: applying it stamps every axis, so it must write every key the other
     bundles write, or a reset from another theme would leave that theme's value
     in place — the shop looking *nearly* right, the hardest bug to see. */
  describe("the Default is the look new stores start on, and the reset", () => {
    const fallback = getReadyMadeTheme("showroom")!;

    it("is listed first, as the Default", () => {
      expect(READY_MADE_THEMES[0].id).toBe("showroom");
      expect(READY_MADE_THEMES[0].label).toBe("Default");
    });

    it("carries the default colour preset", () => {
      expect({ brandColor: fallback.brandColor, accentColor: fallback.accentColor }).toEqual(
        resolveThemeColors({ preset: "default" }),
      );
    });

    it("differs from the storefront's own defaults only where the Showroom does", () => {
      expect(fallback.design).toEqual({ ...DEFAULT_DESIGN, navHover: "highlight" });
      const resolved = resolveTemplates({ templates: fallback.templates });
      const differs = Object.keys(fallback.templates).filter(
        (key) => resolved[key as keyof typeof resolved] !== DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES],
      );
      expect(differs.sort()).toEqual(["header", "imageFit"]);
    });

    it("writes every key the other themes write", () => {
      for (const theme of READY_MADE_THEMES) {
        expect(Object.keys(fallback.templates).sort()).toEqual(Object.keys(theme.templates).sort());
      }
    });
  });

  /* ⚠ The Default is NOT the storefront's built-in fallback. A shop that never
     applied a theme renders these, and every live shop that never opened
     Customize is one: if they moved, those shops would restyle with nobody
     touching anything. Retiring Classic as the Default (2026-10-28) must not
     have moved them. */
  describe("the built-in look a store with no theme renders", () => {
    it("is still the Classic header and its defaults", () => {
      expect(DEFAULT_TEMPLATES.header).toBe("classic");
      expect(DEFAULT_TEMPLATES.imageFit).toBe("fit");
      expect(resolveThemeColors({ preset: "default" })).toEqual({ brandColor: "#111827", accentColor: "#2563eb" });
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
      "navHeader",
      "footerGroups",
      "footerContentPages",
      "footerStyle",
      "footerBlocks",
      "collections",
    ]) {
      expect(patch, key).not.toHaveProperty(key);
    }
  });

  /* The bundles omit `headerMenu`: forcing `collections` would hide a menu its
     owner built by hand. Spreading (rather than replacing) `templates` is what
     preserves it. */
  it("spreads over templates so headerMenu survives", () => {
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
  });

  // Rewriting the footer is not "modifying the theme" — a theme cannot write it,
  // so reporting it would tell the merchant something untrue about their shop.
  it("ignores merchant wording", () => {
    expect(isThemeModified({ ...applied, footerText: "Something else" })).toBe(false);
    expect(isThemeModified({ ...applied, footerNote: "Chittagong" })).toBe(false);
  });
});
