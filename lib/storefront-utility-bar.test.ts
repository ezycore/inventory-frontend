// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { headerNeeds, resolveUtilityBar } from "@/lib/storefront-utility-bar";

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
 * sweeps every bar configuration, at BOTH breakpoints, and checks the bar and
 * the header can never both go silent and never both speak.
 */
describe("headerNeeds", () => {
  const BOOLS = [true, false];
  /** Every combination of the switches that decide who owns the two controls. */
  const configs = BOOLS.flatMap((enabled) =>
    BOOLS.flatMap((showOnDesktop) =>
      BOOLS.flatMap((showOnMobile) =>
        BOOLS.flatMap((showTheme) =>
          BOOLS.map((showLanguage) => ({
            enabled,
            showOnDesktop,
            showOnMobile,
            showTheme,
            showLanguage,
            showPhone: true,
            showTrackOrder: true,
            trackOrderLabel: "",
          })),
        ),
      ),
    ),
  );

  for (const at of ["desktop", "mobile"] as const) {
    it.each(configs)(`${at}: exactly one of the bar and the header owns each control (%o)`, (bar) => {
      const { needsTheme, needsLang } = headerNeeds(bar, at);
      const barShows =
        bar.enabled && (at === "desktop" ? bar.showOnDesktop : bar.showOnMobile);
      // Never both silent (the stranding bug) …
      expect(needsTheme || (barShows && bar.showTheme)).toBe(true);
      expect(needsLang || (barShows && bar.showLanguage)).toBe(true);
      // … and never both speaking (the duplicate-toggle bug).
      expect(needsTheme && barShows && bar.showTheme).toBe(false);
      expect(needsLang && barShows && bar.showLanguage).toBe(false);
    });
  }

  it("hands the toggles back the moment the bar stops carrying them", () => {
    const on = resolveUtilityBar({ enabled: true, showOnDesktop: true }, "classic");
    expect(headerNeeds(on, "desktop")).toEqual({ needsTheme: false, needsLang: false });

    // The default template with its bar switched off — the case that used to
    // leave Classic with no way out of dark mode at all.
    const off = resolveUtilityBar({ enabled: false }, "classic");
    expect(headerNeeds(off, "desktop")).toEqual({ needsTheme: true, needsLang: true });

    // Bar on, but the merchant unticked those two items individually.
    const partial = resolveUtilityBar(
      { enabled: true, showOnDesktop: true, showTheme: false, showLanguage: false },
      "classic",
    );
    expect(headerNeeds(partial, "desktop")).toEqual({ needsTheme: true, needsLang: true });
  });

  /* The breakpoints are independent switches, so an answer taken at the wrong
     one is how the phone bar ends up repeating what the drawer already shows. */
  it("keeps the two breakpoints from answering for each other", () => {
    const mobileOnly = resolveUtilityBar(
      { enabled: true, showOnDesktop: false, showOnMobile: true },
      "classic",
    );
    expect(headerNeeds(mobileOnly, "desktop")).toEqual({
      needsTheme: true,
      needsLang: true,
    });
    expect(headerNeeds(mobileOnly, "mobile")).toEqual({
      needsTheme: false,
      needsLang: false,
    });
  });

  /* Customize → Language & theme. "Never both silent" above is the rule for a
     switch the shop OFFERS; a switch it does not offer is owed by nobody, on
     either breakpoint, whatever the bar says. */
  it.each(configs)("owes no switch the shop does not offer (%o)", (bar) => {
    for (const at of ["desktop", "mobile"] as const) {
      expect(headerNeeds(bar, at, { language: false, theme: false })).toEqual({
        needsTheme: false,
        needsLang: false,
      });
    }
  });

  it("answers each switch on its own", () => {
    const off = resolveUtilityBar({ enabled: false }, "classic");
    expect(headerNeeds(off, "desktop", { language: false, theme: true })).toEqual({
      needsTheme: true,
      needsLang: false,
    });
  });
});
