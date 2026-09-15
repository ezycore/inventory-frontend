// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import View from "./view";

/**
 * Checkout renders nothing real until the persisted cart and session load, so
 * the server sends a loading splash and hydration swaps in the form — or, with
 * no cart, a two-line empty-cart message, which is what a fresh browser (and
 * Lighthouse) sees.
 *
 * Without a reserved height the store footer sat inside a phone's screen and
 * hydration moved it: a 0.138 layout shift (budget 0.1). A screen-tall wrapper
 * in every branch starts the footer below the fold and keeps it there. Reserving
 * the height on the splash alone made the empty cart worse (0.461): the footer
 * rose into view when the short message replaced it. So both branches are pinned.
 */
const checkout = vi.hoisted(() => ({
  state: { t: { checkout: "Checkout" }, hydrated: false, shopper: null, placed: null, items: [] as unknown[] },
}));

vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: undefined }),
}));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useStoreTemplate: () => "single",
}));
vi.mock("@/components/storefront/checkout/use-checkout", () => ({
  useCheckout: () => checkout.state,
}));

const wrapperOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe("checkout page height", () => {
  beforeEach(() => {
    checkout.state = { ...checkout.state, hydrated: false, items: [] };
  });

  it("holds a screen's height before hydration", () => {
    const { container } = render(<View />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(wrapperOf(container).style.minHeight).toBe("100svh");
  });

  it("keeps that height for an empty cart, so the footer does not rise into view", () => {
    checkout.state = { ...checkout.state, hydrated: true, items: [] };
    const { container } = render(<View />);
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
    expect(wrapperOf(container).style.minHeight).toBe("100svh");
  });
});
