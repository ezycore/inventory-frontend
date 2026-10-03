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

  it("reads a value saved before a field became responsive as the desktop's", () => {
    // ⚠ This used to be dropped, and dropping it is what would have broken every
    // page that answered a setting before it grew a phone value — the section
    // would render its default and the backend would refuse the next save.
    // `image-text.imageRatio` is the first, on 21 live stores.
    expect(readSettings(grid, { source: "newest", limit: 8, columns: 4 })?.columns).toEqual({ base: 4 });
    // It is read AS the base, so it still has to be a value the field accepts.
    expect(readSettings(grid, { source: "newest", limit: 8, columns: 99 })?.columns).toBeUndefined();
  });

  it("still refuses a bare OBJECT where a responsive one is expected", () => {
    // A responsive `focal` stores an object as its scalar, so a bare one cannot
    // be told apart from a malformed `{ base, mobile }`. Those keep the strict
    // rule rather than guessing.
    const focalSpec = { focal: { type: "focal", responsive: true, optional: true } } as const;
    expect(readSettings(focalSpec, { focal: { x: 30, y: 40 } })?.focal).toBeUndefined();
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
      largeUrl: undefined,
      width: undefined,
      height: 600,
      alt: "Cushion",
    });
    expect(readImage({ url: "data:image/png;base64,AAAA" })).toBeUndefined();
  });

  it("carries the large rendition through, and refuses a non-http one", () => {
    // The backend stores `largeUrl` for a wide section upload; this reader is the
    // only step between it and `SfImage`, and once dropped it silently.
    expect(readImage({ url: "https://cdn.example/h.webp", largeUrl: "https://cdn.example/h_lg.webp" })?.largeUrl).toBe(
      "https://cdn.example/h_lg.webp",
    );
    expect(readImage({ url: "https://cdn.example/h.webp", largeUrl: "javascript:x" })?.largeUrl).toBeUndefined();
  });
});

describe("isAllowedSectionUrl — a jump to another section", () => {
  it("accepts an anchor, so the section that links to one still draws", () => {
    // ⚠ The regression this exists for: the BACKEND accepted `#order-here` while
    // this reader still refused it, so a call-to-action's required `buttonHref`
    // read as invalid and `prepareSections` dropped the whole section from the
    // page — silently, because that is what it does with an instance it cannot
    // draw. Found in a browser on 2026-09-21, by a section simply not appearing.
    // These two allowlists must agree; `storefront-section-validation.ts` in the
    // backend is the other half.
    expect(isAllowedSectionUrl("#order-here")).toBe(true);
    expect(isAllowedSectionUrl("#a")).toBe(true);
  });

  it("accepts exactly what the style box will take as a name, and no more", () => {
    expect(isAllowedSectionUrl("#Order-Here")).toBe(false);
    expect(isAllowedSectionUrl("#-leading")).toBe(false);
    expect(isAllowedSectionUrl("#")).toBe(false);
    expect(isAllowedSectionUrl("#a b")).toBe(false);
    expect(isAllowedSectionUrl("javascript:alert(1)")).toBe(false);
  });
});
