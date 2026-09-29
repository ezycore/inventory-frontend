import { describe, expect, it } from "vitest";
import { HOME_PRESET_SECTIONS, SECTION_IDS } from "@/lib/storefront-section-ids";

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
