// coding-standard: maintained

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";

/**
 * The SEAM: a stored instance → `readSettings` → the section view → the page's
 * wrapper class. Nothing is mocked along that path.
 *
 * It exists because the two tests either side of it each mock the other half —
 * `checkout-form-section.test.tsx` stubs the view to watch the props, and
 * `checkout-coupon.test.tsx` calls the view directly to watch the classes — so
 * a break *between* them leaves both green. That is the seam-bug shape this
 * repo keeps finding in browser QA rather than in tests: the responsive read
 * (`{ base, mobile }`), the spec's own allowlist (a key the spec does not
 * declare is dropped here, silently) and the view's prop name all have to agree,
 * and only this test asks all three at once.
 */
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({ useStore: () => ({ data: undefined }) }));
vi.mock("@/services/stores/use-sf-preview-store", () => ({ useStoreTemplate: () => "single" }));
vi.mock("@/services/storefront/use-orders-paused", () => ({ useOrdersPaused: () => undefined }));
vi.mock("@/components/storefront/checkout/use-checkout", () => ({
  useCheckout: () => ({
    t: I18N.en,
    hydrated: true,
    shopper: null,
    placed: null,
    items: [{ productId: "a" }],
    sampleCart: false,
  }),
}));
vi.mock("@/components/storefront/checkout/layouts/single-checkout", () => ({
  SingleCheckout: () => <div>single</div>,
}));
vi.mock("@/components/storefront/checkout/layouts/stepped-checkout", () => ({
  SteppedCheckout: () => <div>stepped</div>,
}));
vi.mock("@/components/storefront/checkout/layouts/guided-checkout", () => ({
  GuidedCheckout: () => <div>guided</div>,
}));
vi.mock("@/components/storefront/checkout/layouts/editorial-checkout", () => ({
  EditorialCheckout: () => <div>editorial</div>,
}));

const { SECTION_REGISTRY } = await import("@/components/storefront-builder/section-registry");

/** A saved instance, drawn exactly as a page would draw it. */
const drawStored = (settings: Record<string, unknown>) => {
  const entry = SECTION_REGISTRY["checkout-form"]!;
  const prepared = entry.prepare(
    { id: "c", type: "checkout-form", v: 1, enabled: true, settings } as never,
    "checkout" as never,
  );
  if (!prepared) throw new Error("the checkout section refused to prepare");
  const { container } = render(<>{prepared.render({ base: "/shop" } as never, undefined)}</>);
  return container.querySelector("[class*='nocoupon']")?.className ?? "";
};

describe("hideCoupon, from stored settings to the class on the page", () => {
  it("hides on the phone alone", () => {
    expect(drawStored({ hideCoupon: { mobile: true } })).toBe("sf-nocoupon-m");
  });

  it("hides on the desktop, and on the phone that has not answered", () => {
    expect(drawStored({ hideCoupon: { base: true } })).toBe("sf-nocoupon-d sf-nocoupon-m");
  });

  it("lets the phone keep the field its desktop hides", () => {
    expect(drawStored({ hideCoupon: { base: true, mobile: false } })).toBe("sf-nocoupon-d");
  });

  /** A value saved before the field was responsive reads as the desktop's. */
  it("reads a bare boolean as the desktop answer", () => {
    expect(drawStored({ hideCoupon: true })).toBe("sf-nocoupon-d sf-nocoupon-m");
  });

  it("leaves a checkout nobody has configured alone", () => {
    expect(drawStored({})).toBe("");
  });
});
