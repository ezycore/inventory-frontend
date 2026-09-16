// coding-standard: maintained
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { StickyOrderBarIsland } from "@/components/storefront-builder/islands/sticky-order-bar";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  paused: null as { message: string } | null,
  productLayout: "default" as string,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/services/storefront/use-orders-paused", () => ({ useOrdersPaused: () => mocks.paused }));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rafi5", base: "/shop" }),
}));
vi.mock("@/services/storefront/hooks", () => ({ useStore: () => ({ data: undefined }) }));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useStoreTemplate: () => mocks.productLayout,
}));
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: { buyNow: "Buy now", fromPrice: "From" } }),
}));

type ObserverCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void;
let observed: ObserverCallback | undefined;

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observed = callback;
  }
  observe() {}
  disconnect() {}
}

const product = (overrides: Partial<CatalogProduct> = {}) =>
  ({
    _id: "p1",
    name: "Jamdani saree",
    slug: "jamdani",
    price: 3360,
    productType: "simple",
    availableQuantity: 5,
    outOfStockBehavior: "show",
    images: [],
    ...overrides,
  }) as CatalogProduct;

const addOrderForm = () => {
  const form = document.createElement("div");
  form.setAttribute("data-sf-order-form", "");
  form.scrollIntoView = vi.fn();
  document.body.appendChild(form);
  return form;
};

beforeEach(() => {
  observed = undefined;
  mocks.push.mockReset();
  mocks.paused = null;
  mocks.productLayout = "default";
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("StickyOrderBarIsland", () => {
  it("shows the product and scrolls to the page's order form", () => {
    const form = addOrderForm();
    render(<StickyOrderBarIsland product={product()} currency="BDT" />);
    expect(screen.getByText("Jamdani saree")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Buy now" }));
    expect(form.scrollIntoView).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("opens the product page when the page has no order form", () => {
    render(<StickyOrderBarIsland product={product()} currency="BDT" buttonLabel="Order now" />);
    fireEvent.click(screen.getByRole("button", { name: "Order now" }));
    expect(mocks.push).toHaveBeenCalledWith("/shop/products/jamdani");
  });

  it("gets out of the way while an order form is on screen", () => {
    const form = addOrderForm();
    render(<StickyOrderBarIsland product={product()} currency="BDT" />);
    act(() => observed?.([{ isIntersecting: true, target: form }]));
    expect(screen.queryByRole("button")).toBeNull();
    act(() => observed?.([{ isIntersecting: false, target: form }]));
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("is not shown while the store has paused online orders", () => {
    addOrderForm();
    mocks.paused = { message: "Closed for Eid" };
    render(<StickyOrderBarIsland product={product()} currency="BDT" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("is not shown for a sold-out product, but is for a backorder one", () => {
    render(<StickyOrderBarIsland product={product({ availableQuantity: 0 })} currency="BDT" />);
    expect(screen.queryByRole("button")).toBeNull();
    cleanup();
    render(
      <StickyOrderBarIsland
        product={product({ availableQuantity: 0, outOfStockBehavior: "backorder" })}
        currency="BDT"
      />,
    );
    expect(screen.getByRole("button")).toBeTruthy();
  });

  describe("on the product page itself", () => {
    it("goes back up to the buy buttons rather than reopening the page", () => {
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      render(<StickyOrderBarIsland product={product()} currency="BDT" onProductPage />);
      fireEvent.click(screen.getByRole("button", { name: "Buy now" }));
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
      expect(mocks.push).not.toHaveBeenCalled();
    });

    it("still scrolls to an order form placed on the page", () => {
      const form = addOrderForm();
      render(<StickyOrderBarIsland product={product()} currency="BDT" onProductPage />);
      fireEvent.click(screen.getByRole("button", { name: "Buy now" }));
      expect(form.scrollIntoView).toHaveBeenCalled();
    });

    it("stays away when the product page's sticky-bar layout already pins a bar", () => {
      mocks.productLayout = "sticky";
      render(<StickyOrderBarIsland product={product()} currency="BDT" onProductPage />);
      expect(screen.queryByRole("button")).toBeNull();
      cleanup();
      // On a landing page the layout of the product page is not in play.
      render(<StickyOrderBarIsland product={product()} currency="BDT" />);
      expect(screen.getByRole("button")).toBeTruthy();
    });
  });
});
