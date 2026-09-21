import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";

/**
 * `useCheckout` — the wiring, not the rules.
 *
 * `checkout-validation.test.ts` pins WHAT is wrong with a form and
 * `use-checkout-errors.test.tsx` pins WHEN a message may be seen. Neither
 * notices if the hook stops asking them correctly, and that gap is not
 * hypothetical: reverting `tryAdvance` to an unscoped `reveal()` — the exact
 * stepped-checkout terms dead-end QA reported — left both of those suites green.
 *
 * So this file tests the call, not the callee: that advancing a step consults
 * only that step's fields, and that submitting consults all of them.
 */

/* ---------------------------------- mocks --------------------------------- */

const toastError = vi.fn();
const placeOrder = vi.fn();
const clearCart = vi.fn();
const trackMetaEvent = vi.fn();

let store: Record<string, unknown> = {};
let cartItems: unknown[] = [];
let shopper: unknown = null;

vi.mock("@/lib/storefront-toast", () => ({
  toast: { error: toastError, success: vi.fn() },
}));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: I18N.en, lang: "en" }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: store }),
  useStorePages: () => ({ data: [] }),
  usePlaceOrder: () => ({ mutate: placeOrder, isPending: false }),
  useShopperAccount: () => ({
    updateAddress: { mutate: vi.fn() },
    addAddress: { mutate: vi.fn() },
  }),
}));
// Both stores are zustand selector hooks — the mock has to apply the selector,
// or every `useCartStore((s) => s.items)` call returns the whole state.
vi.mock("@/services/stores/use-cart-store", () => ({
  useCartStore: (select: (s: unknown) => unknown) =>
    select({ storeSlug: "rmc", items: cartItems, clear: clearCart }),
  cartLineKey: (i: { productId: string }) => i.productId,
}));
// Only the event call is observed; the rest of the module (content ids, the purchase call) is real.
vi.mock("@/lib/storefront-meta", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storefront-meta")>()),
  trackMetaEvent,
}));
vi.mock("@/services/stores/use-shopper-store", () => ({
  useShopperStore: (select: (s: unknown) => unknown) =>
    select({ shopper, token: null }),
}));
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/hooks/use-guest-contact-capture", () => ({
  useGuestContactCapture: () => vi.fn(),
}));
vi.mock("@/services/storefront/cart-identity", () => ({
  cartAnonymousId: () => null,
  // Read by `metaCheckoutAttribution` on the submit path: the Customize editor renders the real
  // storefront in an iframe, and a merchant theming their shop must not be tracked as a shopper.
  isSfPreview: () => false,
}));
vi.mock("@/lib/storefront-client", () => ({ storefrontApi: { validateCoupon: vi.fn() } }));

const { useCheckout } = await import("./use-checkout");

/* --------------------------------- helpers -------------------------------- */

/** A store that requires terms — the configuration the dead-end needed. */
const termsRequiredStore = {
  currency: "BDT",
  allowedPaymentMethods: ["cod"],
  checkout: { termsRequired: true, requiredFields: ["name", "phone", "address"] },
};

/** Fill every step-1 field with something the validator accepts. */
const fillStepOne = (api: ReturnType<typeof useCheckout>) => {
  act(() => api.set("name", "Rashidul Karim"));
  act(() => api.set("phone", "01712345678"));
  act(() => api.set("address", "House 42, Road 7, Dhanmondi"));
};

beforeEach(() => {
  vi.clearAllMocks();
  store = { ...termsRequiredStore };
  cartItems = [{ productId: "p1", slug: "p", name: "Rice", price: 620, quantity: 1, maxQty: 9 }];
  shopper = null;
});

/* ---------------------------------- tests --------------------------------- */

describe("tryAdvance — a step is blocked only by what it renders", () => {
  /**
   * THE REGRESSION. `TermsBlock` renders on step 3; an unticked required box is
   * an error from the first render. Unscoped, that error refused step 1 and then
   * pointed at a checkbox two screens away, so Continue did nothing, forever,
   * with nothing on screen to fix.
   */
  it("advances past step 1 with the required terms box still unticked", () => {
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    expect(result.current.termsRequired).toBe(true);
    expect(result.current.termsAccepted).toBe(false);
    // The error genuinely exists — this is not a test of a form with no problems.
    expect(result.current.allErrors.terms).toBeTruthy();

    let advanced = false;
    act(() => {
      advanced = result.current.tryAdvance();
    });

    expect(advanced).toBe(true);
    expect(result.current.step).toBe(2);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("still refuses step 1 when a step-1 field is missing", () => {
    const { result } = renderHook(() => useCheckout());
    act(() => result.current.set("name", "Rashidul Karim"));
    // phone + address left blank.

    let advanced = true;
    act(() => {
      advanced = result.current.tryAdvance();
    });

    expect(advanced).toBe(false);
    expect(result.current.step).toBe(1);
    expect(toastError).toHaveBeenCalledWith(I18N.en.checkoutFixErrors);
  });

  it("advances step 2 → 3, which owns no fields to validate", () => {
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    act(() => void result.current.tryAdvance());
    act(() => void result.current.tryAdvance());
    expect(result.current.step).toBe(3);
  });
});

describe("submit — never points at a screen the shopper cannot see", () => {
  /**
   * A stepped shopper can reach step 3 and only then have a step-1 field go
   * invalid — a signed-in session dropping mid-checkout tightens `phoneUsable`
   * from "non-empty" to the BD-mobile rule, so a number that passed step 1 no
   * longer does. Refusing without moving would show a banner with no highlighted
   * field on screen.
   */
  it("jumps back to the step that owns the first problem", () => {
    shopper = { emailVerified: true, addresses: [], name: "R", phone: "+44 20 7946 0000" };
    const { result } = renderHook(() => useCheckout());
    act(() => result.current.set("name", "Rashidul Karim"));
    act(() => result.current.set("phone", "+44 20 7946 0000"));
    act(() => result.current.set("address", "House 42"));
    act(() => result.current.setTermsAccepted(true));

    // Signed in, a non-BD number is accepted, so step 1 clears.
    act(() => void result.current.tryAdvance());
    act(() => void result.current.tryAdvance());
    expect(result.current.step).toBe(3);

    // The session drops. That same number is now invalid, on a screen two back.
    act(() => {
      shopper = null;
    });
    act(() => result.current.set("phone", "+44 20 7946 0000"));
    expect(result.current.allErrors.phone).toBeTruthy();

    act(() => result.current.submit());

    expect(placeOrder).not.toHaveBeenCalled();
    expect(result.current.step).toBe(1);
  });

  it("does not move a valid form", () => {
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    act(() => void result.current.tryAdvance());
    act(() => result.current.setTermsAccepted(true));
    const before = result.current.step;
    act(() => result.current.submit());
    expect(result.current.step).toBe(before);
    expect(placeOrder).toHaveBeenCalledTimes(1);
  });
});

describe("submit — the final gate keeps every rule", () => {
  it("refuses to place the order while required terms are unticked", () => {
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    act(() => result.current.submit());

    expect(placeOrder).not.toHaveBeenCalled();
    expect(result.current.errorsRevealed).toBe(true);
    expect(result.current.errors.terms).toBeTruthy();
  });

  it("places the order once the box is ticked", () => {
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    act(() => result.current.setTermsAccepted(true));
    act(() => result.current.submit());

    expect(placeOrder).toHaveBeenCalledTimes(1);
  });

  // The minimum order is the other final-submit concern, and it must not be a
  // step gate either — a shopper cannot fix their basket size from step 1.
  it("refuses below the minimum order without blocking an earlier step", () => {
    store = { ...termsRequiredStore, checkout: { ...termsRequiredStore.checkout, minOrderValue: 5000 } };
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);

    let advanced = false;
    act(() => {
      advanced = result.current.tryAdvance();
    });
    expect(advanced).toBe(true);

    act(() => result.current.setTermsAccepted(true));
    act(() => result.current.submit());
    expect(placeOrder).not.toHaveBeenCalled();
  });
});

/**
 * A landing page's order form runs the same hook over lines it picked itself.
 * What must differ is exactly what belongs to the cart: the shopper's basket is
 * neither ordered nor emptied, and there is no mirrored cart to close.
 */
describe("lines — a landing page's order form", () => {
  const lines = [
    { productId: "p9", variantId: "v1", variantLabel: "Red", slug: "saree", name: "Saree", price: 3360, quantity: 2, maxQty: 5 },
  ];
  const openStore = {
    currency: "BDT",
    allowedPaymentMethods: ["cod"],
    checkout: { requiredFields: ["name", "phone", "address"] },
  };

  it("orders the given lines, not the cart, and leaves the cart alone", () => {
    store = openStore;
    const { result } = renderHook(() => useCheckout({ lines }));
    expect(result.current.subtotal).toBe(6720);

    fillStepOne(result.current);
    act(() => result.current.submit());

    expect(placeOrder).toHaveBeenCalledTimes(1);
    const [body, callbacks] = placeOrder.mock.calls[0];
    expect(body.items).toEqual([{ productId: "p9", variantId: "v1", quantity: 2 }]);
    expect(body.anonymousId).toBeUndefined();

    act(() => callbacks.onSuccess({ orderNumber: "ORD-1" }));
    expect(clearCart).not.toHaveBeenCalled();
    expect(result.current.placed).toEqual({ orderNumber: "ORD-1" });
  });

  it("still empties the cart after a checkout-page order", () => {
    store = openStore;
    const { result } = renderHook(() => useCheckout());
    fillStepOne(result.current);
    act(() => result.current.submit());
    act(() => placeOrder.mock.calls[0][1].onSuccess({ orderNumber: "ORD-2" }));
    expect(clearCart).toHaveBeenCalledTimes(1);
  });

  it("reports InitiateCheckout on the first edit, not on arrival", () => {
    store = openStore;
    const { result } = renderHook(() => useCheckout({ lines }));
    expect(trackMetaEvent).not.toHaveBeenCalled();

    fillStepOne(result.current);
    const initiated = trackMetaEvent.mock.calls.filter(([, name]) => name === "InitiateCheckout");
    expect(initiated).toHaveLength(1);
    expect(initiated[0][2]).toMatchObject({ value: 6720, num_items: 2 });
  });

  it("reports InitiateCheckout on arrival at the checkout page", () => {
    store = openStore;
    renderHook(() => useCheckout());
    expect(trackMetaEvent.mock.calls.filter(([, name]) => name === "InitiateCheckout")).toHaveLength(1);
  });
});
