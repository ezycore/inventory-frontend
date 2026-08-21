import { describe, expect, it } from "vitest";
import { READY_MADE_THEMES } from "@/lib/storefront-themes";
import {
  HOME_PRESET_SECTIONS,
  SECTION_IDS,
  resolveHomePrimaryHeading,
} from "@/lib/storefront-section-ids";

describe("storefront section availability", () => {
  it("does not expose sections backed by invented promotional claims", () => {
    expect(SECTION_IDS).not.toContain("trust-row");
    expect(SECTION_IDS).not.toContain("promo-tiles");

    for (const sections of Object.values(HOME_PRESET_SECTIONS)) {
      expect(sections).not.toContain("trust-row");
      expect(sections).not.toContain("promo-tiles");
    }
  });
});

describe("resolveHomePrimaryHeading", () => {
  const sectionsFor = (themeId: string) => {
    const theme = READY_MADE_THEMES.find((candidate) => candidate.id === themeId);
    if (!theme) throw new Error(`Missing theme: ${themeId}`);
    return theme.sections.map((type, index) => ({ key: `${type}-${index}`, type }));
  };

  it("keeps the built-in hero heading for Classic and Fresh Market", () => {
    expect(resolveHomePrimaryHeading(sectionsFor("classic"))).toEqual({
      useHiddenStoreName: false,
    });
    expect(resolveHomePrimaryHeading(sectionsFor("fresh-market"))).toEqual({
      useHiddenStoreName: false,
    });
  });

  it("promotes Muslin's editorial headline", () => {
    expect(resolveHomePrimaryHeading(sectionsFor("muslin"))).toEqual({
      editorialKey: "editorial-split-0",
      useHiddenStoreName: false,
    });
  });

  it("gives Meridian Care a hidden store-name heading", () => {
    expect(resolveHomePrimaryHeading(sectionsFor("meridian-care"))).toEqual({
      useHiddenStoreName: true,
    });
  });

  it("does not promote editorial copy when a hero already owns the heading", () => {
    expect(
      resolveHomePrimaryHeading([
        { key: "editorial", type: "editorial-split" },
        { key: "hero", type: "hero-card" },
      ]),
    ).toEqual({ useHiddenStoreName: false });
  });
});
