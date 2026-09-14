// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { isAllowedSectionUrl, readImage, readSettings } from "@/lib/storefront-builder/settings";

const cta = SECTION_SPECS["call-to-action"].settings;
const grid = SECTION_SPECS["product-grid"].settings;
const ID = "a".repeat(24);
const ID2 = "b".repeat(24);

describe("readSettings", () => {
  it("returns typed settings for a valid instance and ignores undeclared keys", () => {
    const settings = readSettings(cta, {
      heading: "Eid offer",
      buttonLabel: "Order now",
      buttonHref: "/pages/eid",
      align: { base: "left", mobile: "center" },
      extra: "ignored",
    });
    expect(settings).toEqual({
      heading: "Eid offer",
      buttonLabel: "Order now",
      buttonHref: "/pages/eid",
      align: { base: "left", mobile: "center" },
    });
  });

  it("makes the section unrenderable when a required field is invalid", () => {
    expect(
      readSettings(cta, { heading: "Hi", buttonLabel: "Go", buttonHref: "javascript:alert(1)" }),
    ).toBeNull();
    expect(readSettings(cta, { heading: "   ", buttonLabel: "Go", buttonHref: "/" })).toBeNull();
    expect(readSettings(grid, { source: "featured", limit: 25 })).toBeNull();
    expect(readSettings(cta, null)).toBeNull();
  });

  it("drops an invalid optional field but keeps the section", () => {
    const settings = readSettings(cta, {
      heading: "Hi",
      buttonLabel: "Go",
      buttonHref: "https://example.com",
      text: "x".repeat(401),
    });
    expect(settings).not.toBeNull();
    expect(settings?.text).toBeUndefined();
  });

  it("falls back to the desktop value when only the phone override is bad", () => {
    const settings = readSettings(grid, {
      source: "newest",
      limit: 8,
      columns: { base: 4, mobile: 9 },
    });
    expect(settings?.columns).toEqual({ base: 4 });
  });

  it("drops a responsive field that is not { base, mobile }", () => {
    const settings = readSettings(grid, { source: "newest", limit: 8, columns: 4 });
    expect(settings?.columns).toBeUndefined();
  });

  it("reads a focal point per breakpoint, dropping one outside the image", () => {
    const focalSpec = { focal: { type: "focal", responsive: true, optional: true } } as const;
    expect(readSettings(focalSpec, { focal: { base: { x: 30, y: 72.5 }, mobile: { x: 50, y: 10 } } })).toEqual({
      focal: { base: { x: 30, y: 72.5 }, mobile: { x: 50, y: 10 } },
    });
    expect(readSettings(focalSpec, { focal: { base: { x: 30, y: 40 }, mobile: { x: 120, y: 10 } } })).toEqual({
      focal: { base: { x: 30, y: 40 } },
    });
    expect(readSettings(focalSpec, { focal: { base: { x: "30", y: 40 } } })).toEqual({});
  });

  it("refuses id lists with a bad or repeated id, like the backend", () => {
    expect(readSettings(grid, { source: "manual", limit: 4, productIds: [ID, ID2] })?.productIds).toEqual([ID, ID2]);
    expect(readSettings(grid, { source: "manual", limit: 4, productIds: [ID, ID] })?.productIds).toBeUndefined();
    expect(readSettings(grid, { source: "manual", limit: 4, productIds: [ID, "nope"] })?.productIds).toBeUndefined();
  });

  it("refuses rich text over its byte budget", () => {
    const spec = SECTION_SPECS["rich-text"].settings;
    expect(readSettings(spec, { body: "{}" })).toEqual({ body: "{}" });
    // Multi-byte characters count as bytes, not characters.
    expect(readSettings(spec, { body: "ব".repeat(70_000) })).toBeNull();
  });
});

describe("isAllowedSectionUrl", () => {
  it.each([
    ["https://shop.example/offer", true],
    ["/pages/eid", true],
    ["tel:+8801711000000", true],
    ["mailto:hi@shop.example", true],
    ["//evil.example", false],
    ["javascript:alert(1)", false],
    ["data:text/html,hi", false],
    [" /padded", false],
  ])("%s → %s", (url, allowed) => {
    expect(isAllowedSectionUrl(url)).toBe(allowed);
  });
});

describe("readImage", () => {
  it("keeps only http(s) variants and positive sizes", () => {
    expect(
      readImage({
        url: "https://cdn.example/a.webp",
        mediumUrl: "javascript:x",
        width: -1,
        height: 600,
        alt: "Cushion",
        publicId: "org/x/storefront/a",
      }),
    ).toEqual({
      url: "https://cdn.example/a.webp",
      mediumUrl: undefined,
      thumbnailUrl: undefined,
      width: undefined,
      height: 600,
      alt: "Cushion",
    });
    expect(readImage({ url: "data:image/png;base64,AAAA" })).toBeUndefined();
  });
});
