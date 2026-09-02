import { describe, expect, it } from "vitest";
import { faviconHref } from "./storefront-client";

/**
 * `faviconHref` decides which stored variant becomes the tab icon AND the icon
 * Google shows beside a search result. The ordering is the whole contract.
 */
describe("faviconHref", () => {
  const webp = {
    url: "https://cdn/x.webp",
    mediumUrl: "https://cdn/x_md.webp",
    thumbnailUrl: "https://cdn/x_thumb.webp",
  };

  it("prefers the PNG — the only variant Google Search can read", () => {
    expect(faviconHref({ ...webp, pngUrl: "https://cdn/x_icon.png" })).toBe(
      "https://cdn/x_icon.png",
    );
  });

  it("falls back to webp for rows the backfill has not reached", () => {
    // A webp tab icon still beats no tab icon; only the search result loses out.
    expect(faviconHref(webp)).toBe("https://cdn/x_thumb.webp");
    expect(faviconHref({ url: "https://cdn/x.webp" })).toBe("https://cdn/x.webp");
  });

  it("is undefined when the merchant uploaded nothing", () => {
    // Callers must render NO <link> here, so /favicon.ico answers instead —
    // never a logo, which cover-crops to an unreadable slice.
    expect(faviconHref(undefined)).toBeUndefined();
    expect(faviconHref(null)).toBeUndefined();
    expect(faviconHref({})).toBeUndefined();
  });
});
