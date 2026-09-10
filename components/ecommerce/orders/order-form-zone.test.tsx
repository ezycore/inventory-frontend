// coding-standard: maintained
/**
 * The zone the merchant's order dialog sends — with the QUOTE and with the SAVE.
 *
 * A production edit (2026-09-10) landed on the fact that these two payloads were
 * not the same shape: the quote carried a district-derived `zone`, the save
 * carried only the district. With zone rates configured that priced the preview
 * and the saved order differently, and on an edit it also erased the zone the
 * order was created with. The server now derives the zone from the district, so
 * this asymmetry can no longer change a price — this test exists so the payloads
 * cannot drift apart again.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useOrderForm } from "@/components/ecommerce/orders/use-order-form";

const quoteSpy = vi.fn();
const createMutate = vi.fn();
const editMutate = vi.fn();

vi.mock("@/services/api", () => ({
  useOrderQuote: (draft: unknown) => {
    quoteSpy(draft);
    return { data: { shippingCharged: 120, subtotal: 600 }, isFetching: false };
  },
  useCreateStorefrontOrder: () => ({ mutate: createMutate, isPending: false }),
  useEditStorefrontOrder: () => ({ mutate: editMutate, isPending: false }),
}));

const line = {
  productId: "p1",
  variantId: null,
  label: "Piano Fitness Rack",
  price: 600,
  quantity: 1,
  availableQuantity: 5,
};

/** Fill the form out to the point where it will submit, for a Chattogram buyer. */
const fillOutsideDhaka = (form: ReturnType<typeof useOrderForm>) => {
  form.setLines([line]);
  form.setName("Sheikh Fatema");
  form.setPhone("01715069665");
  form.setAddress("Kotwali");
  form.setDistrict("Chattogram");
  form.setArea("Kotwali");
};

beforeEach(() => {
  quoteSpy.mockClear();
  createMutate.mockClear();
  editMutate.mockClear();
});

describe("order dialog payloads", () => {
  it("sends the same zone with the CREATE save as with the quote", () => {
    const { result } = renderHook(() => useOrderForm({ onDone: vi.fn() }));

    act(() => fillOutsideDhaka(result.current));
    act(() => result.current.setChannel("messenger"));
    act(() => result.current.submit());

    const quoted = quoteSpy.mock.calls.at(-1)?.[0];
    const saved = createMutate.mock.calls.at(-1)?.[0];
    expect(quoted.shippingAddress.zone).toBe("outside");
    expect(saved.shippingAddress.zone).toBe("outside");
    expect(saved.shippingAddress.district).toBe("Chattogram");
  });

  it("sends the same zone with the EDIT save as with the quote", () => {
    const { result } = renderHook(() =>
      useOrderForm({
        onDone: vi.fn(),
        initial: {
          orderId: "o1",
          lines: [line],
          channel: "website",
          paymentMethod: "cod",
          name: "Sheikh Fatema",
          phone: "01715069665",
          address: "Kotwali",
          district: "Chattogram",
          area: "Kotwali",
          notes: "",
          shippingCharged: null,
          coupon: "",
          discountType: "fixed",
          discountValue: null,
        },
      }),
    );

    act(() => result.current.submit());

    const quoted = quoteSpy.mock.calls.at(-1)?.[0];
    const saved = editMutate.mock.calls.at(-1)?.[0];
    expect(quoted.shippingAddress.zone).toBe("outside");
    expect(saved.body.shippingAddress.zone).toBe("outside");
  });
});
