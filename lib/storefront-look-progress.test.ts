// coding-standard: maintained

import { describe, expect, it } from "vitest";

import { lookProgress } from "@/lib/storefront-look-progress";
import { DEFAULT_DESIGN } from "@/lib/storefront-theme";
import { READY_MADE_THEMES, recommendedThemeFor } from "@/lib/storefront-themes";

describe("lookProgress", () => {
  it("reports a brand new shop as untouched", () => {
    expect(
      lookProgress({ surface: DEFAULT_DESIGN.surface, hasLogo: false }),
    ).toEqual({ theme: false, logo: false, palette: false, done: false });
  });

  // Applying a theme picks a ground as part of picking a look, so a merchant who
  // applied Classic is not then told to go and pick a palette they already have.
  it("counts an applied theme as a chosen palette", () => {
    const progress = lookProgress({
      appliedThemeId: "classic",
      surface: DEFAULT_DESIGN.surface,
      hasLogo: false,
    });
    expect(progress.palette).toBe(true);
    expect(progress.done).toBe(false);
  });

  it("counts a non-default surface on its own", () => {
    expect(lookProgress({ surface: "parchment", hasLogo: false }).palette).toBe(
      true,
    );
  });

  it("is done only with all three", () => {
    expect(
      lookProgress({
        appliedThemeId: "muslin",
        surface: "parchment",
        hasLogo: true,
      }).done,
    ).toBe(true);
  });
});

describe("recommendedThemeFor", () => {
  it("names the theme drawn for the trade", () => {
    expect(recommendedThemeFor("GROCERY_STORE")?.id).toBe("fresh-market");
    expect(recommendedThemeFor("PHARMACY")?.id).toBe("meridian-care");
  });

  // Silence is the deliberate answer for a trade nothing was drawn for:
  // recommending Classic would dress the shop as it already looks and call it a
  // suggestion, and pointing an electronics shop at a grocery theme is worse.
  it.each(["ELECTRONICS_STORE", "HARDWARE_STORE", "OTHER", undefined])(
    "recommends nothing for %s",
    (industry) => {
      expect(recommendedThemeFor(industry)).toBeUndefined();
    },
  );

  // The map holds ids as strings, so a renamed or retired theme would leave a
  // trade recommending nothing at all — silently, and only for that trade.
  it.each([
    "GROCERY_STORE",
    "RESTAURANT_FNB",
    "PHARMACY",
    "FASHION_APPAREL",
    "BABY_KIDS_STORE",
    "ONLINE_SHOP",
  ])("resolves %s to a theme that exists", (industry) => {
    const theme = recommendedThemeFor(industry);
    expect(READY_MADE_THEMES).toContain(theme);
  });
});
