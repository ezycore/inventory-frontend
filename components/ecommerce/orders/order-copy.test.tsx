// coding-standard: maintained
/**
 * Copy: a new order seeded with another order's products.
 *
 * Two things are worth defending. What is NOT carried over — the old buyer, their
 * coupon, discount, delivery charge and channel — because a pre-filled address is
 * how a parcel ships to the wrong door. And that the seeded form is a CREATE: an
 * `orderId` leaking into it would make the quote hold the old order's prices and
 * the save overwrite the old order.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TestProviders } from "@/tests/test-utils";

import { useOrderCopyInitial } from "./use-order-copy-initial";
import { useOrderForm } from "./use-order-form";

const quoteSpy = vi.fn();
const createMutate = vi.fn();
const editMutate = vi.fn();
const catalogue = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[] | undefined,
}));

vi.mock("@/services/api", () => ({
  useOrderableProducts: () => ({ data: catalogue.rows, isLoading: !catalogue.rows }),
  useOrderQuote: (draft: unknown) => {
    quoteSpy(draft);
    return { data: undefined, isFetching: false };
  },
  useCreateStorefrontOrder: () => ({ mutate: createMutate, isPending: false }),
  useEditStorefrontOrder: () => ({ mutate: editMutate, isPending: false }),
}));
vi.mock("@/hooks/use-debounce", () => ({ useDebounce: <T,>(value: T) => value }));

const order = {
  _id: "o1",
  orderNumber: "ORD-1001",
  channel: "messenger",
  paymentMethod: "bank",
  couponCode: "EID50",
  notes: "Call after 5pm",
  shippingCharged: 120,
  manualDiscount: { type: "fixed", value: 50 },
  items: [
    // Bought at a campaign price of 400; the catalogue says 500 today.
    { productId: "p1", variantId: "v1", productName: "Panjabi — M", quantity: 2, price: 400 },
    { productId: "p2", productName: "Old Cushion", quantity: 1, price: 300 },
  ],
  shippingAddress: {
    name: "Rahim",
    phone: "01711111111",
    address: "12 Test Road",
    district: "Dhaka",
    area: "Gulshan",
  },
} as never;

const seed = () =>
  renderHook(() => useOrderCopyInitial(order, true), { wrapper: TestProviders }).result
    .current;

beforeEach(() => {
  quoteSpy.mockReset();
  createMutate.mockReset();
  editMutate.mockReset();
  catalogue.rows = [
    { productId: "p1", variantId: "v1", label: "Panjabi — M", price: 500, availableQuantity: 8 },
  ];
});

describe("useOrderCopyInitial", () => {
  it("copies the products at today's price", () => {
    const { initial } = seed();
    expect(initial!.lines).toEqual([
      {
        productId: "p1",
        variantId: "v1",
        label: "Panjabi — M",
        price: 500,
        quantity: 2,
        availableQuantity: 8,
      },
    ]);
  });

  it("names a product the catalogue no longer offers instead of seeding it", () => {
    expect(seed().copiedFrom!.dropped).toEqual(["Old Cushion"]);
  });

  it("leaves the buyer out of the form and offers them beside it", () => {
    const { initial, copiedFrom } = seed();
    expect(initial).toMatchObject({ name: "", phone: "", address: "", district: "", area: "" });
    expect(copiedFrom!.customer).toEqual({
      name: "Rahim",
      phone: "01711111111",
      address: "12 Test Road",
      district: "Dhaka",
      area: "Gulshan",
    });
  });

  it("carries nothing negotiated with or written about the old buyer", () => {
    const { initial } = seed();
    expect(initial!.orderId).toBeUndefined();
    expect(initial).toMatchObject({
      channel: "",
      paymentMethod: "cod",
      coupon: "",
      discountValue: null,
      shippingCharged: null,
      notes: "",
    });
  });

  it("waits for the catalogue — the form reads its seed once", () => {
    catalogue.rows = undefined;
    const { initial, loading } = seed();
    expect(initial).toBeUndefined();
    expect(loading).toBe(true);
  });
});

describe("the copied form", () => {
  it("is a create: no orderId on the quote or the save, confirm-now on", () => {
    const { initial, copiedFrom } = seed();
    const { result } = renderHook(() => useOrderForm(() => {}, initial), {
      wrapper: TestProviders,
    });
    expect(result.current.isEdit).toBe(false);
    expect(result.current.confirmImmediately).toBe(true);

    act(() => {
      result.current.setChannel("whatsapp");
      result.current.fillCustomer(copiedFrom!.customer);
    });
    expect(quoteSpy.mock.lastCall![0]).not.toHaveProperty("orderId", expect.anything());

    act(() => result.current.submit());
    expect(editMutate).not.toHaveBeenCalled();
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "whatsapp",
        shippingAddress: expect.objectContaining({ name: "Rahim", phone: "01711111111" }),
      }),
      expect.anything(),
    );
  });

  it("cannot be saved until the merchant names a buyer", () => {
    const { initial } = seed();
    const { result } = renderHook(() => useOrderForm(() => {}, initial), {
      wrapper: TestProviders,
    });
    act(() => result.current.setChannel("whatsapp"));
    expect(result.current.canSubmit).toBe(false);
  });
});
