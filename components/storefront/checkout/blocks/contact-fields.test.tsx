// coding-standard: maintained

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dict } from "@/lib/storefront-i18n";
import { ContactFields } from "./contact-fields";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * The guest sign-in notice and the merchant control over WHERE it appears.
 *
 * The notice is the checkout's only warning that a guest's order lives on a
 * tracking link and nowhere else, so its default — shown on both breakpoints —
 * is the part worth protecting: a store that has never opened the setting must
 * render exactly the markup it always did, with no visibility class at all.
 *
 * Hidden on a single breakpoint is a CLASS, because checkout is server-rendered
 * and a `matchMedia` check would paint the wrong state before correcting it.
 * Hidden on BOTH leaves the tree instead — a `display: none` block still holds a
 * focusable sign-in link, which a keyboard and a screen reader would both find.
 */

vi.mock("@/components/storefront/checkout/blocks/custom-fields", () => ({
  CustomFields: () => null,
}));

const t = {
  contactHeading: "Contact",
  fullName: "Full name",
  mobileLabel: "Mobile",
  requiredTag: "required",
  phonePh: "01…",
  guestNoticeTitle: "Ordering as a guest",
  guestNoticeBody: "Your tracking link is your only record.",
  haveAccount: "Have an account?",
  signIn: "Sign in",
} as unknown as Dict;

const draw = (guestNotice?: { showOnDesktop?: boolean; showOnMobile?: boolean }) =>
  render(
    <ContactFields
      api={
        {
          t,
          base: "/shop",
          shopper: null,
          store: { checkout: { guestNotice } },
          addr: { name: "", phone: "" },
          set: vi.fn(),
          captureContact: vi.fn(),
          errors: {},
          touch: vi.fn(),
        } as unknown as CheckoutApi
      }
    />,
  ).container;

/**
 * The notice's own box: the FIRST child of the block, which is where it renders
 * and the only place the visibility class can land. Identified by the sign-in
 * link it contains rather than by a test hook, so the assertion fails if the
 * class is ever put on an inner wrapper where `display: flex` (inline, and so
 * higher-priority than a class) would survive it.
 */
const notice = (container: HTMLElement): HTMLElement | null => {
  const first = container.firstElementChild?.firstElementChild as HTMLElement | null;
  return first?.querySelector("a[href*='/account']") ? first : null;
};

describe("the checkout guest notice", () => {
  it("shows it with no visibility class when the merchant has set nothing", () => {
    const container = draw();
    const link = container.querySelector("a[href*='/account']");
    expect(link).not.toBeNull();
    // The outermost notice box. `className` unset means the attribute is absent
    // entirely — the markup every shop had before the control existed.
    expect(notice(container)?.className).toBe("");
  });

  it("hides it on phones with a class, not by dropping it", () => {
    const container = draw({ showOnDesktop: true, showOnMobile: false });
    expect(container.querySelector("a[href*='/account']")).not.toBeNull();
    expect(notice(container)?.className).toBe("sf-desktop-only");
  });

  it("hides it on computers the same way", () => {
    const container = draw({ showOnDesktop: false, showOnMobile: true });
    expect(notice(container)?.className).toBe("sf-mobile-only");
  });

  it("drops it from the document when both are off, link and all", () => {
    const container = draw({ showOnDesktop: false, showOnMobile: false });
    expect(container.querySelector("a[href*='/account']")).toBeNull();
  });

  it("never shows it to a signed-in shopper, whatever the setting says", () => {
    const container = render(
      <ContactFields
        api={
          {
            t,
            base: "/shop",
            shopper: { _id: "s1" },
            store: { checkout: { guestNotice: { showOnDesktop: true, showOnMobile: true } } },
            addr: { name: "", phone: "" },
            set: vi.fn(),
            captureContact: vi.fn(),
            errors: {},
            touch: vi.fn(),
          } as unknown as CheckoutApi
        }
      />,
    ).container;
    expect(container.querySelector("a[href*='/account']")).toBeNull();
  });
});
