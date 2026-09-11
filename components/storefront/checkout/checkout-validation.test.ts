import { describe, expect, it } from "vitest";
import {
  CHECKOUT_SLOT_STEP,
  CHECKOUT_STEP_FIELDS,
  checkoutErrors,
  firstInvalidField,
  isCheckoutFieldVisible,
  slotOf,
  stepForField,
  type CheckoutFieldSlot,
  type CheckoutValidationInput,
} from "./checkout-validation";
import type { Dict } from "@/lib/storefront-i18n";

/**
 * These rules used to be three booleans inside `useCheckout`
 * (`contactComplete` / `deliveryComplete` / `addressComplete`), which is why
 * five of the six fields could be wrong without ever saying so — a boolean has
 * nowhere to put a reason. They were extracted here so they could be checked
 * without a store, a cart or a signed-in shopper. This is that check.
 *
 * Messages are asserted by their dictionary KEY, not their English text, so a
 * copy edit doesn't fail the suite — what matters is that the right field gets
 * the right explanation.
 */

// The dictionary is ~600 keys and only these are read; the cast keeps the
// fixture honest about that rather than pretending to build a whole Dict.
const t = {
  nameRequired: "nameRequired",
  phoneRequired: "phoneRequired",
  phoneInvalid: "phoneInvalid",
  addressRequired: "addressRequired",
  districtRequired: "districtRequired",
  areaRequired: "areaRequired",
  termsRequiredError: "termsRequiredError",
} as unknown as Dict;

/** A complete delivery order for a store that requires name/phone/address. */
const base = (over: Partial<CheckoutValidationInput> = {}): CheckoutValidationInput => ({
  t,
  addr: { name: "Rashidul Karim", phone: "01712345678", address: "House 42, Road 7" },
  geo: { district: "Dhaka", area: "Dhanmondi" },
  required: new Set(["name", "phone", "address"]),
  needArea: true,
  isPickup: false,
  phoneUsable: true,
  phoneMalformed: false,
  termsRequired: false,
  termsAccepted: false,
  ...over,
});

describe("checkoutErrors", () => {
  it("says nothing about a complete order", () => {
    expect(checkoutErrors(base())).toEqual({});
  });

  it("flags each missing required field with its OWN message", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
      }),
    );
    // The point of the change: four blanks produce four different sentences,
    // not one "Required" repeated four times.
    expect(errors).toEqual({
      name: "nameRequired",
      phone: "phoneRequired",
      address: "addressRequired",
      district: "districtRequired",
    });
  });

  it("respects the merchant's required-field config", () => {
    const errors = checkoutErrors(
      base({
        required: new Set(["phone"]),
        needArea: false,
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
      }),
    );
    expect(errors).toEqual({ phone: "phoneRequired" });
  });

  // Zone shipping PRICES the order from the district, so it overrides the
  // merchant's config — matching the backend's own enforcement in placeOrder.
  it("forces district+area when zone shipping is on, whatever the config says", () => {
    const errors = checkoutErrors(
      base({
        required: new Set(["name", "phone"]),
        needArea: true,
        geo: { district: "", area: "" },
      }),
    );
    expect(errors.district).toBe("districtRequired");
  });

  it("does not ask for an area until a district narrows the list", () => {
    const blank = checkoutErrors(base({ geo: { district: "", area: "" } }));
    // Area is not "missing" yet — it is a field the shopper cannot fill.
    expect(blank.district).toBe("districtRequired");
    expect(blank.area).toBeUndefined();

    const picked = checkoutErrors(base({ geo: { district: "Dhaka", area: "" } }));
    expect(picked.district).toBeUndefined();
    expect(picked.area).toBe("areaRequired");
  });

  describe("the phone, which is a guest's identity", () => {
    it("asks for one when it is blank", () => {
      const errors = checkoutErrors(
        base({ addr: { name: "R", phone: "", address: "x" }, phoneUsable: false }),
      );
      expect(errors.phone).toBe("phoneRequired");
    });

    // Two different problems with two different fixes. Collapsing them sends
    // someone who typed a landline looking for an empty field.
    it("rejects a typed-but-malformed number with the FORMAT message", () => {
      const errors = checkoutErrors(
        base({
          addr: { name: "R", phone: "0431 55 22", address: "x" },
          phoneUsable: false,
          phoneMalformed: true,
        }),
      );
      expect(errors.phone).toBe("phoneInvalid");
    });

    it("stays silent on a blank phone the merchant did not require", () => {
      const errors = checkoutErrors(
        base({
          required: new Set(["name"]),
          needArea: false,
          addr: { name: "R", phone: "", address: "" },
          phoneUsable: false,
        }),
      );
      expect(errors.phone).toBeUndefined();
    });
  });

  describe("pickup", () => {
    it("drops every delivery field", () => {
      const errors = checkoutErrors(
        base({
          isPickup: true,
          addr: { name: "R", phone: "01712345678", address: "" },
          geo: { district: "", area: "" },
        }),
      );
      expect(errors).toEqual({});
    });

    it("still needs the contact fields — the parcel is handed to somebody", () => {
      const errors = checkoutErrors(
        base({
          isPickup: true,
          addr: { name: "", phone: "", address: "" },
          geo: { district: "", area: "" },
        }),
      );
      expect(errors).toEqual({ name: "nameRequired", phone: "phoneRequired" });
    });
  });

  describe("terms", () => {
    it("is silent when the merchant does not require them", () => {
      expect(checkoutErrors(base({ termsRequired: false })).terms).toBeUndefined();
    });

    it("blocks on an unticked box when they are required", () => {
      const errors = checkoutErrors(base({ termsRequired: true, termsAccepted: false }));
      expect(errors.terms).toBe("termsRequiredError");
    });

    it("clears once ticked", () => {
      expect(checkoutErrors(base({ termsRequired: true, termsAccepted: true })).terms)
        .toBeUndefined();
    });
  });

  it("treats whitespace as blank — a space is not an address", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "   ", phone: "01712345678", address: "  " },
        geo: { district: "  ", area: "  " },
      }),
    );
    expect(errors.name).toBe("nameRequired");
    expect(errors.address).toBe("addressRequired");
    expect(errors.district).toBe("districtRequired");
  });
});

/**
 * The focus order after a refused submit. It must match the visual order of the
 * form, or the page scrolls to the second problem and the shopper never sees
 * the first.
 */
describe("firstInvalidField", () => {
  it("is null when nothing is wrong", () => {
    expect(firstInvalidField({})).toBeNull();
  });

  it("picks the earliest field in form order, not object order", () => {
    expect(firstInvalidField({ terms: "t", district: "d", name: "n" })).toBe("name");
    expect(firstInvalidField({ terms: "t", area: "a" })).toBe("area");
    expect(firstInvalidField({ terms: "t" })).toBe("terms");
  });

  it("agrees with checkoutErrors on a wholly empty delivery form", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
        termsRequired: true,
      }),
    );
    expect(firstInvalidField(errors)).toBe("name");
  });
});

/**
 * Merchant-defined fields can now be anchored anywhere in the checkout, which
 * makes them a step-gating problem: a required field the merchant put on the
 * payment screen must not refuse the address screen, and the refusal on submit
 * must jump to the screen that actually renders it. That is the same failure
 * `CHECKOUT_STEP_FIELDS` exists for — a shopper stuck on a step, pointed at a
 * control two screens away — so it gets the same coverage.
 */
describe("custom-field slots", () => {
  it("reads an unset slot as the pre-slot position", () => {
    // The whole backwards-compatibility promise in one assertion: a stored
    // field with no slot must keep rendering where it always did.
    expect(slotOf({})).toBe("after-address");
    expect(slotOf({ slot: "before-submit" })).toBe("before-submit");
  });

  it("maps every slot to a step the stepped layout actually renders", () => {
    const slots: CheckoutFieldSlot[] = [
      "after-contact",
      "after-address",
      "before-payment",
      "after-payment",
      "before-submit",
    ];
    for (const slot of slots) {
      const step = CHECKOUT_SLOT_STEP[slot];
      expect(Object.keys(CHECKOUT_STEP_FIELDS)).toContain(String(step));
    }
    // Address slots are step 1, payment slots step 2, the last word step 3 —
    // read against SteppedCheckout's blocks, which is the only thing that makes
    // these numbers true.
    expect(CHECKOUT_SLOT_STEP["after-contact"]).toBe(1);
    expect(CHECKOUT_SLOT_STEP["after-address"]).toBe(1);
    expect(CHECKOUT_SLOT_STEP["before-payment"]).toBe(2);
    expect(CHECKOUT_SLOT_STEP["after-payment"]).toBe(2);
    expect(CHECKOUT_SLOT_STEP["before-submit"]).toBe(3);
  });

  it("sends a refused submit to the step that renders the offending field", () => {
    const slots = { ship: "before-submit", gift: "before-payment" } as const;
    expect(stepForField("custom:ship" as never, slots)).toBe(3);
    expect(stepForField("custom:gift" as never, slots)).toBe(2);
    // An unmapped key is a field the merchant deleted between render and
    // submit; step 1 is where custom fields lived before slots, and it is the
    // only step guaranteed to exist.
    expect(stepForField("custom:gone" as never, slots)).toBe(1);
    expect(stepForField("custom:ship" as never)).toBe(1);
  });

  it("refuses a step only for the custom fields that step renders", () => {
    const errors = { "custom:gift": "This is required" };
    // Step 1 renders no custom field here, so Continue must NOT be blocked by
    // one the shopper cannot see — the exact dead end `CHECKOUT_STEP_FIELDS`
    // was written for.
    expect(firstInvalidField(errors, CHECKOUT_STEP_FIELDS[1], [])).toBeNull();
    expect(firstInvalidField(errors, CHECKOUT_STEP_FIELDS[2], ["gift"])).toBe(
      "custom:gift",
    );
    // The final submit scopes nothing and still catches it.
    expect(firstInvalidField(errors)).toBe("custom:gift");
  });

  it("reports custom fields in render order, not alphabetically", () => {
    const errors = { "custom:zebra": "required", "custom:apple": "required" };
    // `zebra` is first in the merchant's list, so it is the one the shopper is
    // sent to — sorting the keys would send them to the second problem.
    expect(firstInvalidField(errors, undefined, ["zebra", "apple"])).toBe(
      "custom:zebra",
    );
  });

  it("keeps built-in fields ahead of custom ones", () => {
    const errors = { name: "Enter your name", "custom:gift": "required" };
    expect(firstInvalidField(errors, CHECKOUT_STEP_FIELDS[1], ["gift"])).toBe("name");
  });
});

/**
 * Conditional fields. The prize is per-payment-method instructions and inputs;
 * the danger is an order nobody can place — a required bank-transfer field left
 * demanding on a cash-on-delivery order, refused by a form that cannot show the
 * shopper what is wrong because the control is not rendered.
 *
 * The backend's `isCheckoutFieldVisible` is the same function. If these two ever
 * disagree, the form accepts an order the server rejects.
 */
describe("isCheckoutFieldVisible", () => {
  it("shows a field with no condition — every field saved before this existed", () => {
    expect(isCheckoutFieldVisible({}, { paymentMethod: "cod" })).toBe(true);
    expect(isCheckoutFieldVisible({ showWhen: {} }, { paymentMethod: "cod" })).toBe(true);
    // An empty list is "no condition", not "never" — "never" is a field the
    // merchant should have deleted, and silently hiding one is worse than
    // showing it.
    expect(
      isCheckoutFieldVisible({ showWhen: { paymentMethods: [] } }, { paymentMethod: "cod" }),
    ).toBe(true);
  });

  it("shows a scoped field only for its own methods", () => {
    const bankOnly = { showWhen: { paymentMethods: ["bank"] } };
    expect(isCheckoutFieldVisible(bankOnly, { paymentMethod: "bank" })).toBe(true);
    expect(isCheckoutFieldVisible(bankOnly, { paymentMethod: "cod" })).toBe(false);
  });

  it("shows everything when there is no payment context to judge against", () => {
    // A caller with no context has no grounds to hide anything — better a field
    // too many than a required one silently dropped.
    expect(isCheckoutFieldVisible({ showWhen: { paymentMethods: ["bank"] } })).toBe(true);
  });

  it("handles a field scoped to several methods", () => {
    const field = { showWhen: { paymentMethods: ["cod", "bank"] } };
    expect(isCheckoutFieldVisible(field, { paymentMethod: "cod" })).toBe(true);
    expect(isCheckoutFieldVisible(field, { paymentMethod: "bank" })).toBe(true);
    expect(isCheckoutFieldVisible(field, { paymentMethod: "bkash" })).toBe(false);
  });
});
