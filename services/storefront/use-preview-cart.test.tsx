// coding-standard: maintained

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";
import { CART_UNCAPPED } from "@/lib/storefront-cart-qty";
import type { CartItem } from "@/services/stores/use-cart-store";

/**
 * The sample basket the page editor previews a cart or checkout page with.
 *
 * Two of its rules are the whole point and neither is visible from the call
 * site: it must be **inert outside a preview frame**, because it sits on the
 * hook every shopper's cart and checkout runs through, and it must **never write
 * to the cart store**, which persists to the merchant's own shop origin — a
 * sample that leaked there would put products in the basket of every later visit
 * the merchant makes to their own shop.
 */

let previewSession = false;
let catalogue: unknown[] = [];

vi.mock("@/lib/storefront-preview", () => ({
  isPreviewSession: () => previewSession,
}));
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: I18N.en, lang: "en" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStoreProducts: (_slug: string, _params: unknown, enabled: boolean) => ({
    data: enabled ? { items: catalogue } : undefined,
  }),
}));

const { usePreviewCart } = await import("./use-preview-cart");
const { usePreviewCartStore } = await import("@/services/stores/use-preview-cart-store");

const product = (id: string, name: string, price: number) => ({
  _id: id,
  name,
  slug: name.toLowerCase(),
  price,
  images: [],
});

const REAL: CartItem[] = [
  { productId: "p1", slug: "rice", name: "Rice", price: 620, quantity: 1, maxQty: 9 },
];

beforeEach(() => {
  previewSession = false;
  catalogue = [product("a", "Cushion", 900), product("b", "Floor mat", 1500)];
  usePreviewCartStore.setState({ filled: true });
});

describe("outside a preview frame", () => {
  it("is null, so a shopper's cart is untouched", () => {
    const { result } = renderHook(() => usePreviewCart([]));
    expect(result.current).toBeNull();
  });
});

describe("inside a preview frame", () => {
  beforeEach(() => {
    previewSession = true;
  });

  it("borrows the store's first two products for an empty basket", () => {
    const { result } = renderHook(() => usePreviewCart([]));
    expect(result.current?.sample).toBe(true);
    expect(result.current?.items.map((i) => i.name)).toEqual(["Cushion", "Floor mat"]);
    // The second line carries two, so the stepper is previewed showing a number.
    expect(result.current?.items.map((i) => i.quantity)).toEqual([1, 2]);
  });

  /**
   * A sample line is never ordered, so its ceiling is not the merchant's stock.
   * Borrowing a sold-out product's real `maxQty` would draw the refused-line
   * state over a preview whose job is to show the layout.
   */
  it("leaves every sample line uncapped", () => {
    const { result } = renderHook(() => usePreviewCart([]));
    expect(result.current?.items.every((i) => i.maxQty === CART_UNCAPPED)).toBe(true);
  });

  it("invents lines when the shop has no products yet", () => {
    catalogue = [];
    const { result } = renderHook(() => usePreviewCart([]));
    expect(result.current?.items).toHaveLength(2);
    expect(result.current?.items[0].name).toContain(I18N.en.previewSampleProduct);
  });

  /** A merchant who HAS items in their cart is previewing something true. */
  it("stands aside for a real basket", () => {
    const { result } = renderHook(() => usePreviewCart(REAL));
    expect(result.current).toBeNull();
  });

  /** Shoppers reach the empty cart too, so it stays designable. */
  it("empties on request, and says the lines are not a sample", () => {
    const { result } = renderHook(() => usePreviewCart([]));
    act(() => usePreviewCartStore.getState().setFilled(false));
    expect(result.current?.items).toEqual([]);
    expect(result.current?.sample).toBe(false);
  });

  it("empties even over a real basket, because that is what was asked for", () => {
    usePreviewCartStore.setState({ filled: false });
    const { result } = renderHook(() => usePreviewCart(REAL));
    expect(result.current?.items).toEqual([]);
  });

  describe("the stepper and the remove button work on a sample", () => {
    it("changes a line's quantity", () => {
      const { result } = renderHook(() => usePreviewCart([]));
      act(() => result.current?.updateQty("a", 5));
      expect(result.current?.items[0].quantity).toBe(5);
    });

    it("drops a removed line", () => {
      const { result } = renderHook(() => usePreviewCart([]));
      act(() => result.current?.removeItem("a"));
      expect(result.current?.items.map((i) => i.name)).toEqual(["Floor mat"]);
    });

    /** Stepping to zero removes the line rather than leaving a 0-quantity row. */
    it("drops a line stepped down past one", () => {
      const { result } = renderHook(() => usePreviewCart([]));
      act(() => result.current?.updateQty("a", 0));
      expect(result.current?.items.map((i) => i.name)).toEqual(["Floor mat"]);
    });
  });
});
