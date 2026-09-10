// coding-standard: maintained
/**
 * The zone the merchant's order dialog sends — with the QUOTE and with the SAVE.
 *
 * A production edit (2026-09-10) landed on the fact that these two payloads were
 * not the same shape: the quote carried a district-derived `zone`, the save
 * carried only the district. With zone rates configured that priced the preview
 * and the saved order differently, and on an edit it also erased the zone the
 * order had been created with. The server now derives the zone from the district,
 * so the asymmetry can no longer change a price — this test exists so the two
 * payloads cannot drift apart again.
 *
 * `useDebounce` is stubbed to the identity function: the quote draft is otherwise
 * 400ms behind the state the submit reads, and the comparison here is between the
 * two payload SHAPES, not between two moments in time.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import {
  useOrderForm,
  type OrderFormInitial,
} from "@/components/ecommerce/orders/use-order-form";

const quoteSpy = vi.fn();
const createMutate = vi.fn();
const editMutate = vi.fn();

vi.mock("@/services/api", () => ({
  useOrderQuote: (draft: unknown) => {
    quoteSpy(draft);
    return { data: undefined, isFetching: false };
  },
  useCreateStorefrontOrder: () => ({ mutate: createMutate, isPending: false }),
  useEditStorefrontOrder: () => ({ mutate: editMutate, isPending: false }),
}));

vi.mock("@/hooks/use-debounce", () => ({ useDebounce: <T,>(value: T) => value }));

/** A Chattogram buyer — outside Dhaka, so the zone is the dearer one. */
const OUTSIDE = {
  name: "Sheikh Fatema",
  phone: "01715069665",
  address: "Kotwali",
  district: "Chattogram",
  area: "Kotwali",
};

const product = {
  productId: "p1",
  variantId: null,
  label: "Piano Fitness Rack",
  price: 600,
  availableQuantity: 5,
};

const editInitial: OrderFormInitial = {
  orderId: "o1",
  lines: [{ ...product, quantity: 1 }],
  channel: "website",
  paymentMethod: "cod",
  ...OUTSIDE,
  notes: "",
  shippingCharged: null,
  coupon: "",
  discountType: "fixed",
  discountValue: null,
};

beforeEach(() => {
  quoteSpy.mockClear();
  createMutate.mockClear();
  editMutate.mockClear();
});

describe("order dialog payloads", () => {
  it("sends the same zone with the CREATE save as with the quote", () => {
    const { result } = renderHook(() => useOrderForm(vi.fn()));

    act(() => {
      result.current.addLine(product as never);
      result.current.setName(OUTSIDE.name);
      result.current.setPhone(OUTSIDE.phone);
      result.current.setAddress(OUTSIDE.address);
      result.current.setDistrict(OUTSIDE.district);
      result.current.setArea(OUTSIDE.area);
      result.current.setChannel("messenger");
    });
    act(() => result.current.submit());

    const quoted = quoteSpy.mock.calls.at(-1)?.[0];
    const saved = createMutate.mock.calls.at(-1)?.[0];
    expect(quoted.shippingAddress.zone).toBe("outside");
    expect(saved.shippingAddress.zone).toBe("outside");
    expect(saved.shippingAddress.district).toBe("Chattogram");
  });

  it("sends the same zone with the EDIT save as with the quote", () => {
    const { result } = renderHook(() => useOrderForm(vi.fn(), editInitial));

    act(() => result.current.submit());

    const quoted = quoteSpy.mock.calls.at(-1)?.[0];
    const saved = editMutate.mock.calls.at(-1)?.[0];
    expect(quoted.shippingAddress.zone).toBe("outside");
    expect(saved.body.shippingAddress.zone).toBe("outside");
  });

  it("sends no zone at all when no district has been picked", () => {
    const { result } = renderHook(() => useOrderForm(vi.fn()));

    act(() => {
      result.current.addLine(product as never);
      result.current.setName(OUTSIDE.name);
      result.current.setPhone(OUTSIDE.phone);
      result.current.setChannel("messenger");
    });
    act(() => result.current.submit());

    const saved = createMutate.mock.calls.at(-1)?.[0];
    // Guessing "inside" here would undercharge a Chattogram delivery; the server
    // is left to price it the way it always did.
    expect(saved.shippingAddress.zone).toBeUndefined();
  });
});
