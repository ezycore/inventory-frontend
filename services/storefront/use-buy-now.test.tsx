// coding-standard: maintained

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBuyNowStore } from "@/services/stores/use-buy-now-store";
import { useCartStore } from "@/services/stores/use-cart-store";
import {
  buyNowHref,
  isBuyNowSearch,
  useBuyNowCartMerge,
  useBuyNowLine,
  useStartBuyNow,
} from "./use-buy-now";

/**
 * Buy now checks out one line and never touches the cart. These pin the three
 * halves: starting one, checkout recognising one (line AND URL, never the line
 * alone), and folding it into the cart on request.
 */

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  useSearchParams: () => nav.search,
}));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));

const oil = { productId: "p7", slug: "oil", name: "Oil", price: 300, maxQty: 5 };
const rice = { productId: "p1", slug: "rice", name: "Rice", price: 620, maxQty: 9 };

beforeEach(() => {
  vi.clearAllMocks();
  nav.search = new URLSearchParams();
  useBuyNowStore.getState().end();
  useCartStore.setState({ storeSlug: "rmc", items: [] });
});

describe("the buy-now URL", () => {
  it("is checkout with ?buy=1, under the store's base", () => {
    expect(buyNowHref("/shop")).toBe("/shop/checkout?buy=1");
    expect(buyNowHref("")).toBe("/checkout?buy=1");
    expect(isBuyNowSearch("?buy=1")).toBe(true);
    expect(isBuyNowSearch("?other=1")).toBe(false);
  });
});

describe("useStartBuyNow", () => {
  it("holds the line, opens checkout, and leaves the cart alone", () => {
    useCartStore.setState({ storeSlug: "rmc", items: [{ ...rice, quantity: 1 }] });
    const { result } = renderHook(() => useStartBuyNow());
    act(() => {
      result.current(oil, 2);
    });
    expect(useBuyNowStore.getState()).toMatchObject({ storeSlug: "rmc", line: { ...oil, quantity: 2 } });
    expect(nav.push).toHaveBeenCalledWith("/shop/checkout?buy=1");
    expect(useCartStore.getState().items).toEqual([{ ...rice, quantity: 1 }]);
  });

  it("caps the quantity at what can be sold", () => {
    const { result } = renderHook(() => useStartBuyNow());
    act(() => {
      result.current(oil, 40);
    });
    expect(useBuyNowStore.getState().line?.quantity).toBe(5);
  });

  it("refuses a sold-out line without navigating", () => {
    const { result } = renderHook(() => useStartBuyNow());
    let started = true;
    act(() => {
      started = result.current({ ...oil, maxQty: 0 });
    });
    expect(started).toBe(false);
    expect(useBuyNowStore.getState().line).toBeNull();
    expect(nav.push).not.toHaveBeenCalled();
  });
});

describe("useBuyNowLine", () => {
  it("is the held line only on a ?buy=1 checkout", () => {
    useBuyNowStore.getState().start("rmc", { ...oil, quantity: 1 });
    const plain = renderHook(() => useBuyNowLine());
    expect(plain.result.current).toBeUndefined();

    nav.search = new URLSearchParams("buy=1");
    const buyNow = renderHook(() => useBuyNowLine());
    expect(buyNow.result.current).toMatchObject({ productId: "p7", quantity: 1 });
  });

  it("ignores a line held for another store", () => {
    useBuyNowStore.getState().start("other-store", { ...oil, quantity: 1 });
    nav.search = new URLSearchParams("buy=1");
    const { result } = renderHook(() => useBuyNowLine());
    expect(result.current).toBeUndefined();
  });
});

describe("useBuyNowCartMerge", () => {
  it("counts only the cart lines the buy-now leaves out", () => {
    useCartStore.setState({
      storeSlug: "rmc",
      items: [{ ...rice, quantity: 1 }, { ...oil, quantity: 1 }],
    });
    const { result } = renderHook(() => useBuyNowCartMerge({ ...oil, quantity: 1 }));
    expect(result.current.otherLines).toBe(1);
  });

  it("adds the line to the cart, ends the buy-now and orders the cart", () => {
    useCartStore.setState({ storeSlug: "rmc", items: [{ ...rice, quantity: 1 }] });
    useBuyNowStore.getState().start("rmc", { ...oil, quantity: 2 });
    const { result } = renderHook(() => useBuyNowCartMerge({ ...oil, quantity: 2 }));
    act(() => result.current.merge());
    expect(useCartStore.getState().items).toEqual([
      { ...rice, quantity: 1 },
      { ...oil, quantity: 2 },
    ]);
    expect(useBuyNowStore.getState().line).toBeNull();
    expect(nav.replace).toHaveBeenCalledWith("/shop/checkout");
  });

  it("keeps the larger quantity of a line the cart already holds", () => {
    useCartStore.setState({
      storeSlug: "rmc",
      items: [{ ...rice, quantity: 1 }, { ...oil, quantity: 1 }],
    });
    const { result } = renderHook(() => useBuyNowCartMerge({ ...oil, quantity: 3 }));
    act(() => result.current.merge());
    expect(useCartStore.getState().items.find((i) => i.productId === "p7")?.quantity).toBe(3);
  });
});
