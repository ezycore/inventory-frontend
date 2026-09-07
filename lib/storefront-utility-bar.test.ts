import { describe, expect, it } from "vitest";
import {
  desktopHeaderNeeds,
  resolveUtilityBar,
} from "@/lib/storefront-utility-bar";

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

  /* Customize writes both breakpoints from one three-way picker, so this only
     arrives from a direct API write — where it would otherwise leave the editor
     lighting up "Mobile only" for a bar that renders on neither breakpoint. */
  it("folds away an off-on-both pair rather than treating it as a second off switch", () => {
    expect(
      resolveUtilityBar(
        { enabled: true, showOnDesktop: false, showOnMobile: false },
        "minimal",
      ),
    ).toMatchObject({ enabled: true, showOnDesktop: true, showOnMobile: false });
  });

  it("leaves a deliberate single-breakpoint choice alone", () => {
    expect(
      resolveUtilityBar(
        { enabled: true, showOnDesktop: false, showOnMobile: true },
        "minimal",
      ),
    ).toMatchObject({ showOnDesktop: false, showOnMobile: true });
  });
});

/**
 * The half of the dark-mode guarantee that a source scan cannot see.
 *
 * `desktop-variants.test.tsx` proves every anatomy WRITES a `ThemeBtn` behind
 * `ctx.needsTheme`. That is only worth something if the flag is false purely
 * when the utility bar is genuinely showing the shopper one instead — so this
 * sweeps every reachable bar configuration and checks the pair can never both
 * be silent.
 */
describe("desktopHeaderNeeds", () => {
  const BOOLS = [true, false];
  /** Every combination of the four switches the merchant can actually reach. */
  const configs = BOOLS.flatMap((enabled) =>
    BOOLS.flatMap((showOnDesktop) =>
      BOOLS.flatMap((showTheme) =>
        BOOLS.map((showLanguage) => ({
          enabled,
          showOnDesktop,
          showTheme,
          showLanguage,
          showOnMobile: false,
          showPhone: true,
          showTrackOrder: true,
          trackOrderLabel: "",
        })),
      ),
    ),
  );

  it.each(configs)(
    "never leaves the shopper without a theme or language control (%o)",
    (bar) => {
      const { needsTheme, needsLang } = desktopHeaderNeeds(bar);
      const barShows = bar.enabled && bar.showOnDesktop;
      // Exactly one of the two renders it: the bar, or the anatomy.
      expect(needsTheme).toBe(!(barShows && bar.showTheme));
      expect(needsLang).toBe(!(barShows && bar.showLanguage));
      expect(needsTheme || (barShows && bar.showTheme)).toBe(true);
      expect(needsLang || (barShows && bar.showLanguage)).toBe(true);
    },
  );

  it("hands the toggles back the moment the bar stops carrying them", () => {
    const on = resolveUtilityBar({ enabled: true, showOnDesktop: true }, "classic");
    expect(desktopHeaderNeeds(on)).toEqual({ needsTheme: false, needsLang: false });

    // The default template with its bar switched off — the case that used to
    // leave Classic with no way out of dark mode at all.
    const off = resolveUtilityBar({ enabled: false }, "classic");
    expect(desktopHeaderNeeds(off)).toEqual({ needsTheme: true, needsLang: true });

    // Bar on, but the merchant unticked those two items individually.
    const partial = resolveUtilityBar(
      { enabled: true, showOnDesktop: true, showTheme: false, showLanguage: false },
      "classic",
    );
    expect(desktopHeaderNeeds(partial)).toEqual({ needsTheme: true, needsLang: true });
  });

  it("ignores a bar that only shows on mobile", () => {
    const mobileOnly = resolveUtilityBar(
      { enabled: true, showOnDesktop: false, showOnMobile: true },
      "classic",
    );
    expect(desktopHeaderNeeds(mobileOnly)).toEqual({
      needsTheme: true,
      needsLang: true,
    });
  });
});
