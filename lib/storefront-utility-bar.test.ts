import { describe, expect, it } from "vitest";
import { resolveUtilityBar } from "@/lib/storefront-utility-bar";

describe("resolveUtilityBar", () => {
  it("preserves the legacy Classic desktop utility bar", () => {
    expect(resolveUtilityBar(undefined, "classic")).toMatchObject({
      enabled: true,
      showOnDesktop: true,
      showOnMobile: false,
    });
  });

  it("preserves other legacy headers without a utility bar", () => {
    expect(resolveUtilityBar(undefined, "minimal").enabled).toBe(false);
  });

  it("lets an explicit section override the header layout", () => {
    expect(
      resolveUtilityBar(
        {
          enabled: true,
          showOnDesktop: false,
          showOnMobile: true,
          showPhone: false,
          trackOrderLabel: "  Check delivery  ",
        },
        "boutique",
      ),
    ).toMatchObject({
      enabled: true,
      showOnDesktop: false,
      showOnMobile: true,
      showPhone: false,
      trackOrderLabel: "Check delivery",
    });
  });
});
