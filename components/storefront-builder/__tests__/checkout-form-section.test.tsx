// coding-standard: maintained

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SectionContext } from "@/components/storefront-builder/section-view";

/**
 * The checkout core section's reading of `hideCoupon`.
 *
 * One rule, and it is the one every responsive setting shares: **an unset phone
 * answer inherits the desktop.** A merchant who hides the coupon field without
 * touching the phone tab means "hidden", not "hidden on the desktop and back on
 * the phone" — and getting that backwards would put the field in front of
 * exactly the shopper the control exists to protect.
 */
vi.mock("@/components/storefront/checkout/checkout-page", () => ({
  CheckoutPageView: ({ hideCoupon }: { hideCoupon?: { desktop: boolean; mobile: boolean } }) => (
    <div data-testid="view" data-hide={`${hideCoupon?.desktop}/${hideCoupon?.mobile}`} />
  ),
}));

const { CheckoutFormSection } = await import("@/components/storefront-builder/sections/checkout-form");

/** Reads its OWN render, so a test may draw twice without the two colliding. */
const draw = (hideCoupon?: { base?: boolean; mobile?: boolean }) => {
  const { container } = render(
    <CheckoutFormSection
      id="c1"
      settings={{ hideCoupon } as never}
      blocks={[]}
      context={{ base: "/shop" } as SectionContext}
    />,
  );
  return container.querySelector("[data-testid='view']")?.getAttribute("data-hide");
};

describe("checkout-form hideCoupon", () => {
  it("shows the field on both screens when the merchant has not answered", () => {
    expect(draw(undefined)).toBe("false/false");
  });

  it("carries a desktop answer down to the phone, which has not been set", () => {
    expect(draw({ base: true })).toBe("true/true");
  });

  it("lets the phone disagree with the desktop", () => {
    expect(draw({ base: false, mobile: true })).toBe("false/true");
    expect(draw({ base: true, mobile: false })).toBe("true/false");
  });
});
