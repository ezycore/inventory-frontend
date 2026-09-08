// coding-standard: maintained

import { describe, expect, it } from "vitest";
import {
  announcementStripAttrs,
  campaignStripAllowedOn,
  isStripHiddenEverywhere,
  marqueeDurationSeconds,
  resolveCampaignStrip,
  stripPaddingInline,
  stripVisibilityClass,
} from "@/lib/storefront-strip-display";

describe("resolveCampaignStrip", () => {
  /* The load-bearing test of the whole feature. Every store that predates these
     settings stores NOTHING, so the resolver's defaults are what those
     storefronts render. Sizes and spacing deliberately leave as ATTRIBUTES, not
     pixels: resolving them here is what froze both strips at desktop spacing on
     a phone (the tables now live in storefront.css, per breakpoint). */
  it("falls back to the theme and the shipped presets when nothing is configured", () => {
    expect(resolveCampaignStrip(undefined)).toEqual({
      background: "var(--primary-soft)",
      color: "var(--primary)",
      visibilityClass: undefined,
      dismissible: false,
      attrs: {
        "data-sf-strip": "campaign",
        "data-strip-size": "sm",
        "data-strip-pad-y": "md",
        "data-strip-pad-x": "md",
      },
    });
  });

  it("emits the merchant's presets as attributes for the stylesheet", () => {
    expect(
      resolveCampaignStrip({ size: "lg", paddingY: "lg", paddingX: "sm" }).attrs,
    ).toEqual({
      "data-sf-strip": "campaign",
      "data-strip-size": "lg",
      "data-strip-pad-y": "lg",
      "data-strip-pad-x": "sm",
    });
  });

  it("resolves no pixel value for size or spacing", () => {
    // Guards the regression directly: a number here can only have come from a
    // JS table, and a JS table cannot vary by breakpoint.
    const strip = resolveCampaignStrip({ size: "lg", paddingX: "lg" });
    expect(Object.values(strip.attrs).every((v) => typeof v === "string")).toBe(true);
    expect(JSON.stringify(strip)).not.toMatch(/\d+px/);
  });

  it("keeps following the theme when only one colour is set", () => {
    const bgOnly = resolveCampaignStrip({ bgColor: "#ffffff" });
    // A set background with no text colour auto-contrasts rather than staying
    // on `var(--primary)`, which could land unreadable on the chosen colour.
    expect(bgOnly.background).toBe("#ffffff");
    expect(bgOnly.color).toBe("#111827");

    const fgOnly = resolveCampaignStrip({ textColor: "#ff0000" });
    expect(fgOnly.background).toBe("var(--primary-soft)");
    expect(fgOnly.color).toBe("#ff0000");
  });

  it("treats a whitespace-only colour as unset", () => {
    const strip = resolveCampaignStrip({ bgColor: "   ", textColor: "  " });
    expect(strip.background).toBe("var(--primary-soft)");
    expect(strip.color).toBe("var(--primary)");
  });
});

describe("strip padding tokens", () => {
  it("applies the dismiss-button floor only when there is a button", () => {
    // `max()` at the point of use, not on the token: a custom property that
    // references itself is invalid at computed-value time.
    expect(stripPaddingInline(false)).toBe("var(--strip-pad-x)");
    expect(stripPaddingInline(true)).toBe(
      "max(var(--strip-pad-x), var(--strip-dismiss-pad))",
    );
  });
});

describe("announcementStripAttrs", () => {
  it("carries one size axis and its own scale", () => {
    expect(announcementStripAttrs("lg")).toEqual({
      "data-sf-strip": "announcement",
      "data-strip-size": "lg",
    });
    // Unset ⇒ the size the bar has always shipped with.
    expect(announcementStripAttrs(undefined)["data-strip-size"]).toBe("sm");
  });
});

describe("stripVisibilityClass", () => {
  it("adds no class when the strip shows on both breakpoints", () => {
    expect(stripVisibilityClass(true, true)).toBeUndefined();
    // Unset means "on" — the switches postdate both strips, so an absent field
    // must not hide a bar the merchant already had running.
    expect(stripVisibilityClass(undefined, undefined)).toBeUndefined();
  });

  it("reuses the storefront's own responsive classes", () => {
    expect(stripVisibilityClass(true, false)).toBe("sf-desktop-only");
    expect(stripVisibilityClass(false, true)).toBe("sf-mobile-only");
  });

  it("has a class for the reachable both-off state", () => {
    expect(stripVisibilityClass(false, false)).toBe("sf-strip-hidden");
    expect(isStripHiddenEverywhere(false, false)).toBe(true);
    expect(isStripHiddenEverywhere(true, false)).toBe(false);
    expect(isStripHiddenEverywhere(undefined, undefined)).toBe(false);
  });
});

describe("campaignStripAllowedOn", () => {
  it("shows on every page by default", () => {
    expect(campaignStripAllowedOn(undefined, false)).toBe(true);
    expect(campaignStripAllowedOn(undefined, true)).toBe(true);
  });

  it("narrows to the home page when asked", () => {
    expect(campaignStripAllowedOn({ showOn: "home" }, true)).toBe(true);
    expect(campaignStripAllowedOn({ showOn: "home" }, false)).toBe(false);
  });

  it("is off only for an explicit false", () => {
    expect(campaignStripAllowedOn({ enabled: false }, true)).toBe(false);
    // `enabled` is absent on every document that predates the block, and those
    // strips were on — treating undefined as off would silently delete the
    // strip from every existing store.
    expect(campaignStripAllowedOn({}, false)).toBe(true);
  });
});

/**
 * The pace of a scrolling announcement.
 *
 * Seconds have to be decided on the SERVER: measuring the rendered text before
 * paint is impossible, and measuring it after is what makes a ticker visibly
 * snap to a new speed on hydration. So the message itself is the only input.
 */
describe("marqueeDurationSeconds", () => {
  const long = "x".repeat(200);

  /* The point of the whole calculation. A fixed duration would do the exact
     opposite of what this feature is for: the longer the notice — which is WHY
     a merchant switches scrolling on — the faster it would have to travel to
     finish in the same time, so the hardest message to read would be the one
     moving quickest. */
  it("gives a longer message more time, rather than more speed", () => {
    expect(marqueeDurationSeconds(long, "normal")).toBeGreaterThan(
      marqueeDurationSeconds("x".repeat(100), "normal"),
    );
  });

  it("orders the paces the way their names promise", () => {
    expect(marqueeDurationSeconds(long, "slow")).toBeGreaterThan(
      marqueeDurationSeconds(long, "normal"),
    );
    expect(marqueeDurationSeconds(long, "normal")).toBeGreaterThan(
      marqueeDurationSeconds(long, "fast"),
    );
  });

  it("treats an unset speed as normal", () => {
    expect(marqueeDurationSeconds(long, undefined)).toBe(
      marqueeDurationSeconds(long, "normal"),
    );
  });

  /* Below the floor the sum stops describing the distance travelled: a short
     message is held to the width of the BAR, not the width of its words (the
     `min-width` on `.sf-marquee-item`), so an honest chars-per-second would
     strobe a three-word notice across the screen. */
  it("holds a floor so a short notice does not strobe", () => {
    expect(marqueeDurationSeconds("Sale!", "fast")).toBeGreaterThanOrEqual(8);
    expect(marqueeDurationSeconds("", "fast")).toBeGreaterThanOrEqual(8);
  });

  it("holds a ceiling at the longest message the field accepts", () => {
    // 200 is the `text` maxLength on both sides of the contract.
    expect(marqueeDurationSeconds(long, "slow")).toBeLessThanOrEqual(60);
  });

  it("ignores surrounding whitespace, as the bar itself does", () => {
    expect(marqueeDurationSeconds("   Closed Friday   ", "normal")).toBe(
      marqueeDurationSeconds("Closed Friday", "normal"),
    );
  });
});
