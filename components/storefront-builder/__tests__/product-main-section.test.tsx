// coding-standard: maintained

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SectionContext } from "@/components/storefront-builder/section-view";

/**
 * The product page core section's **translation**, which is the whole of what
 * this view does: the merchant answers in Customize's words (`portrait`,
 * `crop`) and the storefront draws in CSS (`3 / 4`, `cover`).
 *
 * Two rules are worth a test each, and both are about the screens:
 *
 *  - **An unanswered screen stays unanswered.** The phone inherits the desktop
 *    in the STYLESHEET, not here — filling `base` in from a phone answer would
 *    be the section changing the screen the merchant was not looking at.
 *  - **An unset setting passes nothing**, so the page keeps following Customize
 *    → Product cards, which is what every product page drew before this existed.
 */
vi.mock("@/components/storefront/product/product-data", () => ({
  ProductFromRoute: (props: Record<string, unknown>) => (
    <div data-testid="view" data-props={JSON.stringify(props)} />
  ),
}));

const { ProductMainSection } = await import("@/components/storefront-builder/sections/product-main");

/** Reads its OWN render, so a test may draw twice without the two colliding. */
const draw = (settings: Record<string, unknown>) => {
  const { container } = render(
    <ProductMainSection
      id="m1"
      settings={settings as never}
      blocks={[]}
      context={{ base: "/shop" } as SectionContext}
    />,
  );
  return JSON.parse(container.querySelector("[data-testid='view']")?.getAttribute("data-props") ?? "{}");
};

describe("product-main, from stored settings to the page's values", () => {
  it("passes no shape at all for a section nobody has configured", () => {
    // Every field absent — which is what leaves the page following the store.
    // Read through JSON, so an explicit `undefined` and a missing key are the
    // same thing here, exactly as they are once the props cross into React.
    const { shape } = draw({});
    expect(shape.imageRatio).toBeUndefined();
    expect(shape.imageFit).toBeUndefined();
    expect(shape.relatedLimit).toBeUndefined();
    expect(shape.relatedColumns).toBeUndefined();
    expect(shape.cardImageRatio).toBeUndefined();
    expect(shape.cardImageFit).toBeUndefined();
    expect(shape.cardLook).toEqual({});
  });

  it("hands the related row's corners and button fill through", () => {
    expect(draw({ cardCorners: "round", cardButtons: "outline" }).shape.cardLook).toEqual({
      cardCorners: "round",
      cardButtons: "outline",
    });
  });

  it("resolves the big photo's shape and fit into CSS", () => {
    expect(draw({ imageRatio: { base: "portrait" }, imageFit: "crop" }).shape).toMatchObject({
      imageRatio: { base: "3 / 4" },
      imageFit: "cover",
    });
  });

  it("keeps a phone shape off the desktop, and a desktop shape off the phone", () => {
    // The stylesheet is what makes an unset phone follow the desktop
    // (`var(--sfb-pdp-frame-m, var(--sfb-pdp-frame))`); this view must not
    // pre-empt it in either direction.
    expect(draw({ imageRatio: { mobile: "square" } }).shape.imageRatio).toEqual({ mobile: "1 / 1" });
    expect(draw({ imageRatio: { base: "tall" } }).shape.imageRatio).toEqual({ base: "2 / 3" });
    expect(draw({ imageRatio: { base: "tall", mobile: "square" } }).shape.imageRatio).toEqual({
      base: "2 / 3",
      mobile: "1 / 1",
    });
  });

  it("hands the related row its count, its columns and its card photo", () => {
    const shape = draw({
      relatedLimit: 6,
      relatedColumns: { base: 3, mobile: 2 },
      cardImageRatio: "landscape",
      cardImageFit: "fit",
    }).shape;
    expect(shape).toMatchObject({
      relatedLimit: 6,
      relatedColumns: { base: 3, mobile: 2 },
      cardImageRatio: "4 / 3",
      cardImageFit: "canvas",
    });
  });

  it("keeps the big photo's settings and the cards' apart", () => {
    // Two pairs on one section, and the trap is that they read alike. The big
    // photo takes `imageRatio`; the row's cards take `cardImageRatio`, the same
    // key every other product row carries.
    const shape = draw({ imageRatio: { base: "portrait" }, cardImageRatio: "square" }).shape;
    expect(shape.imageRatio).toEqual({ base: "3 / 4" });
    expect(shape.cardImageRatio).toBe("1 / 1");
  });

  it("passes the two hiding switches as booleans, never as undefined", () => {
    expect(draw({})).toMatchObject({ hideRelated: false, hideDescription: false });
    expect(draw({ hideRelated: true, hideDescription: true })).toMatchObject({
      hideRelated: true,
      hideDescription: true,
    });
  });
});
