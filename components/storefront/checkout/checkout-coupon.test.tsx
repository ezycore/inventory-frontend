// coding-standard: maintained

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";

/**
 * "Hide the coupon field", per screen (`checkout-form.hideCoupon`).
 *
 * The server renders ONE HTML for a phone and a desktop at once, so both
 * answers have to reach the page and CSS has to pick — which is why this is two
 * classes rather than a boolean and a conditional render. Asserting the classes
 * is therefore asserting the whole mechanism: `storefront.css` hides
 * `.sf-coupon-row` inside `.sf-nocoupon-d` above 680px and inside
 * `.sf-nocoupon-m` below it.
 *
 * The four checkout layouts are stubbed. They each draw their own `CouponRow`
 * in their own place, and that is exactly why the classes live on the page's
 * wrapper instead of on the row — one place covers all four.
 */
let hideCoupon: { desktop: boolean; mobile: boolean } | undefined;

vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({ useStore: () => ({ data: undefined }) }));
vi.mock("@/services/stores/use-sf-preview-store", () => ({ useStoreTemplate: () => "single" }));
vi.mock("@/services/storefront/use-orders-paused", () => ({ useOrdersPaused: () => undefined }));
vi.mock("./use-checkout", () => ({
  useCheckout: () => ({
    t: I18N.en,
    hydrated: true,
    shopper: null,
    placed: null,
    items: [{ productId: "a", quantity: 1 }],
    sampleCart: false,
  }),
}));
vi.mock("./layouts/single-checkout", () => ({ SingleCheckout: () => <div>single</div> }));
vi.mock("./layouts/stepped-checkout", () => ({ SteppedCheckout: () => <div>stepped</div> }));
vi.mock("./layouts/guided-checkout", () => ({ GuidedCheckout: () => <div>guided</div> }));
vi.mock("./layouts/editorial-checkout", () => ({ EditorialCheckout: () => <div>editorial</div> }));

const { CheckoutPageView } = await import("./checkout-page");

const classesOf = (container: HTMLElement) =>
  (container.firstElementChild as HTMLElement).className;

beforeEach(() => {
  hideCoupon = undefined;
});

describe("the coupon field's per-screen hiding", () => {
  /** Every checkout ever shipped has shown it, so an unset control must not move. */
  it("adds no class at all when neither screen hides it", () => {
    const { container } = render(<CheckoutPageView hideCoupon={hideCoupon} />);
    expect(classesOf(container)).toBe("");
  });

  it("adds nothing for a section that answered `false` on both screens", () => {
    const { container } = render(<CheckoutPageView hideCoupon={{ desktop: false, mobile: false }} />);
    expect(classesOf(container)).toBe("");
  });

  it("hides on the desktop alone", () => {
    const { container } = render(<CheckoutPageView hideCoupon={{ desktop: true, mobile: false }} />);
    expect(classesOf(container)).toBe("sf-nocoupon-d");
  });

  it("hides on the phone alone — the case the control was asked for", () => {
    const { container } = render(<CheckoutPageView hideCoupon={{ desktop: false, mobile: true }} />);
    expect(classesOf(container)).toBe("sf-nocoupon-m");
  });

  /** A shop that runs no coupons at all takes the field off everywhere. */
  it("hides on both", () => {
    const { container } = render(<CheckoutPageView hideCoupon={{ desktop: true, mobile: true }} />);
    expect(classesOf(container)).toBe("sf-nocoupon-d sf-nocoupon-m");
  });

  /** A checkout with no coupon setting passes nothing. */
  it("is inert without the prop", () => {
    const { container } = render(<CheckoutPageView />);
    expect(classesOf(container)).toBe("");
  });
});
